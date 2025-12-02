const express = require('express');
const router = express.Router();
const { executarQuery } = require('../../conexao');

// ============================================
// GERENCIAMENTO DE USUÁRIOS
// ============================================

/**
 * GET /usuarios/listar
 * Lista todos os usuários cadastrados
 */
router.get('/listar', async (req, res) => {
    try {
        const { busca, cargo, status } = req.query;

        let query = `
            SELECT u.id, u.nome_completo, u.email, u.ra,
                   u.status, u.total_livros_emprestados, u.nivel_leitor, u.total_conquistas,
                   u.created_at
            FROM usuarios u
            WHERE 1=1
        `;
        const params = [];

        // Filtro por busca (nome, email ou RA)
        if (busca) {
            query += ` AND (u.nome_completo LIKE ? OR u.email LIKE ? OR u.ra LIKE ?)`;
            params.push(`%${busca}%`, `%${busca}%`, `%${busca}%`);
        }

        // Filtro por status
        if (status) {
            query += ` AND u.status = ?`;
            params.push(status);
        }

        query += ` ORDER BY u.nome_completo ASC`;

        const usuarios = await executarQuery(query, params);

        res.status(200).json({
            sucesso: true,
            usuarios: usuarios,
            total: usuarios.length
        });

    } catch (error) {
        console.error('Erro ao listar usuários:', error);
        res.status(500).json({
            sucesso: false,
            mensagem: 'Erro interno do servidor ao listar usuários',
            erro: error.message
        });
    }
});

/**
 * GET /usuarios/buscar/:id
 * Busca um usuário específico por ID
 */
router.get('/buscar/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const usuarios = await executarQuery(
            `SELECT u.id, u.nome_completo, u.email, u.ra,
                    u.status, u.total_livros_emprestados, u.nivel_leitor, u.total_conquistas,
                    u.created_at
             FROM usuarios u
             WHERE u.id = ?`,
            [id]
        );

        if (!usuarios || usuarios.length === 0) {
            return res.status(404).json({
                sucesso: false,
                mensagem: 'Usuário não encontrado!'
            });
        }

        res.status(200).json({
            sucesso: true,
            usuario: usuarios[0]
        });

    } catch (error) {
        console.error('Erro ao buscar usuário:', error);
        res.status(500).json({
            sucesso: false,
            mensagem: 'Erro interno do servidor ao buscar usuário',
            erro: error.message
        });
    }
});

/**
 * PUT /usuarios/editar/:id
 * Edita um usuário existente
 */
router.put('/editar/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { nome_completo, email, ra, status } = req.body;

        // Verificar se o usuário existe
        const usuariosExistentes = await executarQuery(
            'SELECT id FROM usuarios WHERE id = ?',
            [id]
        );

        if (!usuariosExistentes || usuariosExistentes.length === 0) {
            return res.status(404).json({
                sucesso: false,
                mensagem: 'Usuário não encontrado!'
            });
        }

        // Construir query de atualização dinâmica
        const camposAtualizar = [];
        const valoresAtualizar = [];

        if (nome_completo) {
            camposAtualizar.push('nome_completo = ?');
            valoresAtualizar.push(nome_completo);
        }

        if (email) {
            // Verificar se o email já existe em outro usuário
            const emailExistente = await executarQuery(
                'SELECT id FROM usuarios WHERE email = ? AND id != ?',
                [email, id]
            );

            if (emailExistente && emailExistente.length > 0) {
                return res.status(400).json({
                    sucesso: false,
                    mensagem: 'Email já está em uso por outro usuário!'
                });
            }

            camposAtualizar.push('email = ?');
            valoresAtualizar.push(email);
        }

        if (ra) {
            // Verificar se o RA já existe em outro usuário
            const raExistente = await executarQuery(
                'SELECT id FROM usuarios WHERE ra = ? AND id != ?',
                [ra, id]
            );

            if (raExistente && raExistente.length > 0) {
                return res.status(400).json({
                    sucesso: false,
                    mensagem: 'RA já está em uso por outro usuário!'
                });
            }

            camposAtualizar.push('ra = ?');
            valoresAtualizar.push(ra);
        }

        if (status) {
            camposAtualizar.push('status = ?');
            valoresAtualizar.push(status);
        }

        if (camposAtualizar.length === 0) {
            return res.status(400).json({
                sucesso: false,
                mensagem: 'Nenhum campo para atualizar!'
            });
        }

        valoresAtualizar.push(id);

        await executarQuery(
            `UPDATE usuarios SET ${camposAtualizar.join(', ')} WHERE id = ?`,
            valoresAtualizar
        );

        // Buscar o usuário atualizado
        const usuarioAtualizado = await executarQuery(
            `SELECT u.id, u.nome_completo, u.email, u.ra,
                    u.status, u.total_livros_emprestados, u.nivel_leitor, u.total_conquistas
             FROM usuarios u
             WHERE u.id = ?`,
            [id]
        );

        res.status(200).json({
            sucesso: true,
            mensagem: 'Usuário atualizado com sucesso!',
            usuario: usuarioAtualizado && usuarioAtualizado.length > 0 ? usuarioAtualizado[0] : null
        });

    } catch (error) {
        console.error('Erro ao editar usuário:', error);
        res.status(500).json({
            sucesso: false,
            mensagem: 'Erro interno do servidor ao editar usuário',
            erro: error.message
        });
    }
});

