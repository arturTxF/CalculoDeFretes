/* =========================================================
   FRETEFÁCIL
   Sistema em HTML + CSS + JavaScript
========================================================= */


/* =========================================================
   VARIÁVEIS
========================================================= */

let mapa;
let marcadorOrigem;
let marcadorDestino;
let linhaRota;

let historico =
    JSON.parse(localStorage.getItem("historicoFretes")) || [];

let orcamentos =
    JSON.parse(localStorage.getItem("orcamentosFretes")) || [];

let transportadoras =
    JSON.parse(localStorage.getItem("transportadoras")) || [];

let veiculos =
    JSON.parse(localStorage.getItem("veiculos")) || [];

let entregas =
    JSON.parse(localStorage.getItem("entregas")) || [];


/* =========================================================
   INICIALIZAÇÃO
========================================================= */

document.addEventListener("DOMContentLoaded", function () {

    document.getElementById("dataAtual").innerText =
        new Date().toLocaleDateString("pt-BR");


    iniciarMapa();

    configurarMenu();

    carregarListas();

    carregarConfiguracoes();

});


/* =========================================================
   MENU
========================================================= */

function configurarMenu() {

    const botoes =
        document.querySelectorAll(".menu-item");


    botoes.forEach(function (botao) {

        botao.addEventListener("click", function (evento) {

            evento.preventDefault();


            const tela =
                botao.dataset.tela;


            botoes.forEach(function (item) {

                item.classList.remove("ativo");

            });


            botao.classList.add("ativo");


            document
                .querySelectorAll(".tela")
                .forEach(function (secao) {

                    secao.classList.remove("ativa");

                });


            const telaSelecionada =
                document.getElementById(
                    "tela-" + tela
                );


            if (telaSelecionada) {

                telaSelecionada.classList.add("ativa");

            }


            if (tela === "calcular" && mapa) {

                setTimeout(function () {

                    mapa.invalidateSize();

                }, 100);

            }

        });

    });

}


/* =========================================================
   MAPA
========================================================= */

function iniciarMapa() {

    mapa = L.map("map").setView(
        [-14.235, -51.925],
        4
    );


    L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {

            maxZoom: 19,

            attribution:
                "&copy; OpenStreetMap contributors"

        }
    ).addTo(mapa);

}


/* =========================================================
   DINHEIRO
========================================================= */

function dinheiro(valor) {

    return valor.toLocaleString(
        "pt-BR",
        {
            style: "currency",
            currency: "BRL"
        }
    );

}


/* =========================================================
   COORDENADAS
========================================================= */

async function buscarCoordenadas(endereco) {

    const url =
        "https://nominatim.openstreetmap.org/search?" +

        new URLSearchParams({

            q: endereco,

            format: "json",

            limit: 1,

            countrycodes: "br",

            "accept-language": "pt-BR"

        });


    const resposta =
        await fetch(url);


    if (!resposta.ok) {

        throw new Error(
            "Não foi possível localizar o endereço."
        );

    }


    const dados =
        await resposta.json();


    if (dados.length === 0) {

        throw new Error(
            "Endereço não encontrado: " +
            endereco
        );

    }


    return {

        lat: Number(dados[0].lat),

        lon: Number(dados[0].lon),

        nome: dados[0].display_name

    };

}


/* =========================================================
   ROTA
========================================================= */

async function buscarRota(
    origem,
    destino
) {

    const coordenadas =

        `${origem.lon},${origem.lat};` +
        `${destino.lon},${destino.lat}`;


    const url =

        "https://router.project-osrm.org/route/v1/driving/" +

        coordenadas +

        "?overview=full&geometries=geojson";


    const resposta =
        await fetch(url);


    if (!resposta.ok) {

        throw new Error(
            "Erro ao calcular a rota."
        );

    }


    const dados =
        await resposta.json();


    if (
        dados.code !== "Ok" ||
        !dados.routes.length
    ) {

        throw new Error(
            "Não foi possível encontrar uma rota."
        );

    }


    return dados.routes[0];

}


/* =========================================================
   MOSTRAR ROTA
========================================================= */

