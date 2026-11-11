/* =========================================================
   ARMAZENAMENTO
   Cada lista do sistema é uma Colecao gravada no localStorage.
========================================================= */

class Colecao {

    constructor(chave) {
        this.chave = chave;
        this.recarregar();
    }

    /* Lê novamente do localStorage (lista vazia se não houver dados). */
    recarregar() {
        try {
            const dados = JSON.parse(localStorage.getItem(this.chave));
            this.itens = Array.isArray(dados) ? dados : [];
        } catch (erro) {
            this.itens = [];
        }
    }

    salvar() {
        localStorage.setItem(this.chave, JSON.stringify(this.itens));
    }

    adicionar(item) {
        this.itens.push(item);
        this.salvar();
    }

    adicionarNoInicio(item) {
        this.itens.unshift(item);
        this.salvar();
    }

    buscar(id) {
        return this.itens.find(item => item.id === id) || null;
    }

    remover(id) {
        this.itens = this.itens.filter(item => item.id !== id);
        this.salvar();
    }

    esvaziar() {
        this.itens = [];
        this.salvar();
    }

}


/* ---------- Coleções do sistema ---------- */

const historico = new Colecao("historicoFretes");
const orcamentos = new Colecao("orcamentosFretes");
const clientes = new Colecao("clientes");
const transportadoras = new Colecao("transportadoras");
const veiculos = new Colecao("veiculos");
const entregas = new Colecao("entregas");

const TODAS_AS_COLECOES = [
    historico,
    orcamentos,
    clientes,
    transportadoras,
    veiculos,
    entregas
];
