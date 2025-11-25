// URL do backend
const API_URL = 'http://localhost:3002';

// Variáveis globais
let dataTableGerenciamento = null;
let dataTableRelatorios = null;
let categoriasDisponiveis = [];

$(document).ready(function () {
    // Carregar categorias ao iniciar
    carregarCategorias();

    // Carregar dados da aba ativa ao iniciar
    const activeSection = $('.content-section.active').attr('id');
    if (activeSection === 'gerenciamento') {
        carregarLivros();
    } else if (activeSection === 'relatorios') {
        carregarRelatorios();
    }

    // --- LÓGICA DE NAVEGAÇÃO ENTRE ABAS ---
    $('.nav-link').on('click', function (e) {
        e.preventDefault();
        $('.nav-link').removeClass('active');
        $('.content-section').removeClass('active');
        $(this).addClass('active');
        const targetSection = $('#' + $(this).data('target'));
        targetSection.addClass('active');

        // Limpar formulário ao trocar de aba (se estava em modo edição)
        const form = $('#cadastro form');
        if (form.data('edit-id')) {
            form[0].reset();
            form.removeData('edit-id');
            const submitBtn = form.find('button[type="submit"]');
            submitBtn.text('Cadastrar Livro').removeClass('btn-warning').addClass('btn-primary');
        }

        // Recarregar dados quando mudar de aba - usar requestAnimationFrame para garantir que a seção está visível
        const target = $(this).data('target');
        requestAnimationFrame(() => {
            if (target === 'gerenciamento' && targetSection.hasClass('active') && targetSection.is(':visible')) {
                carregarLivros();
            } else if (target === 'relatorios' && targetSection.hasClass('active') && targetSection.is(':visible')) {
                carregarRelatorios();
            }
        });
    });

    // --- CADASTRO DE LIVROS ---
    $('#cadastro form').on('submit', async function (e) {
        e.preventDefault();

        // Verificar se está em modo de edição
        const editId = $(this).data('edit-id');
        if (editId) {
            await atualizarLivro(editId);
            return;
        }

        const titulo = $('#titulo').val() ? $('#titulo').val().trim() : '';
        const autor = $('#autor').val() ? $('#autor').val().trim() : '';
        const categoria = $('#categoria').val();
        const sinopseElement = $('#sinopse');
        const sinopse = sinopseElement.length > 0 && sinopseElement.val() ? sinopseElement.val().trim() : '';
        const numeroPaginasElement = $('#numero_paginas');
        const numeroPaginas = numeroPaginasElement.length > 0 && numeroPaginasElement.val() ? numeroPaginasElement.val().trim() : '';

        if (!titulo || !autor || !categoria) {
            mostrarMensagem('cadastro', 'Por favor, preencha todos os campos obrigatórios!', 'erro');
            return;
        }

        const submitBtn = $(this).find('button[type="submit"]');
        submitBtn.prop('disabled', true).text('CADASTRANDO...');

        try {
            const response = await fetch(`${API_URL}/livros/cadastrar`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    titulo,
                    autor,
                    categoria,
                    sinopse: sinopse || null,
                    numero_paginas: numeroPaginas ? parseInt(numeroPaginas) : null
                })
            });

            const data = await response.json();

            if (data.sucesso) {
                mostrarMensagem('cadastro', data.mensagem, 'sucesso');
                $(this)[0].reset();
                
                // Atualizar tabela de gerenciamento se estiver visível
                if ($('#gerenciamento').hasClass('active')) {
                    carregarLivros();
                }
            } else {
                mostrarMensagem('cadastro', data.mensagem, 'erro');
            }

        } catch (error) {
            console.error('Erro ao cadastrar livro:', error);
            mostrarMensagem('cadastro', 'Erro ao conectar com o servidor. Verifique se o backend está rodando!', 'erro');
        } finally {
            submitBtn.prop('disabled', false).text('Cadastrar Livro');
        }
    });

    // Não inicializar tabelas vazias - elas serão criadas quando os dados forem carregados
    // Isso evita conflitos com DataTables
});

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

