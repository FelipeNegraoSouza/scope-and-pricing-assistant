const API_BASE = "http://localhost:8000/api";

let projetosAprovados = [];
let scheduleByDate = {};
let currentDate = new Date();
let selectedDate = null;

const colorsPalette = [
    "#9d4edd", // Roxo Neon
    "#3a86c8", // Azul
    "#06d6a0", // Verde Claro
    "#ef476f", // Rosa/Vermelho
    "#ffbe0b", // Amarelo
    "#ffd166", // Laranja Claro
    "#8338ec", // Violeta
    "#118ab2", // Azul Ciano
    "#ff006e", // Magenta
    "#4361ee"  // Indigo
];

// Utilitário para formatar datas no formato YYYY-MM-DD local
function formatYYYYMMDD(date) {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

// 1. CARREGAR DADOS DOS PROJETOS E MONTAR O CRONOGRAMA
async function carregarDados() {
    try {
        const userId = localStorage.getItem("usuario_id") || "1";
        const response = await fetch(`${API_BASE}/projetos?status=Aprovado`, {
            headers: {
                "X-User-Id": userId
            }
        });
        if (!response.ok) throw new Error("Erro ao buscar projetos aprovados");

        projetosAprovados = await response.json();
        processarCronograma();
        renderizarCalendario();
        renderizarLegenda();

    } catch (error) {
        console.error("Erro ao carregar dados do cronograma:", error);
        document.getElementById('calendar-days-grid').innerHTML = 
            `<p class="text-danger text-center py-4 w-100">Erro ao carregar o calendário. Verifique a conexão com o servidor.</p>`;
    }
}

// 2. LOGICA DE DISTRIBUIÇÃO SEQUENCIAL DAS TAREFAS EM DIAS UTEIS
function processarCronograma() {
    scheduleByDate = {}; // Reseta o agendamento em memória

    projetosAprovados.forEach((project, idx) => {
        // Escolhe uma cor exclusiva para o projeto
        const color = colorsPalette[idx % colorsPalette.length];
        
        // Define a data de início do projeto (data de criação no banco)
        let startDay = new Date(project.criado_em);
        if (isNaN(startDay.getTime())) {
            startDay = new Date();
        }

        // Distribui cada item de escopo (tarefa) sequencialmente
        project.itens.forEach(item => {
            const horas = item.horas_estimadas || 8;
            // 8 horas de trabalho por dia útil
            const duracaoDias = Math.ceil(horas / 8);

            let diasAlocados = 0;
            let currentDay = new Date(startDay);

            while (diasAlocados < duracaoDias) {
                const diaDaSemana = currentDay.getDay(); // 0 = Dom, 6 = Sáb
                
                // Pula finais de semana (0 e 6)
                if (diaDaSemana !== 0 && diaDaSemana !== 6) {
                    const dateStr = formatYYYYMMDD(currentDay);
                    if (!scheduleByDate[dateStr]) {
                        scheduleByDate[dateStr] = [];
                    }
                    
                    scheduleByDate[dateStr].push({
                        projetoId: project.id,
                        projetoTitulo: project.titulo,
                        cliente: project.cliente_nome_empresa || "Cliente",
                        tarefaTitulo: item.titulo_tarefa,
                        tarefaDesc: item.descricao_detalhada || "Sem descrição adicional.",
                        horas: horas,
                        cor: color
                    });

                    diasAlocados++;
                }

                // Avança para o próximo dia
                currentDay.setDate(currentDay.getDate() + 1);
            }

            // O próximo módulo inicia no dia seguinte de onde este parou
            startDay = new Date(currentDay);
        });
    });
}

// 3. RENDERIZAR O GRID DO CALENDÁRIO
function renderizarCalendario() {
    const grid = document.getElementById('calendar-days-grid');
    grid.innerHTML = '';

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // Atualiza cabeçalho do Mês/Ano
    const opcoesMes = { month: 'long', year: 'numeric' };
    document.getElementById('current-month-year').textContent = currentDate.toLocaleDateString('pt-BR', opcoesMes);

    // Primeiro dia do mês atual
    const primeiroDia = new Date(year, month, 1);
    // Último dia do mês atual
    const ultimoDia = new Date(year, month + 1, 0);
    const totalDiasMes = ultimoDia.getDate();

    // Ajusta o início da semana (Segunda-feira = 0, Domingo = 6)
    let primeiroDiaSemanaIndex = (primeiroDia.getDay() + 6) % 7;

    // Último dia do mês anterior (para dias de transição)
    const ultimoDiaMesAnterior = new Date(year, month, 0).getDate();

    // 1. Dias do Mês Anterior (Filler)
    for (let i = primeiroDiaSemanaIndex; i > 0; i--) {
        const diaNum = ultimoDiaMesAnterior - i + 1;
        const cell = document.createElement('div');
        cell.className = 'calendar-day other-month';
        cell.innerHTML = `<span class="day-number">${diaNum}</span>`;
        grid.appendChild(cell);
    }

    // 2. Dias do Mês Atual
    const hoje = new Date();
    for (let dia = 1; dia <= totalDiasMes; dia++) {
        const cellDate = new Date(year, month, dia);
        const dateStr = formatYYYYMMDD(cellDate);
        const tasks = scheduleByDate[dateStr] || [];

        const isToday = cellDate.toDateString() === hoje.toDateString();

        const cell = document.createElement('div');
        cell.className = `calendar-day${isToday ? ' today' : ''}`;
        cell.style.cursor = 'pointer';

        // Cabeçalho do dia
        const header = document.createElement('div');
        header.className = 'w-100 d-flex justify-content-between align-items-start';
        header.innerHTML = `<span class="day-number">${dia}</span>`;
        cell.appendChild(header);

        // Container de faixas das tarefas
        if (tasks.length > 0) {
            const container = document.createElement('div');
            container.className = 'tasks-container';

            // Renderiza as faixas horizontais de cores (uma para cada tarefa ativa)
            tasks.forEach(task => {
                const band = document.createElement('div');
                band.className = 'task-band';
                band.style.backgroundColor = task.cor;
                band.setAttribute('data-tooltip', `${task.projetoTitulo} - ${task.tarefaTitulo}`);
                container.appendChild(band);
            });

            cell.appendChild(container);
        }

        // Evento de clique para ver os detalhes das atividades do dia
        cell.onclick = () => {
            exibirDetalhesDoDia(dateStr, cellDate, tasks);
        };

        grid.appendChild(cell);
    }

    // 3. Dias do Mês Seguinte (Filler para completar o grid de 6 linhas / 42 células)
    const totalCelulas = grid.children.length;
    const celulasFaltando = 42 - totalCelulas;
    for (let dia = 1; dia <= celulasFaltando; dia++) {
        const cell = document.createElement('div');
        cell.className = 'calendar-day other-month';
        cell.innerHTML = `<span class="day-number">${dia}</span>`;
        grid.appendChild(cell);
    }
}

// 4. RENDERIZAR A LEGENDA DOS PROJETOS
function renderizarLegenda() {
    const legend = document.getElementById('projects-legend');
    legend.innerHTML = '';

    projetosAprovados.forEach((project, idx) => {
        const color = colorsPalette[idx % colorsPalette.length];
        const item = document.createElement('div');
        item.className = 'legend-item animate__animated animate__fadeIn';
        item.innerHTML = `
            <span class="legend-color" style="background-color: ${color};"></span>
            <strong>${project.titulo}</strong>
        `;
        legend.appendChild(item);
    });
}

// 5. EXIBIR DETALHES DO DIA SELECIONADO ABAIXO DO CALENDÁRIO
function exibirDetalhesDoDia(dateStr, cellDate, tasks) {
    selectedDate = cellDate;
    
    const container = document.getElementById('day-details-container');
    const label = document.getElementById('selected-day-label');
    const list = document.getElementById('day-tasks-list');

    // Formata a data selecionada para exibição
    const opcoes = { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' };
    label.textContent = cellDate.toLocaleDateString('pt-BR', opcoes);

    list.innerHTML = '';

    if (tasks.length === 0) {
        list.innerHTML = '<p class="text-muted mb-0 py-2">Nenhuma atividade planejada para este dia.</p>';
    } else {
        tasks.forEach(task => {
            const item = document.createElement('div');
            item.className = 'day-task-item p-3 mb-2 d-flex align-items-center gap-3 animate__animated animate__fadeInUp';
            item.innerHTML = `
                <div class="day-task-color-bar" style="background-color: ${task.cor};"></div>
                <div class="flex-grow-grow w-100">
                    <div class="d-flex justify-content-between align-items-center mb-1">
                        <h4 class="h6 mb-0 fw-bold text-purple-light">${task.tarefaTitulo}</h4>
                        <span class="badge bg-purple-subtle text-purple-light">${task.horas}h estimadas</span>
                    </div>
                    <p class="text-white small mb-1">Projeto: <strong>${task.projetoTitulo}</strong> | Cliente: <strong>${task.cliente}</strong></p>
                    <p class="text-muted font-xs mb-0">${task.tarefaDesc}</p>
                </div>
            `;
            list.appendChild(item);
        });
    }

    container.style.display = 'block';
    container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// 6. INICIALIZAÇÃO E EVENTOS
document.addEventListener("DOMContentLoaded", () => {
    // Carrega informações do desenvolvedor e configura Logout
    const nomeUsuario = localStorage.getItem("usuario_nome") || "Felipe N.";
    const profileName = document.querySelector(".user-profile .fw-medium");
    const profileAvatar = document.querySelector(".user-profile .avatar");
    
    if (profileName) profileName.textContent = nomeUsuario;
    if (profileAvatar) {
        const iniciais = nomeUsuario.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
        profileAvatar.textContent = iniciais;
    }

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

    // Configura botões de navegação do calendário
    document.getElementById('btn-prev-month').addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderizarCalendario();
    });

    document.getElementById('btn-next-month').addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderizarCalendario();
    });

    // Carrega dados da API e renderiza
    carregarDados();
});
