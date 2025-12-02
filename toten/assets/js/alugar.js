// URL do backend do totem
const API_URL = 'http://localhost:3003';

// Variáveis globais
let livroData = null;
let usuarioData = null;

// Carrega os dados do livro e do usuário ao carregar a página
document.addEventListener('DOMContentLoaded', async () => {
    // Carrega dados do livro do localStorage
    const livroSelecionado = localStorage.getItem('livro_selecionado');
    if (livroSelecionado) {
        livroData = JSON.parse(livroSelecionado);
    } else {
        // Se não houver livro selecionado, redireciona para livros
        mostrarModal('Aviso', 'Nenhum livro selecionado. Redirecionando...', 'warning', () => {
            window.location.href = 'livros.html';
        });
        return;
    }

    // Carrega dados do usuário do localStorage
    const usuario = localStorage.getItem('usuario');
    if (usuario) {
        usuarioData = JSON.parse(usuario);
    } else {
        // Se não houver usuário logado, redireciona para login
        mostrarModal('Aviso', 'Usuário não autenticado. Redirecionando para login...', 'warning', () => {
            window.location.href = '../aluno/index.html';
        });
        return;
    }

    // Busca dados completos do livro no backend
    await buscarDadosCompletosLivro();

    // Preenche os dados na página (após buscar dados completos)
    preencherDadosLivro();
    preencherDadosRetirada();
    
    console.log('Dados do livro carregados e exibidos:', livroData);
});

