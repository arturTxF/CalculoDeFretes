/* =========================================================
   E-MAIL — CONFIGURAÇÕES DO EMAILJS
   Autor: Pedro Ivanoff
========================================================= */

/* Propriedade da configuração -> id do campo no formulário.
   O mesmo nome é usado como chave no localStorage. */
const CAMPOS_EMAIL = {
    remetente: "emailRemetente",
    publicKey: "emailjsPublicKey",
    serviceId: "emailjsServiceId",
    templateId: "emailjsTemplateId"
};

const CAMPO_ENVIO_AUTOMATICO = "envioAutomatico";


function configuracoesEmail() {
    const config = {
        automatico: localStorage.getItem(CAMPO_ENVIO_AUTOMATICO) !== "nao"
    };

    Object.entries(CAMPOS_EMAIL).forEach(function ([propriedade, id]) {
        config[propriedade] = localStorage.getItem(id) || "";
    });

    return config;
}


function salvarConfiguracoesEmail(silencioso) {
    const remetente = valorDoCampo(CAMPOS_EMAIL.remetente);

    if (remetente && !emailValido(remetente)) {
        alert("Informe um e-mail válido para a empresa.");
        return false;
    }

    localStorage.setItem(
        CAMPO_ENVIO_AUTOMATICO,
        campo(CAMPO_ENVIO_AUTOMATICO).checked ? "sim" : "nao"
    );

    Object.values(CAMPOS_EMAIL).forEach(function (id) {
        localStorage.setItem(id, valorDoCampo(id));
    });

    if (!silencioso) {
        alert("Configurações de e-mail salvas!");
    }

    return true;
}


function carregarConfiguracoesEmail() {
    const config = configuracoesEmail();

    campo(CAMPO_ENVIO_AUTOMATICO).checked = config.automatico;

    Object.entries(CAMPOS_EMAIL).forEach(function ([propriedade, id]) {
        campo(id).value = config[propriedade];
    });
}
