// Dados simulados (Mock) que representam o que a IA do Gemini retornaria do backend
let dadosEscopoIA = [
    { id: 1, titulo: "Dashboard de Gargalos", descricao: "Interface em tempo real exibindo painéis de eficiência das máquinas e ordens de produção.", horas: 60 },
    { id: 2, titulo: "Controle de Insumos", descricao: "Banco de dados integrado para dar baixa automática em matérias-primas.", horas: 80 },
    { id: 3, titulo: "Módulo de Relatórios", descricao: "Exportação de dados históricos em formatos CSV/PDF para análise.", horas: 20 }
];

const containerModulos = document.getElementById('modules-container');
const inputValorHora = document.getElementById('valor-hora');
const txtTotalHoras = document.getElementById('total-horas');
const txtPrecoFinal = document.getElementById('preco-final');
const btnAddModulo = document.getElementById('btn-add-modulo');
const btnSalvar = document.getElementById('btn-salvar-proposta');

// 1. RENDERIZAR OS MÓDULOS NA TELA
function renderizarModulos() {
    containerModulos.innerHTML = '';
    
    dadosEscopoIA.forEach((modulo, index) => {
        const div = document.createElement('div');
        div.className = 'module-item';
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

// 2. ATUALIZAR DADOS DO ARRAY CONFORME O USUÁRIO DIGITA
window.atualizarDados = function(index, campo, valor) {
    if (campo === 'horas') {
        dadosEscopoIA[index][campo] = parseInt(valor) || 0;
        recalcularTotal(); // Recalcula a matemática se mudou a hora
    } else {
        dadosEscopoIA[index][campo] = valor;
    }
};

// 3. MATEMÁTICA FINANCEIRA (HORAS * VALOR DA HORA)
function recalcularTotal() {
    const totalHoras = dadosEscopoIA.reduce((soma, mod) => soma + mod.horas, 0);
    const valorHora = parseFloat(inputValorHora.value) || 0;
    const precoFinal = totalHoras * valorHora;

    txtTotalHoras.textContent = `${totalHoras}h`;
    txtPrecoFinal.textContent = precoFinal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// Ouvir mudança no input de valor da hora
inputValorHora.addEventListener('input', recalcularTotal);

// 4. ADICIONAR NOVO MÓDULO VAZIO
btnAddModulo.addEventListener('click', () => {
    dadosEscopoIA.push({
        id: Date.now(),
        titulo: "Novo Módulo Customizado",
        descricao: "Clique para descrever as regras de negócio deste módulo...",
        horas: 10
    });
    renderizarModulos();
});

// 5. REMOVER MÓDULO
window.removerModulo = function(index) {
    dadosEscopoIA.splice(index, 1);
    renderizarModulos();
};

// 6. REDIRECIONAR PARA O MODO CLIENTE AO FINALIZAR
btnSalvar.addEventListener('click', () => {
    alert("Escopo salvo com sucesso! Redirecionando para a visualização oficial do cliente...");
    window.location.href = "../cliente/index.html";
});

// Inicialização da tela
renderizarModulos();