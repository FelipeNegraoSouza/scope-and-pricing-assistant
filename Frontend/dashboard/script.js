const API_BASE = "http://localhost:8000/api";

// 1. BUSCAR DADOS DO BACKEND E POPULAR TELA
async function carregarDashboard() {
    // Atualiza perfil no header dinamicamente
    const nomeUsuario = localStorage.getItem("usuario_nome") || "Felipe N.";
    const profileName = document.querySelector(".user-profile .fw-medium");
    const profileAvatar = document.querySelector(".user-profile .avatar");
    
    if (profileName) profileName.textContent = nomeUsuario;
    if (profileAvatar) {
        const iniciais = nomeUsuario.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
        profileAvatar.textContent = iniciais;
    }

    // Configura evento de Logout
    const logoutBtn = document.querySelector(".sidebar-logout a");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", (e) => {
            e.preventDefault();
            localStorage.clear();
            if (window.navigateTo) {
                window.navigateTo("../index.html");
            } else {
                window.location.href = "../index.html";
            }
        });
    }

    try {
        const userId = localStorage.getItem("usuario_id") || "1";
        const response = await fetch(`${API_BASE}/dashboard`, {
            headers: {
                "X-User-Id": userId
            }
        });
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
                const url = (escopo.status === 'Aprovado' || escopo.status === 'Concluído')
                    ? `../cliente/index.html?id=${escopo.id}`
                    : `../edicao/index.html?id=${escopo.id}`;
                if (window.navigateTo) {
                    window.navigateTo(url);
                } else {
                    window.location.href = url;
                }
            };

            item.innerHTML = `
                <div class="d-flex justify-content-between align-items-center mb-2">
                    <strong class="text-purple-light text-truncate" style="max-width: 80%;">${escopo.projeto}</strong>
                    <button class="btn-delete-project border-0 bg-transparent text-danger p-0 animate__animated animate__fadeIn" title="Excluir Escopo">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </div>
                <div class="d-flex justify-content-between small mb-1"><span class="text-muted">Cliente:</span><strong>${escopo.cliente}</strong></div>
                <div class="d-flex justify-content-between small mb-1">
                    <span class="text-muted">Valor:</span>
                    <strong>${escopo.valor_total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong>
                </div>
                <div class="d-flex justify-content-between small mb-1">
                    <span class="text-muted">Status:</span>
                    <span class="badge ${statusClass}">${escopo.status}</span>
                </div>
            `;

            // Lógica do botão de exclusão
            const btnDelete = item.querySelector('.btn-delete-project');
            btnDelete.onclick = async (e) => {
                e.stopPropagation(); // Impede a propagação para o clique do card principal
                if (confirm(`Deseja realmente excluir permanentemente o projeto "${escopo.projeto}"?`)) {
                    try {
                        const userId = localStorage.getItem("usuario_id") || "1";
                        const res = await fetch(`${API_BASE}/projetos/${escopo.id}`, {
                            method: 'DELETE',
                            headers: {
                                "X-User-Id": userId
                            }
                        });
                        if (!res.ok) throw new Error("Erro ao excluir o projeto.");
                        
                        // Recarrega o dashboard atualizado
                        carregarDashboard();
                    } catch (err) {
                        console.error(err);
                        alert("Não foi possível excluir este projeto. Verifique a conexão.");
                    }
                }
            };

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