async function carregarCategorias() {
    try {
        const response = await fetch(`${API_URL}/livros/categorias`);
        const data = await response.json();

        if (data.sucesso) {
            categoriasDisponiveis = data.categorias;
            const selectCategoria = $('#categoria');
            
            // Limpar e preencher select
            selectCategoria.find('option:not(:first)').remove();
            
            data.categorias.forEach(categoria => {
                selectCategoria.append(`<option value="${categoria.nome}">${categoria.nome}</option>`);
            });
        }
    } catch (error) {
        console.error('Erro ao carregar categorias:', error);
    }
}

async function carregarLivros() {
    try {
        // Destruir DataTable se já existir ANTES de fazer a requisição
        if (dataTableGerenciamento) {
            try {
                dataTableGerenciamento.destroy();
            } catch (e) {
                console.log('DataTable já estava destruído ou não existia');
            }
            dataTableGerenciamento = null;
        }

        const tbody = $('#gerenciamentoTable tbody');
        tbody.empty();

        console.log('Carregando livros do backend...');
        const response = await fetch(`${API_URL}/livros/listar`);
        
        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Dados recebidos:', data);

        if (data.sucesso && data.livros && data.livros.length > 0) {
            // Adicionar linhas
            data.livros.forEach(livro => {
                const row = `
                    <tr data-id="${livro.id}">
                        <td>${livro.titulo}</td>
                        <td>${livro.autor}</td>
                        <td>${livro.categoria}</td>
                        <td class="actions-cell">
                            <button class="btn btn-secondary btn-editar" data-id="${livro.id}">Editar</button>
                            <button class="btn btn-danger btn-excluir" data-id="${livro.id}">Excluir</button>
                        </td>
                    </tr>
                `;
                tbody.append(row);
            });

            // Usar requestAnimationFrame para garantir que o DOM foi atualizado e a seção está visível
            requestAnimationFrame(() => {
                // Verificar se a seção está visível antes de inicializar
                const section = $('#gerenciamento');
                if (section.hasClass('active') && section.is(':visible')) {
                    // Recriar DataTable
                    dataTableGerenciamento = $('#gerenciamentoTable').DataTable({
                        language: {
                            search: "Buscar:",
                            lengthMenu: "Mostrar _MENU_ registros",
                            info: "Página _PAGE_ de _PAGES_",
                            paginate: {
                                next: "Próximo",
                                previous: "Anterior"
                            }
                        },
                        columnDefs: [{
                            orderable: false,
                            targets: 3
                        }],
                        retrieve: true,
                        destroy: true
                    });

                    // Adicionar eventos aos botões usando delegación de eventos
                    $(document).off('click', '.btn-editar').on('click', '.btn-editar', function() {
                        const livroId = $(this).data('id');
                        editarLivro(livroId);
                    });

                    $(document).off('click', '.btn-excluir').on('click', '.btn-excluir', function() {
                        const livroId = $(this).data('id');
                        excluirLivro(livroId);
                    });
                    
                    console.log(`${data.livros.length} livro(s) carregado(s) e exibidos com sucesso!`);
                }
            });
        } else {
            console.log('Nenhum livro encontrado ou resposta inválida');
            
            // Usar requestAnimationFrame para garantir que a seção está visível
            requestAnimationFrame(() => {
                const section = $('#gerenciamento');
                if (section.hasClass('active') && section.is(':visible')) {
                    // Recriar DataTable vazia
                    if (dataTableGerenciamento) {
                        dataTableGerenciamento.destroy();
                    }
                    
                    dataTableGerenciamento = $('#gerenciamentoTable').DataTable({
                        language: {
                            search: "Buscar:",
                            lengthMenu: "Mostrar _MENU_ registros",
                            info: "Página _PAGE_ de _PAGES_",
                            paginate: {
                                next: "Próximo",
                                previous: "Anterior"
                            },
                            emptyTable: "Nenhum livro cadastrado"
                        },
                        columnDefs: [{
                            orderable: false,
                            targets: 3
                        }]
                    });
                }
            });
        }
    } catch (error) {
        console.error('Erro ao carregar livros:', error);
        mostrarMensagem('gerenciamento', `Erro ao carregar livros: ${error.message}. Verifique se o backend está rodando na porta 3002!`, 'erro');
        
        // Manter DataTable mesmo com erro
        requestAnimationFrame(() => {
            const section = $('#gerenciamento');
            if (section.hasClass('active') && section.is(':visible') && !dataTableGerenciamento) {
                dataTableGerenciamento = $('#gerenciamentoTable').DataTable({
                    language: {
                        search: "Buscar:",
                        lengthMenu: "Mostrar _MENU_ registros",
                        info: "Página _PAGE_ de _PAGES_",
                        paginate: {
                            next: "Próximo",
                            previous: "Anterior"
                        },
                        emptyTable: "Erro ao carregar dados"
                    },
                    columnDefs: [{
                        orderable: false,
                        targets: 3
                    }]
                });
            }
        });
    }
}

