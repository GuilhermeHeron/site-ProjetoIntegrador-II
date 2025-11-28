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
 */
router.get('/historico', async (req, res) => {
    try {
        const historico = await executarQuery(`
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
            ORDER BY h.data_devolucao_real DESC, h.data_emprestimo DESC
        `);

        res.status(200).json({
            sucesso: true,
            historico: historico || [],
            total: historico ? historico.length : 0
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

