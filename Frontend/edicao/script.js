// Variáveis globais para armazenar os dados do escopo e do projeto
let dadosEscopoIA = [];
let projetoId = null;
let projetoDados = {};

// Elementos do DOM mapeados
const containerModulos = document.getElementById('modules-container');
const inputValorHora = document.getElementById('valor-hora');
const txtTotalHoras = document.getElementById('total-horas');
const txtPrecoFinal = document.getElementById('preco-final');
const btnAddModulo = document.getElementById('btn-add-modulo');
const btnSalvar = document.getElementById('btn-salvar-proposta');
const txtNomeProjetoHeader = document.getElementById('nome-projeto-header');

const API_BASE = "http://localhost:8000/api";

// 1. CARREGAR DADOS DO PROJETO DA API
async function carregarProjeto() {
    const urlParams = new URLSearchParams(window.location.search);
    projetoId = urlParams.get('id');

    if (!projetoId) {
        alert("ID do projeto não fornecido na URL!");
        const url = "../dashboard/index.html";
        if (window.navigateTo) {
            window.navigateTo(url);
        } else {
            window.location.href = url;
        }
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/projetos/${projetoId}`);
        if (!response.ok) throw new Error("Erro ao carregar projeto.");

        projetoDados = await response.json();
        
        // Atualiza cabeçalho
        txtNomeProjetoHeader.textContent = projetoDados.titulo;

        // Mapeia os itens vindo do backend para o array local
        dadosEscopoIA = projetoDados.itens.map(item => ({
            id: item.id,
            titulo: item.titulo_tarefa,
            descricao: item.descricao_detalhada || "",
            horas: item.horas_estimadas,
            complexidade: item.complexidade || "Média"
        }));

        // Define o valor da hora a partir do primeiro item (se houver), ou 50.00 como padrão
        if (projetoDados.itens.length > 0) {
            inputValorHora.value = parseFloat(projetoDados.itens[0].valor_hora) || 50;
        }

        renderizarModulos();

    } catch (error) {
        console.error("Erro ao carregar dados do projeto:", error);
        alert("Erro ao carregar dados do projeto. Verifique se o backend está ativo.");
    }
}

// 2. RENDERIZAR OS MÓDULOS NA TELA
function renderizarModulos() {
    containerModulos.innerHTML = '';
    
    dadosEscopoIA.forEach((modulo, index) => {
        const div = document.createElement('div');
        div.className = 'module-item mb-3 p-3';
        div.innerHTML = `
            <div class="row g-3">
                <div class="col-md-8">
                    <input type="text" class="form-control custom-input fw-bold text-purple-light mb-2" value="${modulo.titulo}" onchange="atualizarDados(${index}, 'titulo', this.value)">
                    <textarea class="form-control custom-input small text-muted" rows="2" onchange="atualizarDados(${index}, 'descricao', this.value)">${modulo.descricao}</textarea>
                </div>
                <div class="col-md-3">
                    <label class="form-label text-muted small fw-bold">ESTIMATIVA (HORAS)</label>
                    <input type="number" class="form-control custom-input text-center fw-bold" value="${modulo.horas}" oninput="atualizarDados(${index}, 'horas', this.value)">
                </div>
                <div class="col-md-1 d-flex align-items-center justify-content-center">
                    <button class="btn-delete-mod" onclick="removerModulo(${index})"><i class="fa-solid fa-trash"></i></button>
                </div>
            </div>
        `;
        containerModulos.appendChild(div);
    });

    recalcularTotal();
}

// 3. ATUALIZAR DADOS DO ARRAY CONFORME O USUÁRIO DIGITA
window.atualizarDados = function(index, campo, valor) {
    if (campo === 'horas') {
        dadosEscopoIA[index][campo] = parseInt(valor) || 0;
        recalcularTotal(); // Recalcula a matemática se mudou a hora
    } else {
        dadosEscopoIA[index][campo] = valor;
    }
};

// 4. MATEMÁTICA FINANCEIRA (HORAS * VALOR DA HORA)
function recalcularTotal() {
    const totalHoras = dadosEscopoIA.reduce((soma, mod) => soma + mod.horas, 0);
    const valorHora = parseFloat(inputValorHora.value) || 0;
    const precoFinal = totalHoras * valorHora;

    txtTotalHoras.textContent = `${totalHoras}h`;
    txtPrecoFinal.textContent = precoFinal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// Ouvir mudança no input de valor da hora
inputValorHora.addEventListener('input', recalcularTotal);

// 5. ADICIONAR NOVO MÓDULO VAZIO
btnAddModulo.addEventListener('click', () => {
    dadosEscopoIA.push({
        id: null, // Novo item ainda não tem ID de banco
        titulo: "Novo Módulo Customizado",
        descricao: "Descreva as regras de negócio deste módulo...",
        horas: 10,
        complexidade: "Média"
    });
    renderizarModulos();
});

// 6. REMOVER MÓDULO
window.removerModulo = function(index) {
    dadosEscopoIA.splice(index, 1);
    renderizarModulos();
};

// 7. SALVAR DADOS NO BACKEND E IR PARA O CLIENTE
btnSalvar.addEventListener('click', async () => {
    const totalHoras = dadosEscopoIA.reduce((soma, mod) => soma + mod.horas, 0);
    const valorHora = parseFloat(inputValorHora.value) || 0;
    const precoFinal = totalHoras * valorHora;

    // Prepara payload de atualização
    const payload = {
        titulo: projetoDados.titulo,
        status: "Gerado pela IA", // Atualiza status para indicar que está pronto para visualização
        valor_total: precoFinal,
        itens: dadosEscopoIA.map(modulo => ({
            titulo_tarefa: modulo.titulo,
            descricao_detalhada: modulo.descricao,
            horas_estimadas: modulo.horas,
            complexidade: modulo.complexidade || "Média",
            valor_hora: valorHora,
            custo_estimado: modulo.horas * valorHora
        }))
    };

    try {
        btnSalvar.disabled = true;
        btnSalvar.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status"></span> Salvando...';

        const response = await fetch(`${API_BASE}/projetos/${projetoId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error("Erro ao salvar o escopo.");

        // Redireciona para visualização do cliente
        const url = `../cliente/index.html?id=${projetoId}`;
        if (window.navigateTo) {
            window.navigateTo(url);
        } else {
            window.location.href = url;
        }

    } catch (error) {
        console.error("Erro ao salvar proposta:", error);
        alert("Não foi possível salvar o escopo. Verifique a conexão com o backend.");
        btnSalvar.disabled = false;
        btnSalvar.innerHTML = '<i class="fa-solid fa-floppy-disk me-2"></i> Salvar e Visualizar';
    }
});

// Inicialização da tela
document.addEventListener("DOMContentLoaded", carregarProjeto);