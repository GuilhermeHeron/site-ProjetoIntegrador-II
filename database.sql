-- =====================================================
-- SISTEMA DE BIBLIOTECA - MODELAGEM COMPLETA DO BANCO
-- =====================================================

-- Criação do banco de dados
CREATE DATABASE IF NOT EXISTS biblioteca;
USE biblioteca;

-- =====================================================
-- TABELA: USUARIOS
-- =====================================================
CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome_completo VARCHAR(200) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    ra VARCHAR(50) NOT NULL UNIQUE COMMENT 'Registro Acadêmico ou identificador único',
    status ENUM('ATIVO', 'INATIVO', 'SUSPENSO') DEFAULT 'ATIVO',
    total_livros_emprestados INT DEFAULT 0 COMMENT 'Contador de livros emprestados (total de empréstimos realizados)',
    nivel_leitor ENUM('INICIANTE', 'REGULAR', 'ATIVO', 'EXTREMO') DEFAULT 'INICIANTE',
    total_conquistas INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_ra (ra),
    INDEX idx_email (email)
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

-- Inserir categorias padrão
INSERT INTO categorias (nome, descricao) VALUES
('Ficção', 'Romances, contos e narrativas ficcionais'),
('Não Ficção', 'Livros baseados em fatos reais e informações'),
('Ciência', 'Livros sobre ciências naturais, física, química, biologia'),
('História', 'Livros sobre eventos históricos e períodos'),
('Biografia', 'Livros sobre a vida de pessoas reais'),
('Tecnologia', 'Livros sobre tecnologia, programação e inovação'),
('Literatura Brasileira', 'Obras literárias de autores brasileiros'),
('Literatura Estrangeira', 'Obras literárias de autores internacionais'),
('Filosofia', 'Livros sobre pensamento filosófico e reflexões'),
('Psicologia', 'Livros sobre comportamento humano e mente'),
('Arte', 'Livros sobre artes visuais, música e expressões artísticas'),
('Educação', 'Livros didáticos e materiais educacionais'),
('Autoajuda', 'Livros de desenvolvimento pessoal e motivação'),
('Fantasia', 'Livros de fantasia e mundos imaginários'),
('Ficção Científica', 'Livros de ficção científica e futurismo'),
('Mistério e Suspense', 'Livros de mistério, suspense e thriller'),
('Romance', 'Livros românticos e histórias de amor'),
('Poesia', 'Livros de poesia e versos'),
('Religião e Espiritualidade', 'Livros sobre religiões e espiritualidade'),
('Negócios e Economia', 'Livros sobre negócios, economia e empreendedorismo')
ON DUPLICATE KEY UPDATE nome = nome;

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

-- (Conquistas serão cadastradas via aplicação, se necessário; nenhum registro padrão é inserido aqui)

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
-- DADOS DE EXEMPLO (OPCIONAL - PARA TESTES)
-- =====================================================

-- (Livros de exemplo não são mais inseridos automaticamente; cadastre-os pela aplicação conforme necessário)

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

