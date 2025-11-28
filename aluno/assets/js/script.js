$(document).ready(function() {
    
    const API_URL = 'http://localhost:3001';

    
    function updateGamificationWidget(nivelLeitor, livrosLidos) {
        let levelName = '';
        let icon = '';
        let levelClass = '';

        
        switch(nivelLeitor) {
            case 'INICIANTE':
                levelName = 'Leitor Iniciante';
                icon = '🌱';
                levelClass = 'level-iniciante';
                break;
            case 'REGULAR':
                levelName = 'Leitor Regular';
                icon = '📚';
                levelClass = 'level-regular';
                break;
            case 'ATIVO':
                levelName = 'Leitor Ativo';
                icon = '⭐';
                levelClass = 'level-ativo';
                break;
            case 'EXTREMO':
                levelName = 'Leitor Extremo';
                icon = '🏆';
                levelClass = 'level-extremo';
                break;
            default:
                levelName = 'Leitor Iniciante';
                icon = '🌱';
                levelClass = 'level-iniciante';
        }

        
        const widget = $('#gamification-widget');
        const iconEl = widget.find('.gamification-icon');
        const titleEl = widget.find('.gamification-title');
        const subtitleEl = widget.find('.gamification-subtitle');
        
        
        iconEl.text(icon);
        titleEl.text(levelName);
        
        
        
        widget.removeClass('level-iniciante level-regular level-ativo level-extremo').addClass(levelClass);
    }

    
    async function carregarDadosGamificacao() {
        try {
            
            const usuarioStr = localStorage.getItem('usuario');
            if (!usuarioStr) {
                console.error('Usuário não encontrado no localStorage');
                
                window.location.href = 'index.html';
                return;
            }

            const usuario = JSON.parse(usuarioStr);
            const usuarioId = usuario.id;

            
            const response = await fetch(`${API_URL}/estatisticas/${usuarioId}`);
            const data = await response.json();

            if (data.sucesso && data.estatisticas) {
                const estatisticas = data.estatisticas;
                
                const livrosLidos = estatisticas.livros_devolvidos || 0;
                const nivelLeitor = estatisticas.nivel_leitor || 'INICIANTE';
                
                
                updateGamificationWidget(nivelLeitor, livrosLidos);
            } else {
                console.error('Erro ao carregar estatísticas:', data.mensagem);
                
                updateGamificationWidget('INICIANTE', 0);
            }
        } catch (error) {
            console.error('Erro ao carregar dados de gamificação:', error);
            
            updateGamificationWidget('INICIANTE', 0);
        }
    }

    
    async function carregarLivros() {
        try {
            const response = await fetch(`${API_URL}/livros`);
            const data = await response.json();

            if (data.sucesso && data.livros) {
                const tbody = $('#booksTable tbody');
                tbody.empty(); 

                data.livros.forEach(livro => {
                    const statusClass = livro.disponivel ? 'status-available' : 'status-unavailable';
                    const statusText = livro.disponivel ? 'Disponível' : 'Indisponível';

                    const row = `
                        <tr>
                            <td><div class="book-title">${livro.titulo}</div></td>
                            <td><div class="book-author">${livro.autor}</div></td>
                            <td>${livro.categoria}</td>
                            <td><span class="status ${statusClass}">${statusText}</span></td>
                        </tr>
                    `;
                    tbody.append(row);
                });

                
                if ($.fn.DataTable.isDataTable('#booksTable')) {
                    $('#booksTable').DataTable().destroy();
                }

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
                    }
                });
            } else {
                console.error('Erro ao carregar livros:', data.mensagem);
            }
        } catch (error) {
            console.error('Erro ao carregar livros:', error);
        }
    }

    

    
    carregarDadosGamificacao();

    
    carregarLivros();
});
