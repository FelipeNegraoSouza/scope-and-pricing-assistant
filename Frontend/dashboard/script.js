const API_BASE = "http://localhost:8000/api";

// 1. BUSCAR DADOS DO BACKEND E POPULAR TELA
async function carregarDashboard() {
    try {
        const response = await fetch(`${API_BASE}/dashboard`);
        if (!response.ok) throw new Error("Erro ao buscar dados do dashboard");

        const data = await response.json();

        // Popular Métricas
        document.getElementById('escopos-ativos-val').textContent = data.escopos_ativos;
        document.getElementById('escopos-ativos-desc').textContent = `${data.escopos_ativos} em Andamento`;

        document.getElementById('propostas-enviadas-val').textContent = data.propostas_enviadas;
        // Simulamos uma contagem simples de aprovadas (aproximadamente metade)
        const aprovadas = Math.ceil(data.propostas_enviadas * 0.7);
        const revisao = data.propostas_enviadas - aprovadas;
        document.getElementById('propostas-enviadas-desc').textContent = `${aprovadas} Aprovadas | ${revisao} em Revisão`;

        document.getElementById('faturamento-val').textContent = data.faturamento_potencial.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

        // Popular Últimos Escopos
        const container = document.getElementById('ultimos-escopos-container');
        container.innerHTML = '';

        if (data.ultimos_escopos.length === 0) {
            container.innerHTML = '<p class="text-muted text-center py-3">Nenhum escopo cadastrado ainda.</p>';
            return;
        }

        data.ultimos_escopos.forEach(escopo => {
            const statusClass = escopo.status === 'Concluído' || escopo.status === 'Aprovado'
                ? 'bg-success text-success-light' 
                : 'bg-purple-subtle text-purple-light border border-purple-dim';

            const item = document.createElement('div');
            item.className = 'scope-item p-3 mb-3';
            item.style.cursor = 'pointer';
            item.onclick = () => {
                // Redireciona para edição se for Rascunho/Gerado pela IA, ou visualização do cliente se aprovado
                if (escopo.status === 'Aprovado' || escopo.status === 'Concluído') {
                    window.location.href = `../cliente/index.html?id=${escopo.id}`;
                } else {
                    window.location.href = `../edicao/index.html?id=${escopo.id}`;
                }
            };

            item.innerHTML = `
                <div class="d-flex justify-content-between small mb-1"><span class="text-muted">Cliente:</span><strong>${escopo.cliente}</strong></div>
                <div class="d-flex justify-content-between small mb-1"><span class="text-muted">Projeto:</span><strong>${escopo.projeto}</strong></div>
                <div class="d-flex justify-content-between small mb-1">
                    <span class="text-muted">Valor:</span>
                    <strong>${escopo.valor_total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong>
                </div>
                <div class="d-flex justify-content-between small mb-1">
                    <span class="text-muted">Status:</span>
                    <span class="badge ${statusClass}">${escopo.status}</span>
                </div>
            `;
            container.appendChild(item);
        });

    } catch (error) {
        console.error("Erro ao inicializar dashboard:", error);
        document.getElementById('ultimos-escopos-container').innerHTML = 
            '<p class="text-danger text-center py-3">Erro ao carregar dados do servidor. Certifique-se de que o backend está rodando.</p>';
    }
}

// Inicializar
document.addEventListener("DOMContentLoaded", carregarDashboard);
