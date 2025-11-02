// Função para cancelar aluguel
function cancelarAluguel() {
    const confirmacao = confirm('Deseja cancelar o aluguel deste livro?');
    
    if (confirmacao) {
        alert('Aluguel cancelado!');
        // Voltar para o acervo
        window.location.href = 'index.html';
    }
}

// Função para confirmar aluguel
function confirmarAluguel() {
    const confirmacao = confirm('Deseja confirmar o aluguel do livro "A Grande Aventura"?');
    
    if (confirmacao) {
        alert('Livro alugado com sucesso!\n\n' +
              'Livro: A Grande Aventura\n' +
              'Autor: Thomas Vinterberg\n' +
              'Data do Aluguel: 15/12/2024\n' +
              'Data de Devolução: 22/12/2024\n' +
              'Aluno: Ana Silva (RA: 12345)');
        
        // Voltar para o acervo
        window.location.href = 'index.html';
    }
}