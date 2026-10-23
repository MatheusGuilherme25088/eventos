const usuario = obterUsuario();

// se nao tiver ninguem logado volta pro login
if (!usuario) {
    window.location.href = 'index.html';
}

// RF002.1 e RF002.2
document.getElementById('nomeUsuario').innerText = usuario.nome;
document.getElementById('btnSair').addEventListener('click', sair);

const lista = document.getElementById('lista');
const modal = document.getElementById('modal');
const formEvento = document.getElementById('formEvento');
const erroEvento = document.getElementById('erroEvento');

let eventos = [];
let idEditando = null; // null = cadastrando, numero = editando

// ---------- LISTAR ----------
async function carregarEventos() {
    try {
        eventos = await api('/evento');
        mostrarEventos();
    } catch (erro) {
        lista.innerHTML = `<p class="aviso">${escapar(erro.message)}</p>`;
    }
}

function mostrarEventos() {
    lista.innerHTML = '';

    if (eventos.length == 0) {
        lista.innerHTML = '<p class="aviso">Nenhum evento cadastrado ainda.</p>';
        return;
    }

    eventos.forEach(ev => {
        const temp = ev.temperaturaMaxima != null ? ev.temperaturaMaxima + ' °C' : 'sem temperatura';
        const data = new Date(ev.data).toLocaleDateString('pt-BR');

        const li = document.createElement('li');
        li.className = 'card';
        li.innerHTML = `
            <div class="info">
                <h3>${escapar(ev.cidade)}, ${escapar(ev.tipoEvento)}</h3>
                <p>${escapar(ev.nivelImpacto)}</p>
                <small>${temp} &nbsp;|&nbsp; ${data} &nbsp;|&nbsp; por ${escapar(ev.usuario ? ev.usuario.nome : '')}</small>
            </div>
            <div class="acoes">
                <button class="btn-editar" title="Editar">✏️</button>
                <button class="btn-excluir" title="Excluir">🗑️</button>
            </div>
        `;

        li.querySelector('.btn-editar').addEventListener('click', () => abrirModal(ev));
        li.querySelector('.btn-excluir').addEventListener('click', () => excluirEvento(ev));

        lista.appendChild(li);
    });
}

// ---------- CADASTRAR / EDITAR ----------
document.getElementById('btnNovo').addEventListener('click', () => abrirModal());
document.getElementById('btnCancelar').addEventListener('click', fecharModal);

// deixa a data no formato do input (aaaa-mm-dd)
function dataParaInput(d) {
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const dia = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${mes}-${dia}`;
}

function abrirModal(ev = null) {
    formEvento.reset();
    erroEvento.innerText = '';

    if (ev) {
        idEditando = ev.id;
        document.getElementById('tituloModal').innerText = 'Editar evento';
        document.getElementById('cidade').value = ev.cidade;
        document.getElementById('tipoEvento').value = ev.tipoEvento;
        document.getElementById('temperaturaMaxima').value = ev.temperaturaMaxima ?? '';
        document.getElementById('data').value = dataParaInput(new Date(ev.data));
        document.getElementById('nivelImpacto').value = ev.nivelImpacto;
    } else {
        idEditando = null;
        document.getElementById('tituloModal').innerText = 'Novo evento';
        document.getElementById('data').value = dataParaInput(new Date());
    }

    modal.classList.add('aberto');
    document.getElementById('cidade').focus();
}

function fecharModal() {
    modal.classList.remove('aberto');
}

formEvento.addEventListener('submit', async (e) => {
    e.preventDefault();

    const temp = document.getElementById('temperaturaMaxima').value;
    const data = document.getElementById('data').value;

    const evento = {
        cidade: document.getElementById('cidade').value.trim(),
        tipoEvento: document.getElementById('tipoEvento').value.trim(),
        temperaturaMaxima: temp == '' ? null : Number(temp),
        nivelImpacto: document.getElementById('nivelImpacto').value.trim()
    };
    // meio dia pra data nao mudar de dia por causa do fuso
    if (data) evento.data = new Date(data + 'T12:00:00').toISOString();

    if (!evento.cidade || !evento.tipoEvento || !evento.nivelImpacto) {
        erroEvento.innerText = 'Preencha cidade, tipo e nível de impacto.';
        return;
    }

    try {
        if (idEditando) {
            await api('/evento/' + idEditando, 'PUT', evento);
        } else {
            evento.usuarioId = usuario.id;
            await api('/evento', 'POST', evento);
        }
        fecharModal();
        carregarEventos();
    } catch (erro) {
        erroEvento.innerText = erro.message;
    }
});

// ---------- EXCLUIR ----------
async function excluirEvento(ev) {
    if (!confirm(`Deseja excluir o evento "${ev.cidade}, ${ev.tipoEvento}"?`)) return;

    try {
        await api('/evento/' + ev.id, 'DELETE');
        carregarEventos();
    } catch (erro) {
        alert(erro.message);
    }
}

carregarEventos();
