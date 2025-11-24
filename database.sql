-- =====================================================
-- SISTEMA DE BIBLIOTECA - MODELAGEM COMPLETA DO BANCO
-- =====================================================

-- Criação do banco de dados
CREATE DATABASE IF NOT EXISTS biblioteca;
USE biblioteca;

-- =====================================================
-- TABELA: CARGOS/USUARIOS
-- =====================================================
CREATE TABLE IF NOT EXISTS cargos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(50) NOT NULL UNIQUE,
    descricao TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Inserção de cargos padrão
INSERT INTO cargos (nome, descricao) VALUES
('ALUNO', 'Estudante que pode alugar livros'),
('ADMIN', 'Administrador do sistema com acesso completo'),
('FUNCIONARIO', 'Funcionário da biblioteca que gerencia empréstimos');

-- =====================================================
-- TABELA: USUARIOS
-- =====================================================
CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome_completo VARCHAR(200) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    ra VARCHAR(50) NOT NULL UNIQUE COMMENT 'Registro Acadêmico ou identificador único',
    cargo_id INT NOT NULL,
    status ENUM('ATIVO', 'INATIVO', 'SUSPENSO') DEFAULT 'ATIVO',
    total_livros_emprestados INT DEFAULT 0 COMMENT 'Contador de livros emprestados (total de empréstimos realizados)',
    nivel_leitor ENUM('INICIANTE', 'REGULAR', 'ATIVO', 'EXTREMO') DEFAULT 'INICIANTE',
    total_conquistas INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (cargo_id) REFERENCES cargos(id) ON DELETE RESTRICT,
    INDEX idx_ra (ra),
    INDEX idx_email (email),
    INDEX idx_cargo (cargo_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABELA: CATEGORIAS
-- =====================================================
CREATE TABLE IF NOT EXISTS categorias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL UNIQUE,
    descricao TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Inserção de categorias padrão
INSERT INTO categorias (nome, descricao) VALUES
('Ficção', 'Livros de ficção literária'),
('Não Ficção', 'Livros baseados em fatos reais'),
('Ciência', 'Livros científicos e técnicos'),
('História', 'Livros de história e eventos históricos'),
('Biografia', 'Livros biográficos');

-- =====================================================
-- TABELA: LIVROS
-- =====================================================
-- Permite múltiplos exemplares do mesmo livro
CREATE TABLE IF NOT EXISTS livros (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    autor VARCHAR(255) NOT NULL,
    categoria_id INT NOT NULL,
    sinopse TEXT,
    numero_paginas INT,
    codigo_exemplar VARCHAR(100) UNIQUE COMMENT 'Código único para cada exemplar físico',
    status ENUM('DISPONIVEL', 'EMPRESTADO', 'RESERVADO', 'MANUTENCAO', 'INDISPONIVEL') DEFAULT 'DISPONIVEL',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE RESTRICT,
    INDEX idx_titulo (titulo),
    INDEX idx_autor (autor),
    INDEX idx_categoria (categoria_id),
    INDEX idx_status (status),
    INDEX idx_codigo_exemplar (codigo_exemplar)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABELA: EMPRESTIMOS
-- =====================================================
-- Relaciona usuários com livros (um usuário pode ter múltiplos empréstimos)
CREATE TABLE IF NOT EXISTS emprestimos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    livro_id INT NOT NULL,
    data_emprestimo DATE NOT NULL,
    data_devolucao_prevista DATE NOT NULL,
    data_devolucao_real DATE NULL,
    data_renovacao DATE NULL COMMENT 'Data em que foi renovado (última renovação)',
    numero_renovacoes INT DEFAULT 0 COMMENT 'Quantidade de vezes que foi renovado',
    status ENUM('ATIVO', 'DEVOLVIDO', 'ATRASADO', 'PERDIDO') DEFAULT 'ATIVO',
    condicao_devolucao ENUM('EXCELENTE', 'BOM', 'REGULAR', 'DANIFICADO') NULL COMMENT 'Condição do livro na devolução',
    observacoes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE RESTRICT,
    FOREIGN KEY (livro_id) REFERENCES livros(id) ON DELETE RESTRICT,
    INDEX idx_usuario (usuario_id),
    INDEX idx_livro (livro_id),
    INDEX idx_status (status),
    INDEX idx_data_devolucao (data_devolucao_prevista),
    INDEX idx_data_emprestimo (data_emprestimo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABELA: HISTORICO_EMPRESTIMOS
-- =====================================================
-- Histórico de empréstimos devolvidos (para relatórios e estatísticas)
CREATE TABLE IF NOT EXISTS historico_emprestimos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    livro_id INT NOT NULL,
    data_emprestimo DATE NOT NULL,
    data_devolucao_prevista DATE NOT NULL,
    data_devolucao_real DATE NOT NULL,
    dias_emprestado INT NOT NULL COMMENT 'Total de dias que o livro ficou emprestado',
    numero_renovacoes INT DEFAULT 0,
    condicao_devolucao ENUM('EXCELENTE', 'BOM', 'REGULAR', 'DANIFICADO') NULL,
    status_final ENUM('DEVOLVIDO', 'ATRASADO', 'PERDIDO') DEFAULT 'DEVOLVIDO',
    observacoes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (livro_id) REFERENCES livros(id) ON DELETE CASCADE,
    INDEX idx_usuario (usuario_id),
    INDEX idx_livro (livro_id),
    INDEX idx_data_devolucao (data_devolucao_real)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABELA: CONQUISTAS
-- =====================================================
CREATE TABLE IF NOT EXISTS conquistas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL UNIQUE,
    descricao TEXT,
    icone VARCHAR(50) COMMENT 'Emoji ou código do ícone',
    criterio VARCHAR(255) COMMENT 'Critério para desbloquear (ex: "10 livros lidos")',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABELA: USUARIO_CONQUISTAS
-- =====================================================
-- Relaciona usuários com suas conquistas (muitos para muitos)
CREATE TABLE IF NOT EXISTS usuario_conquistas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    conquista_id INT NOT NULL,
    data_desbloqueio DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (conquista_id) REFERENCES conquistas(id) ON DELETE CASCADE,
    UNIQUE KEY unique_usuario_conquista (usuario_id, conquista_id),
    INDEX idx_usuario (usuario_id),
    INDEX idx_conquista (conquista_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- CONQUISTAS PADRÃO (Apenas níveis de leitor baseados em livros emprestados)
-- =====================================================
INSERT INTO conquistas (nome, descricao, icone, criterio) VALUES
('Leitor Iniciante', 'Emprestou até 5 livros', '🌱', '5 livros emprestados'),
('Leitor Regular', 'Emprestou até 10 livros', '📚', '10 livros emprestados'),
('Leitor Ativo', 'Emprestou até 20 livros', '⭐', '20 livros emprestados'),
('Leitor Extremo', 'Emprestou mais de 20 livros', '🏆', 'Mais de 20 livros emprestados');

-- =====================================================
-- TRIGGERS PARA ATUALIZAÇÃO AUTOMÁTICA
-- =====================================================

-- Trigger: Atualizar contador de livros emprestados e nível do leitor quando um empréstimo é criado
DELIMITER $$

CREATE TRIGGER atualizar_livros_emprestados AFTER INSERT ON emprestimos
FOR EACH ROW
BEGIN
    UPDATE usuarios 
    SET total_livros_emprestados = total_livros_emprestados + 1,
        nivel_leitor = CASE
            WHEN total_livros_emprestados + 1 > 20 THEN 'EXTREMO'
            WHEN total_livros_emprestados + 1 > 10 THEN 'ATIVO'
            WHEN total_livros_emprestados + 1 > 5 THEN 'REGULAR'
            ELSE 'INICIANTE'
        END
    WHERE id = NEW.usuario_id;
END$$

-- Trigger: Atualizar status do livro quando emprestado
CREATE TRIGGER atualizar_status_livro_emprestado AFTER INSERT ON emprestimos
FOR EACH ROW
BEGIN
    UPDATE livros SET status = 'EMPRESTADO' WHERE id = NEW.livro_id;
END$$

-- Trigger: Atualizar status do livro quando devolvido
CREATE TRIGGER atualizar_status_livro_devolvido AFTER UPDATE ON emprestimos
FOR EACH ROW
BEGIN
    IF NEW.status = 'DEVOLVIDO' AND OLD.status = 'ATIVO' THEN
        UPDATE livros SET status = 'DISPONIVEL' WHERE id = NEW.livro_id;
    END IF;
END$$

DELIMITER ;

-- =====================================================
-- VIEWS ÚTEIS PARA CONSULTAS
-- =====================================================

-- View: Empréstimos ativos com informações completas
CREATE OR REPLACE VIEW vw_emprestimos_ativos AS
SELECT 
    e.id,
    u.nome_completo AS usuario_nome,
    u.ra AS usuario_ra,
    l.titulo AS livro_titulo,
    l.autor AS livro_autor,
    c.nome AS livro_categoria,
    e.data_emprestimo,
    e.data_devolucao_prevista,
    e.data_renovacao,
    e.numero_renovacoes,
    e.status,
    DATEDIFF(CURDATE(), e.data_devolucao_prevista) AS dias_atraso
FROM emprestimos e
INNER JOIN usuarios u ON e.usuario_id = u.id
INNER JOIN livros l ON e.livro_id = l.id
INNER JOIN categorias c ON l.categoria_id = c.id
WHERE e.status = 'ATIVO';

-- View: Estatísticas de usuários
CREATE OR REPLACE VIEW vw_estatisticas_usuarios AS
SELECT 
    u.id,
    u.nome_completo,
    u.ra,
    u.email,
    cg.nome AS cargo,
    u.total_livros_emprestados,
    u.nivel_leitor,
    u.total_conquistas,
    COUNT(DISTINCT e.id) AS livros_emprestados_atualmente,
    COUNT(DISTINCT h.id) AS total_devolvidos
FROM usuarios u
INNER JOIN cargos cg ON u.cargo_id = cg.id
LEFT JOIN emprestimos e ON u.id = e.usuario_id AND e.status = 'ATIVO'
LEFT JOIN historico_emprestimos h ON u.id = h.usuario_id
GROUP BY u.id, u.nome_completo, u.ra, u.email, cg.nome, u.total_livros_emprestados, u.nivel_leitor, u.total_conquistas;

-- View: Relatório de classificação de leitores (para painel admin)
CREATE OR REPLACE VIEW vw_classificacao_leitores AS
SELECT 
    u.id,
    u.nome_completo AS nome_leitor,
    u.total_livros_emprestados AS livros_emprestados_total,
    u.nivel_leitor AS classificacao,
    COUNT(DISTINCT h.id) AS total_devolvidos,
    COUNT(DISTINCT CASE WHEN h.status_final = 'ATRASADO' THEN h.id END) AS emprestimos_atrasados
FROM usuarios u
LEFT JOIN historico_emprestimos h ON u.id = h.usuario_id
WHERE u.cargo_id = (SELECT id FROM cargos WHERE nome = 'ALUNO')
GROUP BY u.id, u.nome_completo, u.total_livros_emprestados, u.nivel_leitor
ORDER BY u.total_livros_emprestados DESC;

-- View: Livros disponíveis para aluguel
CREATE OR REPLACE VIEW vw_livros_disponiveis AS
SELECT 
    l.id,
    l.titulo,
    l.autor,
    c.nome AS categoria,
    l.sinopse,
    l.numero_paginas,
    l.codigo_exemplar,
    l.status,
    COUNT(DISTINCT CASE WHEN e.status = 'ATIVO' THEN e.id END) AS exemplares_emprestados
FROM livros l
INNER JOIN categorias c ON l.categoria_id = c.id
LEFT JOIN emprestimos e ON l.id = e.livro_id
WHERE l.status = 'DISPONIVEL'
GROUP BY l.id, l.titulo, l.autor, c.nome, l.sinopse, l.numero_paginas, l.codigo_exemplar, l.status;

-- =====================================================
-- DADOS DE EXEMPLO (OPCIONAL - PARA TESTES)
-- =====================================================

-- Exemplo de livros (múltiplos exemplares do mesmo livro)
INSERT INTO livros (titulo, autor, categoria_id, sinopse, numero_paginas, codigo_exemplar) VALUES
('A Grande Aventura', 'Thomas Vinterberg', (SELECT id FROM categorias WHERE nome = 'Ficção'), 
 'Uma emocionante aventura que leva o leitor a mundos desconhecidos e experiências únicas.', 320, 'FIC-001-01'),
('A Grande Aventura', 'Thomas Vinterberg', (SELECT id FROM categorias WHERE nome = 'Ficção'), 
 'Uma emocionante aventura que leva o leitor a mundos desconhecidos e experiências únicas.', 320, 'FIC-001-02'),
('História do Tempo', 'Stacy Achar.ce', (SELECT id FROM categorias WHERE nome = 'Ciência'), 
 'Uma obra científica sobre o tempo e o universo.', 400, 'CIE-001-01'),
('Na Natureza Selvagem', 'Jon Krakauer', (SELECT id FROM categorias WHERE nome = 'Não Ficção'), 
 'A história real de Christopher McCandless e sua jornada pela natureza.', 280, 'NFC-001-01'),
('Na Natureza Selvagem', 'Jon Krakauer', (SELECT id FROM categorias WHERE nome = 'Não Ficção'), 
 'A história real de Christopher McCandless e sua jornada pela natureza.', 280, 'NFC-001-02'),
('O Mundo Perdido', 'Arthur Conan Doyle', (SELECT id FROM categorias WHERE nome = 'Ficção'), 
 'Uma expedição a um mundo pré-histórico perdido no tempo.', 350, 'FIC-002-01'),
('O Mistério', 'Detrity Eklent', (SELECT id FROM categorias WHERE nome = 'Ficção'), 
 'Um mistério envolvente que prende o leitor do início ao fim.', 290, 'FIC-003-01'),
('Ciência Hoje', 'Sclure Botrlo', (SELECT id FROM categorias WHERE nome = 'Ciência'), 
 'Uma análise das descobertas científicas mais recentes.', 450, 'CIE-002-01'),
('Revoluções na História', 'Maria Alvez', (SELECT id FROM categorias WHERE nome = 'História'), 
 'Um estudo sobre as principais revoluções que marcaram a história.', 380, 'HIS-001-01');

-- =====================================================
-- ÍNDICES ADICIONAIS PARA PERFORMANCE
-- =====================================================

-- Índice composto para busca de livros por título e autor
CREATE INDEX idx_livro_titulo_autor ON livros(titulo, autor);

-- Índice para busca de empréstimos por data
CREATE INDEX idx_emprestimo_datas ON emprestimos(data_emprestimo, data_devolucao_prevista);

-- =====================================================
-- FIM DA MODELAGEM
-- =====================================================

