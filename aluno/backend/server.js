const express = require('express');
const cors = require('cors');
const { executarQuery } = require('../../conexao');

const app = express();
const PORT = 3001;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================
// ROTA: CADASTRO DE ALUNO
// ============================================
app.post('/cadastro', async (req, res) => {
    try {
        const { nome_completo, email, ra } = req.body;

        // Validação dos campos obrigatórios
        if (!nome_completo || !email || !ra) {
            return res.status(400).json({
                sucesso: false,
                mensagem: 'Todos os campos são obrigatórios!'
            });
        }

        // Buscar o ID do cargo ALUNO
        const cargos = await executarQuery(
            'SELECT id FROM cargos WHERE nome = ?',
            ['ALUNO']
        );

        if (!cargos || cargos.length === 0) {
            return res.status(500).json({
                sucesso: false,
                mensagem: 'Erro interno: Cargo ALUNO não encontrado no banco de dados'
            });
        }

        const cargo_id = cargos[0].id;

        // Verificar se o RA já existe
        const raExistente = await executarQuery(
            'SELECT id FROM usuarios WHERE ra = ?',
            [ra]
        );

        if (raExistente && raExistente.length > 0) {
            return res.status(400).json({
                sucesso: false,
                mensagem: 'RA já cadastrado! Por favor, use outro RA ou faça login.'
            });
        }

        // Verificar se o email já existe
        const emailExistente = await executarQuery(
            'SELECT id FROM usuarios WHERE email = ?',
            [email]
        );

        if (emailExistente && emailExistente.length > 0) {
            return res.status(400).json({
                sucesso: false,
                mensagem: 'Email já cadastrado! Por favor, use outro email.'
            });
        }

        // Inserir novo aluno no banco de dados
        const resultado = await executarQuery(
            `INSERT INTO usuarios (nome_completo, email, ra, cargo_id, status, nivel_leitor) 
             VALUES (?, ?, ?, ?, 'ATIVO', 'INICIANTE')`,
            [nome_completo, email, ra, cargo_id]
        );

        res.status(201).json({
            sucesso: true,
            mensagem: 'Aluno cadastrado com sucesso!',
            usuario: {
                id: resultado.insertId,
                nome_completo,
                email,
                ra
            }
        });

    } catch (error) {
        console.error('Erro no cadastro:', error);
        res.status(500).json({
            sucesso: false,
            mensagem: 'Erro interno do servidor ao cadastrar aluno',
            erro: error.message
        });
    }
});

// ============================================
// ROTA: LOGIN DE ALUNO
// ============================================
app.post('/login', async (req, res) => {
    try {
        const { ra } = req.body;

        // Validação do campo obrigatório
        if (!ra) {
            return res.status(400).json({
                sucesso: false,
                mensagem: 'RA é obrigatório!'
            });
        }

        // Buscar usuário pelo RA
        const usuarios = await executarQuery(
            `SELECT u.id, u.nome_completo, u.email, u.ra, u.status, 
                    u.total_livros_lidos, u.nivel_leitor, u.total_conquistas,
                    c.nome AS cargo
             FROM usuarios u
             INNER JOIN cargos c ON u.cargo_id = c.id
             WHERE u.ra = ?`,
            [ra]
        );

        // Verificar se o usuário existe
        if (!usuarios || usuarios.length === 0) {
            return res.status(404).json({
                sucesso: false,
                mensagem: 'RA não encontrado! Verifique seu RA ou cadastre-se.'
            });
        }

        const usuario = usuarios[0];

        // Verificar se o usuário está ativo
        if (usuario.status !== 'ATIVO') {
            return res.status(403).json({
                sucesso: false,
                mensagem: `Usuário ${usuario.status.toLowerCase()}. Entre em contato com o administrador.`
            });
        }

        // Verificar se é um aluno (pode ser redundante, mas é uma validação extra)
        if (usuario.cargo !== 'ALUNO') {
            return res.status(403).json({
                sucesso: false,
                mensagem: 'Acesso restrito apenas para alunos.'
            });
        }

        // Login bem-sucedido
        res.status(200).json({
            sucesso: true,
            mensagem: 'Login realizado com sucesso!',
            usuario: {
                id: usuario.id,
                nome_completo: usuario.nome_completo,
                email: usuario.email,
                ra: usuario.ra,
                status: usuario.status,
                total_livros_lidos: usuario.total_livros_lidos,
                nivel_leitor: usuario.nivel_leitor,
                total_conquistas: usuario.total_conquistas
            }
        });

    } catch (error) {
        console.error('Erro no login:', error);
        res.status(500).json({
            sucesso: false,
            mensagem: 'Erro interno do servidor ao fazer login',
            erro: error.message
        });
    }
});

// ============================================
// ROTA: OBTER DADOS DO USUÁRIO POR ID
// ============================================
app.get('/usuario/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const usuarios = await executarQuery(
            `SELECT u.id, u.nome_completo, u.email, u.ra, u.status, 
                    u.total_livros_lidos, u.nivel_leitor, u.total_conquistas,
                    c.nome AS cargo
             FROM usuarios u
             INNER JOIN cargos c ON u.cargo_id = c.id
             WHERE u.id = ?`,
            [id]
        );

        if (!usuarios || usuarios.length === 0) {
            return res.status(404).json({
                sucesso: false,
                mensagem: 'Usuário não encontrado!'
            });
        }

        const usuario = usuarios[0];

        res.status(200).json({
            sucesso: true,
            usuario: {
                id: usuario.id,
                nome_completo: usuario.nome_completo,
                email: usuario.email,
                ra: usuario.ra,
                status: usuario.status,
                total_livros_lidos: usuario.total_livros_lidos,
                nivel_leitor: usuario.nivel_leitor,
                total_conquistas: usuario.total_conquistas
            }
        });

    } catch (error) {
        console.error('Erro ao buscar usuário:', error);
        res.status(500).json({
            sucesso: false,
            mensagem: 'Erro interno do servidor',
            erro: error.message
        });
    }
});

// Rota de teste
app.get('/test', (req, res) => {
    res.json({ mensagem: 'Backend do aluno está funcionando!' });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor do aluno rodando na porta ${PORT}`);
    console.log(`📡 Endpoints disponíveis:`);
    console.log(`   POST http://localhost:${PORT}/cadastro`);
    console.log(`   POST http://localhost:${PORT}/login`);
    console.log(`   GET  http://localhost:${PORT}/usuario/:id`);
});

