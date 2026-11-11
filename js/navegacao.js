/* =========================================================
   NAVEGAÇÃO ENTRE TELAS (MENU LATERAL)
========================================================= */

function configurarMenu() {
    const botoes = document.querySelectorAll(".menu-item");

    botoes.forEach(function (botao) {
        botao.addEventListener("click", function (evento) {
            evento.preventDefault();

            botoes.forEach(item => item.classList.remove("ativo"));
            botao.classList.add("ativo");

            abrirTela(botao.dataset.tela);
        });
    });
}


function abrirTela(nome) {
    document
        .querySelectorAll(".tela")
        .forEach(secao => secao.classList.remove("ativa"));

    const tela = campo("tela-" + nome);

    if (tela) {
        tela.classList.add("ativa");
    }

    /* O Leaflet precisa recalcular o tamanho quando o mapa volta a ficar visível. */
    if (nome === "calcular") {
        atualizarTamanhoMapa();
    }
}
