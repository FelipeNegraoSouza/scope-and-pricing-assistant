// Endereço base da API
const API_BASE_URL = 'http://localhost:8000/api';

// Elementos do DOM
const techForm = document.getElementById('tech-form');
const techIdInput = document.getElementById('tech-id');
const techNomeInput = document.getElementById('tech-nome');
const techCustoInput = document.getElementById('tech-custo');
const techMultiplicadorInput = document.getElementById('tech-multiplicador');
const techList = document.getElementById('tech-list');
const techCount = document.getElementById('tech-count');
const formTitle = document.getElementById('form-title');
const btnSubmit = document.getElementById('btn-submit');
const btnCancel = document.getElementById('btn-cancel');
const searchTech = document.getElementById('search-tech');
const alertError = document.getElementById('alert-error');
const alertSuccess = document.getElementById('alert-success');
const logoutLink = document.querySelector('.sidebar-logout a');

// Estado global da página
let tecnologias = [];
let usuarioLogado = null;

// 1. VERIFICAÇÃO DE LOGIN
function verificarAutenticacao() {
    const userId = localStorage.getItem('usuario_id');
    const userNome = localStorage.getItem('usuario_nome');
    const userEmail = localStorage.getItem('usuario_email');

    if (!userId) {
        window.location.href = '../index.html';
        return null;
    }

    usuarioLogado = {
        id: parseInt(userId),
        nome: userNome,
        email: userEmail
    };

    // Atualiza nome visual se houver algum elemento correspondente na sidebar ou header
    // Como a sidebar compartilha o design, se quisermos mostrar iniciais do usuário, podemos fazer aqui.
    const sidebarBrand = document.querySelector('.sidebar-brand');
    if (sidebarBrand && usuarioLogado.nome) {
        sidebarBrand.innerHTML = `<i class="fa-solid fa-layer-group"></i><div class="small text-muted mt-1" style="font-size: 11px;">Olá, ${usuarioLogado.nome.split(' ')[0]}</div>`;
    }

    return usuarioLogado;
}

// 2. BUSCAR TECNOLOGIAS DO BACKEND
async function carregarTecnologias() {
    try {
        if (!usuarioLogado) return;

        const response = await fetch(`${API_BASE_URL}/tecnologias`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-User-Id': usuarioLogado.id.toString()
            }
        });

        if (!response.ok) {
            throw new Error('Erro ao carregar o catálogo de tecnologias.');
        }

        tecnologias = await response.json();
        renderizarTecnologias(tecnologias);
    } catch (error) {
        mostrarFeedback('error', error.message);
    }
}

