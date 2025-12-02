const express = require('express');
const router = express.Router();
const { executarQuery } = require('../../conexao');

// ============================================
// GERENCIAMENTO DE EMPRÉSTIMOS
// ============================================

/**
 * GET /emprestimos/ativos
 * Lista todos os empréstimos ativos (livros emprestados e sem devolução)
 */
router.get('/ativos', async (req, res) => {
    try {
        const emprestimos = await executarQuery(
            `SELECT 
                e.id,
                e.usuario_id,
                u.nome_completo AS nome_usuario,
                u.ra AS ra_usuario,
                u.email AS email_usuario,
                e.livro_id,
                l.titulo AS livro_titulo,
                l.autor AS livro_autor,
                c.nome AS livro_categoria,
                l.codigo_exemplar,
                e.data_emprestimo,
                e.data_devolucao_prevista,
                e.data_renovacao,
                e.numero_renovacoes,
                e.status,
                DATEDIFF(CURDATE(), e.data_devolucao_prevista) AS dias_atraso,
                CASE 
                    WHEN DATEDIFF(CURDATE(), e.data_devolucao_prevista) > 0 THEN 'ATRASADO'
                    ELSE 'NO PRAZO'
                END AS situacao
            FROM emprestimos e
            INNER JOIN usuarios u ON e.usuario_id = u.id
            INNER JOIN livros l ON e.livro_id = l.id
            INNER JOIN categorias c ON l.categoria_id = c.id
            WHERE e.status = 'ATIVO'
            ORDER BY e.data_devolucao_prevista ASC, e.data_emprestimo DESC`
        );

        res.status(200).json({
            sucesso: true,
            emprestimos: emprestimos || [],
            total: emprestimos ? emprestimos.length : 0
        });

    } catch (error) {
        console.error('Erro ao listar empréstimos ativos:', error);
        res.status(500).json({
            sucesso: false,
            mensagem: 'Erro interno do servidor ao listar empréstimos ativos',
            erro: error.message
        });
    }
});

/**
 * GET /emprestimos/historico
 * Lista todo o histórico de empréstimos e devoluções
<<<<<<< HEAD
 * Mostra duas linhas por empréstimo: uma para retirado e outra para devolvido
 */
router.get('/historico', async (req, res) => {
    try {
        // Buscar empréstimos ativos (retirados mas não devolvidos)
        const emprestimosAtivos = await executarQuery(`
            SELECT 
                e.id,
                u.nome_completo AS usuario,
                l.titulo AS livro,
                e.data_emprestimo AS data,
                'RETIRADO' AS tipo_evento,
                NULL AS data_devolucao
            FROM emprestimos e
            INNER JOIN usuarios u ON e.usuario_id = u.id
            INNER JOIN livros l ON e.livro_id = l.id
            WHERE e.status = 'ATIVO'
        `);

        // Buscar empréstimos devolvidos (histórico)
        const historicoDevolvidos = await executarQuery(`
=======
 */
router.get('/historico', async (req, res) => {
    try {
        const historico = await executarQuery(`
>>>>>>> b86a84f19e164fe3ab9fc533c207c7ce715fa1e6
            SELECT 
                h.id,
                u.nome_completo AS usuario,
                l.titulo AS livro,
                h.data_emprestimo,
                h.data_devolucao_real AS data_devolucao,
                h.status_final AS status
            FROM historico_emprestimos h
            INNER JOIN usuarios u ON h.usuario_id = u.id
            INNER JOIN livros l ON h.livro_id = l.id
<<<<<<< HEAD
        `);

        // Combinar e criar duas linhas por empréstimo devolvido
        const historicoCompleto = [];
        
        // Adicionar eventos de retirada (empréstimos ativos)
        if (emprestimosAtivos && emprestimosAtivos.length > 0) {
            emprestimosAtivos.forEach(emp => {
                historicoCompleto.push({
                    id: emp.id,
                    usuario: emp.usuario,
                    livro: emp.livro,
                    data: emp.data,
                    tipo_evento: 'RETIRADO',
                    data_devolucao: null,
                    status: null
                });
            });
        }

        // Adicionar eventos de retirada e devolução (histórico)
        if (historicoDevolvidos && historicoDevolvidos.length > 0) {
            historicoDevolvidos.forEach(hist => {
                // Linha de retirada
                historicoCompleto.push({
                    id: hist.id,
                    usuario: hist.usuario,
                    livro: hist.livro,
                    data: hist.data_emprestimo,
                    tipo_evento: 'RETIRADO',
                    data_devolucao: null,
                    status: null
                });
                // Linha de devolução
                historicoCompleto.push({
                    id: hist.id,
                    usuario: hist.usuario,
                    livro: hist.livro,
                    data: hist.data_devolucao,
                    tipo_evento: 'DEVOLVIDO',
                    data_devolucao: hist.data_devolucao,
                    status: hist.status
                });
            });
        }

        // Ordenar por data (mais recente primeiro)
        historicoCompleto.sort((a, b) => {
            const dataA = new Date(a.data);
            const dataB = new Date(b.data);
            return dataB - dataA;
        });

        res.status(200).json({
            sucesso: true,
            historico: historicoCompleto || [],
            total: historicoCompleto ? historicoCompleto.length : 0
=======
            ORDER BY h.data_devolucao_real DESC, h.data_emprestimo DESC
        `);

        res.status(200).json({
            sucesso: true,
            historico: historico || [],
            total: historico ? historico.length : 0
>>>>>>> b86a84f19e164fe3ab9fc533c207c7ce715fa1e6
        });

    } catch (error) {
        console.error('Erro ao buscar histórico de empréstimos:', error);
        res.status(500).json({
            sucesso: false,
            mensagem: 'Erro interno do servidor ao buscar histórico',
            erro: error.message
        });
    }
});

module.exports = router;

