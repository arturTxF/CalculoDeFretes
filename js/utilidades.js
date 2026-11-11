/* =========================================================
   UTILITÁRIOS
   Funções genéricas usadas por todo o sistema.
========================================================= */


/* ---------- DOM ---------- */

function campo(id) {
    return document.getElementById(id);
}

function valorDoCampo(id) {
    return campo(id).value.trim();
}

function textoSelecionado(id) {
    return campo(id).selectedOptions[0].text.trim();
}

function escreverTexto(id, texto) {
    campo(id).innerText = texto;
}

function limparCampos(ids) {
    ids.forEach(function (id) {
        campo(id).value = "";
    });
}

/* Preenche uma lista com o HTML de cada item, ou mostra a mensagem de vazio. */
function renderizarLista(idLista, itens, textoVazio, montarItem) {
    campo(idLista).innerHTML = itens.length
        ? itens.map(montarItem).join("")
        : `<div class="vazio">${textoVazio}</div>`;
}


/* ---------- Texto ---------- */

function escapar(texto) {
    return String(texto || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function emailValido(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(email).trim());
}


/* ---------- Formatação ---------- */

function dinheiro(valor) {
    return valor.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}

function dataDeHoje() {
    return new Date().toLocaleDateString("pt-BR");
}

/* AAAA-MM-DD -> DD/MM/AAAA */
function formatarData(data) {
    if (!data) {
        return "--";
    }

    const partes = data.split("-");

    if (partes.length !== 3) {
        return data;
    }

    const [ano, mes, dia] = partes;

    return `${dia}/${mes}/${ano}`;
}

function formatarTempo(minutos) {
    const horas = Math.floor(minutos / 60);
    const minutosRestantes = minutos % 60;

    if (horas === 0) {
        return minutosRestantes + " min";
    }

    return horas + "h " + minutosRestantes + "min";
}


/* ---------- Assíncrono ---------- */

function esperar(milissegundos) {
    return new Promise(resolve => setTimeout(resolve, milissegundos));
}
