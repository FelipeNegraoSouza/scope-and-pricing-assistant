const API_BASE = "http://localhost:8000/api";
let projetoId = null;

// 1. EVENTO DE IMPRESSÃO
document.getElementById('btn-print').addEventListener('click', () => { 
    window.print(); 
});

// 2. BUSCAR DADOS DA PROPOSTA NO BANCO DE DADOS
async function carregarProposta() {
    const urlParams = new URLSearchParams(window.location.search);
    projetoId = urlParams.get('id');

    if (!projetoId) {
        alert("ID do projeto não fornecido!");
        window.location.href = "../dashboard/index.html";
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/projetos/${projetoId}`);
        if (!response.ok) throw new Error("Erro ao carregar os dados da proposta.");

        const projeto = await response.json();

        // Preenche campos de texto
        document.getElementById('proposal-id').textContent = `ID: #2026-${String(projeto.id).padStart(4, '0')}`;
        document.getElementById('cliente-nome').textContent = projeto.cliente_nome_empresa || "Cliente Não Informado";
        
        // Formata data de emissão
        const dataCriacao = new Date(projeto.criado_em);
        const opcoesData = { day: 'numeric', month: 'long', year: 'numeric' };
        document.getElementById('data-emissao').textContent = dataCriacao.toLocaleDateString('pt-BR', opcoesData);

        // Objetivo do projeto
        document.getElementById('projeto-objetivo').textContent = projeto.descricao_geral;

        // Valor total
        const valorTotal = parseFloat(projeto.valor_total) || 0;
        document.getElementById('valor-total-proposta').textContent = valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

        // Tabela de Módulos
        const tbody = document.getElementById('modulos-tabela-body');
        tbody.innerHTML = '';

        if (projeto.itens.length === 0) {
            tbody.innerHTML = '<tr><td colspan="2" class="text-center text-muted">Nenhum módulo registrado.</td></tr>';
        } else {
            projeto.itens.forEach(item => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><strong>${item.titulo_tarefa}</strong></td>
                    <td class="text-muted small">${item.descricao_detalhada || 'Sem descrição detalhada.'}</td>
                `;
                tbody.appendChild(tr);
            });
        }

        // Verifica o status do projeto e desativa botão se já estiver aprovado
        if (projeto.status === 'Aprovado' || projeto.status === 'Concluído') {
            marcarComoAprovadoUI();
        }

    } catch (error) {
        console.error("Erro ao carregar proposta comercial:", error);
        alert("Falha ao se conectar com o servidor para obter dados da proposta.");
    }
}

// 3. EVENTO DE APROVAÇÃO DA PROPOSTA
const btnAprovar = document.getElementById('btn-aprovar');
btnAprovar.addEventListener('click', async () => {
    if (!projetoId) return;

    if (confirm("Deseja aprovar este escopo formalmente?")) {
        try {
            btnAprovar.disabled = true;
            btnAprovar.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status"></span> Processando...';

            const response = await fetch(`${API_BASE}/projetos/${projetoId}/aprovar`, {
                method: 'POST'
            });

            if (!response.ok) throw new Error("Erro ao aprovar proposta.");

            marcarComoAprovadoUI();
            alert("Sucesso! Proposta aprovada e registro atualizado no sistema.");

        } catch (error) {
            console.error("Erro ao aprovar proposta:", error);
            alert("Não foi possível registrar a aprovação. Verifique com o administrador.");
            btnAprovar.disabled = false;
            btnAprovar.innerHTML = '<i class="fa-solid fa-check me-2"></i>Aprovar Proposta';
        }
    }
});

// Auxiliar para atualizar a UI do botão de aprovar
function marcarComoAprovadoUI() {
    const btn = document.getElementById('btn-aprovar');
    btn.className = "btn btn-secondary disabled";
    btn.disabled = true;
    btn.innerHTML = "<i class='fa-solid fa-check text-success me-2'></i> Proposta Aprovada!";
}

// Inicializa a tela
document.addEventListener("DOMContentLoaded", carregarProposta);
