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
            SELECT u.id, u.nome_completo, u.email, u.ra, cg.nome AS cargo, 
                   u.status, u.total_livros_lidos, u.nivel_leitor, u.total_conquistas,
                   u.created_at
            FROM usuarios u
            INNER JOIN cargos cg ON u.cargo_id = cg.id
            WHERE 1=1
        `;
        const params = [];

        // Filtro por busca (nome, email ou RA)
        if (busca) {
            query += ` AND (u.nome_completo LIKE ? OR u.email LIKE ? OR u.ra LIKE ?)`;
            params.push(`%${busca}%`, `%${busca}%`, `%${busca}%`);
        }

        // Filtro por cargo
        if (cargo) {
            query += ` AND cg.nome = ?`;
            params.push(cargo);
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
            `SELECT u.id, u.nome_completo, u.email, u.ra, cg.id AS cargo_id, cg.nome AS cargo, 
                    u.status, u.total_livros_lidos, u.nivel_leitor, u.total_conquistas,
                    u.created_at
             FROM usuarios u
             INNER JOIN cargos cg ON u.cargo_id = cg.id
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
        const { nome_completo, email, ra, cargo, status } = req.body;

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

        // Buscar o ID do cargo se foi fornecido
        let cargo_id = null;
        if (cargo) {
            const cargos = await executarQuery(
                'SELECT id FROM cargos WHERE nome = ?',
                [cargo]
            );

            if (!cargos || cargos.length === 0) {
                return res.status(400).json({
                    sucesso: false,
                    mensagem: 'Cargo não encontrado!'
                });
            }

            cargo_id = cargos[0].id;
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

        if (cargo_id) {
            camposAtualizar.push('cargo_id = ?');
            valoresAtualizar.push(cargo_id);
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
            `SELECT u.id, u.nome_completo, u.email, u.ra, cg.nome AS cargo, 
                    u.status, u.total_livros_lidos, u.nivel_leitor, u.total_conquistas
             FROM usuarios u
             INNER JOIN cargos cg ON u.cargo_id = cg.id
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
 * Retorna relatório de classificação dos leitores (view do banco)
 */
router.get('/relatorios', async (req, res) => {
    try {
        const relatorio = await executarQuery(
            `SELECT * FROM vw_classificacao_leitores ORDER BY livros_lidos_semestre DESC`
        );

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
        const estatisticas = await executarQuery(
            `SELECT * FROM vw_estatisticas_usuarios`
        );

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

/**
 * GET /usuarios/cargos
 * Lista todos os cargos disponíveis
 */
router.get('/cargos', async (req, res) => {
    try {
        const cargos = await executarQuery(
            'SELECT id, nome, descricao FROM cargos ORDER BY nome'
        );

        res.status(200).json({
            sucesso: true,
            cargos: cargos
        });

    } catch (error) {
        console.error('Erro ao buscar cargos:', error);
        res.status(500).json({
            sucesso: false,
            mensagem: 'Erro interno do servidor ao buscar cargos',
            erro: error.message
        });
    }
});

module.exports = router;

