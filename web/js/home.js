// ==========================================================
// [RF002] Tela Home — CRUD de eventos climáticos
// ==========================================================

const usuario = obterUsuario();

// ---------- Elementos ----------
const lista = document.getElementById('lista');
const resumoEl = document.getElementById('resumo');
const contagem = document.getElementById('contagem');
const campoBusca = document.getElementById('busca');

const dialogoEvento = document.getElementById('dialogoEvento');
const formEvento = document.getElementById('formEvento');
const tituloDialogo = document.getElementById('tituloDialogo');
const btnSalvar = document.getElementById('btnSalvar');
const erroEvento = document.getElementById('erroEvento');
const contadorImpacto = document.getElementById('contadorImpacto');

const dialogoExcluir = document.getElementById('dialogoExcluir');
const textoExcluir = document.getElementById('textoExcluir');
const erroExcluir = document.getElementById('erroExcluir');
const btnConfirmarExcluir = document.getElementById('btnConfirmarExcluir');

const aviso = document.getElementById('aviso');

// ---------- Estado da tela ----------
let eventos = [];          // eventos carregados da API
let filtroDono = 'todos';  // 'todos' | 'meus'
let filtroTipo = null;     // tipoEvento selecionado no resumo
let eventoEditando = null; // evento sendo editado (null = cadastrando)
let eventoExcluindo = null;

// ---------- Ícones ----------
const ICONE_EDITAR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16v4z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M13.5 6.5l4 4" stroke="currentColor" stroke-width="2"/></svg>';
const ICONE_EXCLUIR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

// ==========================================================
// [RF002.1] e [RF002.2] Header: nome do usuário e botão Sair
// ==========================================================
// (sem usuário o <head> já redirecionou para o login; interrompe o script)
if (!usuario) throw new Error('Sem usuário logado.');

document.getElementById('nomeUsuario').textContent = usuario.nome;
document.getElementById('btnSair').addEventListener('click', sair);

// ==========================================================
// Utilidades de exibição
// ==========================================================

// Cor da faixa térmica: azul (frio) -> âmbar -> vermelho (calor)
const ESCALA_TEMP = [
    [0, [59, 111, 182]],
    [15, [111, 168, 201]],
    [25, [224, 161, 0]],
    [33, [217, 98, 43]],
    [40, [168, 34, 24]]
];

function corDaTemperatura(t) {
    if (t === null || t === undefined) return null;
    if (t <= ESCALA_TEMP[0][0]) return ESCALA_TEMP[0][1];
    for (let i = 1; i < ESCALA_TEMP.length; i++) {
        const [t1, c1] = ESCALA_TEMP[i];
        const [t0, c0] = ESCALA_TEMP[i - 1];
        if (t <= t1) {
            const p = (t - t0) / (t1 - t0);
            return c0.map((v, k) => Math.round(v + (c1[k] - v) * p));
        }
    }
    return ESCALA_TEMP[ESCALA_TEMP.length - 1][1];
}

function estiloTermo(t) {
    const rgb = corDaTemperatura(t);
    if (!rgb) return '';
    // Texto escuro em fundo claro, texto branco em fundo escuro (contraste)
    const luminancia = (0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2]) / 255;
    const texto = luminancia > 0.6 ? '#18242C' : '#FFFFFF';
    return `--cor-temp: rgb(${rgb.join(',')}); --texto-temp: ${texto};`;
}

function formatarTemperatura(t) {
    if (t === null || t === undefined) return '—';
    return t.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + '°';
}

function formatarData(iso) {
    return new Date(iso).toLocaleString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
}

// Converte ISO (UTC) para o formato do <input type="datetime-local"> no horário local
function paraInputData(iso) {
    const d = iso ? new Date(iso) : new Date();
    const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 16);
}

function mostrarAviso(mensagem, tipo = 'ok') {
    aviso.textContent = mensagem;
    aviso.classList.toggle('erro', tipo === 'erro');
    aviso.classList.add('visivel');
    clearTimeout(mostrarAviso.timer);
    mostrarAviso.timer = setTimeout(() => aviso.classList.remove('visivel'), 3200);
}

// ==========================================================
// [RF002.3] READ — carregar e listar eventos
// ==========================================================
async function carregarEventos(destacarId) {
    if (!eventos.length) {
        lista.innerHTML = '<li class="estado"><p>Carregando eventos...</p></li>';
    }
    try {
        eventos = await api('/evento');
        renderizar(destacarId);
    } catch (erro) {
        lista.innerHTML = `
            <li class="estado">
                <p><strong>Não foi possível carregar os eventos.</strong>${escaparHtml(erro.message)}</p>
                <p><button type="button" class="btn btn-contorno" id="btnTentar">Tentar novamente</button></p>
            </li>`;
        document.getElementById('btnTentar').addEventListener('click', () => carregarEventos());
        resumoEl.innerHTML = '';
        contagem.textContent = '';
    }
}

