/* =========================================================
   CADASTRO DE TRANSPORTADORAS
========================================================= */

const CAMPOS_TRANSPORTADORA = {
    nome: "nomeTransportadora",
    cnpj: "cnpjTransportadora",
    telefone: "telefoneTransportadora",
    cidade: "cidadeTransportadora"
};


function adicionarTransportadora() {
    const nova = { id: Date.now() };

    Object.entries(CAMPOS_TRANSPORTADORA).forEach(function ([propriedade, id]) {
        nova[propriedade] = valorDoCampo(id);
    });

    if (!nova.nome) {
        alert("Informe o nome da transportadora.");
        return;
    }

    transportadoras.adicionar(nova);
    carregarTransportadoras();
    limparCampos(Object.values(CAMPOS_TRANSPORTADORA));

    alert("Transportadora cadastrada!");
}


function excluirTransportadora(id) {
    if (!confirm("Deseja excluir esta transportadora?")) {
        return;
    }

    transportadoras.remover(id);
    carregarTransportadoras();
}


function carregarTransportadoras() {
    renderizarLista(
        "listaTransportadoras",
        transportadoras.itens,
        "Nenhuma transportadora cadastrada.",
        item => `
            <div class="item-lista">
                <div class="item-info">
                    <strong>🚛 ${escapar(item.nome)}</strong>
                    <span>
                        ${escapar(item.cidade) || "Cidade não informada"}
                        • ${escapar(item.telefone) || "Telefone não informado"}
                    </span>
                </div>

                <div class="item-acoes">
                    <button class="btn-excluir" onclick="excluirTransportadora(${item.id})">
                        🗑️ Excluir
                    </button>
                </div>
            </div>
        `
    );
}
