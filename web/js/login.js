// ==========================================================
// [RF001] Tela de login
// ==========================================================

// Se já existe alguém logado, vai direto para a Home
if (obterUsuario()) {
    window.location.href = 'home.html';
}

const formLogin = document.getElementById('formLogin');
const campoEmail = document.getElementById('email');
const campoSenha = document.getElementById('senha');
const erroLogin = document.getElementById('erroLogin');
const btnEntrar = document.getElementById('btnEntrar');

function mostrarErro(mensagem, campo) {
    erroLogin.textContent = mensagem;
    campoEmail.removeAttribute('aria-invalid');
    campoSenha.removeAttribute('aria-invalid');
    if (campo) {
        campo.setAttribute('aria-invalid', 'true');
        campo.focus();
    }
}

formLogin.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = campoEmail.value.trim();
    const senha = campoSenha.value;

    if (!email) return mostrarErro('Informe o seu e-mail.', campoEmail);
    if (!senha) return mostrarErro('Informe a sua senha.', campoSenha);

    mostrarErro('');
    btnEntrar.disabled = true;
    btnEntrar.textContent = 'Entrando...';

    try {
        // [RF001.1] POST /usuario/login -> devolve os dados do usuário
        const usuario = await api('/usuario/login', {
            method: 'POST',
            body: { email, senha }
        });
        salvarUsuario(usuario);
        window.location.href = 'home.html';
    } catch (erro) {
        mostrarErro(erro.message, campoSenha);
        campoSenha.select();
    } finally {
        btnEntrar.disabled = false;
        btnEntrar.textContent = 'Entrar';
    }
});

// Preenche rapidamente com uma conta de teste
document.querySelectorAll('.contas-teste [data-email]').forEach(botao => {
    botao.addEventListener('click', () => {
        campoEmail.value = botao.dataset.email;
        campoSenha.value = 'senha123';
        btnEntrar.focus();
    });
});
