const db = require("../config/firebase");

async function obterPedidos() {
  const snapshot = await db.ref("pedidos").once("value");
  const dados = snapshot.val() || {};

  return Object.entries(dados).map(([firebaseId, pedido]) => ({
    ...pedido,
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

    const itensAgrupados = new Map();

    for (const item of itens) {
      const quantidade = Number(item.quantidade);

      if (!Number.isInteger(quantidade) || quantidade <= 0) {
        return res.status(400).json({
          mensagem: "Todas as quantidades devem ser números inteiros maiores que zero."
        });
      }

      if (
        item.produtoId === undefined ||
        typeof item.cor !== "string" ||
        !item.cor.trim() ||
        typeof item.tamanho !== "string" ||
        !item.tamanho.trim()
      ) {
        return res.status(400).json({
          mensagem: "Produto, cor e tamanho são obrigatórios para todos os itens."
        });
      }

      const chave = JSON.stringify([
        String(item.produtoId),
        item.cor,
        item.tamanho
      ]);
      const existente = itensAgrupados.get(chave);

      if (existente) {
        existente.quantidade += quantidade;
      } else {
        itensAgrupados.set(chave, {
          ...item,
          quantidade
        });
      }
    }

    const itensNormalizados = [...itensAgrupados.values()];

    const agora = new Date().toISOString();
    const id = Date.now();
    const pedidoId = db.ref("pedidos").push().key;

    if (!pedidoId) {
      throw new Error("Não foi possível gerar a chave do pedido.");
    }

    // O SDK Admin pode executar inicialmente a função da transação com o
    // cache local vazio. Esta leitura hidrata o estado inicial; toda validação
    // e toda escrita continuam sendo feitas atomicamente pela transação.
    const raiz = db.ref();
    const estadoInicial = (await raiz.once("value")).val();

    let falhaTransacao = null;

    const resultado = await raiz.transaction((dados) => {
      falhaTransacao = null;

      // A proposta inicial usa uma cópia do snapshot aquecido. O servidor
      // aplica controle de versão e repete o callback em caso de conflito.
      if (dados === null && estadoInicial !== null) {
        dados = JSON.parse(JSON.stringify(estadoInicial));
      }

      if (!dados || !dados.produtos) {
        falhaTransacao = {
          status: 500,
          mensagem: "Produtos indisponíveis para finalizar o pedido."
        };
        return;
      }

      const produtos = Object.entries(dados.produtos);
      const calculados = [];
      const produtosAlterados = new Set();

      // Toda a validação acontece antes de qualquer alteração no estado.
      for (const item of itensNormalizados) {
        const encontrado = produtos.find(
          ([, produto]) =>
            String(produto.id) === String(item.produtoId)
        );

        if (!encontrado) {
          falhaTransacao = {
            status: 404,
            mensagem: `Produto ${item.nome || item.produtoId} não encontrado.`
          };
          return;
        }

        const [, produto] = encontrado;
        const estoque =
          produto.variacoes?.[item.cor]?.[item.tamanho];

        if (estoque === undefined) {
          falhaTransacao = {
            status: 400,
            mensagem: `A variação ${item.cor}/${item.tamanho} não existe para ${produto.nome}.`
          };
          return;
        }

        if (!Number.isFinite(Number(estoque)) || Number(estoque) < item.quantidade) {
          falhaTransacao = {
            status: 400,
            mensagem: `Estoque insuficiente para ${produto.nome} (${item.cor}/${item.tamanho}).`
          };
          return;
        }

        const preco = produto.promocao?.ativa
          ? Number(produto.promocao.precoPromocional)
          : Number(produto.preco);

        if (!Number.isFinite(preco) || preco < 0) {
          falhaTransacao = {
            status: 500,
            mensagem: `O preço de ${produto.nome} está inválido.`
          };
          return;
        }

        calculados.push({
          ...item,
          nome: produto.nome,
          imagem: produto.imagem,
          imagens: produto.imagens || [],
          precoUnitario: preco,
          subtotal: Number((item.quantidade * preco).toFixed(2))
        });
      }

      for (const item of calculados) {
        const [firebaseId, produto] = produtos.find(
          ([, produtoAtual]) =>
            String(produtoAtual.id) === String(item.produtoId)
        );

        produto.variacoes[item.cor][item.tamanho] =
          Number(produto.variacoes[item.cor][item.tamanho]) -
          item.quantidade;
        produtosAlterados.add(firebaseId);
      }

      for (const firebaseId of produtosAlterados) {
        const produto = dados.produtos[firebaseId];
        const estoqueTotal = Object.values(produto.variacoes || {})
          .reduce(
            (totalCores, tamanhos) =>
              totalCores + Object.values(tamanhos || {})
                .reduce(
                  (totalTamanhos, quantidade) =>
                    totalTamanhos + Number(quantidade || 0),
                  0
                ),
            0
          );

        produto.estoqueTotal = estoqueTotal;
        produto.statusEstoque =
          estoqueTotal > 0 ? "em_estoque" : "esgotado";
      }

      const total = Number(
        calculados
          .reduce(
            (soma, item) => soma + item.subtotal,
            0
          )
          .toFixed(2)
      );

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
        estoqueBaixadoEm: agora,
        historico: [
          {
            status: "aguardando",
            titulo: "Pedido realizado",
            data: agora
          }
        ]
      };

      dados.pedidos = dados.pedidos || {};
      dados.pedidos[pedidoId] = pedido;

      if (dados.carrinhos?.[clienteId]) {
        delete dados.carrinhos[clienteId].itens;
      }

      return dados;
    }, undefined, false);

    if (!resultado.committed) {
      return res
        .status(falhaTransacao?.status || 409)
        .json({
          mensagem:
            falhaTransacao?.mensagem ||
            "Não foi possível finalizar o pedido. Tente novamente."
        });
    }

    const pedido = resultado.snapshot
      .child(`pedidos/${pedidoId}`)
      .val();

    res.status(201).json({
      mensagem: "Pedido criado com sucesso!",
      pedido: {
        ...pedido,
        firebaseId: pedidoId
      }
    });
  } catch (erro) {
    console.error(erro);

    res.status(500).json({
      mensagem: "Erro ao criar pedido."
    });
  }
};

async function cancelarPedidoComReposicao(req, res) {
  const agora = new Date().toISOString();
  const raiz = db.ref();
  const estadoInicial = (await raiz.once("value")).val();
  let falhaTransacao = null;

  const resultado = await raiz.transaction((dados) => {
    falhaTransacao = null;

    if (dados === null && estadoInicial !== null) {
      dados = JSON.parse(JSON.stringify(estadoInicial));
    }

    const encontrado = Object.entries(dados?.pedidos || {})
      .find(([, pedido]) =>
        String(pedido.id) === String(req.params.id)
      );

    if (!encontrado) {
      falhaTransacao = {
        status: 404,
        mensagem: "Pedido não encontrado."
      };
      return;
    }

    const [firebaseId, pedido] = encontrado;

    // Um cancelamento repetido deve ser completamente idempotente.
    if (
      pedido.status === "cancelado" &&
      pedido.estoqueRestauradoEm
    ) {
      return dados;
    }

    const deveRestaurar =
      Boolean(pedido.estoqueBaixadoEm) &&
      !pedido.estoqueRestauradoEm;

    if (deveRestaurar) {
      const itens = Array.isArray(pedido.itens)
        ? pedido.itens
        : Object.values(pedido.itens || {});
      const restauracoes = new Map();

      for (const item of itens) {
        const quantidade = Number(item.quantidade);

        if (!Number.isInteger(quantidade) || quantidade <= 0) {
          falhaTransacao = {
            status: 409,
            mensagem: "O pedido possui uma quantidade inválida e não pode ter o estoque restaurado."
          };
          return;
        }

        const chave = JSON.stringify([
          String(item.produtoId),
          item.cor,
          item.tamanho
        ]);
        const atual = restauracoes.get(chave);

        if (atual) {
          atual.quantidade += quantidade;
        } else {
          restauracoes.set(chave, {
            produtoId: item.produtoId,
            cor: item.cor,
            tamanho: item.tamanho,
            quantidade
          });
        }
      }

      const produtos = Object.entries(dados.produtos || {});
      const validadas = [];

      // Valida todas as referências antes de modificar qualquer estoque.
      for (const restauracao of restauracoes.values()) {
        const produtoEncontrado = produtos.find(
          ([, produto]) =>
            String(produto.id) === String(restauracao.produtoId)
        );

        if (!produtoEncontrado) {
          falhaTransacao = {
            status: 409,
            mensagem: `O produto ${restauracao.produtoId} do pedido não existe mais.`
          };
          return;
        }

        const [produtoFirebaseId, produto] = produtoEncontrado;
        const estoque =
          produto.variacoes?.[restauracao.cor]?.[restauracao.tamanho];

        if (!Number.isFinite(Number(estoque))) {
          falhaTransacao = {
            status: 409,
            mensagem:
              `A variação ${restauracao.cor}/${restauracao.tamanho} ` +
              `de ${produto.nome} não existe mais.`
          };
          return;
        }

        validadas.push({
          ...restauracao,
          produtoFirebaseId
        });
      }

      const produtosAlterados = new Set();

      for (const restauracao of validadas) {
        const produto =
          dados.produtos[restauracao.produtoFirebaseId];

        produto.variacoes[restauracao.cor][restauracao.tamanho] =
          Number(
            produto.variacoes[restauracao.cor][restauracao.tamanho]
          ) + restauracao.quantidade;
        produtosAlterados.add(restauracao.produtoFirebaseId);
      }

      for (const produtoFirebaseId of produtosAlterados) {
        const produto = dados.produtos[produtoFirebaseId];
        const estoqueTotal = Object.values(produto.variacoes || {})
          .reduce(
            (totalCores, tamanhos) =>
              totalCores + Object.values(tamanhos || {})
                .reduce(
                  (totalTamanhos, quantidade) =>
                    totalTamanhos + Number(quantidade || 0),
                  0
                ),
            0
          );

        produto.estoqueTotal = estoqueTotal;
        produto.statusEstoque =
          estoqueTotal > 0 ? "em_estoque" : "esgotado";
      }

      pedido.estoqueRestauradoEm = agora;
    }

    const historico = Array.isArray(pedido.historico)
      ? pedido.historico
      : Object.values(pedido.historico || {});

    pedido.status = "cancelado";
    pedido.atualizadoEm = agora;
    pedido.historico = [
      ...historico,
      {
        status: "cancelado",
        titulo: "Pedido cancelado",
        data: agora
      }
    ];

    dados.pedidos[firebaseId] = pedido;
    return dados;
  }, undefined, false);

  if (!resultado.committed) {
    return res
      .status(falhaTransacao?.status || 409)
      .json({
        mensagem:
          falhaTransacao?.mensagem ||
          "Não foi possível cancelar o pedido."
      });
  }

  const pedidoEncontrado = Object.entries(
    resultado.snapshot.child("pedidos").val() || {}
  ).find(([, pedido]) =>
    String(pedido.id) === String(req.params.id)
  );

  const [firebaseId, pedido] = pedidoEncontrado;

  return res.json({
    mensagem: "Status atualizado.",
    pedido: {
      ...pedido,
      firebaseId
    }
  });
}

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

    if (status === "cancelado") {
      return await cancelarPedidoComReposicao(req, res);
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
