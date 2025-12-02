const express = require('express');
const cors = require('cors');
const { executarQuery } = require('../../conexao');

// ============================================
// [SIS-ALUNO-API] Backend da aplicação do aluno
// Responsável por cadastro/login, empréstimos,
// renovações, histórico e estatísticas individuais
// ============================================

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

        // Inserir novo aluno no banco de dados (sem uso de cargos)
        const resultado = await executarQuery(
            `INSERT INTO usuarios (nome_completo, email, ra, status, nivel_leitor) 
             VALUES (?, ?, ?, 'ATIVO', 'INICIANTE')`,
            [nome_completo, email, ra]
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
                    u.total_livros_emprestados, u.nivel_leitor, u.total_conquistas
             FROM usuarios u
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
                total_livros_emprestados: usuario.total_livros_emprestados,
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
                    u.total_livros_emprestados, u.nivel_leitor, u.total_conquistas
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

        const usuario = usuarios[0];

        res.status(200).json({
            sucesso: true,
            usuario: {
                id: usuario.id,
                nome_completo: usuario.nome_completo,
                email: usuario.email,
                ra: usuario.ra,
                status: usuario.status,
                total_livros_emprestados: usuario.total_livros_emprestados,
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

// ============================================
// ROTA: LISTAR EMPRÉSTIMOS ATIVOS DO USUÁRIO
// ============================================
app.get('/emprestimos/:usuario_id', async (req, res) => {
    try {
        const { usuario_id } = req.params;

        const emprestimos = await executarQuery(
            `SELECT 
                e.id,
                e.livro_id,
                l.titulo AS livro_titulo,
                l.autor AS livro_autor,
                c.nome AS livro_categoria,
                l.sinopse,
                l.numero_paginas,
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

// ============================================
// ROTA: HISTÓRICO DE EMPRÉSTIMOS (RETIRADOS E DEVOLVIDOS)
// ============================================
app.get('/historico/:usuario_id', async (req, res) => {
    try {
        const { usuario_id } = req.params;

        // Buscar empréstimos ativos (retirados mas não devolvidos)
        const emprestimosAtivos = await executarQuery(
            `SELECT 
                e.id,
                e.livro_id,
                l.titulo AS livro_titulo,
                l.autor AS livro_autor,
                c.nome AS livro_categoria,
                e.data_emprestimo AS data,
                'RETIRADO' AS tipo_evento,
                NULL AS data_devolucao_real
            FROM emprestimos e
            INNER JOIN livros l ON e.livro_id = l.id
            INNER JOIN categorias c ON l.categoria_id = c.id
            WHERE e.usuario_id = ? AND e.status = 'ATIVO'`,
            [usuario_id]
        );

        // Buscar empréstimos devolvidos (histórico)
        const historicoDevolvidos = await executarQuery(
            `SELECT 
                h.id,
                h.livro_id,
                l.titulo AS livro_titulo,
                l.autor AS livro_autor,
                c.nome AS livro_categoria,
                h.data_emprestimo,
                h.data_devolucao_real AS data,
                'DEVOLVIDO' AS tipo_evento,
                h.data_devolucao_real
            FROM historico_emprestimos h
            INNER JOIN livros l ON h.livro_id = l.id
            INNER JOIN categorias c ON l.categoria_id = c.id
            WHERE h.usuario_id = ?`,
            [usuario_id]
        );

        // Combinar e ordenar: primeiro retirados, depois devolvidos, ordenados por data
        const historicoCompleto = [];
        
        // Adicionar eventos de retirada
        if (emprestimosAtivos && emprestimosAtivos.length > 0) {
            emprestimosAtivos.forEach(emp => {
                historicoCompleto.push({
                    id: emp.id,
                    livro_id: emp.livro_id,
                    livro_titulo: emp.livro_titulo,
                    livro_autor: emp.livro_autor,
                    livro_categoria: emp.livro_categoria,
                    data: emp.data,
                    tipo_evento: 'RETIRADO',
                    data_devolucao_real: null
                });
            });
        }

        // Adicionar eventos de devolução
        if (historicoDevolvidos && historicoDevolvidos.length > 0) {
            historicoDevolvidos.forEach(hist => {
                historicoCompleto.push({
                    id: hist.id,
                    livro_id: hist.livro_id,
                    livro_titulo: hist.livro_titulo,
                    livro_autor: hist.livro_autor,
                    livro_categoria: hist.livro_categoria,
                    data: hist.data_emprestimo,
                    tipo_evento: 'RETIRADO',
                    data_devolucao_real: hist.data_devolucao_real
                });
                historicoCompleto.push({
                    id: hist.id,
                    livro_id: hist.livro_id,
                    livro_titulo: hist.livro_titulo,
                    livro_autor: hist.livro_autor,
                    livro_categoria: hist.livro_categoria,
                    data: hist.data_devolucao_real,
                    tipo_evento: 'DEVOLVIDO',
                    data_devolucao_real: hist.data_devolucao_real
                });
            });
        }

        // Ordenar por data (mais recente primeiro)
        historicoCompleto.sort((a, b) => {
            const dataA = new Date(a.data);
            const dataB = new Date(b.data);
            return dataB - dataA;
        });

        // Limitar a 40 itens (20 empréstimos com retirado + devolvido)
        const historicoLimitado = historicoCompleto.slice(0, 40);

        res.status(200).json({
            sucesso: true,
            historico: historicoLimitado
        });

    } catch (error) {
        console.error('Erro ao buscar histórico:', error);
        res.status(500).json({
            sucesso: false,
            mensagem: 'Erro interno do servidor',
            erro: error.message
        });
    }
});

// ============================================
// ROTA: RENOVAR EMPRÉSTIMO
// ============================================
app.post('/renovar', async (req, res) => {
    try {
        const { emprestimo_id } = req.body;

        // Validação
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
                e.numero_renovacoes,
                e.status,
                l.titulo AS livro_titulo,
                l.autor AS livro_autor
            FROM emprestimos e
            INNER JOIN livros l ON e.livro_id = l.id
            WHERE e.id = ? AND e.status = 'ATIVO'`,
            [emprestimo_id]
        );

        if (!emprestimos || emprestimos.length === 0) {
            return res.status(404).json({
                sucesso: false,
                mensagem: 'Empréstimo não encontrado ou já foi devolvido!'
            });
        }

        const emprestimo = emprestimos[0];

        // Verificar se já renovou 3 vezes (limite)
        if (emprestimo.numero_renovacoes >= 3) {
            return res.status(400).json({
                sucesso: false,
                mensagem: 'Limite de renovações atingido! Máximo de 3 renovações por empréstimo.'
            });
        }

        // Calcular nova data de devolução (7 dias a partir da data atual)
        const hoje = new Date();
        const novaDataDevolucao = new Date(hoje);
        novaDataDevolucao.setDate(hoje.getDate() + 7);

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
             SET data_devolucao_prevista = ?,
                 data_renovacao = ?,
                 numero_renovacoes = numero_renovacoes + 1
             WHERE id = ?`,
            [
                formatarDataMySQL(novaDataDevolucao),
                formatarDataMySQL(hoje),
                emprestimo_id
            ]
        );

        res.status(200).json({
            sucesso: true,
            mensagem: 'Empréstimo renovado com sucesso!',
            renovacao: {
                emprestimo_id: emprestimo.id,
                livro_titulo: emprestimo.livro_titulo,
                livro_autor: emprestimo.livro_autor,
                nova_data_devolucao: formatarDataMySQL(novaDataDevolucao),
                numero_renovacoes: emprestimo.numero_renovacoes + 1
            }
        });

    } catch (error) {
        console.error('Erro ao renovar empréstimo:', error);
        res.status(500).json({
            sucesso: false,
            mensagem: 'Erro interno do servidor ao renovar empréstimo',
            erro: error.message
        });
    }
});

// ============================================
// ROTA: ESTATÍSTICAS DO USUÁRIO
// ============================================
app.get('/estatisticas/:usuario_id', async (req, res) => {
    try {
        const { usuario_id } = req.params;

        // Buscar dados do usuário
        const usuarios = await executarQuery(
            `SELECT 
                u.id,
                u.nome_completo,
                u.total_livros_emprestados,
                u.nivel_leitor,
                u.total_conquistas
            FROM usuarios u
            WHERE u.id = ?`,
            [usuario_id]
        );

        if (!usuarios || usuarios.length === 0) {
            return res.status(404).json({
                sucesso: false,
                mensagem: 'Usuário não encontrado!'
            });
        }

        const usuario = usuarios[0];

        // Contar empréstimos ativos
        const emprestimosAtivos = await executarQuery(
            `SELECT COUNT(*) AS total FROM emprestimos 
             WHERE usuario_id = ? AND status = 'ATIVO'`,
            [usuario_id]
        );

        // Contar livros devolvidos (histórico)
        const livrosDevolvidos = await executarQuery(
            `SELECT COUNT(*) AS total FROM historico_emprestimos 
             WHERE usuario_id = ?`,
            [usuario_id]
        );

        res.status(200).json({
            sucesso: true,
            estatisticas: {
                total_livros_emprestados: usuario.total_livros_emprestados || 0,
                livros_emprestados_atualmente: emprestimosAtivos[0]?.total || 0,
                livros_devolvidos: livrosDevolvidos[0]?.total || 0,
                nivel_leitor: usuario.nivel_leitor,
                total_conquistas: usuario.total_conquistas || 0
            }
        });

    } catch (error) {
        console.error('Erro ao buscar estatísticas:', error);
        res.status(500).json({
            sucesso: false,
            mensagem: 'Erro interno do servidor',
            erro: error.message
        });
    }
});

// ============================================
// ROTA: LISTAR TODOS OS LIVROS COM STATUS
// (UM REGISTRO POR ID, SEM AGRUPAR)
// ============================================
app.get('/livros', async (req, res) => {
    try {
        // 1) Busca todos os livros (igual ao admin, sem filtro de status)
        const todosLivros = await executarQuery(
            `SELECT 
                l.id,
                l.titulo,
                l.autor,
                c.nome AS categoria,
                l.sinopse,
                l.numero_paginas,
                l.status AS status_livro
            FROM livros l
            INNER JOIN categorias c ON l.categoria_id = c.id
            ORDER BY l.titulo ASC, l.autor ASC`
        );

        // 2) Busca todos os empréstimos ativos
        const emprestimosAtivos = await executarQuery(
            `SELECT DISTINCT livro_id 
             FROM emprestimos 
             WHERE status = 'ATIVO'`
        );

        const livrosEmprestados = new Set(emprestimosAtivos.map(e => e.livro_id));

        // 3) Monta a lista final livro a livro (sem agrupar por título/autor)
        const livrosProcessados = todosLivros.map(livro => {
            const estaEmprestadoNaTabela = livrosEmprestados.has(livro.id);
            const estaEmprestadoPorStatus = livro.status_livro === 'EMPRESTADO';

            // Status que tornam o livro indisponível
            const statusIndisponivel =
                livro.status_livro === 'INDISPONIVEL' ||
                livro.status_livro === 'MANUTENCAO' ||
                livro.status_livro === 'RESERVADO';

            // Disponível somente se:
            // - não está emprestado
            // - e não está em nenhum status de indisponibilidade
            const disponivel = !estaEmprestadoNaTabela &&
                               !estaEmprestadoPorStatus &&
                               !statusIndisponivel;

            return {
                id: livro.id,
                titulo: livro.titulo,
                autor: livro.autor,
                categoria: livro.categoria,
                sinopse: livro.sinopse,
                numero_paginas: livro.numero_paginas,
                disponivel: disponivel
            };
        });

        // 4) Retorna todos os livros (inclusive indisponíveis)
        res.status(200).json({
            sucesso: true,
            livros: livrosProcessados
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
    console.log(`   GET  http://localhost:${PORT}/emprestimos/:usuario_id`);
    console.log(`   GET  http://localhost:${PORT}/historico/:usuario_id`);
    console.log(`   POST http://localhost:${PORT}/renovar`);
    console.log(`   GET  http://localhost:${PORT}/estatisticas/:usuario_id`);
    console.log(`   GET  http://localhost:${PORT}/livros`);
});

