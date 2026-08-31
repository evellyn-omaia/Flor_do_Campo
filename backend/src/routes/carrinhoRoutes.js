const router = require("express").Router();

const c = require("../controllers/carrinhoController");

const autenticar = require("../middlewares/authMiddleware");

router.get("/", autenticar, c.buscar);

router.post("/", autenticar, c.adicionar);

router.patch("/:produtoId", autenticar, c.atualizar);

router.delete("/:produtoId", autenticar, c.remover);

module.exports = router;
