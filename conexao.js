const mysql = require('mysql2/promise');

// Configuração da conexão com o banco de dados
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '', 
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

