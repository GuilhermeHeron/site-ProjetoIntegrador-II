$(document).ready(function() {
    // --- DADOS DO ALUNO LOGADO (EXEMPLO HARD-CODED) ---
    const loggedInStudent = {
        name: "Ana Silva",
        // >>> MUDE ESTE NÚMERO PARA TESTAR OS NÍVEIS <<<
        booksReadSemester:55 
    };

    // --- FUNÇÃO PARA ATUALIZAR O WIDGET DE GAMIFICAÇÃO ---
    function updateGamificationWidget(booksRead) {
        let levelName = '';
        let icon = '';
        let levelClass = '';

        if (booksRead <= 5) {
            levelName = 'Leitor Iniciante';
            icon = '🌱';
            levelClass = 'level-iniciante';
        } else if (booksRead <= 10) {
            levelName = 'Leitor Regular';
            icon = '📚';
            levelClass = 'level-regular';
        } else if (booksRead <= 20) {
            levelName = 'Leitor Ativo';
            icon = '⭐';
            levelClass = 'level-ativo';
        } else {
            levelName = 'Leitor Extremo';
            icon = '🏆';
            levelClass = 'level-extremo';
        }

        // Seleciona os elementos do widget
        const widget = $('#gamification-widget');
        const iconEl = widget.find('.gamification-icon');
        const titleEl = widget.find('.gamification-title');
        const subtitleEl = widget.find('.gamification-subtitle');
        
        // Atualiza o conteúdo e a classe
        iconEl.text(icon);
        titleEl.text(levelName);
        subtitleEl.text(booksRead + ' livros lidos este semestre');
        
        // Remove classes antigas e adiciona a nova para a cor da borda
        widget.removeClass('level-iniciante level-regular level-ativo level-extremo').addClass(levelClass);
    }

    // --- INICIALIZAÇÃO DA PÁGINA ---

    // 1. Atualiza o widget de gamificação com os dados do aluno
    updateGamificationWidget(loggedInStudent.booksReadSemester);

    // 2. Inicializa o DataTables
    $('#booksTable').DataTable({
        "language": {
            "lengthMenu": "Mostrar _MENU_ registros",
            "zeroRecords": "Nenhum livro encontrado",
            "info": "Página _PAGE_ de _PAGES_",
            "infoEmpty": "Nenhum registro",
            "infoFiltered": "(filtrado de _MAX_ registros)",
            "search": "Buscar:",
            "paginate": { 
                "next": "Próximo", 
                "previous": "Anterior" 
            }
        },
        "columnDefs": [ { 
            "orderable": false, 
            "targets": 4 
        } ]
    });

    // 3. Adiciona evento de clique aos botões "Alugar"
    $('#booksTable tbody').on('click', '.btn-alugar', function() {
        if (!$(this).is(':disabled')) {
            var bookTitle = $(this).closest('tr').find('.book-title').text();
            var bookAuthor = $(this).closest('tr').find('.book-author').text();
            
            // Redirecionar para a página de aluguel
            window.location.href = 'alugar.html';
        }
    });
});
