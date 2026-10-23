const express = require("express");

const router = express.Router();

const {
    cadastrar,
    listar,
    buscar,
    atualizar,
    excluir,
    resumo } = require("../controllers/evento.controller");

router.post("/cadastrar", cadastrar);
router.get("/listar", listar);
router.get("/buscar/:id", buscar);
router.put("/atualizar/:id", atualizar);
router.delete("/excluir/:id", excluir);
router.get("/resumo", resumo);

module.exports = router;
