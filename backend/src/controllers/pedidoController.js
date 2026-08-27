let pedidos = [];

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

    pedido.status = status;

    res.json({
        mensagem: "Status do pedido atualizado com sucesso!",
        pedido
    });
};

module.exports = {
    listarPedidos,
    buscarPedidoPorId,
    criarPedido,
    atualizarStatusPedido
};