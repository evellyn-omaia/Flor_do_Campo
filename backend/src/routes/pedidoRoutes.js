const express = require("express");

const router = express.Router();

const pedidoController = require("../controllers/pedidoController");
const verificarAdmin = require("../middlewares/verificarAdmin");

router.post("/", pedidoController.criarPedido);

router.get("/", verificarAdmin, pedidoController.listarPedidos);

router.get("/:id", verificarAdmin, pedidoController.buscarPedidoPorId);

router.put(
    "/:id/status",
    verificarAdmin,
    pedidoController.atualizarStatusPedido
);

module.exports = router;