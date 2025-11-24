/**
 * Script para executar todos os backends simultaneamente
 * 
 * Uso: node start-all.js
 */

const { spawn } = require('child_process');
const path = require('path');

// Cores para o console (Windows)
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    blue: '\x1b[34m',
    yellow: '\x1b[33m',
    red: '\x1b[31m'
};

console.log(`${colors.bright}${colors.blue}╔════════════════════════════════════════╗${colors.reset}`);
console.log(`${colors.bright}${colors.blue}║   INICIANDO TODOS OS BACKENDS          ║${colors.reset}`);
console.log(`${colors.bright}${colors.blue}╚════════════════════════════════════════╝${colors.reset}\n`);

// Array para armazenar os processos
const processes = [];

// Função para iniciar um servidor
function startServer(name, scriptPath, port, color) {
    console.log(`${colors.bright}${color}🚀 Iniciando servidor ${name}...${colors.reset}`);
    
    const server = spawn('node', [scriptPath], {
        cwd: __dirname,
        stdio: 'inherit',
        shell: true
    });

    server.on('error', (error) => {
        console.error(`${colors.red}❌ Erro ao iniciar servidor ${name}:`, error.message);
    });

    server.on('exit', (code) => {
        if (code !== 0 && code !== null) {
            console.log(`${colors.red}⚠️  Servidor ${name} encerrado com código ${code}${colors.reset}`);
        }
    });

    processes.push({ name, process: server, port });
    
    return server;
}

// Iniciar servidor do aluno (porta 3001)
startServer('ALUNO', path.join(__dirname, 'aluno/backend/server.js'), 3001, colors.green);

// Iniciar servidor do admin (porta 3002)
startServer('ADMIN', path.join(__dirname, 'admin/backend/server.js'), 3002, colors.blue);

// Iniciar servidor do totem (porta 3003)
startServer('TOTEM', path.join(__dirname, 'toten/backend/server.js'), 3003, colors.yellow);

// Aguardar um pouco para os servidores iniciarem
setTimeout(() => {
    console.log(`\n${colors.bright}${colors.green}✅ Todos os servidores foram iniciados!${colors.reset}\n`);
    console.log(`${colors.bright}📡 Servidores rodando:${colors.reset}`);
    console.log(`${colors.green}   • Aluno: http://localhost:3001${colors.reset}`);
    console.log(`${colors.blue}   • Admin: http://localhost:3002${colors.reset}`);
    console.log(`${colors.yellow}   • Totem: http://localhost:3003${colors.reset}`);
    console.log(`\n${colors.yellow}💡 Pressione Ctrl+C para parar todos os servidores${colors.reset}\n`);
}, 2000);

// Gerenciar encerramento
process.on('SIGINT', () => {
    console.log(`\n${colors.yellow}🛑 Encerrando todos os servidores...${colors.reset}`);
    
    processes.forEach(({ name, process: proc }) => {
        proc.kill('SIGINT');
    });
    
    setTimeout(() => {
        console.log(`${colors.green}✅ Todos os servidores foram encerrados!${colors.reset}`);
        process.exit(0);
    }, 1000);
});

process.on('SIGTERM', () => {
    processes.forEach(({ name, process: proc }) => {
        proc.kill('SIGTERM');
    });
    process.exit(0);
});

