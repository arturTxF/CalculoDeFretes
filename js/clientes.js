/* =========================================================
   CLIENTES
   Cadastro e seleção do cliente na tela de cálculo.
   Autor: Pedro Ivanoff
========================================================= */

/* Propriedade do cliente -> id do campo no formulário. */
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

/* Id do cliente aberto no formulário, ou null quando é um cadastro novo. */
let clienteEmEdicao = null;


/* ---------- Formulário ---------- */

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


/* ---------- Validação ---------- */

function emailJaCadastrado(email, idAtual) {
    return clientes.itens.some(function (cliente) {
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


/* ---------- Ações ---------- */

function salvarCliente() {
    const dados = lerFormularioCliente();
    const erro = validarCliente(dados);

    if (erro) {
        alert(erro);
        return;
    }

    const editando = Boolean(clienteEmEdicao);

    if (editando) {
        Object.assign(clientes.buscar(clienteEmEdicao) || {}, dados);
        clientes.salvar();
    } else {
        clientes.adicionar(Object.assign({ id: Date.now() }, dados));
    }

    cancelarEdicaoCliente();
    carregarClientes();

    alert(editando ? "Cliente atualizado!" : "Cliente cadastrado!");
}


function editarCliente(id) {
    const cliente = clientes.buscar(id);

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

    clientes.remover(id);

    if (clienteEmEdicao === id) {
        cancelarEdicaoCliente();
    }

    carregarClientes();
}


/* ---------- Listagem ---------- */

function carregarClientes() {
    renderizarLista(
        "listaClientes",
        clientes.itens,
        "Nenhum cliente cadastrado.",
        linhaDoCliente
    );

    preencherSelectClientes();
}


function linhaDoCliente(cliente) {
    return `
        <div class="item-lista">
            <div class="item-info">
                <strong>👤 ${escapar(cliente.nome)}</strong>
                <span>
                    ✉️ ${escapar(cliente.email)}
                    • ${escapar(cliente.telefone) || "Telefone não informado"}
                    • ${escapar(cliente.cidade) || "Cidade não informada"}
                </span>
            </div>

            <div class="item-acoes">
                <button class="btn-secundario" onclick="editarCliente(${cliente.id})">
                    ✏️ Editar
                </button>
                <button class="btn-excluir" onclick="excluirCliente(${cliente.id})">
                    🗑️ Excluir
                </button>
            </div>
        </div>
    `;
}


/* ---------- Cliente na tela de cálculo ---------- */

function preencherSelectClientes() {
    const select = campo("clienteFrete");

    if (!select) {
        return;
    }

    const selecionadoAntes = select.value;

    select.innerHTML =
        '<option value="">Selecione um cliente cadastrado</option>' +
        clientes.itens.map(cliente => `
            <option value="${cliente.id}">
                ${escapar(cliente.nome)} (${escapar(cliente.email)})
            </option>
        `).join("");

    const aindaExiste = clientes.itens.some(
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

    return clientes.itens.find(
        cliente => String(cliente.id) === select.value
    ) || null;
}


function mostrarEmailCliente() {
    const cliente = clienteSelecionado();

    escreverTexto(
        "emailCliente",
        cliente
            ? "O orçamento será enviado para " + cliente.email
            : "Nenhum cliente selecionado. O orçamento não será enviado por e-mail."
    );
}
