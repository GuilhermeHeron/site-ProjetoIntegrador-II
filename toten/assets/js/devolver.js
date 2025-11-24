// URL do backend do totem
const API_URL = 'http://localhost:3003';

// Variáveis globais
let usuarioData = null;
let emprestimos = [];

// Carrega os dados ao carregar a página
document.addEventListener('DOMContentLoaded', async () => {
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

    // Carrega os empréstimos ativos
    await carregarEmprestimos();
});

// Função para carregar empréstimos ativos do usuário
async function carregarEmprestimos() {
    const loadingMessage = document.getElementById('loading-message');
    const emptyMessage = document.getElementById('empty-message');
    const table = document.getElementById('emprestimosTable');

    try {
        const response = await fetch(`${API_URL}/emprestimos/usuario/${usuarioData.id}`);
        const data = await response.json();

        loadingMessage.style.display = 'none';

        if (data.sucesso && data.emprestimos && data.emprestimos.length > 0) {
            emprestimos = data.emprestimos;
            preencherTabela(emprestimos);
            table.style.display = 'table';
            emptyMessage.style.display = 'none';

            // Inicializa DataTables
            if ($.fn.DataTable.isDataTable('#emprestimosTable')) {
                $('#emprestimosTable').DataTable().destroy();
            }

            $('#emprestimosTable').DataTable({
                language: {
                    url: 'https://cdn.datatables.net/plug-ins/1.13.6/i18n/pt-BR.json'
                },
                pageLength: 10,
                order: [[3, 'asc']] // Ordena por data de devolução
            });
        } else {
            table.style.display = 'none';
            emptyMessage.style.display = 'block';
        }
    } catch (error) {
        console.error('Erro ao carregar empréstimos:', error);
        loadingMessage.style.display = 'none';
        mostrarModal('Erro', 'Erro ao carregar seus livros emprestados. Verifique se o backend está rodando!', 'error');
    }
}

// Função para preencher a tabela com os empréstimos
function preencherTabela(emprestimos) {
    const tbody = document.querySelector('#emprestimosTable tbody');
    tbody.innerHTML = '';

    emprestimos.forEach(emprestimo => {
        const row = document.createElement('tr');
        
        // Formata datas
        const formatarData = (dataStr) => {
            if (!dataStr) return 'N/A';
            const data = new Date(dataStr);
            return data.toLocaleDateString('pt-BR');
        };

        // Verifica se está atrasado
        const hoje = new Date();
        const dataDevolucao = new Date(emprestimo.data_devolucao_prevista);
        const estaAtrasado = hoje > dataDevolucao;
        const diasAtraso = estaAtrasado ? Math.floor((hoje - dataDevolucao) / (1000 * 60 * 60 * 24)) : 0;

        // Status visual
        let statusHTML = '';
        if (estaAtrasado) {
            statusHTML = `<span class="status status-unavailable">Atrasado (${diasAtraso} dias)</span>`;
        } else {
            statusHTML = `<span class="status status-available">No prazo</span>`;
        }

        row.innerHTML = `
            <td>${emprestimo.livro_titulo}</td>
            <td>${emprestimo.livro_autor}</td>
            <td>${formatarData(emprestimo.data_emprestimo)}</td>
            <td>${formatarData(emprestimo.data_devolucao_prevista)}</td>
            <td>${statusHTML}</td>
            <td>
                <button class="btn-devolver" 
                        data-emprestimo-id="${emprestimo.id}"
                        data-livro-titulo="${emprestimo.livro_titulo}"
                        data-livro-autor="${emprestimo.livro_autor}"
                        style="padding: 8px 16px; background-color: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 500;">
                    Devolver
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });

    // Adiciona event listeners aos botões de devolver
    document.querySelectorAll('.btn-devolver').forEach(button => {
        button.addEventListener('click', function() {
            const emprestimoId = this.getAttribute('data-emprestimo-id');
            const livroTitulo = this.getAttribute('data-livro-titulo');
            const livroAutor = this.getAttribute('data-livro-autor');
            
            devolverLivro(emprestimoId, livroTitulo, livroAutor);
        });
    });
}

// Função para devolver um livro
function devolverLivro(emprestimoId, livroTitulo, livroAutor) {
    mostrarModalConfirmacao(
        'Confirmar Devolução',
        `Deseja confirmar a devolução do livro "${livroTitulo}"?`,
        () => {
            processarDevolucao(emprestimoId);
        }
    );
}

// Função para processar a devolução
async function processarDevolucao(emprestimoId) {
    try {
        const response = await fetch(`${API_URL}/devolver`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                emprestimo_id: parseInt(emprestimoId),
                condicao_devolucao: 'BOM', // Pode ser melhorado com um formulário
                observacoes: null
            })
        });

        const data = await response.json();

        if (data.sucesso) {
            const formatarData = (dataStr) => {
                const data = new Date(dataStr);
                return data.toLocaleDateString('pt-BR');
            };

            const mensagem = `Livro: ${data.devolucao.livro_titulo}\n` +
                            `Autor: ${data.devolucao.livro_autor}\n` +
                            `Data do Empréstimo: ${formatarData(data.devolucao.data_emprestimo)}\n` +
                            `Data de Devolução: ${formatarData(data.devolucao.data_devolucao_real)}\n` +
                            `Dias Emprestados: ${data.devolucao.dias_emprestados}\n` +
                            `Status: ${data.devolucao.status === 'ATRASADO' ? 'Atrasado' : 'No prazo'}`;

            mostrarModal('Sucesso', mensagem, 'success', () => {
                // Recarrega a lista de empréstimos
                carregarEmprestimos();
            });
        } else {
            mostrarModal('Erro', `Erro ao devolver livro: ${data.mensagem}`, 'error');
        }

    } catch (error) {
        console.error('Erro ao devolver livro:', error);
        mostrarModal('Erro', 'Erro ao conectar com o servidor. Verifique se o backend está rodando!', 'error');
    }
}
