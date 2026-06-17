document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("login-form");
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const loginCard = document.querySelector(".login-card");
    const alertBox = document.getElementById("alert-error");

    loginForm.addEventListener("submit", (e) => {
        e.preventDefault();

        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();

        // Limpa estado anterior de erro
        alertBox.style.display = "none";
        loginCard.classList.remove("shake-animation");

        // Credenciais do usuário padrão criadas no banco de dados (semente)
        const DEFAULT_EMAIL = "felipe.ngsouza@gmail.com";
        const DEFAULT_PASSWORD = "admin";

        if (email === DEFAULT_EMAIL && password === DEFAULT_PASSWORD) {
            // Sucesso: Redireciona com animação suave de saída para o dashboard
            if (window.navigateTo) {
                window.navigateTo("./dashboard/index.html");
            } else {
                window.location.href = "./dashboard/index.html";
            }
        } else {
            // Falha: Ativa animações e mensagem de erro
            setTimeout(() => {
                alertBox.textContent = "Credenciais inválidas. Verifique os dados inseridos.";
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
