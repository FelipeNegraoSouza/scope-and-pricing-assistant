// Array global que vai guardar as tecnologias adicionadas pelo usuário
let tecnologias = [];

// Elementos do DOM mapeados
const inputTech = document.getElementById('input-tech');
const btnAddTech = document.getElementById('btn-add-tech');
const containerTags = document.getElementById('tech-tags-container');
const formBriefing = document.getElementById('form-briefing');
const btnSubmit = document.getElementById('btn-submit');
const btnText = document.getElementById('btn-text');
const btnSpinner = document.getElementById('btn-spinner');

// 1. FUNÇÃO PARA ADICIONAR E RENDERIZAR AS TAGS DE TECNOLOGIA
function atualizarTags() {
    containerTags.innerHTML = ''; // Limpa o container para re-renderizar
    
    tecnologias.forEach((tech, index) => {
        const tag = document.createElement('span');
        tag.className = 'tech-tag animate__animated animate__fadeIn';
        tag.innerHTML = `
            ${tech} 
            <i class="fa-solid fa-xmark" onclick="removerTech(${index})"></i>
        `;
        containerTags.appendChild(tag);
    });
}

// Escuta o clique no botão "+" de tecnologia
btnAddTech.addEventListener('click', () => {
    const valor = inputTech.value.trim();
    if (valor && !tecnologias.includes(valor)) {
        tecnologias.push(valor);
        inputTech.value = ''; // Limpa o input
        atualizarTags();      // Atualiza a tela
    }
});

// Permite adicionar tecnologia apertando "Enter" dentro do input
inputTech.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault(); // Evita que o formulário seja enviado ao dar Enter aqui
        btnAddTech.click();
    }
});

// Função global para deletar uma tag (chamada pelo 'onclick' do ícone X)
window.removerTech = function(index) {
    tecnologias.splice(index, 1);
    atualizarTags();
};

// 2. INTERCEPTANDO O ENVIO DO FORMULÁRIO (CONEXÃO COM BACKEND)
formBriefing.addEventListener('submit', async function(e) {
    e.preventDefault(); // Evita que a página recarregue

    // Captura os dados dos inputs textuais
    const dadosBriefing = {
        cliente: document.getElementById('cliente').value,
        projeto: document.getElementById('projeto').value,
        descricao: document.getElementById('descricao').value,
        stack: tecnologias // Envia o array de strings criado pelo usuário
    };

    console.log("Dados enviados para a API FastAPI:", dadosBriefing);

    // EFEITO VISUAL: Ativa o estado de carregamento do botão (Loading)
    btnText.textContent = "Processando com Inteligência Artificial...";
    btnSubmit.disabled = true;
    btnSpinner.classList.remove('d-none');

    try {
        const response = await fetch('http://localhost:8000/api/briefing', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dadosBriefing)
        });

        if (!response.ok) {
            throw new Error("Falha ao gerar escopo com a IA.");
        }

        const resultado = await response.json();
        
        // Redireciona o desenvolvedor para a tela de edição passando o ID do escopo gerado
        const url = `../edicao/index.html?id=${resultado.id}`;
        if (window.navigateTo) {
            window.navigateTo(url);
        } else {
            window.location.href = url;
        }

    } catch (error) {
        console.error("Erro ao gerar escopo:", error);
        alert("Erro ao comunicar com a IA. Por favor, verifique se o backend está ativo.");
        
        // Restaura o botão em caso de erro
        btnText.textContent = "Gerar Escopo com IA";
        btnSubmit.disabled = false;
        btnSpinner.classList.add('d-none');
    }
});