async function editarLivro(id) {
    try {
        const response = await fetch(`${API_URL}/livros/buscar/${id}`);
        const data = await response.json();

        if (data.sucesso && data.livro) {
            const livro = data.livro;
            
            // Preencher formulário (você pode criar um modal ou usar o formulário existente)
            $('#titulo').val(livro.titulo);
            $('#autor').val(livro.autor);
            $('#categoria').val(livro.categoria);
            
            // Trocar para aba de cadastro e atualizar botão
            $('.nav-link[data-target="cadastro"]').click();
            
            // Atualizar texto do botão
            const submitBtn = $('#cadastro form button[type="submit"]');
            submitBtn.text('Atualizar Livro').removeClass('btn-primary').addClass('btn-warning');

            // Armazenar ID para atualização
            $('#cadastro form').data('edit-id', id);
            
            mostrarMensagem('cadastro', 'Livro carregado para edição. Modifique os campos e clique em "Atualizar Livro".', 'sucesso');
        }
    } catch (error) {
        console.error('Erro ao buscar livro:', error);
        mostrarMensagem('gerenciamento', 'Erro ao buscar livro!', 'erro');
    }
}

async function atualizarLivro(id) {
    const titulo = $('#titulo').val() ? $('#titulo').val().trim() : '';
    const autor = $('#autor').val() ? $('#autor').val().trim() : '';
    const categoria = $('#categoria').val();

    if (!titulo || !autor || !categoria) {
        mostrarMensagem('cadastro', 'Por favor, preencha todos os campos obrigatórios!', 'erro');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/livros/editar/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                titulo,
                autor,
                categoria
            })
        });

        const data = await response.json();

        if (data.sucesso) {
            mostrarMensagem('cadastro', data.mensagem, 'sucesso');
            $('#cadastro form')[0].reset();
            $('#cadastro form').removeData('edit-id');
            
            // Restaurar botão ao modo de cadastro
            const submitBtn = $('#cadastro form button[type="submit"]');
            submitBtn.text('Cadastrar Livro').removeClass('btn-warning').addClass('btn-primary');
            
            // Atualizar tabela
            carregarLivros();
        } else {
            mostrarMensagem('cadastro', data.mensagem, 'erro');
        }
    } catch (error) {
        console.error('Erro ao atualizar livro:', error);
        mostrarMensagem('cadastro', 'Erro ao atualizar livro!', 'erro');
    }
}

