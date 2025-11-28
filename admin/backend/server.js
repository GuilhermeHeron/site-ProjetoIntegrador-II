const express = require('express');
const cors = require('cors');

// ============================================
// [SIS-ADMIN-API] Backend da área administrativa da biblioteca
// Responsável por cadastro/edição de livros, gestão de usuários
// e relatórios/estatísticas usados no painel admin
// ============================================

const app = express();
const PORT = 3002;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Importar rotas
const cadastroLivrosRoutes = require('./cadastro-livros');
const gerenciarLivrosRoutes = require('./gerenciar-livros');
const gerenciarUsuariosRoutes = require('./gerenciar-usuarios');
const gerenciarEmprestimosRoutes = require('./gerenciar-emprestimos');

// Usar rotas
app.use('/livros', cadastroLivrosRoutes);
app.use('/livros', gerenciarLivrosRoutes);
app.use('/usuarios', gerenciarUsuariosRoutes);
app.use('/emprestimos', gerenciarEmprestimosRoutes);

// Rota de teste
app.get('/test', (req, res) => {
    res.json({ mensagem: 'Backend do admin está funcionando!' });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor do admin rodando na porta ${PORT}`);
    console.log(`📡 Endpoints disponíveis:`);
    console.log(`   POST http://localhost:${PORT}/livros/cadastrar`);
    console.log(`   GET  http://localhost:${PORT}/livros/listar`);
    console.log(`   PUT  http://localhost:${PORT}/livros/editar/:id`);
    console.log(`   DELETE http://localhost:${PORT}/livros/excluir/:id`);
    console.log(`   GET  http://localhost:${PORT}/usuarios/listar`);
    console.log(`   PUT  http://localhost:${PORT}/usuarios/editar/:id`);
    console.log(`   GET  http://localhost:${PORT}/usuarios/relatorios`);
    console.log(`   GET  http://localhost:${PORT}/emprestimos/ativos`);
    console.log(`   GET  http://localhost:${PORT}/emprestimos/historico`);
});