function mostrarRota(
    origem,
    destino,
    rota
) {

    if (marcadorOrigem) {

        mapa.removeLayer(
            marcadorOrigem
        );

    }


    if (marcadorDestino) {

        mapa.removeLayer(
            marcadorDestino
        );

    }


    if (linhaRota) {

        mapa.removeLayer(
            linhaRota
        );

    }


    marcadorOrigem =

        L.marker([
            origem.lat,
            origem.lon
        ])

        .addTo(mapa)

        .bindPopup(
            "<b>Origem</b><br>" +
            origem.nome
        );


    marcadorDestino =

        L.marker([
            destino.lat,
            destino.lon
        ])

        .addTo(mapa)

        .bindPopup(
            "<b>Destino</b><br>" +
            destino.nome
        );


    linhaRota =

        L.geoJSON(
            rota.geometry,
            {

                style: {

                    color: "#078d4b",

                    weight: 5

                }

            }

        ).addTo(mapa);


    mapa.fitBounds(
        linhaRota.getBounds(),
        {
            padding: [15, 15]
        }
    );

}


/* =========================================================
   CALCULAR FRETE
========================================================= */

async function calcularFrete() {

    const botao =
        document.getElementById(
            "btnCalcular"
        );


    const status =
        document.getElementById(
            "statusMapa"
        );


    const origemTexto =
        document.getElementById(
            "origem"
        ).value.trim();


    const destinoTexto =
        document.getElementById(
            "destino"
        ).value.trim();


    if (
        !origemTexto ||
        !destinoTexto
    ) {

        alert(
            "Informe a origem e o destino."
        );

        return;

    }


    botao.disabled = true;

    botao.innerText =
        "⏳ CALCULANDO...";


    status.innerText =
        "Localizando endereços...";


    try {

        const origem =
            await buscarCoordenadas(
                origemTexto
            );


        await new Promise(
            resolve =>
                setTimeout(
                    resolve,
                    1100
                )
        );


        const destino =
            await buscarCoordenadas(
                destinoTexto
            );


        status.innerText =
            "Calculando rota...";


        const rota =
            await buscarRota(
                origem,
                destino
            );


        mostrarRota(
            origem,
            destino,
            rota
        );


        const distanciaKm =
            rota.distance / 1000;


        const minutos =
            Math.round(
                rota.duration / 60
            );


        document.getElementById(
            "distancia"
        ).innerText =
            distanciaKm.toFixed(0) +
            " km";


        document.getElementById(
            "tempo"
        ).innerText =
            formatarTempo(minutos);


        const valor =
            calcularValor(
                distanciaKm
            );


        /* SALVAR NO HISTÓRICO */

        const registro = {

            id: Date.now(),

            origem: origemTexto,

            destino: destinoTexto,

            distancia: distanciaKm,

            valor: valor,

            data:
                new Date().toLocaleDateString(
                    "pt-BR"
                )

        };


        historico.unshift(registro);


        localStorage.setItem(
            "historicoFretes",
            JSON.stringify(historico)
        );


        /* CRIAR ORÇAMENTO */

        const orcamento = {

            id: Date.now(),

            origem: origemTexto,

            destino: destinoTexto,

            valor: valor,

            data:
                new Date().toLocaleDateString(
                    "pt-BR"
                ),

            status: "Pendente"

        };


        orcamentos.unshift(
            orcamento
        );


        localStorage.setItem(
            "orcamentosFretes",
            JSON.stringify(orcamentos)
        );


        carregarListas();


        status.innerText =
            "Rota encontrada";


    } catch (erro) {

        console.error(erro);

        status.innerText =
            "Erro na rota";

        alert(
            erro.message
        );

    }


    botao.disabled = false;

    botao.innerText =
        "🧮 CALCULAR FRETE";

}


/* =========================================================
   CÁLCULO DO VALOR
========================================================= */

