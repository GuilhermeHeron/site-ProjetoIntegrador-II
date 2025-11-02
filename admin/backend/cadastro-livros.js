const express = require('express');
const router = express.Router();
const { executarQuery } = require('../../conexao');

// ============================================
// CADASTRO DE LIVROS
// ============================================

/**
 * POST /livros/cadastrar
 * Cadastra um novo livro no sistema
 */
router.post('/cadastrar', async (req, res) => {
    try {
        const { titulo, autor, categoria, sinopse, numero_paginas, codigo_exemplar } = req.body;

        // Validação dos campos obrigatórios
        if (!titulo || !autor || !categoria) {
            return res.status(400).json({
                sucesso: false,
                mensagem: 'Título, autor e categoria são obrigatórios!'
            });
        }

        // Buscar o ID da categoria pelo nome
        const categorias = await executarQuery(
            'SELECT id FROM categorias WHERE nome = ?',
            [categoria]
        );

        if (!categorias || categorias.length === 0) {
            return res.status(400).json({
                sucesso: false,
                mensagem: 'Categoria não encontrada! Verifique se a categoria existe.'
            });
        }

        const categoria_id = categorias[0].id;

        // Gerar código do exemplar se não foi fornecido
        let codigoExemplar = codigo_exemplar;
        if (!codigoExemplar) {
            // Gera um código baseado na categoria e timestamp
            const prefixo = categoria.substring(0, 3).toUpperCase();
            const timestamp = Date.now().toString().slice(-6);
            codigoExemplar = `${prefixo}-${timestamp}`;
        }

        // Verificar se o código do exemplar já existe
        const codigoExistente = await executarQuery(
            'SELECT id FROM livros WHERE codigo_exemplar = ?',
            [codigoExemplar]
        );

        if (codigoExistente && codigoExistente.length > 0) {
            return res.status(400).json({
                sucesso: false,
                mensagem: 'Código do exemplar já existe! Use outro código ou deixe o sistema gerar automaticamente.'
            });
        }

        // Inserir novo livro no banco de dados
        const resultado = await executarQuery(
            `INSERT INTO livros (titulo, autor, categoria_id, sinopse, numero_paginas, codigo_exemplar, status) 
             VALUES (?, ?, ?, ?, ?, ?, 'DISPONIVEL')`,
            [titulo, autor, categoria_id, sinopse || null, numero_paginas || null, codigoExemplar]
        );

        // Buscar o livro cadastrado com informações completas
        const livroCadastrado = await executarQuery(
            `SELECT l.id, l.titulo, l.autor, c.nome AS categoria, l.sinopse, 
                    l.numero_paginas, l.codigo_exemplar, l.status
             FROM livros l
             INNER JOIN categorias c ON l.categoria_id = c.id
             WHERE l.id = ?`,
            [resultado.insertId]
        );

        res.status(201).json({
            sucesso: true,
            mensagem: 'Livro cadastrado com sucesso!',
            livro: livroCadastrado && livroCadastrado.length > 0 ? livroCadastrado[0] : null
        });

    } catch (error) {
        console.error('Erro ao cadastrar livro:', error);
        res.status(500).json({
            sucesso: false,
            mensagem: 'Erro interno do servidor ao cadastrar livro',
            erro: error.message
        });
    }
});

/**
 * GET /livros/categorias
 * Lista todas as categorias disponíveis
 */
router.get('/categorias', async (req, res) => {
    try {
        const categorias = await executarQuery(
            'SELECT id, nome, descricao FROM categorias ORDER BY nome'
        );

        res.status(200).json({
            sucesso: true,
            categorias: categorias
        });

    } catch (error) {
        console.error('Erro ao buscar categorias:', error);
        res.status(500).json({
            sucesso: false,
            mensagem: 'Erro interno do servidor ao buscar categorias',
            erro: error.message
        });
    }
});

module.exports = router;

