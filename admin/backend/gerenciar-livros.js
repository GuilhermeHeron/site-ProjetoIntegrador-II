const express = require('express');
const router = express.Router();
const { executarQuery } = require('../../conexao');

// ============================================
// GERENCIAMENTO DE LIVROS
// ============================================

/**
 * GET /livros/listar
 * Lista todos os livros cadastrados
 */
router.get('/listar', async (req, res) => {
    try {
        const { busca, categoria, status } = req.query;

        let query = `
            SELECT l.id, l.titulo, l.autor, c.nome AS categoria, l.sinopse, 
                   l.numero_paginas, l.codigo_exemplar, l.status, l.created_at
            FROM livros l
            INNER JOIN categorias c ON l.categoria_id = c.id
            WHERE 1=1
        `;
        const params = [];

        // Filtro por busca (título ou autor)
        if (busca) {
            query += ` AND (l.titulo LIKE ? OR l.autor LIKE ?)`;
            params.push(`%${busca}%`, `%${busca}%`);
        }

        // Filtro por categoria
        if (categoria) {
            query += ` AND c.nome = ?`;
            params.push(categoria);
        }

        // Filtro por status
        if (status) {
            query += ` AND l.status = ?`;
            params.push(status);
        }

        query += ` ORDER BY l.titulo ASC`;

        const livros = await executarQuery(query, params);

        res.status(200).json({
            sucesso: true,
            livros: livros,
            total: livros.length
        });

    } catch (error) {
        console.error('Erro ao listar livros:', error);
        res.status(500).json({
            sucesso: false,
            mensagem: 'Erro interno do servidor ao listar livros',
            erro: error.message
        });
    }
});

/**
 * GET /livros/buscar/:id
 * Busca um livro específico por ID
 */
router.get('/buscar/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const livros = await executarQuery(
            `SELECT l.id, l.titulo, l.autor, c.id AS categoria_id, c.nome AS categoria, 
                    l.sinopse, l.numero_paginas, l.codigo_exemplar, l.status
             FROM livros l
             INNER JOIN categorias c ON l.categoria_id = c.id
             WHERE l.id = ?`,
            [id]
        );

        if (!livros || livros.length === 0) {
            return res.status(404).json({
                sucesso: false,
                mensagem: 'Livro não encontrado!'
            });
        }

        res.status(200).json({
            sucesso: true,
            livro: livros[0]
        });

    } catch (error) {
        console.error('Erro ao buscar livro:', error);
        res.status(500).json({
            sucesso: false,
            mensagem: 'Erro interno do servidor ao buscar livro',
            erro: error.message
        });
    }
});

/**
 * PUT /livros/editar/:id
 * Edita um livro existente
 */
router.put('/editar/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { titulo, autor, categoria, sinopse, numero_paginas, codigo_exemplar, status } = req.body;

        // Verificar se o livro existe
        const livrosExistentes = await executarQuery(
            'SELECT id FROM livros WHERE id = ?',
            [id]
        );

        if (!livrosExistentes || livrosExistentes.length === 0) {
            return res.status(404).json({
                sucesso: false,
                mensagem: 'Livro não encontrado!'
            });
        }

        // Buscar o ID da categoria se foi fornecida
        let categoria_id = null;
        if (categoria) {
            const categorias = await executarQuery(
                'SELECT id FROM categorias WHERE nome = ?',
                [categoria]
            );

            if (!categorias || categorias.length === 0) {
                return res.status(400).json({
                    sucesso: false,
                    mensagem: 'Categoria não encontrada!'
                });
            }

            categoria_id = categorias[0].id;
        }

        // Construir query de atualização dinâmica
        const camposAtualizar = [];
        const valoresAtualizar = [];

        if (titulo) {
            camposAtualizar.push('titulo = ?');
            valoresAtualizar.push(titulo);
        }

        if (autor) {
            camposAtualizar.push('autor = ?');
            valoresAtualizar.push(autor);
        }

        if (categoria_id) {
            camposAtualizar.push('categoria_id = ?');
            valoresAtualizar.push(categoria_id);
        }

        if (sinopse !== undefined) {
            camposAtualizar.push('sinopse = ?');
            valoresAtualizar.push(sinopse);
        }

        if (numero_paginas !== undefined) {
            camposAtualizar.push('numero_paginas = ?');
            valoresAtualizar.push(numero_paginas);
        }

        if (codigo_exemplar) {
            // Verificar se o código já existe em outro livro
            const codigoExistente = await executarQuery(
                'SELECT id FROM livros WHERE codigo_exemplar = ? AND id != ?',
                [codigo_exemplar, id]
            );

            if (codigoExistente && codigoExistente.length > 0) {
                return res.status(400).json({
                    sucesso: false,
                    mensagem: 'Código do exemplar já está em uso por outro livro!'
                });
            }

            camposAtualizar.push('codigo_exemplar = ?');
            valoresAtualizar.push(codigo_exemplar);
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
            `UPDATE livros SET ${camposAtualizar.join(', ')} WHERE id = ?`,
            valoresAtualizar
        );

        // Buscar o livro atualizado
        const livroAtualizado = await executarQuery(
            `SELECT l.id, l.titulo, l.autor, c.nome AS categoria, l.sinopse, 
                    l.numero_paginas, l.codigo_exemplar, l.status
             FROM livros l
             INNER JOIN categorias c ON l.categoria_id = c.id
             WHERE l.id = ?`,
            [id]
        );

        res.status(200).json({
            sucesso: true,
            mensagem: 'Livro atualizado com sucesso!',
            livro: livroAtualizado && livroAtualizado.length > 0 ? livroAtualizado[0] : null
        });

    } catch (error) {
        console.error('Erro ao editar livro:', error);
        res.status(500).json({
            sucesso: false,
            mensagem: 'Erro interno do servidor ao editar livro',
            erro: error.message
        });
    }
});

/**
 * DELETE /livros/excluir/:id
 * Exclui um livro do sistema
 */
router.delete('/excluir/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Verificar se o livro existe
        const livrosExistentes = await executarQuery(
            'SELECT id, titulo, status FROM livros WHERE id = ?',
            [id]
        );

        if (!livrosExistentes || livrosExistentes.length === 0) {
            return res.status(404).json({
                sucesso: false,
                mensagem: 'Livro não encontrado!'
            });
        }

        const livro = livrosExistentes[0];

        // Verificar se o livro está emprestado
        if (livro.status === 'EMPRESTADO') {
            return res.status(400).json({
                sucesso: false,
                mensagem: 'Não é possível excluir um livro que está emprestado!'
            });
        }

        // Verificar se há empréstimos ativos
        const emprestimosAtivos = await executarQuery(
            'SELECT id FROM emprestimos WHERE livro_id = ? AND status = "ATIVO"',
            [id]
        );

        if (emprestimosAtivos && emprestimosAtivos.length > 0) {
            return res.status(400).json({
                sucesso: false,
                mensagem: 'Não é possível excluir um livro com empréstimos ativos!'
            });
        }

        // Excluir o livro
        await executarQuery(
            'DELETE FROM livros WHERE id = ?',
            [id]
        );

        res.status(200).json({
            sucesso: true,
            mensagem: `Livro "${livro.titulo}" excluído com sucesso!`
        });

    } catch (error) {
        console.error('Erro ao excluir livro:', error);
        res.status(500).json({
            sucesso: false,
            mensagem: 'Erro interno do servidor ao excluir livro',
            erro: error.message
        });
    }
});

module.exports = router;

