/* =========================================================
   CÁLCULO DE FRETE
========================================================= */

const TARIFAS = {
    valorFixo: 300,
    porKg: 0.15,
    porMetroCubico: 12,
    entregaAgendada: 80,
    percentualSeguro: 0.003,
    percentualFragil: 0.001
};

const MULTIPLICADOR_VEICULO = {
    "3/4": 1,
    "toco": 1.15,
    "truck": 1.30,
    "carreta": 1.50
};

/* Entrega "normal" não tem acréscimo (fator 1). */
const FATOR_URGENCIA = {
    "urgente": 1.20,
    "expressa": 1.40
};

/* Preço de cada transportadora sugerida em relação ao total calculado. */
const VARIACAO_TRANSPORTADORAS = {
    preco1: 1,
    preco2: 1.08,
    preco3: 0.94
};

/* O Nominatim aceita no máximo uma consulta por segundo. */
const INTERVALO_ENTRE_CONSULTAS_MS = 1100;

const TEXTO_BOTAO_CALCULAR = "🧮 CALCULAR FRETE";
const TEXTO_BOTAO_CALCULANDO = "⏳ CALCULANDO...";


/* ---------- Fluxo principal ---------- */

async function calcularFrete() {
    const origemTexto = valorDoCampo("origem");
    const destinoTexto = valorDoCampo("destino");

    if (!origemTexto || !destinoTexto) {
        alert("Informe a origem e o destino.");
        return;
    }

    bloquearBotaoCalcular(true);

    try {
        escreverTexto("statusMapa", "Localizando endereços...");

        const origem = await buscarCoordenadas(origemTexto);
        await esperar(INTERVALO_ENTRE_CONSULTAS_MS);
        const destino = await buscarCoordenadas(destinoTexto);

        escreverTexto("statusMapa", "Calculando rota...");

        const rota = await buscarRota(origem, destino);
        mostrarRota(origem, destino, rota);

        const distanciaKm = rota.distance / 1000;
        const minutos = Math.round(rota.duration / 60);

        escreverTexto("distancia", distanciaKm.toFixed(0) + " km");
        escreverTexto("tempo", formatarTempo(minutos));

        const composicao = calcularComposicao(distanciaKm, lerDadosDaCarga());
        exibirComposicao(composicao);

        const cliente = clienteSelecionado();

        const orcamento = registrarCotacao({
            origem: origemTexto,
            destino: destinoTexto,
            distancia: distanciaKm,
            valor: composicao.total,
            cliente: cliente
        });

        carregarListas();

        escreverTexto("statusMapa", "Rota encontrada");

        if (cliente && configuracoesEmail().automatico) {
            escreverTexto("statusMapa", "Enviando orçamento por e-mail...");
            await enviarEmailOrcamento(orcamento, false);
            escreverTexto("statusMapa", "Rota encontrada");
        }

    } catch (erro) {
        console.error(erro);
        escreverTexto("statusMapa", "Erro na rota");
        alert(erro.message);

    } finally {
        bloquearBotaoCalcular(false);
    }
}


function bloquearBotaoCalcular(bloquear) {
    const botao = campo("btnCalcular");

    botao.disabled = bloquear;
    botao.innerText = bloquear ? TEXTO_BOTAO_CALCULANDO : TEXTO_BOTAO_CALCULAR;
}


/* ---------- Valores ---------- */

function lerDadosDaCarga() {
    return {
        peso: Number(campo("peso").value),
        volume: Number(campo("volume").value),
        mercadoria: Number(campo("mercadoria").value),
        veiculo: campo("veiculo").value,
        urgencia: campo("urgencia").value,
        seguro: campo("seguro").checked,
        agendada: campo("agendada").checked,
        fragil: campo("fragil").checked
    };
}


/* Calcula cada parte do frete. Não acessa a tela. */
function calcularComposicao(distancia, carga) {
    const freteBase =
        (TARIFAS.valorFixo +
            carga.peso * TARIFAS.porKg +
            carga.volume * TARIFAS.porMetroCubico) *
        MULTIPLICADOR_VEICULO[carga.veiculo];

    const valorDistancia = distancia * valorKmConfigurado();

    const combustivel = valorDistancia * (taxaCombustivelConfigurada() / 100);

    const seguro = carga.seguro
        ? carga.mercadoria * TARIFAS.percentualSeguro
        : 0;

    let adicionais = 0;

    if (carga.agendada) {
        adicionais += TARIFAS.entregaAgendada;
    }

    if (carga.fragil) {
        adicionais += carga.mercadoria * TARIFAS.percentualFragil;
    }

    const fatorUrgencia = FATOR_URGENCIA[carga.urgencia] || 1;

    const total =
        (freteBase + valorDistancia + combustivel + seguro + adicionais) *
        fatorUrgencia;

    return { freteBase, valorDistancia, combustivel, seguro, adicionais, total };
}


function exibirComposicao(composicao) {
    escreverTexto("freteBase", dinheiro(composicao.freteBase));
    escreverTexto("distanciaValor", dinheiro(composicao.valorDistancia));
    escreverTexto("combustivel", dinheiro(composicao.combustivel));
    escreverTexto("seguroValor", dinheiro(composicao.seguro));
    escreverTexto("adicionais", dinheiro(composicao.adicionais));
    escreverTexto("total", dinheiro(composicao.total));
    escreverTexto("total2", dinheiro(composicao.total));

    Object.entries(VARIACAO_TRANSPORTADORAS).forEach(function ([id, fator]) {
        escreverTexto(id, dinheiro(composicao.total * fator));
    });
}


/* ---------- Registro ---------- */

/* Grava a cotação no histórico e cria o orçamento correspondente. */
function registrarCotacao({ origem, destino, distancia, valor, cliente }) {
    const id = Date.now();
    const data = dataDeHoje();

    historico.adicionarNoInicio({
        id,
        origem,
        destino,
        distancia,
        valor,
        clienteNome: cliente ? cliente.nome : "",
        data
    });

    const orcamento = {
        id,
        origem,
        destino,
        distancia,
        valor,
        peso: campo("peso").value,
        veiculo: textoSelecionado("veiculo"),
        urgencia: textoSelecionado("urgencia"),
        clienteId: cliente ? cliente.id : null,
        clienteNome: cliente ? cliente.nome : "",
        clienteEmail: cliente ? cliente.email : "",
        emailEnviado: "Não enviado",
        data,
        status: "Pendente"
    };

    orcamentos.adicionarNoInicio(orcamento);

    return orcamento;
}


/* ---------- Transportadoras sugeridas ---------- */

function selecionar(nome) {
    alert("Transportadora selecionada:\n\n" + nome);
}
