// se ja estiver logado vai direto pra home
if (obterUsuario()) {
    window.location.href = 'home.html';
}

const formLogin = document.getElementById('formLogin');
const erroLogin = document.getElementById('erroLogin');

formLogin.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value.trim();
    const senha = document.getElementById('senha').value;

    if (email == '' || senha == '') {
        erroLogin.innerText = 'Preencha o e-mail e a senha.';
        return;
    }

    try {
        // RF001.1 - POST /usuario/login
        const usuario = await api('/usuario/login', 'POST', { email, senha });
        salvarUsuario(usuario);
        window.location.href = 'home.html';
    } catch (erro) {
        erroLogin.innerText = erro.message;
    }
});
