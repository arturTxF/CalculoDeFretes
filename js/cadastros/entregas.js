/* =========================================================
   CADASTRO E ACOMPANHAMENTO DE ENTREGAS
========================================================= */

const STATUS_ENTREGA = ["Em preparação", "Em trânsito", "Entregue"];

const CAMPOS_ENTREGA = ["entregaOrigem", "entregaDestino", "motoristaEntrega", "previsaoEntrega"];


function adicionarEntrega() {
    const nova = {
        id: Date.now(),
        origem: valorDoCampo("entregaOrigem"),
        destino: valorDoCampo("entregaDestino"),
        motorista: valorDoCampo("motoristaEntrega"),
        previsao: campo("previsaoEntrega").value,
        status: STATUS_ENTREGA[0]
    };

    if (!nova.origem || !nova.destino) {
        alert("Informe a origem e o destino.");
        return;
    }

    entregas.adicionar(nova);
    carregarEntregas();
    limparCampos(CAMPOS_ENTREGA);

    alert("Entrega cadastrada!");
}


function alterarStatusEntrega(id, status) {
    const entrega = entregas.buscar(id);

    if (entrega) {
        entrega.status = status;
        entregas.salvar();
    }

    carregarEntregas();
}


function excluirEntrega(id) {
    if (!confirm("Deseja excluir esta entrega?")) {
        return;
    }

    entregas.remover(id);
    carregarEntregas();
}


function carregarEntregas() {
    renderizarLista(
        "listaEntregas",
        entregas.itens,
        "Nenhuma entrega cadastrada.",
        item => `
            <div class="item-lista">
                <div class="item-info">
                    <strong>📍 ${escapar(item.origem)} → ${escapar(item.destino)}</strong>
                    <span>
                        Motorista: ${escapar(item.motorista) || "Não informado"}
                        • Previsão: ${item.previsao ? formatarData(item.previsao) : "Não informada"}
                    </span>
                </div>

                <div class="item-acoes">
                    <select onchange="alterarStatusEntrega(${item.id}, this.value)">
                        ${opcoesDeStatus(item.status)}
                    </select>

                    <button class="btn-excluir" onclick="excluirEntrega(${item.id})">
                        🗑️
                    </button>
                </div>
            </div>
        `
    );
}


function opcoesDeStatus(statusAtual) {
    return STATUS_ENTREGA.map(status => `
        <option ${status === statusAtual ? "selected" : ""}>${status}</option>
    `).join("");
}
