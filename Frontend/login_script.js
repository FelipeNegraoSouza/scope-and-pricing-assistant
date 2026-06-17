document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("login-form");
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const loginCard = document.querySelector(".login-card");
    const alertBox = document.getElementById("alert-error");
    const toggleContainer = document.getElementById("toggle-container");

    const API_BASE = "http://localhost:8000/api";
    let isRegisterMode = false;

    // Alternador de Formulário (Login <-> Cadastro)
    toggleContainer.addEventListener("click", (e) => {
        const target = e.target.closest("#btn-toggle");
        if (!target) return;
        e.preventDefault();

        isRegisterMode = !isRegisterMode;

        const btnToggle = document.getElementById("btn-toggle");
        const nameGroup = document.getElementById("name-group");
        const nomeInput = document.getElementById("nome");
        const formTitle = document.getElementById("form-title");
        const btnSubmitText = document.getElementById("btn-text");
        const btnSubmitIcon = document.getElementById("btn-icon");

        if (isRegisterMode) {
            formTitle.textContent = "Criar Nova Conta";
            nameGroup.style.display = "block";
            nomeInput.required = true;
            btnSubmitText.textContent = "Cadastrar";
            btnSubmitIcon.className = "fa-solid fa-user-plus me-2";
            btnToggle.textContent = "Entrar";
            toggleContainer.childNodes[0].nodeValue = "Já tem uma conta? ";
        } else {
            formTitle.textContent = "Entrar no Sistema";
            nameGroup.style.display = "none";
            nomeInput.required = false;
            nomeInput.value = "";
            btnSubmitText.textContent = "Entrar";
            btnSubmitIcon.className = "fa-solid fa-right-to-bracket me-2";
            btnToggle.textContent = "Cadastre-se";
            toggleContainer.childNodes[0].nodeValue = "Não tem uma conta? ";
        }
    });

    // Envio do formulário
    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();
        const nomeInput = document.getElementById("nome");
        const nome = nomeInput ? nomeInput.value.trim() : "";

        // Limpa estado anterior de erro
        alertBox.style.display = "none";
        loginCard.classList.remove("shake-animation");

        try {
            let url = `${API_BASE}/usuarios/login`;
            let payload = { email, senha: password };

            if (isRegisterMode) {
                url = `${API_BASE}/usuarios/registrar`;
                payload = { nome, email, senha: password };
            }

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.detail || "Erro de validação ou conexão.");
            }

            const user = await response.json();

            // Salva dados no localStorage
            localStorage.setItem("usuario_id", user.id);
            localStorage.setItem("usuario_nome", user.nome);
            localStorage.setItem("usuario_email", user.email);

            // Sucesso: Redireciona com animação suave de saída para o dashboard
            if (window.navigateTo) {
                window.navigateTo("./dashboard/index.html");
            } else {
                window.location.href = "./dashboard/index.html";
            }
        } catch (error) {
            // Falha: Ativa animações e mensagem de erro
            setTimeout(() => {
                alertBox.textContent = error.message;
                alertBox.style.display = "block";
                loginCard.classList.add("shake-animation");
            }, 50);
        }
    });

    // Remove a classe de animação após terminar para poder repetir se necessário
    loginCard.addEventListener("animationend", () => {
        loginCard.classList.remove("shake-animation");
    });
});
