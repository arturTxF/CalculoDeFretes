/* =========================================================
   E-MAIL — ENVIO DO ORÇAMENTO E TESTE DE ENVIO
   Autor: Pedro Ivanoff
========================================================= */

const SITUACAO_ENVIADO = "Enviado";
const SITUACAO_PROGRAMA_EMAIL = "Aberto no programa de e-mail";


/* Envia pelo EmailJS usando a configuração salva. */
function enviarPeloEmailJS(config, parametros) {
    return emailjs.send(
        config.serviceId,
        config.templateId,
        parametros,
        { publicKey: config.publicKey }
    );
}


/* ---------- Orçamento ---------- */

/* manual = true quando o usuário clicou em "Enviar"
   (mostra alertas; no envio automático fica silencioso). */
async function enviarEmailOrcamento(orcamento, manual) {
    if (!orcamento.clienteEmail) {
        if (manual) {
            alert(
                "Este orçamento não possui cliente com e-mail.\n\n" +
                "Selecione um cliente na tela de cálculo antes de gerar o orçamento."
            );
        }

        return false;
    }

    const config = configuracoesEmail();
    const assunto = assuntoOrcamento(orcamento);
    const mensagem = montarMensagemOrcamento(orcamento);

    const problema = problemaNaConfiguracao(config);

    if (problema) {
        if (manual) {
            alert(
                "Envio automático indisponível.\n\n" +
                problema +
                "\n\nO programa de e-mail será aberto com a mensagem pronta."
            );
        }

        usarProgramaEmail(orcamento, assunto, mensagem);
        return true;
    }

    try {
        await enviarPeloEmailJS(
            config,
            parametrosEmail(
                orcamento.clienteEmail,
                orcamento.clienteNome,
                assunto,
                mensagem,
                config.remetente
            )
        );

        marcarOrcamentoEnviado(orcamento.id, SITUACAO_ENVIADO);

        if (manual) {
            alert("Orçamento enviado para " + orcamento.clienteEmail);
        }

        return true;

    } catch (erro) {
        console.error("Falha no envio pelo EmailJS:", erro);

        alert(
            "Não foi possível enviar o e-mail.\n\n" +
            explicarErroEmail(erro) +
            "\n\nO programa de e-mail será aberto com a mensagem pronta."
        );

        usarProgramaEmail(orcamento, assunto, mensagem);
        return false;
    }
}


function reenviarOrcamento(id) {
    const orcamento = orcamentos.buscar(id);

    if (orcamento) {
        enviarEmailOrcamento(orcamento, true);
    }
}


function marcarOrcamentoEnviado(id, situacao) {
    const orcamento = orcamentos.buscar(id);

    if (!orcamento) {
        return;
    }

    orcamento.emailEnviado = situacao;
    orcamento.status = "Enviado ao cliente";

    orcamentos.salvar();
    carregarOrcamentos();
}


/* ---------- Alternativa: programa de e-mail (mailto) ---------- */

function usarProgramaEmail(orcamento, assunto, mensagem) {
    abrirProgramaEmail(orcamento.clienteEmail, assunto, mensagem);
    marcarOrcamentoEnviado(orcamento.id, SITUACAO_PROGRAMA_EMAIL);
}


function abrirProgramaEmail(destinatario, assunto, mensagem) {
    window.location.href =
        "mailto:" + encodeURIComponent(destinatario) +
        "?subject=" + encodeURIComponent(assunto) +
        "&body=" + encodeURIComponent(mensagem);
}


/* ---------- Teste de envio ---------- */

async function enviarEmailTeste() {
    const destino = valorDoCampo(CAMPOS_EMAIL.remetente);

    if (!emailValido(destino)) {
        alert(
            "Preencha o campo \"E-mail da empresa\" com um endereço válido.\n\n" +
            "O teste será enviado para ele."
        );
        return;
    }

    if (!confirm("Um e-mail de teste será enviado para:\n\n" + destino + "\n\nDeseja continuar?")) {
        return;
    }

    salvarConfiguracoesEmail(true);

    const config = configuracoesEmail();
    const problema = problemaNaConfiguracao(config);

    if (problema) {
        alert("Não é possível testar o envio.\n\n" + problema);
        return;
    }

    try {
        await enviarPeloEmailJS(
            config,
            parametrosEmail(
                destino,
                "Equipe " + nomeDoSistema(),
                "Teste de envio - FreteFácil",
                "Este é um e-mail de teste do sistema FreteFácil.\n\n" +
                "Se você recebeu esta mensagem, o envio de orçamentos está configurado corretamente.",
                destino
            )
        );

        alert("Teste enviado para " + destino + "\n\nVerifique a caixa de entrada e o spam.");

    } catch (erro) {
        console.error("Falha no teste de envio:", erro);

        console.log(
            "Variáveis enviadas ao template:",
            Object.keys(parametrosEmail(destino, "", "", "", destino)).join(", ")
        );

        alert("O teste falhou.\n\n" + explicarErroEmail(erro));
    }
}
