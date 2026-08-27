let categorias = [];

const listarCategorias = (req, res) => {
    res.json(categorias);
};

const buscarCategoriaPorId = (req, res) => {
    const id = Number(req.params.id);

    const categoria = categorias.find(c => c.id === id);

    if (!categoria) {
        return res.status(404).json({
            mensagem: "Categoria não encontrada."
        });
    }

    res.json(categoria);
};

const criarCategoria = (req, res) => {
    const { nome } = req.body;

    if (!nome) {
        return res.status(400).json({
            mensagem: "O nome da categoria é obrigatório."
        });
    }

    const novaCategoria = {
        id: Date.now(),
        nome,
        ativo: true
    };

    categorias.push(novaCategoria);

    res.status(201).json({
        mensagem: "Categoria criada com sucesso!",
        categoria: novaCategoria
    });
};

const atualizarCategoria = (req, res) => {
    const id = Number(req.params.id);

    const categoria = categorias.find(c => c.id === id);

    if (!categoria) {
        return res.status(404).json({
            mensagem: "Categoria não encontrada."
        });
    }

    const { nome, ativo } = req.body;

    if (nome !== undefined) {
        categoria.nome = nome;
    }

    if (ativo !== undefined) {
        categoria.ativo = ativo;
    }

    res.json({
        mensagem: "Categoria atualizada com sucesso!",
        categoria
    });
};

const excluirCategoria = (req, res) => {
    const id = Number(req.params.id);

    const indice = categorias.findIndex(c => c.id === id);

    if (indice === -1) {
        return res.status(404).json({
            mensagem: "Categoria não encontrada."
        });
    }

    categorias.splice(indice, 1);

    res.json({
        mensagem: "Categoria excluída com sucesso!"
    });
};

module.exports = {
    listarCategorias,
    buscarCategoriaPorId,
    criarCategoria,
    atualizarCategoria,
    excluirCategoria
};