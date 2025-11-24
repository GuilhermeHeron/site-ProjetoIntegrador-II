// URL do backend do totem
const API_URL = 'http://localhost:3003';

document.addEventListener('DOMContentLoaded', async () => {
    // Carrega livros do backend
    await carregarLivros();

    // Inicializa DataTables após carregar os dados
    // Verifica se já existe uma instância do DataTable e destrói antes de criar uma nova
    if ($.fn.DataTable.isDataTable('#booksTable')) {
        $('#booksTable').DataTable().destroy();
    }
    
    $('#booksTable').DataTable({
        language: {
            url: 'https://cdn.datatables.net/plug-ins/1.13.6/i18n/pt-BR.json'
        },
        pageLength: 10,
        order: [[0, 'asc']]
    });

    // Event listener para o botão de devolução
    const btnDevolucao = document.getElementById('btn-devolucao');
    if (btnDevolucao) {
        btnDevolucao.addEventListener('click', function(e) {
            e.preventDefault();
            // Marca que veio para devolução
            localStorage.setItem('acao_totem', 'devolucao');
            // Redireciona para login do totem
            window.location.href = 'index.html';
        });
    }
});

// Função para carregar livros do backend
async function carregarLivros() {
    try {
        const response = await fetch(`${API_URL}/livros`);
        const data = await response.json();

        if (data.sucesso && data.livros) {
            const tbody = document.querySelector('#booksTable tbody');
            tbody.innerHTML = ''; // Limpa o conteúdo estático

            data.livros.forEach(livro => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td><div class="book-title">${livro.titulo}</div></td>
                    <td><div class="book-author">${livro.autor}</div></td>
                    <td>${livro.categoria}</td>
                    <td><span class="status status-available">Disponível</span></td>
                    <td><button class="btn-alugar" data-livro-id="${livro.id}" data-livro-titulo="${livro.titulo}" data-livro-autor="${livro.autor}" data-livro-categoria="${livro.categoria}">Alugar</button></td>
                `;
                tbody.appendChild(row);
            });

            // Usa delegação de eventos para funcionar com DataTables
            // Remove listeners anteriores se existirem
            const tableBody = document.querySelector('#booksTable tbody');
            if (tableBody) {
                tableBody.addEventListener('click', function(e) {
                    // Verifica se o clique foi em um botão de alugar
                    if (e.target && e.target.classList.contains('btn-alugar')) {
                        const button = e.target;
                        const livroId = button.getAttribute('data-livro-id');
                        const titulo = button.getAttribute('data-livro-titulo');
                        const autor = button.getAttribute('data-livro-autor');
                        const categoria = button.getAttribute('data-livro-categoria');
                        
                        if (!livroId) {
                            mostrarModal('Erro', 'ID do livro não encontrado.', 'error');
                            return;
                        }
                        
                        // Salva os dados do livro no localStorage
                        const livroData = {
                            id: parseInt(livroId), // Garante que é um número
                            titulo: titulo,
                            autor: autor,
                            categoria: categoria
                        };
                        
                        console.log('Livro selecionado:', livroData);
                        localStorage.setItem('livro_selecionado', JSON.stringify(livroData));
                        
                        // Redireciona para a página de login do totem
                        window.location.href = 'index.html';
                    }
                });
            }
        } else {
            console.error('Erro ao carregar livros:', data.mensagem);
        }
    } catch (error) {
        console.error('Erro ao conectar com o servidor:', error);
        // Mantém os dados estáticos caso haja erro
    }
}

