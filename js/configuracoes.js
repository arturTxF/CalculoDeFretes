/* =========================================================
   CONFIGURAÇÕES GERAIS
   (as configurações de e-mail ficam em js/email/configuracao.js)
========================================================= */

/* O id de cada campo também é a chave usada no localStorage. */
const CAMPOS_CONFIGURACAO = ["nomeSistema", "taxaCombustivel", "valorKm"];

const PADROES = {
    nomeSistema: "FreteFácil",
    taxaCombustivel: 12,
    valorKm: 1.25
};


/* ---------- Leitura dos valores usados no sistema ---------- */

function nomeDoSistema() {
    return localStorage.getItem("nomeSistema") || PADROES.nomeSistema;
}

function valorKmConfigurado() {
    return Number(localStorage.getItem("valorKm")) || PADROES.valorKm;
}

function taxaCombustivelConfigurada() {
    return Number(localStorage.getItem("taxaCombustivel")) || PADROES.taxaCombustivel;
}


/* ---------- Formulário ---------- */

function salvarConfiguracoes() {
    CAMPOS_CONFIGURACAO.forEach(function (id) {
        localStorage.setItem(id, campo(id).value);
    });

    alert("Configurações salvas!");
}


function carregarConfiguracoes() {
    CAMPOS_CONFIGURACAO.forEach(function (id) {
        const valor = localStorage.getItem(id);

        if (valor) {
            campo(id).value = valor;
        }
    });
}
