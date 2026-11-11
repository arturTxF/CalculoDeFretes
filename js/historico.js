/* =========================================================
   HISTÓRICO DE COTAÇÕES
========================================================= */

function carregarHistorico() {
    renderizarLista(
        "listaHistorico",
        historico.itens,
        "Nenhuma cotação realizada ainda.",
        item => `
            <div class="historico-item">
                <div class="historico-topo">
                    <strong>${escapar(item.origem)} → ${escapar(item.destino)}</strong>
                    <strong>${dinheiro(item.valor)}</strong>
                </div>

                <div class="historico-detalhes">
                    <span>📅 ${escapar(item.data)}</span>
                    <span>📍 ${item.distancia.toFixed(0)} km</span>
                    <span>👤 ${escapar(item.clienteNome) || "Sem cliente"}</span>
                </div>
            </div>
        `
    );
}


function limparHistorico() {
    if (!confirm("Deseja apagar todo o histórico?")) {
        return;
    }

    historico.esvaziar();
    carregarHistorico();
}
