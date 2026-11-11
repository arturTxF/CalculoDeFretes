/* =========================================================
   ORÇAMENTOS
   (o envio por e-mail fica em js/email/envio.js)
========================================================= */

function carregarOrcamentos() {
    renderizarLista(
        "listaOrcamentos",
        orcamentos.itens,
        "Nenhum orçamento criado.",
        item => `
            <div class="item-lista">
                <div class="item-info">
                    <strong>📄 ${escapar(item.origem)} → ${escapar(item.destino)}</strong>
                    <span>
                        Criado em ${escapar(item.data)}
                        • Status: ${escapar(item.status)}
                    </span>
                    <span>
                        👤 ${escapar(item.clienteNome) || "Sem cliente"}
                        • ✉️ ${escapar(item.clienteEmail) || "Sem e-mail"}
                        • ${escapar(item.emailEnviado) || "Não enviado"}
                    </span>
                </div>

                <div class="item-acoes">
                    <strong class="preco">${dinheiro(item.valor)}</strong>

                    <button
                        class="btn-secundario"
                        onclick="reenviarOrcamento(${item.id})"
                        ${item.clienteEmail ? "" : "disabled"}
                    >
                        ✉️ Enviar
                    </button>

                    <button class="btn-excluir" onclick="excluirOrcamento(${item.id})">
                        🗑️
                    </button>
                </div>
            </div>
        `
    );
}


function excluirOrcamento(id) {
    if (!confirm("Deseja excluir este orçamento?")) {
        return;
    }

    orcamentos.remover(id);
    carregarOrcamentos();
}
