// Função para cancelar renovação
function cancelarRenovacao() {
    const confirmacao = confirm('Deseja cancelar a renovação deste livro?');
    
    if (confirmacao) {
        alert('Renovação cancelada!');
        // Voltar para o perfil
        window.location.href = 'perfil.html';
    }
}

// Função para confirmar renovação
function confirmarRenovacao() {
    const confirmacao = confirm('Deseja confirmar a renovação do livro "A Grande Aventura"?');
    
    if (confirmacao) {
        alert('Livro renovado com sucesso!\n\n' +
              'Livro: A Grande Aventura\n' +
              'Autor: Thomas Vinterberg\n' +
              'Data do Empréstimo Original: 15/12/2024\n' +
              'Data de Devolução Anterior: 22/12/2024\n' +
              'Nova Data de Devolução: 27/12/2024\n' +
              'Período Adicional: +5 dias\n' +
              'Aluno: Ana Silva (RA: 12345)');
        
        // Voltar para o perfil
        window.location.href = 'perfil.html';
    }
}