/**
 * GET /usuarios/relatorios
 * Retorna relatório de classificação dos leitores
 * Considera apenas empréstimos realizados nos últimos 6 meses
 */
router.get('/relatorios', async (req, res) => {
    try {
        const relatorio = await executarQuery(`
            SELECT 
                u.id,
                u.nome_completo AS nome_leitor,
                COALESCE(stats.livros_emprestados_6_meses, 0) AS livros_emprestados_total,
                u.nivel_leitor AS classificacao,
                COALESCE(stats.total_devolvidos_6_meses, 0) AS total_devolvidos,
                COALESCE(stats.emprestimos_atrasados_6_meses, 0) AS emprestimos_atrasados
            FROM usuarios u
            LEFT JOIN (
                SELECT
                    base.usuario_id,
                    COUNT(*) AS livros_emprestados_6_meses,
                    COUNT(CASE WHEN base.status_final = 'ATRASADO' THEN 1 END) AS emprestimos_atrasados_6_meses,
                    COUNT(CASE WHEN base.data_devolucao_real IS NOT NULL THEN 1 END) AS total_devolvidos_6_meses
                FROM (
                    -- Empréstimos ainda ativos nos últimos 6 meses
                    SELECT 
                        e.usuario_id,
                        e.livro_id,
                        e.data_emprestimo,
                        NULL AS data_devolucao_real,
                        NULL AS status_final
                    FROM emprestimos e
                    WHERE e.data_emprestimo >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
                    AND e.status = 'ATIVO'

                    UNION ALL

                    -- Empréstimos que já foram para o histórico nos últimos 6 meses
                    SELECT 
                        h.usuario_id,
                        h.livro_id,
                        h.data_emprestimo,
                        h.data_devolucao_real,
                        h.status_final
                    FROM historico_emprestimos h
                    WHERE h.data_emprestimo >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
                ) AS base
                GROUP BY base.usuario_id
            ) AS stats ON u.id = stats.usuario_id
            ORDER BY livros_emprestados_total DESC
        `);

        res.status(200).json({
            sucesso: true,
            relatorio: relatorio,
            total: relatorio.length
        });

    } catch (error) {
        console.error('Erro ao buscar relatório:', error);
        res.status(500).json({
            sucesso: false,
            mensagem: 'Erro interno do servidor ao buscar relatório',
            erro: error.message
        });
    }
});

/**
 * GET /usuarios/estatisticas
 * Retorna estatísticas gerais dos usuários
 */
router.get('/estatisticas', async (req, res) => {
    try {
        const estatisticas = await executarQuery(`
            SELECT 
                u.id,
                u.nome_completo,
                u.ra,
                u.email,
                u.total_livros_emprestados,
                u.nivel_leitor,
                u.total_conquistas,
                COUNT(DISTINCT e.id) AS livros_emprestados_atualmente,
                COUNT(DISTINCT h.id) AS total_devolvidos
            FROM usuarios u
            LEFT JOIN emprestimos e ON u.id = e.usuario_id AND e.status = 'ATIVO'
            LEFT JOIN historico_emprestimos h ON u.id = h.usuario_id
            GROUP BY 
                u.id,
                u.nome_completo,
                u.ra,
                u.email,
                u.total_livros_emprestados,
                u.nivel_leitor,
                u.total_conquistas
        `);

        res.status(200).json({
            sucesso: true,
            estatisticas: estatisticas,
            total: estatisticas.length
        });

    } catch (error) {
        console.error('Erro ao buscar estatísticas:', error);
        res.status(500).json({
            sucesso: false,
            mensagem: 'Erro interno do servidor ao buscar estatísticas',
            erro: error.message
        });
    }
});

module.exports = router;

