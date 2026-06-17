  -- 1. Criação e Seleção do Banco de Dados
CREATE DATABASE IF NOT EXISTS assistente_escopo;
USE assistente_escopo;

-- 2. TABELA: Usuários (Desenvolvedores/Analistas)
CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. TABELA: Clientes
CREATE TABLE IF NOT EXISTS clientes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome_empresa VARCHAR(150) NOT NULL,
    responsavel VARCHAR(100),
    email VARCHAR(100),
    telefone VARCHAR(20),
    usuario_id INT NOT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- 4. TABELA: Projetos (Escopos Macros)
CREATE TABLE IF NOT EXISTS projetos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(150) NOT NULL,
    descricao_geral TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'Rascunho', -- Rascunho, Gerado pela IA, Aprovado, Cancelado
    valor_total DECIMAL(10, 2) DEFAULT 0.00, -- Soma do custo de todas as tarefas
    cliente_id INT NOT NULL,
    usuario_id INT NOT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- 5. TABELA: Itens do Escopo (Tarefas e Precificação)
CREATE TABLE IF NOT EXISTS itens_escopo (
    id INT AUTO_INCREMENT PRIMARY KEY,
    projeto_id INT NOT NULL,
    titulo_tarefa VARCHAR(150) NOT NULL,
    descricao_detalhada TEXT,
    horas_estimadas INT NOT NULL DEFAULT 0,
    complexidade VARCHAR(20) DEFAULT 'Média', -- Baixa, Média, Alta
    valor_hora DECIMAL(10, 2) DEFAULT 50.00,  -- Valor padrão que pode ser alterado por tarefa
    custo_estimado DECIMAL(10, 2) DEFAULT 0.00, -- horas_estimadas * valor_hora
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (projeto_id) REFERENCES projetos(id) ON DELETE CASCADE
);

-- 6. DADOS INICIAIS
INSERT INTO usuarios (id, nome, email, senha) VALUES (1, 'Felipe N.', 'teste@gmail.com', 'admin') ON DUPLICATE KEY UPDATE id=id;