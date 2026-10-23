const express = require("express");

const router = express.Router();

const {
    login,
    cadastrar,
    listar,
    buscar,
    atualizar,
    excluir } = require("../controllers/usuario.controller");

router.post("/login", login);
router.post("/cadastrar", cadastrar);
router.get("/listar", listar);
router.get("/buscar/:id", buscar);
router.put("/atualizar/:id", atualizar);
router.delete("/excluir/:id", excluir);

module.exports = router;
