const mysql = require('mysql2/promise');

// ============================================
// [SIS-DB] Camada de acesso ao banco de dados MySQL
// Responsável por abrir conexões, executar queries
// e oferecer helpers reutilizáveis para todos os backends
// ============================================

// Configuração da conexão com o banco de dados
// ATENÇÃO: ajuste host/port/user/password conforme seu MySQL local
const dbConfig = {
    host: '127.0.0.1',   // usar IP evita alguns problemas de resolução de 'localhost'
    port: 3306,          // se seu MySQL usar outra porta (ex.: 3307), troque aqui
    user: 'root',
    password: '',        // se tiver senha no root, coloque aqui
    database: 'biblioteca',

    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    charset: 'utf8mb4'
};

// Criar pool de conexões para melhor performance
const pool = mysql.createPool(dbConfig);

// Função para testar a conexão
async function testarConexao() {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Conexão com o banco de dados estabelecida com sucesso!');
        connection.release();
        return true;
    } catch (error) {
        console.error('❌ Erro ao conectar com o banco de dados:', error.message);
        return false;
    }
}

// Função para executar queries
async function executarQuery(sql, params = []) {
    try {
        const [results] = await pool.execute(sql, params);
        return results;
    } catch (error) {
        console.error('Erro ao executar query:', error.message);
        throw error;
    }
}

// Função para obter uma conexão direta (para transações)
async function obterConexao() {
    return await pool.getConnection();
}

// Exportar funções e pool
module.exports = {
    pool,
    testarConexao,
    executarQuery,
    obterConexao
};

