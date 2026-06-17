# Assistente de Escopo e Precificação Inteligente

Este é um sistema desenvolvido para automatizar a geração de escopos técnicos e a precificação de projetos de desenvolvimento de software. A ferramenta coleta o briefing do cliente e a stack sugerida, aciona a Inteligência Artificial (Gemini) para gerar a estrutura de módulos técnicos, estima as horas e calcula a precificação do projeto com base no valor da hora do desenvolvedor. Por fim, gera uma proposta comercial compartilhável que permite a aprovação digital por parte do cliente.

---

## 🚀 Como Executar o Projeto

Você pode rodar a aplicação de duas formas: utilizando **Docker Compose** (recomendado para simular o ambiente de produção com MySQL) ou de forma **100% Local (sem Docker)** utilizando banco de dados SQLite.

---

### Opção A: Executando via Docker (Recomendado)

Esta é a opção mais prática, pois configura o banco de dados MySQL, o backend e o frontend automaticamente em rede isolada.

**Requisitos:** Docker Desktop instalado.

1. No diretório raiz do projeto, configure sua chave de API do Gemini no arquivo `.env` (opcional, veja a seção [Configuração do Gemini](#-configuração-do-gemini-ia)).
2. Suba os containers com o comando:
   ```bash
   docker-compose up --build
   ```
3. Acesse a aplicação:
   * **Frontend (Aplicação Web):** `http://localhost` (porta 80)
   * **Backend (API):** `http://localhost:8000` (Documentação em `http://localhost:8000/docs`)

---

### Opção B: Executando Localmente (Sem Docker)

Se a sua máquina não possui suporte a Docker, a aplicação conta com um sistema de autodetação e utilizará **SQLite** local de forma automática.

**Requisitos:** Python 3.11 instalado na máquina.

#### 1. Executando o Backend (API)
1. Vá para a pasta do Backend:
   ```bash
   cd Backend
   ```
2. Crie e ative o ambiente virtual (`venv`):
   * **No Windows (Git Bash):**
     ```bash
     source venv/Scripts/activate
     ```
   * **No Windows (PowerShell):**
     ```powershell
     .\venv\Scripts\Activate.ps1
     ```
   * **No Linux/macOS:**
     ```bash
     source venv/bin/activate
     ```
3. Instale as dependências necessárias:
   ```bash
   pip install -r requirements.txt
   ```
4. Suba o servidor do backend:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
   *O backend criará automaticamente o banco de dados SQLite local `escopo.db` e estará rodando em `http://127.0.0.1:8000`.*

#### 2. Executando o Frontend
Como o frontend é composto por páginas estáticas leves:
* Basta abrir o arquivo `index.html` na raiz do projeto (ou `Frontend/index.html` para ir direto ao login) no seu navegador dando dois cliques sobre ele.
* *(Opcional)* Se você utiliza o VS Code, pode usar a extensão **Live Server** para rodar o frontend sob um servidor local.

---

## 🔑 Credenciais Padrão de Acesso

Após carregar a tela de Login/Cadastro, você pode entrar usando o usuário desenvolvedor semeado automaticamente no banco de dados:
* **E-mail:** `teste@gmail.com`
* **Senha:** `admin`

*Você também pode alternar para a aba **Cadastre-se** para criar uma conta nova e exclusiva com seu próprio e-mail e senha.*

---

## 🧠 Configuração do Gemini (IA)

O sistema utiliza Inteligência Artificial para decompor o briefing do cliente em módulos de entrega técnica.

1. Abra o arquivo `.env` localizado na raiz do projeto.
2. Adicione sua chave de acesso à variável `GEMINI_API_KEY`:
   ```env
   GEMINI_API_KEY=sua_chave_aqui
   ```
3. **Fallback:** Caso você não configure a chave ou esteja sem acesso à internet, o sistema detectará automaticamente a ausência da credencial e usará um fluxo inteligente de dados mockados pré-definidos para que você consiga testar o fluxo de ponta a ponta sem interrupções.

---

## 🛠️ Tecnologias Utilizadas

* **Backend:** FastAPI (Python), SQLAlchemy (ORM), Pydantic (Validação de Dados), SQLite/MySQL (Bancos de dados suportados).
* **Frontend:** HTML5, CSS3 Customizado (Dark Mode e Glassmorphism), Javascript (Vanilla), Bootstrap 5, FontAwesome (Ícones) e Animate.css (Micro-Animações).
* **Containerização:** Docker & Docker Compose.
