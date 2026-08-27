const express = require("express");

const router = express.Router();

const categoriaController = require("../controllers/categoriaController");
const verificarAdmin = require("../middlewares/verificarAdmin");

router.get("/", categoriaController.listarCategorias);
router.get("/:id", categoriaController.buscarCategoriaPorId);

router.post("/", verificarAdmin, categoriaController.criarCategoria);
router.put("/:id", verificarAdmin, categoriaController.atualizarCategoria);
router.delete("/:id", verificarAdmin, categoriaController.excluirCategoria);

module.exports = router;