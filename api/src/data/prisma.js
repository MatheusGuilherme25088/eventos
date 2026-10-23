require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaMariaDb } = require('@prisma/adapter-mariadb');

// No Prisma 7 o PrismaClient precisa de um "driver adapter".
// Para MySQL/MariaDB (XAMPP) usamos o @prisma/adapter-mariadb.
// Aqui convertemos a DATABASE_URL do .env nos campos que o driver espera.
const url = new URL(process.env.DATABASE_URL);

const adapter = new PrismaMariaDb({
    host: url.hostname,
    port: Number(url.port) || 3306,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.replace('/', ''),
    connectionLimit: 5,
    allowPublicKeyRetrieval: true // necessário se usar MySQL 8 em vez de MariaDB
});

const prisma = new PrismaClient({ adapter });

module.exports = prisma;