function eventosFiltrados(ignorarTipo = false) {
    const termo = campoBusca.value.trim().toLowerCase();
    return eventos.filter(ev => {
        if (filtroDono === 'meus' && ev.usuarioId !== usuario.id) return false;
        if (!ignorarTipo && filtroTipo && ev.tipoEvento !== filtroTipo) return false;
        if (termo && !(`${ev.cidade} ${ev.tipoEvento}`.toLowerCase().includes(termo))) return false;
        return true;
    });
}

function renderizarResumo() {
    // Conta os eventos por tipo (respeitando os outros filtros)
    const contagemTipos = {};
    eventosFiltrados(true).forEach(ev => {
        contagemTipos[ev.tipoEvento] = (contagemTipos[ev.tipoEvento] || 0) + 1;
    });
    const tipos = Object.entries(contagemTipos).sort((a, b) => b[1] - a[1]);

    if (filtroTipo && !contagemTipos[filtroTipo]) filtroTipo = null;

    resumoEl.innerHTML = tipos.map(([tipo, qtd]) => `
        <li>
            <button type="button" data-tipo="${escaparHtml(tipo)}" aria-pressed="${tipo === filtroTipo}">
                <b>${qtd}</b> ${escaparHtml(tipo)}
            </button>
        </li>`).join('');
}

function renderizar(destacarId) {
    renderizarResumo();
    const visiveis = eventosFiltrados();

    contagem.textContent = `(${visiveis.length} de ${eventos.length})`;

    if (!eventos.length) {
        lista.innerHTML = `
            <li class="estado">
                <p><strong>Nenhum evento registrado ainda.</strong>Registre o primeiro evento climático da sua região.</p>
                <p><button type="button" class="btn btn-alerta" data-acao="novo">Registrar evento</button></p>
            </li>`;
        return;
    }

    if (!visiveis.length) {
        lista.innerHTML = `
            <li class="estado">
                <p><strong>Nenhum evento corresponde aos filtros.</strong>Mude a busca ou escolha outro filtro.</p>
                <p><button type="button" class="btn btn-contorno" data-acao="limpar">Limpar filtros</button></p>
            </li>`;
        return;
    }

    lista.innerHTML = visiveis.map(ev => {
        const meu = ev.usuarioId === usuario.id;
        const autor = meu ? '<span class="meu">Registrado por você</span>' : `Registrado por ${escaparHtml(ev.usuario?.nome || 'usuário #' + ev.usuarioId)}`;
        const titulo = `${escaparHtml(ev.cidade)}, ${escaparHtml(ev.tipoEvento)}`;
        const temp = ev.temperaturaMaxima;

        return `
        <li class="evento${ev.id === destacarId ? ' destaque' : ''}" data-id="${ev.id}">
            <div class="termo" style="${estiloTermo(temp)}" title="Temperatura máxima">
                <strong>${formatarTemperatura(temp)}</strong>
                <span>${temp === null || temp === undefined ? 'sem registro' : 'máxima'}</span>
            </div>
            <div class="evento-corpo">
                <h3>${titulo}</h3>
                <p class="impacto">${escaparHtml(ev.nivelImpacto)}</p>
                <ul class="meta">
                    <li><time datetime="${escaparHtml(ev.data)}">${formatarData(ev.data)}</time></li>
                    <li>${autor}</li>
                </ul>
            </div>
            <div class="evento-acoes">
                <button type="button" class="btn-icone" data-acao="editar" title="Editar" aria-label="Editar evento ${titulo}">${ICONE_EDITAR}</button>
                <button type="button" class="btn-icone excluir" data-acao="excluir" title="Excluir" aria-label="Excluir evento ${titulo}">${ICONE_EXCLUIR}</button>
            </div>
        </li>`;
    }).join('');
}

// ---------- Filtros ----------
document.querySelectorAll('.alternador [data-filtro]').forEach(botao => {
    botao.addEventListener('click', () => {
        filtroDono = botao.dataset.filtro;
        document.querySelectorAll('.alternador [data-filtro]').forEach(b =>
            b.setAttribute('aria-pressed', String(b === botao)));
        renderizar();
    });
});

campoBusca.addEventListener('input', () => renderizar());

resumoEl.addEventListener('click', (e) => {
    const botao = e.target.closest('[data-tipo]');
    if (!botao) return;
    filtroTipo = filtroTipo === botao.dataset.tipo ? null : botao.dataset.tipo;
    renderizar();
});

// ---------- Ações nos cards ----------
lista.addEventListener('click', (e) => {
    const botao = e.target.closest('[data-acao]');
    if (!botao) return;

    const acao = botao.dataset.acao;
    if (acao === 'novo') return abrirFormulario();
    if (acao === 'limpar') {
        filtroTipo = null;
        campoBusca.value = '';
        document.querySelector('.alternador [data-filtro="todos"]').click();
        return;
    }

    const id = Number(botao.closest('[data-id]').dataset.id);
    const evento = eventos.find(ev => ev.id === id);
    if (acao === 'editar') abrirFormulario(evento);
    if (acao === 'excluir') abrirExclusao(evento);
});

