const express = require('express');
const router = express.Router();

const Evento = require('../controllers/evento.controller');

// /resumo precisa vir antes de /:id para não ser confundido com um id
router.get('/resumo', Evento.resumo);

router.post('/', Evento.cadastrar);
router.get('/', Evento.listar);
router.get('/:id', Evento.buscar);
router.put('/:id', Evento.alterar);
router.patch('/:id', Evento.alterar);
router.delete('/:id', Evento.excluir);

module.exports = router;
