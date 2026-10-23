const prisma = require("../data/prisma");

const cadastrar = async (req, res) => {
    const data = req.body;

    try {
        const item = await prisma.evento.create({
            data
        });
        res.status(201).json(item);
    } catch (e) {
        res.status(400).json({ erro: "Não foi possível cadastrar o evento. Confira os campos." });
    }
};

const listar = async (req, res) => {
    // traz o nome de quem registrou o evento, para mostrar na tela
    const lista = await prisma.evento.findMany({
        include: { usuario: { select: { nome: true } } },
        orderBy: { id: "desc" }
    });

    res.status(200).json(lista);
};

const buscar = async (req, res) => {
    const { id } = req.params;

    const item = await prisma.evento.findUnique({
        where: { id: Number(id) }
    });

    if (!item) {
        return res.status(404).json({ erro: "Evento não encontrado." });
    }
    res.status(200).json(item);
};

const atualizar = async (req, res) => {
    const { id } = req.params;
    const dados = req.body;

    try {
        const item = await prisma.evento.update({
            where: { id: Number(id) },
            data: dados
        });
        res.status(200).json(item);
    } catch (e) {
        res.status(400).json({ erro: "Não foi possível atualizar o evento." });
    }
};

const excluir = async (req, res) => {
    const { id } = req.params;

    try {
        const item = await prisma.evento.delete({
            where: { id: Number(id) }
        });
        res.status(200).json(item);
    } catch (e) {
        res.status(404).json({ erro: "Evento não encontrado." });
    }
};

// resumo: quantidade de eventos por tipo
const resumo = async (req, res) => {
    const grupos = await prisma.evento.groupBy({
        by: ["tipoEvento"],
        _count: { id: true }
    });

    const porTipo = grupos.map(g => ({
        tipoEvento: g.tipoEvento,
        quantidade: g._count.id
    }));

    const total = await prisma.evento.count();

    res.status(200).json({ total, porTipo });
};

module.exports = {
    cadastrar,
    listar,
    buscar,
    atualizar,
    excluir,
    resumo
}