function calcularValor(
    distancia
) {

    const peso =
        Number(
            document.getElementById(
                "peso"
            ).value
        );


    const volume =
        Number(
            document.getElementById(
                "volume"
            ).value
        );


    const mercadoria =
        Number(
            document.getElementById(
                "mercadoria"
            ).value
        );


    const veiculo =
        document.getElementById(
            "veiculo"
        ).value;


    const urgencia =
        document.getElementById(
            "urgencia"
        ).value;


    let freteBase =

        300 +

        (peso * 0.15) +

        (volume * 12);


    const multiplicador = {

        "3/4": 1,

        "toco": 1.15,

        "truck": 1.30,

        "carreta": 1.50

    };


    freteBase *=
        multiplicador[veiculo];


    let valorKm =
        Number(
            localStorage.getItem(
                "valorKm"
            )
        );


    if (!valorKm) {

        valorKm = 1.25;

    }


    const valorDistancia =
        distancia * valorKm;


    let taxaCombustivel =
        Number(
            localStorage.getItem(
                "taxaCombustivel"
            )
        );


    if (!taxaCombustivel) {

        taxaCombustivel = 12;

    }


    const combustivel =
        valorDistancia *
        (taxaCombustivel / 100);


    let seguro = 0;


    if (
        document.getElementById(
            "seguro"
        ).checked
    ) {

        seguro =
            mercadoria * 0.003;

    }


    let adicionais = 0;


    if (
        document.getElementById(
            "agendada"
        ).checked
    ) {

        adicionais += 80;

    }


    if (
        document.getElementById(
            "fragil"
        ).checked
    ) {

        adicionais +=
            mercadoria * 0.001;

    }


    let fatorUrgencia = 1;


    if (
        urgencia === "urgente"
    ) {

        fatorUrgencia = 1.20;

    }


    if (
        urgencia === "expressa"
    ) {

        fatorUrgencia = 1.40;

    }


    let total =

        freteBase +

        valorDistancia +

        combustivel +

        seguro +

        adicionais;


    total *=
        fatorUrgencia;


    document.getElementById(
        "freteBase"
    ).innerText =
        dinheiro(freteBase);


    document.getElementById(
        "distanciaValor"
    ).innerText =
        dinheiro(valorDistancia);


    document.getElementById(
        "combustivel"
    ).innerText =
        dinheiro(combustivel);


    document.getElementById(
        "seguroValor"
    ).innerText =
        dinheiro(seguro);


    document.getElementById(
        "adicionais"
    ).innerText =
        dinheiro(adicionais);


    document.getElementById(
        "total"
    ).innerText =
        dinheiro(total);


    document.getElementById(
        "total2"
    ).innerText =
        dinheiro(total);


    document.getElementById(
        "preco1"
    ).innerText =
        dinheiro(total);


    document.getElementById(
        "preco2"
    ).innerText =
        dinheiro(total * 1.08);


    document.getElementById(
        "preco3"
    ).innerText =
        dinheiro(total * 0.94);


    return total;

}


/* =========================================================
   TEMPO
========================================================= */

function formatarTempo(minutos) {

    const horas =
        Math.floor(
            minutos / 60
        );


    const minutosRestantes =
        minutos % 60;


    if (horas === 0) {

        return minutosRestantes + " min";

    }


    return (
        horas +
        "h " +
        minutosRestantes +
        "min"
    );

}


/* =========================================================
   BOTÃO CALCULAR
========================================================= */

document
    .getElementById("btnCalcular")
    .addEventListener(
        "click",
        calcularFrete
    );


/* =========================================================
   TRANSPORTADORAS
========================================================= */

function adicionarTransportadora() {

    const nome =
        document.getElementById(
            "nomeTransportadora"
        ).value.trim();


    const cnpj =
        document.getElementById(
            "cnpjTransportadora"
        ).value.trim();


    const telefone =
        document.getElementById(
            "telefoneTransportadora"
        ).value.trim();


    const cidade =
        document.getElementById(
            "cidadeTransportadora"
        ).value.trim();


    if (!nome) {

        alert(
            "Informe o nome da transportadora."
        );

        return;

    }


    const nova = {

        id: Date.now(),

        nome: nome,

        cnpj: cnpj,

        telefone: telefone,

        cidade: cidade

    };


    transportadoras.push(nova);


    salvarTransportadoras();

    carregarTransportadoras();


    document.getElementById(
        "nomeTransportadora"
    ).value = "";

    document.getElementById(
        "cnpjTransportadora"
    ).value = "";

    document.getElementById(
        "telefoneTransportadora"
    ).value = "";

    document.getElementById(
        "cidadeTransportadora"
    ).value = "";


    alert(
        "Transportadora cadastrada!"
    );

}


