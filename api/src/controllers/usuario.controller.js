const prisma = require("../data/prisma");

// RF001.1 - login: recebe email e senha e devolve os dados do usuario
const login = async (req, res) => {
    const { email, senha } = req.body;

    if (!email || !senha) {
        return res.status(400).json({ erro: "Informe o e-mail e a senha." });
    }

    const usuario = await prisma.usuario.findUnique({
        where: { email: email }
    });

    if (!usuario || usuario.senha != senha) {
        return res.status(401).json({ erro: "E-mail ou senha inválidos." });
    }

    // nao devolve a senha
    delete usuario.senha;
    res.status(200).json(usuario);
};

const cadastrar = async (req, res) => {
    const data = req.body;

    try {
        const item = await prisma.usuario.create({
            data,
            omit: { senha: true }
        });
        res.status(201).json(item);
    } catch (e) {
        res.status(400).json({ erro: "Não foi possível cadastrar o usuário." });
    }
};

const listar = async (req, res) => {
    const lista = await prisma.usuario.findMany({
        omit: { senha: true }
    });

    res.status(200).json(lista);
};

const buscar = async (req, res) => {
    const { id } = req.params;

    const item = await prisma.usuario.findUnique({
        where: { id: Number(id) },
        omit: { senha: true },
        include: { eventos: true }
    });

    if (!item) {
        return res.status(404).json({ erro: "Usuário não encontrado." });
    }
    res.status(200).json(item);
};

const atualizar = async (req, res) => {
    const { id } = req.params;
    const dados = req.body;

    try {
        const item = await prisma.usuario.update({
            where: { id: Number(id) },
            data: dados,
            omit: { senha: true }
        });
        res.status(200).json(item);
    } catch (e) {
        res.status(400).json({ erro: "Não foi possível atualizar o usuário." });
    }
};

const excluir = async (req, res) => {
    const { id } = req.params;

    try {
        // apaga os eventos do usuario antes, por causa da chave estrangeira
        await prisma.evento.deleteMany({
            where: { usuarioId: Number(id) }
        });

        const item = await prisma.usuario.delete({
            where: { id: Number(id) },
            omit: { senha: true }
        });
        res.status(200).json(item);
    } catch (e) {
        res.status(404).json({ erro: "Usuário não encontrado." });
    }
};

module.exports = {
    login,
    cadastrar,
    listar,
    buscar,
    atualizar,
    excluir
}
