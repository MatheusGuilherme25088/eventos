require('dotenv').config();
const express = require('express');
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

const eventoRoutes = require('./src/routes/evento.routes');
app.use('/evento', eventoRoutes);

const usuarioRoutes = require('./src/routes/usuario.routes');
app.use('/usuario', usuarioRoutes);

app.use('/', (req, res) => {
  res.json({
    msg: 'API eventos respondendo:', rotas: [
      { login: 'POST /usuario/login' },
      { usuario: '/usuario' },
      { eventos: '/evento' },
      { resumo: '/evento/resumo' }
    ]
  })
})

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor http://localhost:${PORT}`);
});
