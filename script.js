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

let clientes =
    JSON.parse(localStorage.getItem("clientes")) || [];

let clienteEmEdicao = null;


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

    carregarConfiguracoesEmail();


    document
        .getElementById("clienteFrete")
        .addEventListener(
            "change",
            mostrarEmailCliente
        );

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
   TEXTO SEGURO
========================================================= */

function escapar(texto) {

    return String(texto || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");

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


        const cliente =
            clienteSelecionado();


        /* SALVAR NO HISTÓRICO */

        const registro = {

            id: Date.now(),

            origem: origemTexto,

            destino: destinoTexto,

            distancia: distanciaKm,

            valor: valor,

            clienteNome:
                cliente ? cliente.nome : "",

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

            distancia: distanciaKm,

            valor: valor,

            peso:
                document.getElementById("peso").value,

            veiculo:
                document.getElementById("veiculo")
                    .selectedOptions[0].text.trim(),

            urgencia:
                document.getElementById("urgencia")
                    .selectedOptions[0].text.trim(),

            clienteId:
                cliente ? cliente.id : null,

            clienteNome:
                cliente ? cliente.nome : "",

            clienteEmail:
                cliente ? cliente.email : "",

            emailEnviado: "Não enviado",

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


        /* ENVIAR ORÇAMENTO AO CLIENTE */

        if (
            cliente &&
            configuracoesEmail().automatico
        ) {

            status.innerText =
                "Enviando orçamento por e-mail...";


            await enviarEmailOrcamento(
                orcamento,
                false
            );


            status.innerText =
                "Rota encontrada";

        }


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
   CADASTRO DE CLIENTES
   Autor: Pedro Ivanoff
========================================================= */

const CHAVE_CLIENTES = "clientes";

const CAMPOS_CLIENTE = {
    nome: "nomeCliente",
    email: "emailClienteCadastro",
    telefone: "telefoneCliente",
    documento: "documentoCliente",
    cidade: "cidadeCliente",
    contato: "contatoCliente"
};

const TEXTO_BOTAO_CADASTRAR = "➕ CADASTRAR CLIENTE";
const TEXTO_BOTAO_SALVAR = "💾 SALVAR ALTERAÇÕES";


function campo(id) {

    return document.getElementById(id);

}


function valorDoCampo(id) {

    return campo(id).value.trim();

}


function emailValido(email) {

    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(
        String(email).trim()
    );

}


function lerFormularioCliente() {

    const cliente = {};

    Object.entries(CAMPOS_CLIENTE).forEach(function ([propriedade, id]) {

        cliente[propriedade] = valorDoCampo(id);

    });

    return cliente;

}


function preencherFormularioCliente(cliente) {

    Object.entries(CAMPOS_CLIENTE).forEach(function ([propriedade, id]) {

        campo(id).value = cliente[propriedade] || "";

    });

}


function emailJaCadastrado(email, idAtual) {

    return clientes.some(function (cliente) {

        return (
            cliente.email.toLowerCase() === email.toLowerCase() &&
            cliente.id !== idAtual
        );

    });

}


/* Devolve o motivo da recusa, ou null quando os dados estão válidos. */
function validarCliente(cliente) {

    if (!cliente.nome) {

        return "Informe o nome do cliente.";

    }

    if (!emailValido(cliente.email)) {

        return "Informe um e-mail válido.\n\nO e-mail é usado para enviar o orçamento ao cliente.";

    }

    if (emailJaCadastrado(cliente.email, clienteEmEdicao)) {

        return "Já existe um cliente cadastrado com este e-mail.";

    }

    return null;

}


function salvarCliente() {

    const dados = lerFormularioCliente();

    const erro = validarCliente(dados);

    if (erro) {

        alert(erro);
        return;

    }

    const editando = Boolean(clienteEmEdicao);

    if (editando) {

        atualizarCliente(clienteEmEdicao, dados);

    } else {

        clientes.push(Object.assign({ id: Date.now() }, dados));

    }

    salvarClientes();

    cancelarEdicaoCliente();

    carregarClientes();

    alert(
        editando
            ? "Cliente atualizado!"
            : "Cliente cadastrado!"
    );

}


function atualizarCliente(id, dados) {

    const cliente = buscarCliente(id);

    if (cliente) {

        Object.assign(cliente, dados);

    }

}


function buscarCliente(id) {

    return clientes.find(
        cliente => cliente.id === id
    ) || null;

}


function salvarClientes() {

    localStorage.setItem(
        CHAVE_CLIENTES,
        JSON.stringify(clientes)
    );

}


function carregarClientes() {

    const lista = campo("listaClientes");

    lista.innerHTML = clientes.length
        ? clientes.map(linhaDoCliente).join("")
        : '<div class="vazio">Nenhum cliente cadastrado.</div>';

    preencherSelectClientes();

}


function linhaDoCliente(cliente) {

    return `
        <div class="item-lista">

            <div class="item-info">

                <strong>
                    👤 ${escapar(cliente.nome)}
                </strong>

                <span>
                    ✉️ ${escapar(cliente.email)}
                    • ${escapar(cliente.telefone) || "Telefone não informado"}
                    • ${escapar(cliente.cidade) || "Cidade não informada"}
                </span>

            </div>

            <div class="item-acoes">

                <button
                    class="btn-secundario"
                    onclick="editarCliente(${cliente.id})"
                >
                    ✏️ Editar
                </button>

                <button
                    class="btn-excluir"
                    onclick="excluirCliente(${cliente.id})"
                >
                    🗑️ Excluir
                </button>

            </div>

        </div>
    `;

}


function editarCliente(id) {

    const cliente = buscarCliente(id);

    if (!cliente) {

        return;

    }

    clienteEmEdicao = id;

    preencherFormularioCliente(cliente);

    campo("btnSalvarCliente").innerText = TEXTO_BOTAO_SALVAR;

    campo("btnCancelarCliente").hidden = false;

    campo(CAMPOS_CLIENTE.nome).focus();

}


function cancelarEdicaoCliente() {

    clienteEmEdicao = null;

    preencherFormularioCliente({});

    campo("btnSalvarCliente").innerText = TEXTO_BOTAO_CADASTRAR;

    campo("btnCancelarCliente").hidden = true;

}


function excluirCliente(id) {

    if (!confirm("Deseja excluir este cliente?")) {

        return;

    }

    clientes = clientes.filter(
        cliente => cliente.id !== id
    );

    if (clienteEmEdicao === id) {

        cancelarEdicaoCliente();

    }

    salvarClientes();

    carregarClientes();

}


/* =========================================================
   CLIENTE NA TELA DE CÁLCULO
   Autor: Pedro Ivanoff
========================================================= */

function preencherSelectClientes() {

    const select = campo("clienteFrete");

    if (!select) {

        return;

    }

    const selecionadoAntes = select.value;

    select.innerHTML =
        '<option value="">Selecione um cliente cadastrado</option>' +
        clientes.map(function (cliente) {

            return `
                <option value="${cliente.id}">
                    ${escapar(cliente.nome)} (${escapar(cliente.email)})
                </option>
            `;

        }).join("");

    const aindaExiste = clientes.some(
        cliente => String(cliente.id) === selecionadoAntes
    );

    if (aindaExiste) {

        select.value = selecionadoAntes;

    }

    mostrarEmailCliente();

}


function clienteSelecionado() {

    const select = campo("clienteFrete");

    if (!select || !select.value) {

        return null;

    }

    return clientes.find(
        cliente => String(cliente.id) === select.value
    ) || null;

}


function mostrarEmailCliente() {

    const cliente = clienteSelecionado();

    campo("emailCliente").innerText = cliente
        ? "O orçamento será enviado para " + cliente.email
        : "Nenhum cliente selecionado. O orçamento não será enviado por e-mail.";

}


/* =========================================================
   CONFIGURAÇÕES DE E-MAIL
   Autor: Pedro Ivanoff
========================================================= */

/* Propriedade da configuração -> id do campo no formulário.
   O mesmo nome é usado como chave no localStorage. */
const CAMPOS_EMAIL = {
    remetente: "emailRemetente",
    publicKey: "emailjsPublicKey",
    serviceId: "emailjsServiceId",
    templateId: "emailjsTemplateId"
};

const CAMPO_ENVIO_AUTOMATICO = "envioAutomatico";


function configuracoesEmail() {

    const config = {
        automatico:
            localStorage.getItem(CAMPO_ENVIO_AUTOMATICO) !== "nao"
    };

    Object.entries(CAMPOS_EMAIL).forEach(function ([propriedade, id]) {

        config[propriedade] = localStorage.getItem(id) || "";

    });

    return config;

}


function salvarConfiguracoesEmail(silencioso) {

    const remetente = valorDoCampo(CAMPOS_EMAIL.remetente);

    if (remetente && !emailValido(remetente)) {

        alert("Informe um e-mail válido para a empresa.");
        return false;

    }

    localStorage.setItem(
        CAMPO_ENVIO_AUTOMATICO,
        campo(CAMPO_ENVIO_AUTOMATICO).checked ? "sim" : "nao"
    );

    Object.entries(CAMPOS_EMAIL).forEach(function ([, id]) {

        localStorage.setItem(id, valorDoCampo(id));

    });

    if (!silencioso) {

        alert("Configurações de e-mail salvas!");

    }

    return true;

}


function carregarConfiguracoesEmail() {

    const config = configuracoesEmail();

    campo(CAMPO_ENVIO_AUTOMATICO).checked = config.automatico;

    Object.entries(CAMPOS_EMAIL).forEach(function ([propriedade, id]) {

        campo(id).value = config[propriedade];

    });

}


/* =========================================================
   MENSAGEM DO ORÇAMENTO
   Autor: Pedro Ivanoff
========================================================= */

const VALIDADE_ORCAMENTO_DIAS = 7;


function nomeDoSistema() {

    return localStorage.getItem("nomeSistema") || "FreteFácil";

}


function assuntoOrcamento(orcamento) {

    return (
        "Orçamento de frete " +
        orcamento.origem +
        " → " +
        orcamento.destino
    );

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

    return distancia
        ? distancia.toFixed(0) + " km"
        : "não informada";

}


function pesoEscrito(peso) {

    return peso
        ? peso + " kg"
        : "não informado";

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


/* =========================================================
   ENVIO DO ORÇAMENTO POR E-MAIL
   Autor: Pedro Ivanoff
========================================================= */

const SITUACAO_ENVIADO = "Enviado";
const SITUACAO_PROGRAMA_EMAIL = "Aberto no programa de e-mail";


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

        await emailjs.send(
            config.serviceId,
            config.templateId,
            parametrosEmail(
                orcamento.clienteEmail,
                orcamento.clienteNome,
                assunto,
                mensagem,
                config.remetente
            ),
            { publicKey: config.publicKey }
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


function marcarOrcamentoEnviado(id, situacao) {

    const orcamento = orcamentos.find(
        item => item.id === id
    );

    if (!orcamento) {

        return;

    }

    orcamento.emailEnviado = situacao;

    orcamento.status = "Enviado ao cliente";

    localStorage.setItem(
        "orcamentosFretes",
        JSON.stringify(orcamentos)
    );

    carregarOrcamentos();

}


function reenviarOrcamento(id) {

    const orcamento = orcamentos.find(
        item => item.id === id
    );

    if (orcamento) {

        enviarEmailOrcamento(orcamento, true);

    }

}


/* =========================================================
   DIAGNÓSTICO DO ENVIO
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

    const verificacao = VERIFICACOES_ENVIO.find(
        item => item.falhou(config)
    );

    return verificacao
        ? verificacao.motivo(config)
        : null;

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

/* Usados quando o texto da resposta não identifica a causa. */
const DIAGNOSTICOS_POR_STATUS = {
    404:
        "Service ID ou Template ID não encontrado.\n\n" +
        "Confira os dois códigos no painel do EmailJS e veja se cada um foi colado no campo certo.",
    412:
        "O EmailJS não conseguiu acessar a conta de e-mail conectada.\n\n" +
        "Abra Email Services no painel e reconecte o serviço.",
    418: "Limite de envios do plano atingido.",
    429: "Limite de envios do plano atingido.",
    401:
        "Acesso recusado pelo EmailJS.\n\n" +
        "Verifique a Public Key e a lista de origens permitidas em Account > Security.",
    403:
        "Acesso recusado pelo EmailJS.\n\n" +
        "Verifique a Public Key e a lista de origens permitidas em Account > Security."
};


function explicarErroEmail(erro) {

    const status = erro && erro.status;

    const texto = String(
        (erro && (erro.text || erro.message)) || erro
    );

    const detalhe =
        "Resposta do EmailJS: " +
        (status ? status + " - " : "") +
        texto;

    const diagnostico = DIAGNOSTICOS_EMAIL.find(
        item => item.padrao.test(texto)
    );

    const causa = diagnostico
        ? diagnostico.causa
        : DIAGNOSTICOS_POR_STATUS[status];

    if (!causa) {

        return detalhe;

    }

    return (
        (typeof causa === "function" ? causa() : causa) +
        "\n\n" +
        detalhe
    );

}


/* =========================================================
   TESTE DE ENVIO
   Autor: Pedro Ivanoff
========================================================= */

async function enviarEmailTeste() {

    const destino = valorDoCampo(CAMPOS_EMAIL.remetente);

    if (!emailValido(destino)) {

        alert(
            "Preencha o campo \"E-mail da empresa\" com um endereço válido.\n\n" +
            "O teste será enviado para ele."
        );

        return;

    }

    if (
        !confirm(
            "Um e-mail de teste será enviado para:\n\n" +
            destino +
            "\n\nDeseja continuar?"
        )
    ) {

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

        await emailjs.send(
            config.serviceId,
            config.templateId,
            parametrosEmail(
                destino,
                "Equipe " + nomeDoSistema(),
                "Teste de envio - FreteFácil",
                "Este é um e-mail de teste do sistema FreteFácil.\n\n" +
                "Se você recebeu esta mensagem, o envio de orçamentos está configurado corretamente.",
                destino
            ),
            { publicKey: config.publicKey }
        );

        alert(
            "Teste enviado para " + destino +
            "\n\nVerifique a caixa de entrada e o spam."
        );

    } catch (erro) {

        console.error("Falha no teste de envio:", erro);

        console.log(
            "Variáveis enviadas ao template:",
            Object.keys(
                parametrosEmail(destino, "", "", "", destino)
            ).join(", ")
        );

        alert("O teste falhou.\n\n" + explicarErroEmail(erro));

    }

}


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

                        <span>
                            👤 ${escapar(item.clienteNome) || "Sem cliente"}
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
                            📄 ${escapar(item.origem)}
                            → ${escapar(item.destino)}
                        </strong>

                        <span>
                            Criado em ${item.data}
                            • Status: ${escapar(item.status)}
                        </span>

                        <span>
                            👤 ${escapar(item.clienteNome) || "Sem cliente"}
                            • ✉️ ${escapar(item.clienteEmail) || "Sem e-mail"}
                            • ${escapar(item.emailEnviado) || "Não enviado"}
                        </span>

                    </div>

                    <div class="item-acoes">

                        <strong class="preco">
                            ${dinheiro(item.valor)}
                        </strong>

                        <button
                            class="btn-secundario"
                            onclick="reenviarOrcamento(${item.id})"
                            ${item.clienteEmail ? "" : "disabled"}
                        >
                            ✉️ Enviar
                        </button>

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
            "ATENÇÃO!\n\nIsso vai apagar histórico, orçamentos, clientes, transportadoras, veículos e entregas.\n\nDeseja continuar?"
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

    clientes = [];


    cancelarEdicaoCliente();


    carregarListas();


    carregarConfiguracoes();


    carregarConfiguracoesEmail();


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

    carregarClientes();

    carregarHistorico();

    carregarOrcamentos();

    carregarTransportadoras();

    carregarVeiculos();

    carregarEntregas();

}