function salvarTransportadoras() {

    localStorage.setItem(
        "transportadoras",
        JSON.stringify(
            transportadoras
        )
    );

}


function carregarTransportadoras() {

    const lista =
        document.getElementById(
            "listaTransportadoras"
        );


    if (!transportadoras.length) {

        lista.innerHTML =
            '<div class="vazio">Nenhuma transportadora cadastrada.</div>';

        return;

    }


    lista.innerHTML =
        transportadoras.map(function (item) {

            return `

                <div class="item-lista">

                    <div class="item-info">

                        <strong>
                            🚛 ${item.nome}
                        </strong>

                        <span>
                            ${item.cidade || "Cidade não informada"}
                            • ${item.telefone || "Telefone não informado"}
                        </span>

                    </div>

                    <div class="item-acoes">

                        <button
                            class="btn-excluir"
                            onclick="excluirTransportadora(${item.id})"
                        >
                            🗑️ Excluir
                        </button>

                    </div>

                </div>

            `;

        }).join("");

}


function excluirTransportadora(id) {

    if (
        !confirm(
            "Deseja excluir esta transportadora?"
        )
    ) {

        return;

    }


    transportadoras =
        transportadoras.filter(
            item => item.id !== id
        );


    salvarTransportadoras();

    carregarTransportadoras();

}


/* =========================================================
   VEÍCULOS
========================================================= */

function adicionarVeiculo() {

    const modelo =
        document.getElementById(
            "modeloVeiculo"
        ).value.trim();


    const placa =
        document.getElementById(
            "placaVeiculo"
        ).value.trim();


    const tipo =
        document.getElementById(
            "tipoVeiculo"
        ).value;


    const capacidade =
        document.getElementById(
            "capacidadeVeiculo"
        ).value;


    if (!modelo || !placa) {

        alert(
            "Informe o modelo e a placa."
        );

        return;

    }


    const novo = {

        id: Date.now(),

        modelo: modelo,

        placa: placa,

        tipo: tipo,

        capacidade: capacidade

    };


    veiculos.push(novo);


    localStorage.setItem(
        "veiculos",
        JSON.stringify(veiculos)
    );


    carregarVeiculos();


    document.getElementById(
        "modeloVeiculo"
    ).value = "";

    document.getElementById(
        "placaVeiculo"
    ).value = "";

    document.getElementById(
        "capacidadeVeiculo"
    ).value = "";


    alert(
        "Veículo cadastrado!"
    );

}


function carregarVeiculos() {

    const lista =
        document.getElementById(
            "listaVeiculos"
        );


    if (!veiculos.length) {

        lista.innerHTML =
            '<div class="vazio">Nenhum veículo cadastrado.</div>';

        return;

    }


    lista.innerHTML =
        veiculos.map(function (item) {

            return `

                <div class="item-lista">

                    <div class="item-info">

                        <strong>
                            🚚 ${item.modelo}
                        </strong>

                        <span>
                            Placa: ${item.placa}
                            • ${item.tipo}
                            • Capacidade: ${item.capacidade || "--"} kg
                        </span>

                    </div>

                    <div class="item-acoes">

                        <button
                            class="btn-excluir"
                            onclick="excluirVeiculo(${item.id})"
                        >
                            🗑️ Excluir
                        </button>

                    </div>

                </div>

            `;

        }).join("");

}


function excluirVeiculo(id) {

    if (
        !confirm(
            "Deseja excluir este veículo?"
        )
    ) {

        return;

    }


    veiculos =
        veiculos.filter(
            item => item.id !== id
        );


    localStorage.setItem(
        "veiculos",
        JSON.stringify(veiculos)
    );


    carregarVeiculos();

}


/* =========================================================
   ENTREGAS
========================================================= */

