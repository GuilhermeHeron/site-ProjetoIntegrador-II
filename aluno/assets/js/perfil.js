// URL do backend
const API_URL = 'http://localhost:3001';

// Variáveis globais
let usuarioData = null;

// Carrega os dados ao carregar a página
document.addEventListener('DOMContentLoaded', async () => {
    // Carrega dados do usuário do localStorage
    const usuario = localStorage.getItem('usuario');
    if (usuario) {
        usuarioData = JSON.parse(usuario);
    } else {
        // Se não houver usuário logado, redireciona para login
        mostrarModal('Atenção', 'Usuário não autenticado. Redirecionando para login...', 'warning', () => {
            window.location.href = 'index.html';
        });
        return;
    }

    // Carrega todos os dados do perfil
    await carregarDadosPerfil();
});

// Função para carregar todos os dados do perfil
async function carregarDadosPerfil() {
    try {
        // Carrega dados atualizados do usuário
        await carregarDadosUsuario();
        
        // Carrega estatísticas
        await carregarEstatisticas();
        
        // Carrega empréstimos ativos
        await carregarEmprestimos();
        
        // Carrega histórico
        await carregarHistorico();
    } catch (error) {
        console.error('Erro ao carregar dados do perfil:', error);
    }
}

// Função para carregar dados do usuário
async function carregarDadosUsuario() {
    try {
        const response = await fetch(`${API_URL}/usuario/${usuarioData.id}`);
        const data = await response.json();

        if (data.sucesso && data.usuario) {
            usuarioData = data.usuario;
            atualizarInformacoesUsuario(data.usuario);
        }
    } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error);
    }
}

// Função para atualizar informações do usuário na página
function atualizarInformacoesUsuario(usuario) {
    // Atualiza avatar com iniciais
    const avatarText = document.querySelector('.avatar-text');
    if (avatarText) {
        const iniciais = usuario.nome_completo
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);
        avatarText.textContent = iniciais;
    }

    // Atualiza nome
    const nomeElement = document.querySelector('.user-details h3');
    if (nomeElement) {
        nomeElement.textContent = usuario.nome_completo;
    }

    // Atualiza RA
    const raElements = document.querySelectorAll('.user-details p');
    raElements.forEach(p => {
        if (p.textContent.includes('RA:')) {
            p.innerHTML = `<strong>RA:</strong> ${usuario.ra}`;
        }
        if (p.textContent.includes('Email:')) {
            p.innerHTML = `<strong>Email:</strong> ${usuario.email}`;
        }
    });
}

// Função para carregar estatísticas
async function carregarEstatisticas() {
    try {
        const response = await fetch(`${API_URL}/estatisticas/${usuarioData.id}`);
        const data = await response.json();

        if (data.sucesso && data.estatisticas) {
            atualizarEstatisticas(data.estatisticas);
        }
    } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
    }
}

// Função para atualizar estatísticas na página
function atualizarEstatisticas(stats) {
    const statCards = document.querySelectorAll('.stat-card');
    
    statCards.forEach(card => {
        const icon = card.querySelector('.stat-icon').textContent;
        const content = card.querySelector('.stat-content');
        
        if (icon === '📚') {
            // Livros Emprestados (total)
            content.querySelector('h3').textContent = stats.total_livros_emprestados || 0;
            content.querySelector('p').textContent = 'Livros Emprestados';
        } else if (icon === '📖') {
            // Livros Emprestados Atualmente
            content.querySelector('h3').textContent = stats.livros_emprestados_atualmente || 0;
            content.querySelector('p').textContent = 'Livros Emprestados';
        } else if (icon === '⭐') {
            // Nível do Leitor
            const nivelNome = getNivelNome(stats.nivel_leitor);
            const nivelIcon = getNivelIcon(stats.nivel_leitor);
            content.querySelector('h3').textContent = nivelNome;
            card.querySelector('.stat-icon').textContent = nivelIcon;
            content.querySelector('p').textContent = 'Nível Atual';
        } else if (icon === '🏆') {
            // Conquistas
            content.querySelector('h3').textContent = stats.total_conquistas || 0;
            content.querySelector('p').textContent = 'Conquistas';
        }
    });
}

// Função para obter nome do nível
function getNivelNome(nivel) {
    const niveis = {
        'INICIANTE': 'Leitor Iniciante',
        'REGULAR': 'Leitor Regular',
        'ATIVO': 'Leitor Ativo',
        'EXTREMO': 'Leitor Extremo'
    };
    return niveis[nivel] || 'Leitor Iniciante';
}

// Função para obter ícone do nível
function getNivelIcon(nivel) {
    const icons = {
        'INICIANTE': '🌱',
        'REGULAR': '📚',
        'ATIVO': '⭐',
        'EXTREMO': '🏆'
    };
    return icons[nivel] || '🌱';
}

// Função para carregar empréstimos ativos
async function carregarEmprestimos() {
    try {
        const response = await fetch(`${API_URL}/emprestimos/${usuarioData.id}`);
        const data = await response.json();

        if (data.sucesso && data.emprestimos) {
            atualizarEmprestimos(data.emprestimos);
        }
    } catch (error) {
        console.error('Erro ao carregar empréstimos:', error);
    }
}

