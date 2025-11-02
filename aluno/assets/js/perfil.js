document.addEventListener('DOMContentLoaded', function() {
    // Dados do usuário (simulados)
    const userData = {
        name: "Ana Silva",
        ra: "12345",
        email: "ana.silva@email.com",
        booksRead: 15,
        booksBorrowed: 3,
        level: "Leitor Ativo",
        achievements: 5
    };

    // Atualizar informações do usuário
    updateUserInfo(userData);
    
    // Atualizar estatísticas
    updateStats(userData);
});

function updateUserInfo(data) {
    // Atualizar avatar com iniciais
    const avatarText = document.querySelector('.avatar-text');
    if (avatarText) {
        const initials = data.name.split(' ').map(n => n[0]).join('');
        avatarText.textContent = initials;
    }
}

function updateStats(data) {
    // As estatísticas já estão hardcoded no HTML, mas aqui poderia ser dinâmico
    console.log('Estatísticas atualizadas para:', data.name);
}

// Função para renovar livro
function renovarLivro(titulo) {
    // Redirecionar para a página de renovação
    window.location.href = 'renovar.html';
}

// Função para devolver livro
function devolverLivro(titulo) {
    // Redirecionar para a página de devolução
    window.location.href = 'devolver.html';
}

// Função para atualizar visual do card
function updateBookCard(titulo, acao) {
    const cards = document.querySelectorAll('.my-book-card');
    
    cards.forEach(card => {
        const bookTitle = card.querySelector('h3').textContent;
        if (bookTitle === titulo) {
            if (acao === 'renovado') {
                // Atualizar data de devolução
                const dataDevolucao = card.querySelector('p:nth-child(4)');
                const hoje = new Date();
                const novaData = new Date(hoje);
                novaData.setDate(hoje.getDate() + 7);
                dataDevolucao.textContent = `Data Devolução: ${novaData.toLocaleDateString('pt-BR')}`;
                
                // Destacar renovação
                card.style.borderColor = '#10b981';
                card.style.boxShadow = '0 4px 16px rgba(16, 185, 129, 0.3)';
                
                setTimeout(() => {
                    card.style.borderColor = '';
                    card.style.boxShadow = '';
                }, 3000);
                
            } else if (acao === 'devolvido') {
                // Remover card da lista
                card.style.opacity = '0.5';
                card.style.transform = 'scale(0.95)';
                
                setTimeout(() => {
                    card.remove();
                    updateStatsAfterReturn();
                }, 500);
            }
        }
    });
}

// Função para atualizar estatísticas após devolução
function updateStatsAfterReturn() {
    const booksBorrowedElement = document.querySelector('.stat-card:nth-child(2) h3');
    if (booksBorrowedElement) {
        const currentCount = parseInt(booksBorrowedElement.textContent);
        booksBorrowedElement.textContent = currentCount - 1;
    }
}

// Função para mostrar detalhes do livro
function showBookDetails(titulo) {
    const details = {
        'A Grande Aventura': {
            autor: 'Thomas Vinterberg',
            categoria: 'Ficção',
            sinopse: 'Uma emocionante aventura que leva o leitor a mundos desconhecidos.',
            paginas: 320
        },
        'Na Natureza Selvagem': {
            autor: 'Jon Krakauer',
            categoria: 'Não Ficção',
            sinopse: 'A história real de Christopher McCandless e sua jornada pela natureza.',
            paginas: 280
        },
        'O Mundo Perdido': {
            autor: 'Arthur Conan Doyle',
            categoria: 'Ficção',
            sinopse: 'Uma expedição a um mundo pré-histórico perdido no tempo.',
            paginas: 350
        }
    };
    
    const livro = details[titulo];
    if (livro) {
        alert(`Detalhes do Livro: ${titulo}\n\n` +
              `Autor: ${livro.autor}\n` +
              `Categoria: ${livro.categoria}\n` +
              `Páginas: ${livro.paginas}\n\n` +
              `Sinopse: ${livro.sinopse}`);
    }
}
