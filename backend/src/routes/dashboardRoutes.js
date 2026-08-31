const express = require("express");

const router = express.Router();

const dashboardController = require("../controllers/dashboardController");
const verificarAdmin = require("../middlewares/verificarAdmin");
const autenticar = require("../middlewares/authMiddleware");

router.get("/", autenticar, verificarAdmin, dashboardController.calcularDashboard);

module.exports = router;
