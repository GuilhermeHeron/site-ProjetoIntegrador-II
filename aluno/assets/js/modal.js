// Sistema de Modal Personalizado

// Cria o HTML do modal se não existir
function criarModalHTML() {
    if (document.getElementById('custom-modal')) {
        return; // Modal já existe
    }

    const modalHTML = `
        <div id="custom-modal" class="custom-modal">
            <div class="custom-modal-overlay"></div>
            <div class="custom-modal-container">
                <div class="custom-modal-header">
                    <h3 class="custom-modal-title" id="modal-title">Título</h3>
                    <button class="custom-modal-close" id="modal-close">&times;</button>
                </div>
                <div class="custom-modal-body">
                    <p id="modal-message">Mensagem</p>
                </div>
                <div class="custom-modal-footer">
                    <button class="custom-modal-btn custom-modal-btn-primary" id="modal-confirm">OK</button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Adiciona event listeners
    const modal = document.getElementById('custom-modal');
    const overlay = modal.querySelector('.custom-modal-overlay');
    const closeBtn = document.getElementById('modal-close');
    const confirmBtn = document.getElementById('modal-confirm');

    // Fechar ao clicar no overlay
    overlay.addEventListener('click', fecharModal);

    // Fechar ao clicar no botão X
    closeBtn.addEventListener('click', fecharModal);

    // Fechar ao clicar no botão OK
    confirmBtn.addEventListener('click', fecharModal);

    // Fechar com ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            fecharModal();
        }
    });
}

// Função para mostrar modal simples (tipo alert)
function mostrarModal(titulo, mensagem, tipo = 'info', callback = null) {
    criarModalHTML();

    const modal = document.getElementById('custom-modal');
    const titleEl = document.getElementById('modal-title');
    const messageEl = document.getElementById('modal-message');
    const confirmBtn = document.getElementById('modal-confirm');
    const footer = document.querySelector('.custom-modal-footer');

    // Define o título e mensagem
    titleEl.textContent = titulo;
    
    // Se a mensagem contém quebras de linha, converte para HTML
    if (mensagem.includes('\n')) {
        messageEl.innerHTML = mensagem.split('\n').map(line => {
            if (line.trim() === '') return '<br>';
            return `<p>${line}</p>`;
        }).join('');
    } else {
        messageEl.textContent = mensagem;
    }

    // Define a cor baseada no tipo
    const tipos = {
        'info': { color: '#60a5fa', icon: 'ℹ️' },
        'success': { color: '#10b981', icon: '✅' },
        'error': { color: '#ef4444', icon: '❌' },
        'warning': { color: '#f59e0b', icon: '⚠️' }
    };

    const tipoInfo = tipos[tipo] || tipos.info;
    titleEl.style.color = tipoInfo.color;
    titleEl.textContent = `${tipoInfo.icon} ${titulo}`;

    // Configura o botão
    confirmBtn.textContent = 'OK';
    confirmBtn.onclick = () => {
        fecharModal();
        if (callback) callback();
    };

    // Mostra apenas um botão para modal simples
    footer.innerHTML = '';
    footer.appendChild(confirmBtn);

    // Mostra o modal
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// Função para mostrar modal de confirmação (tipo confirm)
function mostrarModalConfirmacao(titulo, mensagem, tipo = 'warning', onConfirm, onCancel = null) {
    criarModalHTML();

    const modal = document.getElementById('custom-modal');
    const titleEl = document.getElementById('modal-title');
    const messageEl = document.getElementById('modal-message');
    const footer = document.querySelector('.custom-modal-footer');

    // Define o título e mensagem
    const tipos = {
        'info': { color: '#60a5fa', icon: 'ℹ️' },
        'success': { color: '#10b981', icon: '✅' },
        'error': { color: '#ef4444', icon: '❌' },
        'warning': { color: '#f59e0b', icon: '⚠️' }
    };

    const tipoInfo = tipos[tipo] || tipos.warning;
    titleEl.style.color = tipoInfo.color;
    titleEl.textContent = `${tipoInfo.icon} ${titulo}`;
    
    if (mensagem.includes('\n')) {
        messageEl.innerHTML = mensagem.split('\n').map(line => {
            if (line.trim() === '') return '<br>';
            return `<p>${line}</p>`;
        }).join('');
    } else {
        messageEl.textContent = mensagem;
    }

    // Cria botões de confirmação e cancelamento
    footer.innerHTML = `
        <button class="custom-modal-btn custom-modal-btn-secondary" id="modal-cancel">Cancelar</button>
        <button class="custom-modal-btn custom-modal-btn-primary" id="modal-confirm">Confirmar</button>
    `;

    const cancelBtn = document.getElementById('modal-cancel');
    const confirmBtn = document.getElementById('modal-confirm');

    cancelBtn.onclick = () => {
        fecharModal();
        if (onCancel) onCancel();
    };

    confirmBtn.onclick = () => {
        fecharModal();
        if (onConfirm) onConfirm();
    };

    // Mostra o modal
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// Função para fechar o modal
function fecharModal() {
    const modal = document.getElementById('custom-modal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// Exporta as funções para uso global
window.mostrarModal = mostrarModal;
window.mostrarModalConfirmacao = mostrarModalConfirmacao;
window.fecharModal = fecharModal;

