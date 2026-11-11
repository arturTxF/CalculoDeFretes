/* =========================================================
   FRETEFÁCIL
   Sistema em HTML + CSS + JavaScript

   Ponto de entrada: inicializa as telas e liga os eventos.
   Deve ser o último script carregado no index.html.
========================================================= */

document.addEventListener("DOMContentLoaded", function () {
    escreverTexto("dataAtual", dataDeHoje());

    iniciarMapa();
    configurarMenu();

    carregarListas();
    carregarConfiguracoes();
    carregarConfiguracoesEmail();

    campo("btnCalcular").addEventListener("click", calcularFrete);
    campo("clienteFrete").addEventListener("change", mostrarEmailCliente);
});


function carregarListas() {
    carregarClientes();
    carregarHistorico();
    carregarOrcamentos();
    carregarTransportadoras();
    carregarVeiculos();
    carregarEntregas();
}


function apagarDados() {
    if (
        !confirm(
            "ATENÇÃO!\n\nIsso vai apagar histórico, orçamentos, clientes, transportadoras, veículos e entregas.\n\nDeseja continuar?"
        )
    ) {
        return;
    }

    localStorage.clear();

    TODAS_AS_COLECOES.forEach(colecao => colecao.recarregar());

    cancelarEdicaoCliente();

    carregarListas();
    carregarConfiguracoes();
    carregarConfiguracoesEmail();

    alert("Todos os dados foram apagados.");
}
