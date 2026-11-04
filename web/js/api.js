const API_URL = 'http://localhost:3000';

async function api(rota, metodo = 'GET', corpo = null) {
    const opcoes = { method: metodo, headers: { 'Content-Type': 'application/json' } };
    if (corpo) opcoes.body = JSON.stringify(corpo);

    let resposta;
    try {
        resposta = await fetch(API_URL + rota, opcoes);
    } catch (e) {
        throw new Error('Não foi possível conectar na API. Ela está rodando?');
    }

    const dados = await resposta.json().catch(() => null);
    if (!resposta.ok) {
        throw new Error(dados && dados.erro ? dados.erro : 'Erro ' + resposta.status);
    }
    return dados;
}

function obterUsuario() {
    return JSON.parse(localStorage.getItem('usuario'));
}

function salvarUsuario(usuario) {
    localStorage.setItem('usuario', JSON.stringify(usuario));
}

function sair() {
    localStorage.removeItem('usuario');
    window.location.href = 'index.html';
}

function escapar(texto) {
    const div = document.createElement('div');
    div.innerText = texto ?? '';
    return div.innerHTML;
}