// 3. RENDERIZAR LISTA NO DOM
function renderizarTecnologias(lista) {
    techList.innerHTML = '';
    
    // Atualiza o contador de tecnologias
    techCount.textContent = `${lista.length} ${lista.length === 1 ? 'Tecnologia' : 'Tecnologias'}`;

    if (lista.length === 0) {
        techList.innerHTML = `
            <div class="text-center py-5 text-muted">
                <i class="fa-solid fa-folder-open fa-2x mb-3"></i>
                <p class="mb-0">Nenhuma tecnologia cadastrada.</p>
                <small class="text-muted">Cadastre uma nova tecnologia na coluna ao lado.</small>
            </div>
        `;
        return;
    }

    lista.forEach(tech => {
        const custoBase = parseFloat(tech.custo_base);
        const multiplicador = parseFloat(tech.multiplicador);
        const custoFinal = custoBase * multiplicador;

        const itemHTML = `
            <div class="tech-item animate__animated animate__fadeIn" data-id="${tech.id}">
                <div class="d-flex align-items-center">
                    <div class="tech-icon-box">
                        <i class="fa-solid fa-code"></i>
                    </div>
                    <div class="tech-info">
                        <div class="tech-name">${tech.nome}</div>
                        <div class="tech-details">
                            Custo Base: R$ ${custoBase.toFixed(2)}/h &bull; Mult: ${multiplicador.toFixed(2)}x
                        </div>
                    </div>
                </div>
                
                <div class="d-flex align-items-center">
                    <div class="tech-value-box">
                        <div class="tech-calculated-price">R$ ${custoFinal.toFixed(2)}<span class="small" style="font-size: 10px; font-weight: normal; color: #8e92a3;">/h</span></div>
                        <span class="tech-multi-badge">${multiplicador > 1.0 ? '+' : ''}${( (multiplicador - 1) * 100 ).toFixed(0)}% Complexidade</span>
                    </div>
                    <div class="tech-actions">
                        <button class="action-btn btn-edit-tech" onclick="prepararEdicao(${tech.id})" title="Editar tecnologia">
                            <i class="fa-solid fa-pen-to-square"></i>
                        </button>
                        <button class="action-btn btn-delete-tech" onclick="deletarTecnologia(${tech.id})" title="Excluir tecnologia">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
        techList.insertAdjacentHTML('beforeend', itemHTML);
    });
}

// 4. PREPARAR FORMULÁRIO PARA EDIÇÃO
window.prepararEdicao = function(id) {
    const tech = tecnologias.find(t => t.id === id);
    if (!tech) return;

    // Preenche campos
    techIdInput.value = tech.id;
    techNomeInput.value = tech.nome;
    techCustoInput.value = tech.custo_base;
    techMultiplicadorInput.value = tech.multiplicador;

    // Altera interface visual
    formTitle.textContent = 'Editar Tecnologia';
    btnSubmit.innerHTML = '<i class="fa-solid fa-save me-2"></i>Salvar Alterações';
    btnCancel.classList.remove('d-none');
    
    // Rolagem suave até o formulário no celular
    techNomeInput.focus();
};

// Limpar formulário e voltar ao estado original
function resetarFormulario() {
    techIdInput.value = '';
    techForm.reset();
    formTitle.textContent = 'Cadastrar Tecnologia';
    btnSubmit.innerHTML = '<i class="fa-solid fa-save me-2"></i>Salvar';
    btnCancel.classList.add('d-none');
}

// Cancelar Edição
btnCancel.addEventListener('click', resetarFormulario);

// 5. EXECUTAR SUBMIT (CRIAR / ATUALIZAR)
techForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const id = techIdInput.value;
    const nome = techNomeInput.value.trim();
    const custo_base = parseFloat(techCustoInput.value);
    const multiplicador = parseFloat(techMultiplicadorInput.value);

    const payload = { nome, custo_base, multiplicador };

    try {
        let response;
        if (id) {
            // Edição (PUT)
            response = await fetch(`${API_BASE_URL}/tecnologias/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-User-Id': usuarioLogado.id.toString()
                },
                body: JSON.stringify(payload)
            });
        } else {
            // Cadastro (POST)
            response = await fetch(`${API_BASE_URL}/tecnologias`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-User-Id': usuarioLogado.id.toString()
                },
                body: JSON.stringify(payload)
            });
        }

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.detail || 'Erro ao processar requisição.');
        }

        mostrarFeedback('success', id ? 'Tecnologia atualizada com sucesso!' : 'Tecnologia cadastrada com sucesso!');
        resetarFormulario();
        await carregarTecnologias();
    } catch (error) {
        mostrarFeedback('error', error.message);
    }
});

// 6. EXCLUIR TECNOLOGIA
window.deletarTecnologia = async function(id) {
    const tech = tecnologias.find(t => t.id === id);
    if (!tech) return;

    if (!confirm(`Deseja realmente remover a tecnologia '${tech.name || tech.nome}'?`)) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/tecnologias/${id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'X-User-Id': usuarioLogado.id.toString()
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.detail || 'Erro ao deletar tecnologia.');
        }

        mostrarFeedback('success', 'Tecnologia excluída do catálogo.');
        if (techIdInput.value === id.toString()) {
            resetarFormulario();
        }
        await carregarTecnologias();
    } catch (error) {
        mostrarFeedback('error', error.message);
    }
};

// 7. FILTRAR TECNOLOGIAS EM TEMPO REAL
searchTech.addEventListener('input', (e) => {
    const termo = e.target.value.toLowerCase().trim();
    if (!termo) {
        renderizarTecnologias(tecnologias);
        return;
    }

    const filtradas = tecnologias.filter(tech => 
        tech.nome.toLowerCase().includes(termo)
    );
    renderizarTecnologias(filtradas);
});

// 8. MOSTRAR MENSAGENS DE FEEDBACK
function mostrarFeedback(tipo, mensagem) {
    if (tipo === 'success') {
        alertSuccess.textContent = mensagem;
        alertSuccess.classList.remove('d-none');
        alertError.classList.add('d-none');
        setTimeout(() => alertSuccess.classList.add('d-none'), 3000);
    } else {
        alertError.textContent = mensagem;
        alertError.classList.remove('d-none');
        alertSuccess.classList.add('d-none');
        setTimeout(() => alertError.classList.add('d-none'), 5000);
    }
}

// 9. LOGOUT E ENTRADA
if (logoutLink) {
    logoutLink.addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.clear();
        window.location.href = '../index.html';
    });
}

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    const auth = verificarAutenticacao();
    if (auth) {
        carregarTecnologias();
    }
});