// Função para buscar dados completos do livro no backend
async function buscarDadosCompletosLivro() {
    if (!livroData || !livroData.id) {
        console.warn('ID do livro não encontrado no localStorage');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/livros/${livroData.id}`);
        const data = await response.json();

        if (data.sucesso && data.livro) {
            // Atualiza os dados do livro com informações completas do backend
            livroData = {
                id: data.livro.id,
                titulo: data.livro.titulo || livroData.titulo,
                autor: data.livro.autor || livroData.autor,
                categoria: data.livro.categoria || livroData.categoria,
                sinopse: data.livro.sinopse || '',
                numero_paginas: data.livro.numero_paginas || 0,
                status: data.livro.status || 'DISPONIVEL'
            };
            console.log('Dados completos do livro carregados:', livroData);
        } else {
            console.warn('Livro não encontrado no backend, usando dados do localStorage');
        }
    } catch (error) {
        console.error('Erro ao buscar dados do livro:', error);
        // Continua com os dados do localStorage caso haja erro
    }
}

// Função para preencher os dados do livro na página
function preencherDadosLivro() {
    if (!livroData) return;

    const bookDetails = document.querySelector('.book-details');
    if (!bookDetails) return;

    // Atualiza título
    const tituloElement = bookDetails.querySelector('h2');
    if (tituloElement) {
        tituloElement.textContent = livroData.titulo;
    }

    // Busca todos os parágrafos e atualiza os dados
    const paragraphs = bookDetails.querySelectorAll('p');
    
    paragraphs.forEach(p => {
        const strong = p.querySelector('strong');
        if (strong) {
            const label = strong.textContent.trim();
            
            // Atualiza autor
            if (label.includes('Autor:')) {
                p.innerHTML = `<strong>Autor:</strong> ${livroData.autor || 'Não informado'}`;
            }
            // Atualiza categoria
            else if (label.includes('Categoria:')) {
                p.innerHTML = `<strong>Categoria:</strong> ${livroData.categoria || 'Não informado'}`;
            }
            // Atualiza status
            else if (label.includes('Status:')) {
                p.innerHTML = `<strong>Status:</strong> <span class="status status-available">Disponível</span>`;
            }
            // Atualiza páginas
            else if (label.includes('Páginas:')) {
                const paginas = livroData.numero_paginas || 0;
                p.innerHTML = `<strong>Páginas:</strong> ${paginas > 0 ? paginas : 'Não informado'}`;
            }
            // Atualiza sinopse
            else if (label.includes('Sinopse:')) {
                const sinopse = livroData.sinopse || 'Sinopse não disponível.';
                p.innerHTML = `<strong>Sinopse:</strong> ${sinopse}`;
            }
        }
    });

    // Se não encontrar os elementos, cria novos
    if (paragraphs.length === 0) {
        let html = '';
        
        if (livroData.autor) {
            html += `<p><strong>Autor:</strong> ${livroData.autor}</p>`;
        }
        if (livroData.categoria) {
            html += `<p><strong>Categoria:</strong> ${livroData.categoria}</p>`;
        }
        html += `<p><strong>Status:</strong> <span class="status status-available">Disponível</span></p>`;
        if (livroData.numero_paginas) {
            html += `<p><strong>Páginas:</strong> ${livroData.numero_paginas}</p>`;
        }
        if (livroData.sinopse) {
            html += `<p><strong>Sinopse:</strong> ${livroData.sinopse}</p>`;
        }
        
        bookDetails.insertAdjacentHTML('beforeend', html);
    }
}

// Função para preencher os dados da retirada
function preencherDadosRetirada() {
    if (!usuarioData) return;

    // Calcula datas
    const hoje = new Date();
    const dataDevolucao = new Date(hoje);
    dataDevolucao.setDate(hoje.getDate() + 7); // 7 dias para devolução

    // Formata datas
    const formatarData = (data) => {
        return data.toLocaleDateString('pt-BR');
    };

    // Atualiza informações da retirada
    const rentalDetails = document.querySelector('.rental-details');
    if (rentalDetails) {
        rentalDetails.innerHTML = `
            <p><strong>Data da Retirada:</strong> ${formatarData(hoje)}</p>
            <p><strong>Data de Devolução:</strong> ${formatarData(dataDevolucao)}</p>
            <p><strong>Período:</strong> 7 dias</p>
            <p><strong>Aluno:</strong> ${usuarioData.nome_completo} (RA: ${usuarioData.ra})</p>
        `;
    }
}

// Função para cancelar retirada
function cancelarRetirada() {
    mostrarModalConfirmacao(
        'Cancelar Retirada',
        'Deseja cancelar a retirada deste livro?',
        () => {
            // Remove o livro selecionado do localStorage
            localStorage.removeItem('livro_selecionado');
            mostrarModal('Sucesso', 'Retirada cancelada!', 'success', () => {
                window.location.href = 'livros.html';
            });
        }
    );
}

// Função para confirmar retirada
async function confirmarRetirada() {
    if (!livroData || !usuarioData) {
        mostrarModal('Erro', 'Dados do livro ou usuário não encontrados.', 'error');
        return;
    }

    if (!livroData.id) {
        mostrarModal('Erro', 'ID do livro não encontrado. Por favor, selecione o livro novamente.', 'error', () => {
            window.location.href = 'livros.html';
        });
        return;
    }

    mostrarModalConfirmacao(
        'Confirmar Retirada',
        `Deseja confirmar a retirada do livro "${livroData.titulo}"?`,
        () => {
            processarRetirada();
        }
    );
}

// Função para processar a retirada
async function processarRetirada() {

    // Desabilita o botão durante o processamento
    const btnConfirmar = document.querySelector('.btn-primary');
    if (btnConfirmar) {
        btnConfirmar.disabled = true;
        btnConfirmar.textContent = 'Processando...';
    }

    try {
        const response = await fetch(`${API_URL}/alugar`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                usuario_id: usuarioData.id,
                livro_id: livroData.id
            })
        });

        const data = await response.json();

        if (data.sucesso) {
            // Formata datas
            const formatarData = (dataStr) => {
                const data = new Date(dataStr);
                return data.toLocaleDateString('pt-BR');
            };

            const mensagem = `Livro: ${data.emprestimo.livro_titulo}\n` +
                            `Autor: ${data.emprestimo.livro_autor}\n` +
                            `Data da Retirada: ${formatarData(data.emprestimo.data_emprestimo)}\n` +
                            `Data de Devolução: ${formatarData(data.emprestimo.data_devolucao_prevista)}\n` +
                            `Aluno: ${data.emprestimo.usuario_nome} (RA: ${data.emprestimo.usuario_ra})`;

            mostrarModal('Sucesso', mensagem, 'success', () => {
                // Remove o livro selecionado do localStorage
                localStorage.removeItem('livro_selecionado');
                // Voltar para o acervo
                window.location.href = 'livros.html';
            });
        } else {
            mostrarModal('Erro', `Erro ao retirar livro: ${data.mensagem}`, 'error');
            if (btnConfirmar) {
                btnConfirmar.disabled = false;
                btnConfirmar.textContent = 'Confirmar Retirada';
            }
        }

    } catch (error) {
        console.error('Erro ao retirar livro:', error);
        mostrarModal('Erro', 'Erro ao conectar com o servidor. Verifique se o backend está rodando!', 'error');
        if (btnConfirmar) {
            btnConfirmar.disabled = false;
            btnConfirmar.textContent = 'Confirmar Retirada';
        }
    }
}