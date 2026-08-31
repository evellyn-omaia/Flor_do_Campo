const express = require("express");

const router = express.Router();

const categoriaController = require("../controllers/categoriaController");
const verificarAdmin = require("../middlewares/verificarAdmin");
const autenticar = require("../middlewares/authMiddleware");

router.get("/", categoriaController.listarCategorias);
router.get("/:id", categoriaController.buscarCategoriaPorId);

router.post("/", autenticar, verificarAdmin, categoriaController.criarCategoria);
router.put("/:id", autenticar, verificarAdmin, categoriaController.atualizarCategoria);
router.delete("/:id", autenticar, verificarAdmin, categoriaController.excluirCategoria);

module.exports = router;
