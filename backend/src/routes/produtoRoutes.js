const express = require("express");
const verificarAdmin = require("../middlewares/verificarAdmin");
const autenticar = require("../middlewares/authMiddleware");

const router = express.Router();

const produtoController = require("../controllers/produtoController");

router.get("/", produtoController.listarProdutos);
router.get("/:id", produtoController.buscarProdutoPorId);
router.post("/", autenticar, verificarAdmin, produtoController.criarProduto);

router.put("/:id", autenticar, verificarAdmin, produtoController.atualizarProduto);

router.delete("/:id", autenticar, verificarAdmin, produtoController.excluirProduto);

module.exports = router;
