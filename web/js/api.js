// ==========================================================
// Configuração e funções compartilhadas entre as telas
// ==========================================================

// Endereço do back-end (pasta /api). Altere se mudar a porta no .env
const API_URL = 'http://localhost:3000';

// Chave onde guardamos o usuário logado no navegador
const CHAVE_SESSAO = 'eventos.usuario';

/**
 * Faz uma requisição à API e devolve o JSON da resposta.
 * Se a API responder com erro, lança um Error com a mensagem do back-end.
 */
async function api(caminho, { method = 'GET', body } = {}) {
    let resposta;
    try {
        resposta = await fetch(API_URL + caminho, {
            method,
            headers: body ? { 'Content-Type': 'application/json' } : undefined,
            body: body ? JSON.stringify(body) : undefined
        });
    } catch {
        throw new Error(`Não foi possível conectar à API em ${API_URL}. Verifique se o back-end está rodando (npm run dev na pasta api).`);
    }

    let dados = null;
    try { dados = await resposta.json(); } catch { /* resposta sem corpo */ }

    if (!resposta.ok) {
        throw new Error((dados && dados.erro) || `Erro ${resposta.status} ao acessar a API.`);
    }
    return dados;
}

// ---------- Sessão ----------
function obterUsuario() {
    try {
        return JSON.parse(localStorage.getItem(CHAVE_SESSAO));
    } catch {
        return null;
    }
}

function salvarUsuario(usuario) {
    localStorage.setItem(CHAVE_SESSAO, JSON.stringify(usuario));
}

function sair() {
    localStorage.removeItem(CHAVE_SESSAO);
    window.location.href = 'index.html';
}

// ---------- Utilidades ----------
// Evita que textos digitados pelo usuário virem HTML (proteção contra XSS)
function escaparHtml(texto) {
    return String(texto ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
