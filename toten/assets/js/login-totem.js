// URL do backend
const API_URL = 'http://localhost:3001';

document.addEventListener('DOMContentLoaded', () => {
    // Seleciona os elementos do DOM
    const loginForm = document.getElementById('login-form');
    const loginFormElement = loginForm.querySelector('form');

    // ============================================
    // LOGIN DE ALUNO
    // ============================================
    loginFormElement.addEventListener('submit', async (event) => {
        event.preventDefault();

        const ra = document.getElementById('login-ra').value.trim();

        // Validação básica
        if (!ra) {
            mostrarMensagem(loginFormElement, 'Por favor, digite seu RA!', 'erro');
            return;
        }

        // Desabilita o botão durante o login
        const submitBtn = loginFormElement.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'ENTRANDO...';

        try {
            const response = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ra: ra
                })
            });

            const data = await response.json();

            if (data.sucesso) {
                // Login bem-sucedido
                mostrarMensagem(loginFormElement, data.mensagem, 'sucesso');
                
                // Limpa o formulário
                loginFormElement.reset();
                
                // Salva dados do usuário no localStorage
                localStorage.setItem('usuario', JSON.stringify(data.usuario));
                
                // Verifica a ação do totem
                const acaoTotem = localStorage.getItem('acao_totem');
                const livroSelecionado = localStorage.getItem('livro_selecionado');
                
                // Redireciona após 1 segundo
                setTimeout(() => {
                    if (acaoTotem === 'devolucao') {
                        // Remove a flag de ação
                        localStorage.removeItem('acao_totem');
                        // Redireciona para a página de devolução do totem
                        window.location.href = 'devolver.html';
                    } else if (livroSelecionado) {
                        // Se há livro selecionado, redireciona para a página de alugar do totem
                        window.location.href = 'alugar.html';
                    } else {
                        // Caso padrão, redireciona para livros
                        window.location.href = 'livros.html';
                    }
                }, 1000);
            } else {
                // Erro no login
                mostrarMensagem(loginFormElement, data.mensagem, 'erro');
                submitBtn.disabled = false;
                submitBtn.textContent = 'ENTRAR';
            }

        } catch (error) {
            console.error('Erro ao fazer login:', error);
            mostrarMensagem(loginFormElement, 'Erro ao conectar com o servidor. Verifique se o backend está rodando!', 'erro');
            submitBtn.disabled = false;
            submitBtn.textContent = 'ENTRAR';
        }
    });
});

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

function mostrarMensagem(formElement, mensagem, tipo) {
    // Remove mensagens anteriores
    limparMensagens(formElement);

    // Cria elemento de mensagem
    const mensagemElement = document.createElement('div');
    mensagemElement.className = `mensagem ${tipo}`;
    mensagemElement.textContent = mensagem;
    mensagemElement.style.cssText = `
        padding: 12px 16px;
        margin-bottom: 20px;
        border-radius: 4px;
        font-size: 14px;
        font-weight: 500;
        text-align: center;
        ${tipo === 'sucesso' 
            ? 'background-color: #d4edda; color: #155724; border: 1px solid #c3e6cb;' 
            : 'background-color: #f8d7da; color: #721c24; border: 1px solid #f5c6cb;'}
    `;

    // Insere antes do botão de submit
    const submitBtn = formElement.querySelector('button[type="submit"]');
    formElement.insertBefore(mensagemElement, submitBtn);

    // Remove mensagem após 5 segundos (se for erro)
    if (tipo === 'erro') {
        setTimeout(() => {
            mensagemElement.remove();
        }, 5000);
    }
}

function limparMensagens(formElement = null) {
    const mensagens = formElement 
        ? formElement.querySelectorAll('.mensagem')
        : document.querySelectorAll('.mensagem');
    
    mensagens.forEach(msg => msg.remove());
}

