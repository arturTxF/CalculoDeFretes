/* =========================================================
   MAPA, ENDEREÇOS E ROTAS
   Leaflet + OpenStreetMap (Nominatim) + OSRM
========================================================= */

const CENTRO_DO_BRASIL = [-14.235, -51.925];
const COR_DA_ROTA = "#078d4b";

let mapa;

/* Camadas desenhadas no mapa para a última rota calculada. */
let camadasDaRota = [];


function iniciarMapa() {
    mapa = L.map("map").setView(CENTRO_DO_BRASIL, 4);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "&copy; OpenStreetMap contributors"
    }).addTo(mapa);
}


function atualizarTamanhoMapa() {
    if (mapa) {
        setTimeout(() => mapa.invalidateSize(), 100);
    }
}


/* ---------- Serviços externos ---------- */

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

    const resposta = await fetch(url);

    if (!resposta.ok) {
        throw new Error("Não foi possível localizar o endereço.");
    }

    const dados = await resposta.json();

    if (dados.length === 0) {
        throw new Error("Endereço não encontrado: " + endereco);
    }

    return {
        lat: Number(dados[0].lat),
        lon: Number(dados[0].lon),
        nome: dados[0].display_name
    };
}


async function buscarRota(origem, destino) {
    const coordenadas =
        `${origem.lon},${origem.lat};` +
        `${destino.lon},${destino.lat}`;

    const url =
        "https://router.project-osrm.org/route/v1/driving/" +
        coordenadas +
        "?overview=full&geometries=geojson";

    const resposta = await fetch(url);

    if (!resposta.ok) {
        throw new Error("Erro ao calcular a rota.");
    }

    const dados = await resposta.json();

    if (dados.code !== "Ok" || !dados.routes.length) {
        throw new Error("Não foi possível encontrar uma rota.");
    }

    return dados.routes[0];
}


/* ---------- Desenho no mapa ---------- */

function mostrarRota(origem, destino, rota) {
    camadasDaRota.forEach(camada => mapa.removeLayer(camada));

    const marcadorOrigem = L.marker([origem.lat, origem.lon])
        .addTo(mapa)
        .bindPopup("<b>Origem</b><br>" + escapar(origem.nome));

    const marcadorDestino = L.marker([destino.lat, destino.lon])
        .addTo(mapa)
        .bindPopup("<b>Destino</b><br>" + escapar(destino.nome));

    const linhaRota = L.geoJSON(rota.geometry, {
        style: { color: COR_DA_ROTA, weight: 5 }
    }).addTo(mapa);

    camadasDaRota = [marcadorOrigem, marcadorDestino, linhaRota];

    mapa.fitBounds(linhaRota.getBounds(), { padding: [15, 15] });
}
