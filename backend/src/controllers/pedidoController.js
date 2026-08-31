const db = require("../config/firebase");

async function obterPedidos() {
  const snapshot = await db.ref("pedidos").once("value");
  const dados = snapshot.val() || {};

  return Object.entries(dados).map(([firebaseId, pedido]) => ({
    ...pedido,
    firebaseId
  }));
}

async function obterProdutos() {
  const snapshot = await db.ref("produtos").once("value");
  const dados = snapshot.val() || {};

  return Object.entries(dados).map(([firebaseId, produto]) => ({
    ...produto,
    firebaseId
  }));
}

const listarPedidos = async (req, res) => {
  try {
    const pedidos = await obterPedidos();

    pedidos.sort(
      (a, b) =>
        new Date(b.criadoEm) - new Date(a.criadoEm)
    );

    res.json(pedidos);
  } catch (erro) {
    console.error(erro);

    res.status(500).json({
      mensagem: "Erro ao listar pedidos."
    });
  }
};

const buscarPedidoPorId = async (req, res) => {
  try {
    const pedidos = await obterPedidos();

    const pedido = pedidos.find(
      (x) => String(x.id) === String(req.params.id)
    );

    if (!pedido) {
      return res.status(404).json({
        mensagem: "Pedido não encontrado."
      });
    }

    const usuarioSnapshot = await db
      .ref(`usuarios/${req.usuario.uid}`)
      .once("value");
    const usuario = usuarioSnapshot.val();

    if (
      String(pedido.clienteId) !== String(req.usuario.uid) &&
      usuario?.tipo !== "admin"
    ) {
      return res.status(403).json({
        mensagem: "Acesso negado a este pedido."
      });
    }

    res.json(pedido);
  } catch (erro) {
    console.error(erro);

    res.status(500).json({
      mensagem: "Erro ao buscar pedido."
    });
  }
};

const criarPedido = async (req, res) => {
  try {
    const {
      clienteNome,
      telefone,
      email,
      endereco,
      pagamento,
      itens
    } = req.body;

    if (
      !clienteNome ||
      !telefone ||
      !pagamento ||
      !itens?.length
    ) {
      return res.status(400).json({
        mensagem:
          "Identificação, pagamento e itens são obrigatórios."
      });
    }

    const clienteId = req.usuario.uid;
    const produtos = await obterProdutos();

    // Valida produtos e estoque
    for (const item of itens) {
      const produto = produtos.find(
        (p) =>
          String(p.id) === String(item.produtoId)
      );

      if (!produto) {
        return res.status(404).json({
          mensagem: `Produto ${item.nome} não encontrado.`
        });
      }

      const estoque =
        produto.variacoes?.[item.cor]?.[item.tamanho];

      if (
        estoque === undefined ||
        Number(estoque) < Number(item.quantidade)
      ) {
        return res.status(400).json({
          mensagem:
            `Estoque insuficiente para ${produto.nome}.`
        });
      }
    }

    const calculados = itens.map((item) => {
      const produto = produtos.find(
        (p) =>
          String(p.id) === String(item.produtoId)
      );

      const preco = produto.promocao?.ativa
        ? Number(produto.promocao.precoPromocional)
        : Number(produto.preco);

      const quantidade = Number(item.quantidade);

      return {
        ...item,
        nome: produto.nome,
        quantidade,
        precoUnitario: preco,
        subtotal: Number(
          (quantidade * preco).toFixed(2)
        )
      };
    });

    const total = Number(
      calculados
        .reduce(
          (total, item) => total + item.subtotal,
          0
        )
        .toFixed(2)
    );

    const agora = new Date().toISOString();
    const id = Date.now();

    const pedido = {
      id,
      codigo: `FC${String(id).slice(-6)}`,
      clienteId,
      clienteNome,
      telefone,
      email: email || req.usuario.email || "",
      endereco: endereco || {},
      pagamento,
      statusPagamento:
        pagamento === "dinheiro"
          ? "pendente"
          : "aprovado",
      itens: calculados,
      total,
      status: "aguardando",
      criadoEm: agora,
      atualizadoEm: agora,
      historico: [
        {
          status: "aguardando",
          titulo: "Pedido realizado",
          data: agora
        }
      ]
    };

    const referencia = db.ref("pedidos").push();

    await referencia.set(pedido);

    // Limpa o carrinho
    await db
      .ref(`carrinhos/${clienteId}/itens`)
      .remove();

    res.status(201).json({
      mensagem: "Pedido criado com sucesso!",
      pedido: {
        ...pedido,
        firebaseId: referencia.key
      }
    });
  } catch (erro) {
    console.error(erro);

    res.status(500).json({
      mensagem: "Erro ao criar pedido."
    });
  }
};

const atualizarStatusPedido = async (req, res) => {
  try {
    const permitidos = [
      "aguardando",
      "em_preparo",
      "pronto",
      "retirado",
      "cancelado"
    ];

    const status = req.body.status;

    if (!permitidos.includes(status)) {
      return res.status(400).json({
        mensagem: "Status inválido."
      });
    }

    const pedidos = await obterPedidos();

    const pedido = pedidos.find(
      (x) =>
        String(x.id) === String(req.params.id)
    );

    if (!pedido) {
      return res.status(404).json({
        mensagem: "Pedido não encontrado."
      });
    }

    const titulos = {
      aguardando: "Aguardando confirmação",
      em_preparo: "Pedido em preparação",
      pronto: "Pronto para buscar",
      retirado: "Pedido retirado",
      cancelado: "Pedido cancelado"
    };

    const agora = new Date().toISOString();

    const atualizado = {
      ...pedido,
      status,
      atualizadoEm: agora,
      historico: [
        ...(pedido.historico || []),
        {
          status,
          titulo: titulos[status],
          data: agora
        }
      ]
    };

    delete atualizado.firebaseId;

    await db
      .ref(`pedidos/${pedido.firebaseId}`)
      .set(atualizado);

    res.json({
      mensagem: "Status atualizado.",
      pedido: {
        ...atualizado,
        firebaseId: pedido.firebaseId
      }
    });
  } catch (erro) {
    console.error(erro);

    res.status(500).json({
      mensagem: "Erro ao atualizar status."
    });
  }
};

module.exports = {
  listarPedidos,
  buscarPedidoPorId,
  criarPedido,
  atualizarStatusPedido
};
