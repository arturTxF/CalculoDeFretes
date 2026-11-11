/* =========================================================
   CADASTRO DE VEÍCULOS
========================================================= */

function adicionarVeiculo() {
    const novo = {
        id: Date.now(),
        modelo: valorDoCampo("modeloVeiculo"),
        placa: valorDoCampo("placaVeiculo"),
        tipo: campo("tipoVeiculo").value,
        capacidade: campo("capacidadeVeiculo").value
    };

    if (!novo.modelo || !novo.placa) {
        alert("Informe o modelo e a placa.");
        return;
    }

    veiculos.adicionar(novo);
    carregarVeiculos();
    limparCampos(["modeloVeiculo", "placaVeiculo", "capacidadeVeiculo"]);

    alert("Veículo cadastrado!");
}


function excluirVeiculo(id) {
    if (!confirm("Deseja excluir este veículo?")) {
        return;
    }

    veiculos.remover(id);
    carregarVeiculos();
}


function carregarVeiculos() {
    renderizarLista(
        "listaVeiculos",
        veiculos.itens,
        "Nenhum veículo cadastrado.",
        item => `
            <div class="item-lista">
                <div class="item-info">
                    <strong>🚚 ${escapar(item.modelo)}</strong>
                    <span>
                        Placa: ${escapar(item.placa)}
                        • ${escapar(item.tipo)}
                        • Capacidade: ${escapar(item.capacidade) || "--"} kg
                    </span>
                </div>

                <div class="item-acoes">
                    <button class="btn-excluir" onclick="excluirVeiculo(${item.id})">
                        🗑️ Excluir
                    </button>
                </div>
            </div>
        `
    );
}