function adicionarEntrega() {

    const origem =
        document.getElementById(
            "entregaOrigem"
        ).value.trim();


    const destino =
        document.getElementById(
            "entregaDestino"
        ).value.trim();


    const motorista =
        document.getElementById(
            "motoristaEntrega"
        ).value.trim();


    const previsao =
        document.getElementById(
            "previsaoEntrega"
        ).value;


    if (!origem || !destino) {

        alert(
            "Informe a origem e o destino."
        );

        return;

    }


    const nova = {

        id: Date.now(),

        origem: origem,

        destino: destino,

        motorista: motorista,

        previsao: previsao,

        status: "Em preparação"

    };


    entregas.push(nova);


    localStorage.setItem(
        "entregas",
        JSON.stringify(entregas)
    );


    carregarEntregas();


    document.getElementById(
        "entregaOrigem"
    ).value = "";

    document.getElementById(
        "entregaDestino"
    ).value = "";

    document.getElementById(
        "motoristaEntrega"
    ).value = "";

    document.getElementById(
        "previsaoEntrega"
    ).value = "";


    alert(
        "Entrega cadastrada!"
    );

}


function carregarEntregas() {

    const lista =
        document.getElementById(
            "listaEntregas"
        );


    if (!entregas.length) {

        lista.innerHTML =
            '<div class="vazio">Nenhuma entrega cadastrada.</div>';

        return;

    }


    lista.innerHTML =
        entregas.map(function (item) {

            return `

                <div class="item-lista">

                    <div class="item-info">

                        <strong>
                            📍 ${item.origem}
                            → ${item.destino}
                        </strong>

                        <span>
                            Motorista:
                            ${item.motorista || "Não informado"}
                            • Previsão:
                            ${item.previsao
                                ? formatarData(item.previsao)
                                : "Não informada"}
                        </span>

                    </div>

                    <div class="item-acoes">

                        <select
                            onchange="alterarStatusEntrega(${item.id}, this.value)"
                        >

                            <option
                                ${item.status === "Em preparação" ? "selected" : ""}
                            >
                                Em preparação
                            </option>

                            <option
                                ${item.status === "Em trânsito" ? "selected" : ""}
                            >
                                Em trânsito
                            </option>

                            <option
                                ${item.status === "Entregue" ? "selected" : ""}
                            >
                                Entregue
                            </option>

                        </select>


                        <button
                            class="btn-excluir"
                            onclick="excluirEntrega(${item.id})"
                        >
                            🗑️
                        </button>

                    </div>

                </div>

            `;

        }).join("");

}


function alterarStatusEntrega(
    id,
    status
) {

    const entrega =
        entregas.find(
            item => item.id === id
        );


    if (entrega) {

        entrega.status = status;

    }


    localStorage.setItem(
        "entregas",
        JSON.stringify(entregas)
    );


    carregarEntregas();

}


function excluirEntrega(id) {

    if (
        !confirm(
            "Deseja excluir esta entrega?"
        )
    ) {

        return;

    }


    entregas =
        entregas.filter(
            item => item.id !== id
        );


    localStorage.setItem(
        "entregas",
        JSON.stringify(entregas)
    );


    carregarEntregas();

}


/* =========================================================
   HISTÓRICO
========================================================= */

function carregarHistorico() {

    const lista =
        document.getElementById(
            "listaHistorico"
        );


    if (!historico.length) {

        lista.innerHTML =
            '<div class="vazio">Nenhuma cotação realizada ainda.</div>';

        return;

    }


    lista.innerHTML =
        historico.map(function (item) {

            return `

                <div class="historico-item">

                    <div class="historico-topo">

                        <strong>
                            ${item.origem}
                            → ${item.destino}
                        </strong>

                        <strong>
                            ${dinheiro(item.valor)}
                        </strong>

                    </div>


                    <div class="historico-detalhes">

                        <span>
                            📅 ${item.data}
                        </span>

                        <span>
                            📍 ${item.distancia.toFixed(0)} km
                        </span>

                    </div>

                </div>

            `;

        }).join("");

}