// Função para atualizar lista de empréstimos
function atualizarEmprestimos(emprestimos) {
    const booksGrid = document.querySelector('.my-books-grid');
    if (!booksGrid) return;

    booksGrid.innerHTML = '';

    if (emprestimos.length === 0) {
        booksGrid.innerHTML = '<p style="text-align: center; color: #cbd5e1; padding: 20px;">Você não possui livros emprestados no momento.</p>';
        return;
    }

    emprestimos.forEach(emprestimo => {
        const formatarData = (dataStr) => {
            if (!dataStr) return 'N/A';
            const data = new Date(dataStr);
            return data.toLocaleDateString('pt-BR');
        };

        const estaAtrasado = emprestimo.dias_atraso > 0;
        const statusClass = estaAtrasado ? 'status-overdue' : 'status-loaned';
        const statusText = estaAtrasado ? 'Atrasado' : 'Emprestado';

        const card = document.createElement('div');
        card.className = 'my-book-card';
        card.innerHTML = `
            <div class="book-info">
                <h3>${emprestimo.livro_titulo}</h3>
                <p><strong>Autor:</strong> ${emprestimo.livro_autor}</p>
                <p><strong>Data Empréstimo:</strong> ${formatarData(emprestimo.data_emprestimo)}</p>
                <p><strong>Data Devolução:</strong> ${formatarData(emprestimo.data_devolucao_prevista)}</p>
                <p><strong>Status:</strong> <span class="status ${statusClass}">${statusText}</span></p>
            </div>
            <div class="book-actions">
                <button class="btn btn-primary" onclick="renovarLivro(${emprestimo.id}, '${emprestimo.livro_titulo.replace(/'/g, "\\'")}')">Renovar</button>
                <button class="btn btn-secondary" onclick="devolverLivro(${emprestimo.id}, '${emprestimo.livro_titulo.replace(/'/g, "\\'")}')">Devolver</button>
            </div>
        `;
        booksGrid.appendChild(card);
    });
}

// Função para carregar histórico
async function carregarHistorico() {
    try {
        const response = await fetch(`${API_URL}/historico/${usuarioData.id}`);
        const data = await response.json();

        if (data.sucesso && data.historico) {
            atualizarHistorico(data.historico);
        }
    } catch (error) {
        console.error('Erro ao carregar histórico:', error);
    }
}

// Função para atualizar histórico
function atualizarHistorico(historico) {
    const historyList = document.querySelector('.history-list');
    if (!historyList) return;

    historyList.innerHTML = '';

    if (historico.length === 0) {
        historyList.innerHTML = '<p style="text-align: center; color: #cbd5e1; padding: 20px;">Nenhum histórico de leitura ainda.</p>';
        return;
    }

    historico.forEach(item => {
        const formatarData = (dataStr) => {
            if (!dataStr) return 'N/A';
            const data = new Date(dataStr);
            return data.toLocaleDateString('pt-BR');
        };

        const isRetirado = item.tipo_evento === 'RETIRADO';
        const icon = isRetirado ? '📖' : '✅';
        const texto = isRetirado ? 'Retirado em' : 'Devolvido em';

        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        historyItem.innerHTML = `
            <div class="history-icon">${icon}</div>
            <div class="history-content">
                <h4>${item.livro_titulo}</h4>
                <p>${texto} ${formatarData(item.data)}</p>
            </div>
        `;
        historyList.appendChild(historyItem);
    });
}

// Função para renovar livro
async function renovarLivro(emprestimoId, titulo) {
    mostrarModalConfirmacao(
        'Renovar Empréstimo',
        `Deseja renovar o empréstimo do livro "${titulo}"?`,
        'warning',
        async () => {
            try {
                const response = await fetch(`${API_URL}/renovar`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        emprestimo_id: emprestimoId
                    })
                });

                const data = await response.json();

                if (data.sucesso) {
                    const mensagem = `Livro renovado com sucesso!\n\n` +
                                  `Nova data de devolução: ${new Date(data.renovacao.nova_data_devolucao).toLocaleDateString('pt-BR')}\n` +
                                  `Renovações realizadas: ${data.renovacao.numero_renovacoes}`;
                    
                    mostrarModal('Sucesso', mensagem, 'success', async () => {
                        // Recarrega os dados
                        await carregarEmprestimos();
                        await carregarEstatisticas();
                    });
                } else {
                    mostrarModal('Erro', `Erro ao renovar livro: ${data.mensagem}`, 'error');
                }

            } catch (error) {
                console.error('Erro ao renovar livro:', error);
                mostrarModal('Erro', 'Erro ao conectar com o servidor. Verifique se o backend está rodando!', 'error');
            }
        }
    );
}

// Função para devolver livro
function devolverLivro(emprestimoId, titulo) {
    mostrarModalConfirmacao(
        'Devolver Livro',
        `Deseja devolver o livro "${titulo}"?`,
        'warning',
        () => {
            // Redireciona para a página de devolução do totem
            localStorage.setItem('emprestimo_devolver', emprestimoId);
            window.location.href = '../toten/devolver.html';
        }
    );
}
