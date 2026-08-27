const express = require("express");
const verificarAdmin = require("../middlewares/verificarAdmin");

const router = express.Router();

const produtoController = require("../controllers/produtoController");

router.get("/", produtoController.listarProdutos);
router.get("/:id", produtoController.buscarProdutoPorId);
router.post("/", verificarAdmin, produtoController.criarProduto);

router.put("/:id", verificarAdmin, produtoController.atualizarProduto);

router.delete("/:id", verificarAdmin, produtoController.excluirProduto);

module.exports = router;