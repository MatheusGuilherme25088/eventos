const express = require('express');
const router = express.Router();

const Usuario = require('../controllers/usuario.controller');

// [RF001.1] Rota de login (POST) que devolve os dados do usuário
router.post('/login', Usuario.login);

router.post('/', Usuario.cadastrar);
router.get('/', Usuario.listar);
router.get('/:id', Usuario.buscar);
router.put('/:id', Usuario.alterar);
router.patch('/:id', Usuario.alterar);
router.delete('/:id', Usuario.excluir);

module.exports = router;
