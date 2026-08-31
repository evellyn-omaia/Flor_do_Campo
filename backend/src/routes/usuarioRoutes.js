const router = require("express").Router();
const autenticar = require("../middlewares/authMiddleware");
const usuarioController = require("../controllers/usuarioController");

router.get("/me", autenticar, usuarioController.obterPerfilAtual);

module.exports = router;
