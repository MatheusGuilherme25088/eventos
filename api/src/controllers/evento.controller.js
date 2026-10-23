const prisma = require('../data/prisma');

// Dados do usuário que acompanham cada evento (sem senha)
const incluirUsuario = { usuario: { select: { id: true, nome: true } } };

function tratarErro(res, erro) {
    if (erro.code === 'P2025') return res.status(404).json({ erro: 'Evento não encontrado.' });
    if (erro.code === 'P2003') return res.status(400).json({ erro: 'Usuário informado não existe.' });
    console.error(erro);
    return res.status(500).json({ erro: 'Erro interno no servidor.' });
}

// Converte e valida o corpo da requisição.
// parcial = true -> usado no alterar (só valida o que foi enviado)
function montarDados(body = {}, parcial = false) {
    const erros = [];
    const data = {};

    const textos = { cidade: 50, tipoEvento: 50, nivelImpacto: 100 };
    for (const [campo, max] of Object.entries(textos)) {
        if (body[campo] === undefined) {
            if (!parcial) erros.push(`O campo ${campo} é obrigatório.`);
            continue;
        }
        const valor = String(body[campo]).trim();
        if (!valor) erros.push(`O campo ${campo} é obrigatório.`);
        else if (valor.length > max) erros.push(`O campo ${campo} aceita no máximo ${max} caracteres.`);
        else data[campo] = valor;
    }

    if (body.usuarioId !== undefined) {
        const usuarioId = Number(body.usuarioId);
        if (!Number.isInteger(usuarioId)) erros.push('usuarioId inválido.');
        else data.usuarioId = usuarioId;
    } else if (!parcial) {
        erros.push('O campo usuarioId é obrigatório.');
    }

    if (body.temperaturaMaxima !== undefined) {
        if (body.temperaturaMaxima === null || body.temperaturaMaxima === '') {
            data.temperaturaMaxima = null;
        } else {
            const temp = Number(body.temperaturaMaxima);
            if (Number.isNaN(temp)) erros.push('temperaturaMaxima deve ser um número.');
            else data.temperaturaMaxima = temp;
        }
    }

    if (body.data !== undefined && body.data !== null && body.data !== '') {
        const dt = new Date(body.data);
        if (Number.isNaN(dt.getTime())) erros.push('data inválida.');
        else data.data = dt;
    }

    return { data, erros };
}

const cadastrar = async (req, res) => {
    try {
        const { data, erros } = montarDados(req.body);
        if (erros.length) return res.status(400).json({ erro: erros.join(' ') });

        const evento = await prisma.evento.create({ data, include: incluirUsuario });
        return res.status(201).json(evento);
    } catch (erro) {
        return tratarErro(res, erro);
    }
};

// GET /evento            -> todos os eventos
// GET /evento?usuarioId=1 -> apenas os eventos de um usuário
const listar = async (req, res) => {
    try {
        const where = {};
        if (req.query.usuarioId) where.usuarioId = Number(req.query.usuarioId);

        const eventos = await prisma.evento.findMany({
            where,
            include: incluirUsuario,
            orderBy: [{ data: 'desc' }, { id: 'desc' }]
        });
        return res.status(200).json(eventos);
    } catch (erro) {
        return tratarErro(res, erro);
    }
};

const buscar = async (req, res) => {
    try {
        const evento = await prisma.evento.findUnique({
            where: { id: Number(req.params.id) },
            include: incluirUsuario
        });
        if (!evento) return res.status(404).json({ erro: 'Evento não encontrado.' });
        return res.status(200).json(evento);
    } catch (erro) {
        return tratarErro(res, erro);
    }
};

const alterar = async (req, res) => {
    try {
        const { data, erros } = montarDados(req.body, true);
        if (erros.length) return res.status(400).json({ erro: erros.join(' ') });

        const evento = await prisma.evento.update({
            where: { id: Number(req.params.id) },
            data,
            include: incluirUsuario
        });
        return res.status(200).json(evento);
    } catch (erro) {
        return tratarErro(res, erro);
    }
};

const excluir = async (req, res) => {
    try {
        const evento = await prisma.evento.delete({ where: { id: Number(req.params.id) } });
        return res.status(200).json(evento);
    } catch (erro) {
        return tratarErro(res, erro);
    }
};

// GET /evento/resumo -> total de eventos e quantidade/média de temperatura por tipo
const resumo = async (req, res) => {
    try {
        const grupos = await prisma.evento.groupBy({
            by: ['tipoEvento'],
            _count: { _all: true },
            _avg: { temperaturaMaxima: true },
            _max: { temperaturaMaxima: true }
        });

        const porTipo = grupos
            .map(g => ({
                tipoEvento: g.tipoEvento,
                quantidade: g._count._all,
                mediaTemperatura: g._avg.temperaturaMaxima !== null ? Number(g._avg.temperaturaMaxima.toFixed(1)) : null,
                maiorTemperatura: g._max.temperaturaMaxima
            }))
            .sort((a, b) => b.quantidade - a.quantidade);

        const total = porTipo.reduce((soma, g) => soma + g.quantidade, 0);
        return res.status(200).json({ total, porTipo });
    } catch (erro) {
        return tratarErro(res, erro);
    }
};

module.exports = { cadastrar, listar, buscar, alterar, excluir, resumo };
