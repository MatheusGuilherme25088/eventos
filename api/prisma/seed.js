const prisma = require('../src/data/prisma')

async function main() {
    await prisma.$transaction(async (transaction) => {
        await transaction.evento.deleteMany()
        await transaction.usuario.deleteMany()

        const dadosUsuarios = [
            { nome: "Ana Silva", email: "ana@email.com", senha: "senha123" },
            { nome: "Maria Silva", email: "maria@email.com", senha: "senha123" },
            { nome: "João Oliveira", email: "joao@email.com", senha: "senha123" },
            { nome: "Paula Martins", email: "paula@email.com", senha: "senha123" },
            { nome: "Pedro Souza", email: "pedro@email.com", senha: "senha123" }
        ]

        // Criação em sequência para manter a ordem (Ana, Maria, João, Paula, Pedro)
        const usuarios = []
        for (const data of dadosUsuarios) {
            usuarios.push(await transaction.usuario.create({ data }))
        }
        console.log("Usuarios de teste cadastrados.")

        // O deleteMany() NÃO reinicia o auto incremento do MySQL.
        // Por isso usamos o id real de cada usuário criado (usuarios[0].id, ...)
        // em vez de 1, 2, 3... fixos. Assim o seed pode ser executado várias vezes.
        const [ana, maria, joao, paula, pedro] = usuarios

        const dadosEventos = [
            { usuarioId: ana.id, cidade: "Amparo", tipoEvento: "Tempestade", temperaturaMaxima: 34.2, nivelImpacto: "Derrubada de árvores e destelhamento de edifícios" },
            { usuarioId: ana.id, cidade: "Campinas", tipoEvento: "Queimada", temperaturaMaxima: 38.2, nivelImpacto: "Perda de mata atlântica e área agrícola" },
            { usuarioId: maria.id, cidade: "Jaguariúna", tipoEvento: "Tempestade Magnética", temperaturaMaxima: 30.1, nivelImpacto: "Acidentes com pessoas atingidas por raios" },
            { usuarioId: maria.id, cidade: "Pedreira", tipoEvento: "Tempestade", temperaturaMaxima: 34.2, nivelImpacto: "Derrubada de árvores e destelhamento de edifícios" },
            { usuarioId: joao.id, cidade: "Monte Alegre do Sul", tipoEvento: "Vendaval", temperaturaMaxima: 36.2, nivelImpacto: "Derrubada de árvores e destelhamento de edifícios" },
            { usuarioId: joao.id, cidade: "Santo Antônio de Posse", tipoEvento: "Baixa umidade relativa do ar", temperaturaMaxima: 39.7, nivelImpacto: "Excesso de atendimento a pessoas com problemas respiratórios" },
            { usuarioId: paula.id, cidade: "Serra Negra", tipoEvento: "Geada", temperaturaMaxima: 6.2, nivelImpacto: "Perda de produção agrícola" },
            { usuarioId: pedro.id, cidade: "Águas de Lindóia", tipoEvento: "Tempestade", temperaturaMaxima: 34.8, nivelImpacto: "Derrubada de árvores e destelhamento de edifícios" }
        ]

        for (const data of dadosEventos) {
            await transaction.evento.create({ data })
        }
        console.log("Eventos de teste cadastrados.")
    }, { timeout: 20000 })
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
