const express = require("express");

const router = express.Router();

const pedidoController = require("../controllers/pedidoController");

const autenticar = require("../middlewares/authMiddleware");
const verificarAdmin = require("../middlewares/verificarAdmin");

router.post("/", autenticar, pedidoController.criarPedido);

router.get(
  "/",
  autenticar,
  verificarAdmin,
  pedidoController.listarPedidos
);

router.get(
  "/:id",
  autenticar,
  pedidoController.buscarPedidoPorId
);

router.patch(
  "/:id/status",
  autenticar,
  verificarAdmin,
  pedidoController.atualizarStatusPedido
);

module.exports = router;