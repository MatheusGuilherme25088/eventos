const prisma = require('../data/prisma');

// Nunca devolvemos a senha nas respostas da API
const semSenha = { senha: true };

function tratarErro(res, erro) {
    if (erro.code === 'P2002') return res.status(409).json({ erro: 'Já existe um usuário com este e-mail.' });
    if (erro.code === 'P2025') return res.status(404).json({ erro: 'Usuário não encontrado.' });
    console.error(erro);
    return res.status(500).json({ erro: 'Erro interno no servidor.' });
}

// [RF001.1] POST /usuario/login  { email, senha } -> dados do usuário (sem a senha)
const login = async (req, res) => {
    try {
        const { email, senha } = req.body || {};

        if (!email || !senha) {
            return res.status(400).json({ erro: 'Informe e-mail e senha.' });
        }

        const usuario = await prisma.usuario.findUnique({
            where: { email: String(email).trim().toLowerCase() }
        });

        if (!usuario || usuario.senha !== senha) {
            return res.status(401).json({ erro: 'E-mail ou senha inválidos.' });
        }

        const { senha: _, ...dados } = usuario;
        return res.status(200).json(dados);
    } catch (erro) {
        return tratarErro(res, erro);
    }
};

const cadastrar = async (req, res) => {
    try {
        const { nome, email, senha } = req.body || {};

        if (!nome || !email || !senha) {
            return res.status(400).json({ erro: 'Campos obrigatórios: nome, email e senha.' });
        }

        const usuario = await prisma.usuario.create({
            data: { nome, email: String(email).trim().toLowerCase(), senha },
            omit: semSenha
        });
        return res.status(201).json(usuario);
    } catch (erro) {
        return tratarErro(res, erro);
    }
};

const listar = async (req, res) => {
    try {
        const usuarios = await prisma.usuario.findMany({
            omit: semSenha,
            orderBy: { nome: 'asc' }
        });
        return res.status(200).json(usuarios);
    } catch (erro) {
        return tratarErro(res, erro);
    }
};

const buscar = async (req, res) => {
    try {
        const id = Number(req.params.id);
        const usuario = await prisma.usuario.findUnique({
            where: { id },
            omit: semSenha,
            include: { eventos: true }
        });

        if (!usuario) return res.status(404).json({ erro: 'Usuário não encontrado.' });
        return res.status(200).json(usuario);
    } catch (erro) {
        return tratarErro(res, erro);
    }
};

const alterar = async (req, res) => {
    try {
        const id = Number(req.params.id);
        const { nome, email, senha } = req.body || {};

        const data = {};
        if (nome !== undefined) data.nome = nome;
        if (email !== undefined) data.email = String(email).trim().toLowerCase();
        if (senha !== undefined) data.senha = senha;

        const usuario = await prisma.usuario.update({
            where: { id },
            data,
            omit: semSenha
        });
        return res.status(200).json(usuario);
    } catch (erro) {
        return tratarErro(res, erro);
    }
};

// Exclui o usuário e os eventos registrados por ele (em uma transação)
const excluir = async (req, res) => {
    try {
        const id = Number(req.params.id);

        const usuario = await prisma.$transaction(async (tx) => {
            await tx.evento.deleteMany({ where: { usuarioId: id } });
            return tx.usuario.delete({ where: { id }, omit: semSenha });
        });

        return res.status(200).json(usuario);
    } catch (erro) {
        return tratarErro(res, erro);
    }
};

module.exports = { login, cadastrar, listar, buscar, alterar, excluir };
