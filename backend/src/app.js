const express = require("express");
const categoriaRoutes = require("./routes/categoriaRoutes");
const cors = require("cors");
const produtosRoutes = require("./routes/produtoRoutes");
const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.json({
        mensagem: "API Flor do Campo funcionando!"
    });
});

app.use("/api/produtos", produtosRoutes);
app.use("/api/categorias", categoriaRoutes);

module.exports = app;