let produtos = [];

const calcularEstoque = (variacoes = {}) => {
    let total = 0;

    Object.values(variacoes).forEach(cor => {
        Object.values(cor).forEach(quantidade => {
            total += Number(quantidade);
        });
    });

    let statusEstoque;

    if (total === 0) {
        statusEstoque = "esgotado";
    } else if (total <= 5) {
        statusEstoque = "ultimas_unidades";
    } else {
        statusEstoque = "em_estoque";
    }

    return {
        estoqueTotal: total,
        statusEstoque
    };
};
const listarProdutos = (req, res) => {
    res.json(produtos);
};

const buscarProdutoPorId = (req, res) => {
    const id = Number(req.params.id);

    const produto = produtos.find(p => p.id === id);

    if (!produto) {
        return res.status(404).json({
            mensagem: "Produto não encontrado."
        });
    }

    res.json(produto);
};

const criarProduto = (req, res) => {
    const {
        nome,
        descricao,
        preco,
        categoriaId,
        codigo,
        status,
        imagem,
        promocao,
        variacoes
    } = req.body;

    if (!nome || preco === undefined || !categoriaId) {
        return res.status(400).json({
            mensagem: "Nome, preço e categoria são obrigatórios."
        });
    }

    if (Number(preco) < 0) {
        return res.status(400).json({
            mensagem: "O preço não pode ser negativo."
        });
    }
    const estoque = calcularEstoque(variacoes);

    const novoProduto = {
        id: Date.now(),
        nome,
        descricao: descricao || "",
        preco: Number(preco),
        categoriaId,
        codigo: codigo || "",
        status: status || "ativo",
        imagem: imagem || "",
        promocao: promocao || {
            ativa: false,
            precoPromocional: null
        },
        variacoes: variacoes || {},

        estoqueTotal: estoque.estoqueTotal,
statusEstoque: estoque.statusEstoque,
        criadoEm: new Date().toISOString()
    };

    produtos.push(novoProduto);

    res.status(201).json({
        mensagem: "Produto criado com sucesso!",
        produto: novoProduto
    });
};

const atualizarProduto = (req, res) => {
    const id = Number(req.params.id);

    const produto = produtos.find(p => p.id === id);

    if (!produto) {
        return res.status(404).json({
            mensagem: "Produto não encontrado."
        });
    }

    const dados = req.body;

    Object.keys(dados).forEach(campo => {
        produto[campo] = dados[campo];
    });

if (dados.variacoes !== undefined) {
    const estoque = calcularEstoque(produto.variacoes);

    produto.estoqueTotal = estoque.estoqueTotal;
    produto.statusEstoque = estoque.statusEstoque;
}

    res.json({
        mensagem: "Produto atualizado com sucesso!",
        produto
    });
};

const excluirProduto = (req, res) => {
    const id = Number(req.params.id);

    const indice = produtos.findIndex(p => p.id === id);

    if (indice === -1) {
        return res.status(404).json({
            mensagem: "Produto não encontrado."
        });
    }

    produtos.splice(indice, 1);

    res.json({
        mensagem: "Produto excluído com sucesso!"
    });
};

module.exports = {
    produtos,
    listarProdutos,
    buscarProdutoPorId,
    criarProduto,
    atualizarProduto,
    excluirProduto
};