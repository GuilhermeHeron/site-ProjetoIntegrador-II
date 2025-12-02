const express = require('express');
const cors = require('cors');
const { executarQuery } = require('../../conexao');

// ============================================
// [SIS-TOTEM-API] Backend do totem de autoatendimento
// Responsável por listar livros disponíveis,
// registrar retiradas/devoluções e emprestimos ativos
// usados na interface de totem
// ============================================

const app = express();
const PORT = 3003;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================
// ROTA: LISTAR LIVROS DISPONÍVEIS
// ============================================
app.get('/livros', async (req, res) => {
    try {
        const livros = await executarQuery(
            `SELECT 
                l.id,
                l.titulo,
                l.autor,
                c.nome AS categoria,
                l.sinopse,
                l.numero_paginas,
                l.status,
                l.codigo_exemplar
            FROM livros l
            INNER JOIN categorias c ON l.categoria_id = c.id
            WHERE l.status = 'DISPONIVEL'
            ORDER BY l.titulo ASC`
        );

        res.status(200).json({
            sucesso: true,
            livros: livros || []
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

// ============================================
// ROTA: OBTER DADOS DE UM LIVRO ESPECÍFICO
// ============================================
app.get('/livros/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const livros = await executarQuery(
            `SELECT 
                l.id,
                l.titulo,
                l.autor,
                c.nome AS categoria,
                l.sinopse,
                l.numero_paginas,
                l.status,
                l.codigo_exemplar
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
            mensagem: 'Erro interno do servidor',
            erro: error.message
        });
    }
});

// ============================================
// ROTA: RETIRAR LIVRO
// ============================================
app.post('/alugar', async (req, res) => {
    try {
        const { usuario_id, livro_id } = req.body;

        // Validação dos campos obrigatórios
        if (!usuario_id || !livro_id) {
            return res.status(400).json({
                sucesso: false,
                mensagem: 'Usuário ID e Livro ID são obrigatórios!'
            });
        }

        // Verificar se o usuário existe e está ativo
        const usuarios = await executarQuery(
            'SELECT id, nome_completo, ra, status FROM usuarios WHERE id = ?',
            [usuario_id]
        );

        if (!usuarios || usuarios.length === 0) {
            return res.status(404).json({
                sucesso: false,
                mensagem: 'Usuário não encontrado!'
            });
        }

        const usuario = usuarios[0];

        if (usuario.status !== 'ATIVO') {
            return res.status(403).json({
                sucesso: false,
                mensagem: `Usuário ${usuario.status.toLowerCase()}. Não é possível retirar livros.`
            });
        }

        // Verificar se o livro existe e está disponível
        const livros = await executarQuery(
            'SELECT id, titulo, autor, status FROM livros WHERE id = ?',
            [livro_id]
        );

        if (!livros || livros.length === 0) {
            return res.status(404).json({
                sucesso: false,
                mensagem: 'Livro não encontrado!'
            });
        }

        const livro = livros[0];

        if (livro.status !== 'DISPONIVEL') {
            return res.status(400).json({
                sucesso: false,
                mensagem: `Livro não está disponível. Status atual: ${livro.status}`
            });
        }

        // Verificar se o usuário já tem este livro emprestado
        const emprestimosAtivos = await executarQuery(
            `SELECT id FROM emprestimos 
             WHERE usuario_id = ? AND livro_id = ? AND status = 'ATIVO'`,
            [usuario_id, livro_id]
        );

        if (emprestimosAtivos && emprestimosAtivos.length > 0) {
            return res.status(400).json({
                sucesso: false,
                mensagem: 'Você já possui este livro emprestado!'
            });
        }

        // Calcular datas
        const hoje = new Date();
        const dataDevolucao = new Date(hoje);
        dataDevolucao.setDate(hoje.getDate() + 7); // 7 dias para devolução

        // Formatar datas para MySQL (YYYY-MM-DD)
        const formatarDataMySQL = (data) => {
            const ano = data.getFullYear();
            const mes = String(data.getMonth() + 1).padStart(2, '0');
            const dia = String(data.getDate()).padStart(2, '0');
            return `${ano}-${mes}-${dia}`;
        };

        // Criar empréstimo
        const resultado = await executarQuery(
            `INSERT INTO emprestimos 
             (usuario_id, livro_id, data_emprestimo, data_devolucao_prevista, status) 
             VALUES (?, ?, ?, ?, 'ATIVO')`,
            [
                usuario_id,
                livro_id,
                formatarDataMySQL(hoje),
                formatarDataMySQL(dataDevolucao)
            ]
        );

        // O status do livro será atualizado automaticamente pelo trigger no banco

        res.status(201).json({
            sucesso: true,
            mensagem: 'Livro retirado com sucesso!',
            emprestimo: {
                id: resultado.insertId,
                usuario_id: usuario.id,
                usuario_nome: usuario.nome_completo,
                usuario_ra: usuario.ra,
                livro_id: livro.id,
                livro_titulo: livro.titulo,
                livro_autor: livro.autor,
                data_emprestimo: formatarDataMySQL(hoje),
                data_devolucao_prevista: formatarDataMySQL(dataDevolucao)
            }
        });

    } catch (error) {
        console.error('Erro ao retirar livro:', error);
        res.status(500).json({
            sucesso: false,
            mensagem: 'Erro interno do servidor ao retirar livro',
            erro: error.message
        });
    }
});

// ============================================
// ROTA: DEVOLVER LIVRO
// ============================================
app.post('/devolver', async (req, res) => {
    try {
        const { emprestimo_id, condicao_devolucao, observacoes } = req.body;

        // Validação dos campos obrigatórios
        if (!emprestimo_id) {
            return res.status(400).json({
                sucesso: false,
                mensagem: 'ID do empréstimo é obrigatório!'
            });
        }

        // Buscar o empréstimo
        const emprestimos = await executarQuery(
            `SELECT 
                e.id,
                e.usuario_id,
                e.livro_id,
                e.data_emprestimo,
                e.data_devolucao_prevista,
                e.status,
                u.nome_completo AS usuario_nome,
                u.ra AS usuario_ra,
                l.titulo AS livro_titulo,
                l.autor AS livro_autor
            FROM emprestimos e
            INNER JOIN usuarios u ON e.usuario_id = u.id
            INNER JOIN livros l ON e.livro_id = l.id
            WHERE e.id = ?`,
            [emprestimo_id]
        );

        if (!emprestimos || emprestimos.length === 0) {
            return res.status(404).json({
                sucesso: false,
                mensagem: 'Empréstimo não encontrado!'
            });
        }

        const emprestimo = emprestimos[0];

        // Verificar se o empréstimo já foi devolvido
        if (emprestimo.status === 'DEVOLVIDO') {
            return res.status(400).json({
                sucesso: false,
                mensagem: 'Este livro já foi devolvido!'
            });
        }

        // Calcular dias emprestados
        const dataEmprestimo = new Date(emprestimo.data_emprestimo);
        const hoje = new Date();
        const diasEmprestados = Math.ceil((hoje - dataEmprestimo) / (1000 * 60 * 60 * 24));

        // Determinar status final
        let statusFinal = 'DEVOLVIDO';
        const dataDevolucaoPrevista = new Date(emprestimo.data_devolucao_prevista);
        if (hoje > dataDevolucaoPrevista) {
            statusFinal = 'ATRASADO';
        }

        // Formatar data para MySQL
        const formatarDataMySQL = (data) => {
            const ano = data.getFullYear();
            const mes = String(data.getMonth() + 1).padStart(2, '0');
            const dia = String(data.getDate()).padStart(2, '0');
            return `${ano}-${mes}-${dia}`;
        };

        // Atualizar empréstimo
        await executarQuery(
            `UPDATE emprestimos 
             SET status = ?,
                 data_devolucao_real = ?,
                 condicao_devolucao = ?,
                 observacoes = ?
             WHERE id = ?`,
            [
                statusFinal,
                formatarDataMySQL(hoje),
                condicao_devolucao || 'BOM',
                observacoes || null,
                emprestimo_id
            ]
        );

        // Mover para histórico
        await executarQuery(
            `INSERT INTO historico_emprestimos 
             (usuario_id, livro_id, data_emprestimo, data_devolucao_prevista, 
              data_devolucao_real, dias_emprestado, numero_renovacoes, 
              condicao_devolucao, status_final, observacoes)
             SELECT 
                 usuario_id, livro_id, data_emprestimo, data_devolucao_prevista,
                 data_devolucao_real, ?, numero_renovacoes,
                 condicao_devolucao, ?, observacoes
             FROM emprestimos
             WHERE id = ?`,
            [
                Math.ceil(diasEmprestados),
                statusFinal,
                emprestimo_id
            ]
        );

        // O status do livro será atualizado automaticamente pelo trigger no banco

        res.status(200).json({
            sucesso: true,
            mensagem: 'Livro devolvido com sucesso!',
            devolucao: {
                emprestimo_id: emprestimo.id,
                livro_titulo: emprestimo.livro_titulo,
                livro_autor: emprestimo.livro_autor,
                usuario_nome: emprestimo.usuario_nome,
                usuario_ra: emprestimo.usuario_ra,
                data_emprestimo: emprestimo.data_emprestimo,
                data_devolucao_prevista: emprestimo.data_devolucao_prevista,
                data_devolucao_real: formatarDataMySQL(hoje),
                dias_emprestados: diasEmprestados,
                status: statusFinal,
                condicao_devolucao: condicao_devolucao || 'BOM'
            }
        });

    } catch (error) {
        console.error('Erro ao devolver livro:', error);
        res.status(500).json({
            sucesso: false,
            mensagem: 'Erro interno do servidor ao devolver livro',
            erro: error.message
        });
    }
});

// ============================================
// ROTA: LISTAR EMPRÉSTIMOS ATIVOS DE UM USUÁRIO
// ============================================
app.get('/emprestimos/usuario/:usuario_id', async (req, res) => {
    try {
        const { usuario_id } = req.params;

        const emprestimos = await executarQuery(
            `SELECT 
                e.id,
                e.livro_id,
                l.titulo AS livro_titulo,
                l.autor AS livro_autor,
                c.nome AS livro_categoria,
                e.data_emprestimo,
                e.data_devolucao_prevista,
                e.numero_renovacoes,
                e.status,
                DATEDIFF(CURDATE(), e.data_devolucao_prevista) AS dias_atraso
            FROM emprestimos e
            INNER JOIN livros l ON e.livro_id = l.id
            INNER JOIN categorias c ON l.categoria_id = c.id
            WHERE e.usuario_id = ? AND e.status = 'ATIVO'
            ORDER BY e.data_devolucao_prevista ASC`,
            [usuario_id]
        );

        res.status(200).json({
            sucesso: true,
            emprestimos: emprestimos || []
        });

    } catch (error) {
        console.error('Erro ao listar empréstimos:', error);
        res.status(500).json({
            sucesso: false,
            mensagem: 'Erro interno do servidor',
            erro: error.message
        });
    }
});

// Rota de teste
app.get('/test', (req, res) => {
    res.json({ mensagem: 'Backend do totem está funcionando!' });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor do totem rodando na porta ${PORT}`);
    console.log(`📡 Endpoints disponíveis:`);
    console.log(`   GET  http://localhost:${PORT}/livros`);
    console.log(`   GET  http://localhost:${PORT}/livros/:id`);
    console.log(`   POST http://localhost:${PORT}/alugar`);
    console.log(`   POST http://localhost:${PORT}/devolver`);
    console.log(`   GET  http://localhost:${PORT}/emprestimos/usuario/:usuario_id`);
});

