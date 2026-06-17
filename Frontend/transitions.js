// Função global para navegação animada (programática)
window.navigateTo = function(url) {
    document.body.classList.add("page-exiting");
    setTimeout(() => {
        window.location.href = url;
    }, 300);
};

document.addEventListener("DOMContentLoaded", () => {
    // Efeito de entrada fade-in e slide-up
    document.body.classList.add("page-loaded");

    // Intercepta cliques em links locais (âncoras <a>) para aplicar transição de saída
    document.addEventListener("click", (e) => {
        const target = e.target.closest("a");
        if (target) {
            const href = target.getAttribute("href");
            if (href) {
                const isExternal = target.target === "_blank" || href.startsWith("http") && !href.includes(window.location.hostname);
                const isSpecial = href.startsWith("#") || href.startsWith("javascript:") || href.startsWith("mailto:") || href.startsWith("tel:");
                
                if (!isExternal && !isSpecial) {
                    e.preventDefault();
                    window.navigateTo(href);
                }
            }
        }
    });
});
