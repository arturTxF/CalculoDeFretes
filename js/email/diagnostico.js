/* =========================================================
   E-MAIL — DIAGNÓSTICO DE PROBLEMAS NO ENVIO
   Autor: Pedro Ivanoff
========================================================= */

/* Verificações feitas antes de chamar o EmailJS.
   A primeira que falhar explica por que o envio não é possível. */
const VERIFICACOES_ENVIO = [
    {
        falhou: config =>
            !config.publicKey || !config.serviceId || !config.templateId,
        motivo: () =>
            "Preencha a Public Key, o Service ID e o Template ID em Configurações."
    },
    {
        falhou: () => typeof emailjs === "undefined",
        motivo: () =>
            "A biblioteca do EmailJS não foi carregada. Verifique a conexão com a internet ou se algum bloqueador está ativo."
    },
    {
        falhou: () => location.protocol === "file:",
        motivo: () =>
            "A página está aberta como arquivo local (file://). O EmailJS exige um endereço http. Use o Live Server do VS Code ou rode: python -m http.server"
    },
    {
        falhou: config => !/^service_/.test(config.serviceId),
        motivo: config =>
            "O Service ID deve começar com service_ e o valor informado foi \"" +
            config.serviceId +
            "\".\n\nConfira se ele não foi colado no campo errado."
    },
    {
        falhou: config => !/^template_/.test(config.templateId),
        motivo: config =>
            "O Template ID deve começar com template_ e o valor informado foi \"" +
            config.templateId +
            "\".\n\nConfira se ele não foi colado no campo errado."
    },
    {
        falhou: config => /^(service|template)_/.test(config.publicKey),
        motivo: config =>
            "O campo Public Key está com \"" +
            config.publicKey +
            "\", que é um ID de serviço ou template.\n\nA Public Key fica em Account > General no painel do EmailJS."
    }
];


function problemaNaConfiguracao(config) {
    const verificacao = VERIFICACOES_ENVIO.find(item => item.falhou(config));

    return verificacao ? verificacao.motivo(config) : null;
}


/* A causa vem do texto da resposta, não do código HTTP:
   o EmailJS usa 400 para vários problemas diferentes. */
const DIAGNOSTICOS_EMAIL = [
    {
        padrao: /recipient|to.?email|address is empty/i,
        causa:
            "O EmailJS recebeu o pedido sem destinatário.\n\n" +
            "Abra o template no painel, aba Settings, e confirme que o campo \"To Email\" contém exatamente {{to_email}} (sem espaços dentro das chaves). Depois clique em Save.\n\n" +
            "Confira também se o Template ID salvo aqui é o mesmo template que você editou."
    },
    {
        padrao: /dynamic variable|corrupted/i,
        causa:
            "O template usa uma variável que não está sendo enviada.\n\n" +
            "Use apenas estas no template: {{to_email}}, {{to_name}}, {{reply_to}}, {{subject}} e {{message}}."
    },
    {
        padrao: /account not found/i,
        causa:
            "A Public Key não corresponde a nenhuma conta.\n\n" +
            "Copie novamente em Account > General. Se você tiver mais de uma conta ou equipe no EmailJS, use a da conta onde o serviço e o template foram criados."
    },
    {
        padrao: /public key|user.?id|invalid.*key/i,
        causa:
            "Public Key recusada.\n\n" +
            "Copie novamente em Account > General no painel do EmailJS."
    },
    {
        padrao: /origin|cors|not allowed|blocked/i,
        causa: () =>
            "O endereço desta página não está autorizado.\n\n" +
            "No painel, em Account > Security, adicione " +
            location.origin +
            " à lista de origens permitidas — ou desative a restrição."
    },
    {
        padrao: /service/i,
        causa:
            "Service ID não encontrado.\n\n" +
            "No painel, abra Email Services: o código do serviço aparece na coluna Service ID e começa com service_.\n\n" +
            "Confirme também que o serviço está conectado (status Connected)."
    },
    {
        padrao: /template/i,
        causa:
            "Template ID não encontrado.\n\n" +
            "No painel, abra Email Templates: o código começa com template_ e aparece na lista e na aba Settings do template.\n\n" +
            "Se você acabou de criar o template, confirme que clicou em Save."
    },
    {
        padrao: /insufficient|quota|limit|too many/i,
        causa: "Limite de envios do plano atingido."
    },
    {
        padrao: /grant|auth|smtp|gmail|outlook/i,
        causa:
            "O EmailJS não conseguiu acessar a conta de e-mail conectada.\n\n" +
            "Abra Email Services no painel e reconecte o serviço."
    }
];

const ACESSO_RECUSADO =
    "Acesso recusado pelo EmailJS.\n\n" +
    "Verifique a Public Key e a lista de origens permitidas em Account > Security.";

const LIMITE_ATINGIDO = "Limite de envios do plano atingido.";

/* Usados quando o texto da resposta não identifica a causa. */
const DIAGNOSTICOS_POR_STATUS = {
    401: ACESSO_RECUSADO,
    403: ACESSO_RECUSADO,
    404:
        "Service ID ou Template ID não encontrado.\n\n" +
        "Confira os dois códigos no painel do EmailJS e veja se cada um foi colado no campo certo.",
    412:
        "O EmailJS não conseguiu acessar a conta de e-mail conectada.\n\n" +
        "Abra Email Services no painel e reconecte o serviço.",
    418: LIMITE_ATINGIDO,
    429: LIMITE_ATINGIDO
};


function explicarErroEmail(erro) {
    const status = erro && erro.status;
    const texto = String((erro && (erro.text || erro.message)) || erro);

    const detalhe =
        "Resposta do EmailJS: " +
        (status ? status + " - " : "") +
        texto;

    const diagnostico = DIAGNOSTICOS_EMAIL.find(item => item.padrao.test(texto));

    const causa = diagnostico
        ? diagnostico.causa
        : DIAGNOSTICOS_POR_STATUS[status];

    if (!causa) {
        return detalhe;
    }

    return (typeof causa === "function" ? causa() : causa) + "\n\n" + detalhe;
}
