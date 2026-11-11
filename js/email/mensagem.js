/* =========================================================
   E-MAIL — TEXTO DO ORÇAMENTO
   Autor: Pedro Ivanoff
========================================================= */

const VALIDADE_ORCAMENTO_DIAS = 7;


function assuntoOrcamento(orcamento) {
    return "Orçamento de frete " + orcamento.origem + " → " + orcamento.destino;
}


function montarMensagemOrcamento(orcamento) {
    const remetente = configuracoesEmail().remetente;

    const linhas = [
        "Olá, " + orcamento.clienteNome + "!",
        "",
        "Segue o orçamento de frete solicitado:",
        "",
        "Número do orçamento: " + orcamento.id,
        "Data: " + orcamento.data,
        "Origem: " + orcamento.origem,
        "Destino: " + orcamento.destino,
        "Distância: " + distanciaEscrita(orcamento.distancia),
        "Veículo: " + (orcamento.veiculo || "não informado"),
        "Tipo de entrega: " + (orcamento.urgencia || "normal"),
        "Peso da carga: " + pesoEscrito(orcamento.peso),
        "",
        "VALOR TOTAL: " + dinheiro(orcamento.valor),
        "",
        "Orçamento válido por " + VALIDADE_ORCAMENTO_DIAS + " dias.",
        "",
        "Atenciosamente,",
        nomeDoSistema()
    ];

    if (remetente) {
        linhas.push(remetente);
    }

    return linhas.join("\n");
}


function distanciaEscrita(distancia) {
    return distancia ? distancia.toFixed(0) + " km" : "não informada";
}


function pesoEscrito(peso) {
    return peso ? peso + " kg" : "não informado";
}


/* Um mesmo valor é enviado com vários nomes porque cada template
   do EmailJS pode usar um deles no campo "To Email". */
function parametrosEmail(destino, nome, assunto, mensagem, resposta) {
    return {
        to_email: destino,
        email: destino,
        user_email: destino,
        recipient: destino,

        to_name: nome,
        user_name: nome,
        name: nome,

        reply_to: resposta || destino,
        from_name: nomeDoSistema(),

        subject: assunto,
        title: assunto,

        message: mensagem,
        content: mensagem
    };
}
