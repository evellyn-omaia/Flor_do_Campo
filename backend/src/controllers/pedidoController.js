const pedidos = [];
const { produtos } = require("./produtoController");

const encontrarEstoque = (produto, cor, tamanho) => {
    if (!produto.variacoes || !cor || !tamanho) {
        return null;
    }

    const corEncontrada = Object.keys(produto.variacoes).find(
        nomeCor => nomeCor.toLowerCase() === String(cor).toLowerCase()
    );

    if (!corEncontrada) {
        return null;
    }

    const variacoesCor = produto.variacoes[corEncontrada];

    const tamanhoEncontrado = Object.keys(variacoesCor).find(
        nomeTamanho =>
            nomeTamanho.toLowerCase() === String(tamanho).toLowerCase()
    );

    if (!tamanhoEncontrado) {
        return null;
    }

    return variacoesCor[tamanhoEncontrado];
};

const listarPedidos = (req, res) => {
    res.json(pedidos);
};

const buscarPedidoPorId = (req, res) => {
    const id = Number(req.params.id);

    const pedido = pedidos.find(p => p.id === id);

    if (!pedido) {
        return res.status(404).json({
            mensagem: "Pedido não encontrado."
        });
    }

    res.json(pedido);
};

const criarPedido = (req, res) => {
    const { clienteId, clienteNome, itens } = req.body;

    if (!clienteId || !clienteNome || !itens || itens.length === 0) {
        return res.status(400).json({
            mensagem: "Cliente e itens do pedido são obrigatórios."
        });
    }

    for (const item of itens) {
    const produto = produtos.find(
        p => String(p.id) === String(item.produtoId)
    );

    if (!produto) {
        return res.status(404).json({
            mensagem: `Produto ${item.nome} não encontrado.`
        });
    }

    const estoque = encontrarEstoque(
        produto,
        item.cor,
        item.tamanho
    );

    if (estoque === null) {
        return res.status(400).json({
            mensagem: `Variação ${item.cor}/${item.tamanho} não encontrada para ${item.nome}.`
        });
    }

    if (Number(item.quantidade) > Number(estoque)) {
        return res.status(400).json({
            mensagem: `Estoque insuficiente para ${item.nome}. Disponível: ${estoque}.`
        });
    }
}

    const itensCalculados = itens.map(item => {

        
     const subtotal = Number(
    (Number(item.precoUnitario) * Number(item.quantidade)).toFixed(2)
);

        return {
            produtoId: item.produtoId,
            nome: item.nome,
            cor: item.cor,
            tamanho: item.tamanho,
            quantidade: Number(item.quantidade),
            precoUnitario: Number(item.precoUnitario),
            subtotal
        };
    });

const total = Number(
    itensCalculados
        .reduce((soma, item) => soma + item.subtotal, 0)
        .toFixed(2)
);

    const novoPedido = {
        id: Date.now(),
        clienteId,
        clienteNome,
        itens: itensCalculados,
        total,
        status: "pendente",
        criadoEm: new Date().toISOString()
    };

    pedidos.push(novoPedido);

    res.status(201).json({
        mensagem: "Pedido criado com sucesso!",
        pedido: novoPedido
    });
};

const atualizarStatusPedido = (req, res) => {
    const id = Number(req.params.id);
    const { status } = req.body;

    const pedido = pedidos.find(p => p.id === id);

    if (!pedido) {
        return res.status(404).json({
            mensagem: "Pedido não encontrado."
        });
    }

    const statusPermitidos = [
        "pendente",
        "confirmado",
        "enviado",
        "finalizado",
        "cancelado"
    ];

    if (!statusPermitidos.includes(status)) {
        return res.status(400).json({
            mensagem: "Status de pedido inválido."
        });
    }

    // Evita descontar o estoque novamente
    if (pedido.status === "finalizado" && status === "finalizado") {
        return res.status(400).json({
            mensagem: "Este pedido já foi finalizado."
        });
    }

    // Desconta o estoque somente quando o pedido é finalizado
    if (status === "finalizado" && pedido.status !== "finalizado") {

        for (const item of pedido.itens) {
            const produto = produtos.find(
                p => String(p.id) === String(item.produtoId)
            );

            if (!produto) {
                return res.status(404).json({
                    mensagem: `Produto ${item.nome} não encontrado.`
                });
            }

            const corEncontrada = Object.keys(produto.variacoes).find(
                cor =>
                    cor.toLowerCase() ===
                    String(item.cor).toLowerCase()
            );

            if (!corEncontrada) {
                return res.status(400).json({
                    mensagem: `Cor ${item.cor} não encontrada para ${item.nome}.`
                });
            }

            const tamanhoEncontrado = Object.keys(
                produto.variacoes[corEncontrada]
            ).find(
                tamanho =>
                    tamanho.toLowerCase() ===
                    String(item.tamanho).toLowerCase()
            );

            if (!tamanhoEncontrado) {
                return res.status(400).json({
                    mensagem: `Tamanho ${item.tamanho} não encontrado para ${item.nome}.`
                });
            }

            const estoqueAtual = Number(
                produto.variacoes[corEncontrada][tamanhoEncontrado]
            );

            if (estoqueAtual < Number(item.quantidade)) {
                return res.status(400).json({
                    mensagem: `Estoque insuficiente para finalizar ${item.nome}.`
                });
            }
        }

        // Agora que todos os itens foram validados, desconta o estoque
        for (const item of pedido.itens) {
            const produto = produtos.find(
                p => String(p.id) === String(item.produtoId)
            );

            const corEncontrada = Object.keys(produto.variacoes).find(
                cor =>
                    cor.toLowerCase() ===
                    String(item.cor).toLowerCase()
            );

            const tamanhoEncontrado = Object.keys(
                produto.variacoes[corEncontrada]
            ).find(
                tamanho =>
                    tamanho.toLowerCase() ===
                    String(item.tamanho).toLowerCase()
            );

            produto.variacoes[corEncontrada][tamanhoEncontrado] -=
                Number(item.quantidade);

            const estoqueTotal = Object.values(produto.variacoes)
                .reduce(
                    (total, cor) =>
                        total +
                        Object.values(cor).reduce(
                            (soma, quantidade) =>
                                soma + Number(quantidade),
                            0
                        ),
                    0
                );

            produto.estoqueTotal = estoqueTotal;

            if (estoqueTotal === 0) {
                produto.statusEstoque = "esgotado";
            } else if (estoqueTotal <= 5) {
                produto.statusEstoque = "ultimas_unidades";
            } else {
                produto.statusEstoque = "em_estoque";
            }
        }
    }

    pedido.status = status;

    res.json({
        mensagem: "Status do pedido atualizado com sucesso!",
        pedido
    });
};

module.exports = {
    pedidos,
    listarPedidos,
    buscarPedidoPorId,
    criarPedido,
    atualizarStatusPedido
};