function limparHistorico() {

    if (
        !confirm(
            "Deseja apagar todo o histórico?"
        )
    ) {

        return;

    }


    historico = [];


    localStorage.setItem(
        "historicoFretes",
        JSON.stringify(historico)
    );


    carregarHistorico();

}


/* =========================================================
   ORÇAMENTOS
========================================================= */

function carregarOrcamentos() {

    const lista =
        document.getElementById(
            "listaOrcamentos"
        );


    if (!orcamentos.length) {

        lista.innerHTML =
            '<div class="vazio">Nenhum orçamento criado.</div>';

        return;

    }


    lista.innerHTML =
        orcamentos.map(function (item) {

            return `

                <div class="item-lista">

                    <div class="item-info">

                        <strong>
                            📄 ${item.origem}
                            → ${item.destino}
                        </strong>

                        <span>
                            Criado em ${item.data}
                            • Status: ${item.status}
                        </span>

                    </div>

                    <div class="item-acoes">

                        <strong class="preco">
                            ${dinheiro(item.valor)}
                        </strong>

                        <button
                            class="btn-excluir"
                            onclick="excluirOrcamento(${item.id})"
                        >
                            🗑️
                        </button>

                    </div>

                </div>

            `;

        }).join("");

}


function excluirOrcamento(id) {

    if (
        !confirm(
            "Deseja excluir este orçamento?"
        )
    ) {

        return;

    }


    orcamentos =
        orcamentos.filter(
            item => item.id !== id
        );


    localStorage.setItem(
        "orcamentosFretes",
        JSON.stringify(orcamentos)
    );


    carregarOrcamentos();

}


/* =========================================================
   CONFIGURAÇÕES
========================================================= */

function salvarConfiguracoes() {

    const nome =
        document.getElementById(
            "nomeSistema"
        ).value;


    const taxa =
        document.getElementById(
            "taxaCombustivel"
        ).value;


    const valorKm =
        document.getElementById(
            "valorKm"
        ).value;


    localStorage.setItem(
        "nomeSistema",
        nome
    );


    localStorage.setItem(
        "taxaCombustivel",
        taxa
    );


    localStorage.setItem(
        "valorKm",
        valorKm
    );


    alert(
        "Configurações salvas!"
    );

}


function carregarConfiguracoes() {

    const nome =
        localStorage.getItem(
            "nomeSistema"
        );


    const taxa =
        localStorage.getItem(
            "taxaCombustivel"
        );


    const valorKm =
        localStorage.getItem(
            "valorKm"
        );


    if (nome) {

        document.getElementById(
            "nomeSistema"
        ).value = nome;

    }


    if (taxa) {

        document.getElementById(
            "taxaCombustivel"
        ).value = taxa;

    }


    if (valorKm) {

        document.getElementById(
            "valorKm"
        ).value = valorKm;

    }

}


/* =========================================================
   APAGAR TODOS OS DADOS
========================================================= */

function apagarDados() {

    if (
        !confirm(
            "ATENÇÃO!\n\nIsso vai apagar histórico, orçamentos, transportadoras, veículos e entregas.\n\nDeseja continuar?"
        )
    ) {

        return;

    }


    localStorage.clear();


    historico = [];

    orcamentos = [];

    transportadoras = [];

    veiculos = [];

    entregas = [];


    carregarListas();


    carregarConfiguracoes();


    alert(
        "Todos os dados foram apagados."
    );

}


/* =========================================================
   DATA
========================================================= */

function formatarData(data) {

    if (!data) {

        return "--";

    }


    const partes =
        data.split("-");


    if (partes.length !== 3) {

        return data;

    }


    return (
        partes[2] +
        "/" +
        partes[1] +
        "/" +
        partes[0]
    );

}


/* =========================================================
   SELECIONAR TRANSPORTADORA
========================================================= */

function selecionar(nome) {

    alert(
        "Transportadora selecionada:\n\n" +
        nome
    );

}


/* =========================================================
   CARREGAR TODAS AS LISTAS
========================================================= */

function carregarListas() {

    carregarHistorico();

    carregarOrcamentos();

    carregarTransportadoras();

    carregarVeiculos();

    carregarEntregas();

}