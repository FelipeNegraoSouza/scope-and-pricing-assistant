document.getElementById('btn-print').addEventListener('click', () => { window.print(); });
document.getElementById('btn-aprovar').addEventListener('click', () => {
    if (confirm("Deseja aprovar este escopo formalmente?")) {
        const btn = document.getElementById('btn-aprovar');
        btn.className = "btn btn-secondary disabled";
        btn.innerHTML = "<i class='fa-solid fa-check text-success me-2'></i> Proposta Aprovada!";
        alert("Sucesso! Registro atualizado no sistema.");
    }
});