async function excluirLivro(id) {
    if (!confirm('Tem certeza que deseja excluir este livro?')) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/livros/excluir/${id}`, {
            method: 'DELETE'
        });

        const data = await response.json();

        if (data.sucesso) {
            mostrarMensagem('gerenciamento', data.mensagem, 'sucesso');
            carregarLivros();
        } else {
            mostrarMensagem('gerenciamento', data.mensagem, 'erro');
        }
    } catch (error) {
        console.error('Erro ao excluir livro:', error);
        mostrarMensagem('gerenciamento', 'Erro ao excluir livro!', 'erro');
    }
}

async function carregarRelatorios() {
    try {
        // Destruir DataTable se já existir ANTES de fazer a requisição
        if (dataTableRelatorios) {
            try {
                dataTableRelatorios.destroy();
            } catch (e) {
                console.log('DataTable de relatórios já estava destruído ou não existia');
            }
            dataTableRelatorios = null;
        }

        const tbody = $('#relatoriosTable tbody');
        tbody.empty();

        const response = await fetch(`${API_URL}/usuarios/relatorios`);
        const data = await response.json();

        if (data.sucesso && data.relatorio) {
            data.relatorio.forEach(item => {
                const badgeClass = item.classificacao === 'EXTREMO' ? 'level-extremo' :
                                  item.classificacao === 'ATIVO' ? 'level-ativo' :
                                  item.classificacao === 'REGULAR' ? 'level-regular' : 'level-iniciante';
                
                const row = `
                    <tr>
                        <td>${item.id}</td>
                        <td>${item.nome_leitor}</td>
                        <td>${item.livros_emprestados_total || 0}</td>
                        <td><span class="level-badge ${badgeClass}">${item.classificacao}</span></td>
                    </tr>
                `;
                tbody.append(row);
            });

            // Usar requestAnimationFrame para garantir que o DOM foi atualizado e a seção está visível
            requestAnimationFrame(() => {
                const section = $('#relatorios');
                if (section.hasClass('active') && section.is(':visible')) {
                    // Recriar DataTable
                    dataTableRelatorios = $('#relatoriosTable').DataTable({
                        language: {
                            search: "Buscar:",
                            lengthMenu: "Mostrar _MENU_ registros",
                            info: "Página _PAGE_ de _PAGES_",
                            paginate: {
                                next: "Próximo",
                                previous: "Anterior"
                            }
                        },
                        order: [[2, "desc"]], // Ordenar por livros lidos (descendente)
                        columnDefs: [{
                            orderable: false,
                            targets: 3
                        }]
                    });
                }
            });
        }
    } catch (error) {
        console.error('Erro ao carregar relatórios:', error);
        mostrarMensagem('relatorios', 'Erro ao carregar relatórios. Verifique se o backend está rodando!', 'erro');
    }
}

function inicializarTabelas() {
    // NÃO inicializar DataTables vazias - elas serão criadas quando os dados forem carregados
    // Isso evita conflitos quando os dados são carregados dinamicamente
    console.log('Tabelas serão inicializadas quando os dados forem carregados');
}

function mostrarMensagem(secao, mensagem, tipo) {
    const section = $(`#${secao}`);
    const mensagemClass = tipo === 'sucesso' ? 'mensagem-sucesso' : 'mensagem-erro';
    
    // Remover mensagens anteriores
    section.find('.mensagem-sucesso, .mensagem-erro').remove();
    
    const corFundo = tipo === 'sucesso' ? '#d4edda' : '#f8d7da';
    const corTexto = tipo === 'sucesso' ? '#155724' : '#721c24';
    
    const mensagemHtml = `
        <div class="${mensagemClass}" style="
            padding: 12px 16px;
            margin-bottom: 20px;
            border-radius: 4px;
            background-color: ${corFundo};
            color: ${corTexto};
            border: 1px solid ${tipo === 'sucesso' ? '#c3e6cb' : '#f5c6cb'};
            font-size: 14px;
            font-weight: 500;
            text-align: center;
        ">${mensagem}</div>
    `;
    
    section.find('.page-header').after(mensagemHtml);
    
    // Remover mensagem após 5 segundos
    setTimeout(() => {
        section.find(`.${mensagemClass}`).fadeOut(300, function() {
            $(this).remove();
        });
    }, 5000);
}
