const express = require("express");

const router = express.Router();

const dashboardController = require("../controllers/dashboardController");
const verificarAdmin = require("../middlewares/verificarAdmin");

router.get("/", verificarAdmin, dashboardController.calcularDashboard);

module.exports = router;