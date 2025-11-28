// URL do backend
const API_URL = 'http://localhost:3001';

document.addEventListener('DOMContentLoaded', () => {
    // Seleciona os elementos do DOM
    const registerForm = document.getElementById('register-form');
    const loginForm = document.getElementById('login-form');

    const showLoginLink = document.getElementById('show-login');
    const showRegisterLink = document.getElementById('show-register');

    // Adiciona um evento ao link "Faça login"
    showLoginLink.addEventListener('click', (event) => {
        event.preventDefault(); // Impede o comportamento padrão do link

        // Esconde o formulário de cadastro e mostra o de login
        registerForm.classList.add('hidden');
        loginForm.classList.remove('hidden');
        
        // Limpa mensagens de erro anteriores
        limparMensagens();
    });

    // Adiciona um evento ao link "Cadastre-se"
    showRegisterLink.addEventListener('click', (event) => {
        event.preventDefault(); // Impede o comportamento padrão do link

        // Esconde o formulário de login e mostra o de cadastro
        loginForm.classList.add('hidden');
        registerForm.classList.remove('hidden');
        
        // Limpa mensagens de erro anteriores
        limparMensagens();
    });

    // ============================================
    // CADASTRO DE ALUNO
    // ============================================
    const registerFormElement = registerForm.querySelector('form');
    registerFormElement.addEventListener('submit', async (event) => {
        event.preventDefault();

        const nomeCompleto = document.getElementById('reg-fullname').value.trim();
        const email = document.getElementById('reg-email').value.trim();
        const ra = document.getElementById('reg-ra').value.trim();

        // Validação básica
        if (!nomeCompleto || !email || !ra) {
            mostrarMensagem(registerFormElement, 'Por favor, preencha todos os campos!', 'erro');
            return;
        }

        // Desabilita o botão durante o cadastro
        const submitBtn = registerFormElement.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'CADASTRANDO...';

        try {
            const response = await fetch(`${API_URL}/cadastro`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    nome_completo: nomeCompleto,
                    email: email,
                    ra: ra
                })
            });

            const data = await response.json();

            if (data.sucesso) {
                // Cadastro bem-sucedido
                mostrarMensagem(registerFormElement, data.mensagem + ' Agora faça login com seu RA.', 'sucesso');
                
                // Limpa o formulário
                registerFormElement.reset();
                
                // Esconde o formulário de cadastro e mostra o de login
                setTimeout(() => {
                    registerForm.classList.add('hidden');
                    loginForm.classList.remove('hidden');
                    
                    // Preenche o campo RA no formulário de login
                    document.getElementById('login-ra').value = data.usuario.ra;
                    
                    // Limpa mensagens
                    limparMensagens();
                    
                    // Mostra mensagem no formulário de login
                    mostrarMensagem(loginFormElement, 'Cadastro realizado com sucesso! Faça login com seu RA.', 'sucesso');
                    
                    // Reabilita o botão de cadastro
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'CADASTRAR';
                }, 1500);
            } else {
                // Erro no cadastro
                mostrarMensagem(registerFormElement, data.mensagem, 'erro');
                submitBtn.disabled = false;
                submitBtn.textContent = 'CADASTRAR';
            }

        } catch (error) {
            console.error('Erro ao cadastrar:', error);
            mostrarMensagem(registerFormElement, 'Erro ao conectar com o servidor. Verifique se o backend está rodando!', 'erro');
            submitBtn.disabled = false;
            submitBtn.textContent = 'CADASTRAR';
        }
    });

    // ============================================
    // LOGIN DE ALUNO
    // ============================================
    const loginFormElement = loginForm.querySelector('form');
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
                
                // Limpa qualquer flag do totem (pois estamos no login do aluno)
                localStorage.removeItem('acao_totem');
                localStorage.removeItem('livro_selecionado');
                
                // Redireciona para livros.html após 1 segundo
                setTimeout(() => {
                    window.location.href = 'livros.html';
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