// ==========================================================
// [RF002.3] CREATE / UPDATE — formulário
// ==========================================================
document.getElementById('btnNovo').addEventListener('click', () => abrirFormulario());

function abrirFormulario(evento = null) {
    eventoEditando = evento;
    formEvento.reset();
    erroEvento.textContent = '';
    formEvento.querySelectorAll('[aria-invalid]').forEach(c => c.removeAttribute('aria-invalid'));

    if (evento) {
        tituloDialogo.textContent = 'Editar evento';
        btnSalvar.textContent = 'Salvar alterações';
        formEvento.cidade.value = evento.cidade;
        formEvento.tipoEvento.value = evento.tipoEvento;
        formEvento.temperaturaMaxima.value = evento.temperaturaMaxima ?? '';
        formEvento.data.value = paraInputData(evento.data);
        formEvento.nivelImpacto.value = evento.nivelImpacto;
    } else {
        tituloDialogo.textContent = 'Registrar evento';
        btnSalvar.textContent = 'Registrar evento';
        formEvento.data.value = paraInputData();
    }
    atualizarContador();
    dialogoEvento.showModal();
    formEvento.cidade.focus();
}

function atualizarContador() {
    contadorImpacto.textContent = `${formEvento.nivelImpacto.value.length} de 100 caracteres`;
}
formEvento.nivelImpacto.addEventListener('input', atualizarContador);

// Ao corrigir um campo, some o destaque de erro
formEvento.addEventListener('input', (e) => {
    if (e.target.getAttribute('aria-invalid')) {
        e.target.removeAttribute('aria-invalid');
        erroEvento.textContent = '';
    }
});

function validarFormulario() {
    const obrigatorios = [
        ['cidade', 'Informe a cidade.'],
        ['tipoEvento', 'Informe o tipo de evento.'],
        ['data', 'Informe a data e hora do evento.'],
        ['nivelImpacto', 'Descreva o nível de impacto.']
    ];
    formEvento.querySelectorAll('[aria-invalid]').forEach(c => c.removeAttribute('aria-invalid'));

    for (const [nome, mensagem] of obrigatorios) {
        const campo = formEvento[nome];
        if (!campo.value.trim()) {
            campo.setAttribute('aria-invalid', 'true');
            campo.focus();
            return mensagem;
        }
    }
    const temp = formEvento.temperaturaMaxima;
    if (temp.value !== '' && !temp.checkValidity()) {
        temp.setAttribute('aria-invalid', 'true');
        temp.focus();
        return 'Temperatura deve estar entre -30 °C e 60 °C.';
    }
    return null;
}

formEvento.addEventListener('submit', async (e) => {
    e.preventDefault();
    const problema = validarFormulario();
    if (problema) {
        erroEvento.textContent = problema;
        return;
    }
    erroEvento.textContent = '';

    const temp = formEvento.temperaturaMaxima.value;
    const dados = {
        cidade: formEvento.cidade.value.trim(),
        tipoEvento: formEvento.tipoEvento.value.trim(),
        temperaturaMaxima: temp === '' ? null : Number(temp),
        data: new Date(formEvento.data.value).toISOString(),
        nivelImpacto: formEvento.nivelImpacto.value.trim()
    };

    btnSalvar.disabled = true;
    try {
        let salvo;
        if (eventoEditando) {
            // UPDATE: PUT /evento/:id
            salvo = await api(`/evento/${eventoEditando.id}`, { method: 'PUT', body: dados });
            mostrarAviso('Alterações salvas.');
        } else {
            // CREATE: POST /evento (com o id do usuário logado)
            salvo = await api('/evento', { method: 'POST', body: { ...dados, usuarioId: usuario.id } });
            mostrarAviso('Evento registrado.');
        }
        dialogoEvento.close();
        await carregarEventos(salvo.id);
    } catch (erro) {
        erroEvento.textContent = erro.message;
    } finally {
        btnSalvar.disabled = false;
    }
});

// ==========================================================
// [RF002.3] DELETE — confirmação e exclusão
// ==========================================================
function abrirExclusao(evento) {
    eventoExcluindo = evento;
    erroExcluir.textContent = '';
    textoExcluir.textContent = `O evento "${evento.cidade}, ${evento.tipoEvento}" será excluído permanentemente.`;
    dialogoExcluir.showModal();
    dialogoExcluir.querySelector('[data-fechar]').focus();
}

btnConfirmarExcluir.addEventListener('click', async () => {
    btnConfirmarExcluir.disabled = true;
    try {
        // DELETE /evento/:id
        await api(`/evento/${eventoExcluindo.id}`, { method: 'DELETE' });
        dialogoExcluir.close();
        mostrarAviso('Evento excluído.');
        await carregarEventos();
    } catch (erro) {
        erroExcluir.textContent = erro.message;
    } finally {
        btnConfirmarExcluir.disabled = false;
    }
});

// ---------- Fechar diálogos ----------
document.querySelectorAll('dialog [data-fechar]').forEach(botao => {
    botao.addEventListener('click', () => botao.closest('dialog').close());
});

// ---------- Início ----------
carregarEventos();
