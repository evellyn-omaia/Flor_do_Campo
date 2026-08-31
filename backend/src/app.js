const express = require("express");
const pedidoRoutes = require("./routes/pedidoRoutes");
const categoriaRoutes = require("./routes/categoriaRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const cors = require("cors");
const produtosRoutes = require("./routes/produtoRoutes");
const bannerRoutes = require("./routes/bannerRoutes");
const carrinhoRoutes = require("./routes/carrinhoRoutes");
const usuarioRoutes = require("./routes/usuarioRoutes");
const app = express();

app.use(cors());
app.use(express.json({ limit: "50mb" }));

app.get("/", (req, res) => {
    res.json({
        mensagem: "API Flor do Campo funcionando!"
    });
});

app.use("/api/produtos", produtosRoutes);
app.use("/api/banners", bannerRoutes);
app.use("/api/carrinho", carrinhoRoutes);
app.use("/api/categorias", categoriaRoutes);
app.use("/api/pedidos", pedidoRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/usuarios", usuarioRoutes);

module.exports = app;
