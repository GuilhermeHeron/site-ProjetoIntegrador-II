// Função para cancelar devolução
function cancelarDevolucao() {
    const confirmacao = confirm('Deseja cancelar a devolução deste livro?');
    
    if (confirmacao) {
        alert('Devolução cancelada!');
        // Voltar para o perfil
        window.location.href = 'perfil.html';
    }
}

// Função para confirmar devolução
function confirmarDevolucao() {
    const confirmacao = confirm('Deseja confirmar a devolução do livro "A Grande Aventura"?');
    
    if (confirmacao) {
        alert('Livro devolvido com sucesso!\n\n' +
              'Livro: A Grande Aventura\n' +
              'Autor: Thomas Vinterberg\n' +
              'Data do Empréstimo: 15/12/2024\n' +
              'Data de Devolução: 20/12/2024\n' +
              'Aluno: Ana Silva (RA: 12345)\n' +
              'Condição: Excelente');
        
        // Voltar para o perfil
        window.location.href = 'perfil.html';
    }
}