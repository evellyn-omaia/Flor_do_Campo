const db = require("../config/firebase");

async function buscarProduto(produtoId) {
  const snapshot = await db.ref("produtos").once("value");
  const produtos = snapshot.val() || {};

  const encontrado = Object.values(produtos).find(
    (produto) => String(produto.id) === String(produtoId)
  );

  return encontrado;
}

async function buscarCarrinho(clienteId) {
  const snapshot = await db
    .ref(`carrinhos/${clienteId}`)
    .once("value");
  const carrinho = snapshot.val() || {};

  return {
    clienteId,
    ...carrinho,
    itens: carrinho.itens || []
  };
}

function obterEstoqueVariacao(produto, cor, tamanho) {
  if (
    typeof cor !== "string" ||
    !Object.prototype.hasOwnProperty.call(
      produto.variacoes || {},
      cor
    )
  ) {
    return {
      erro: `A cor ${cor || "informada"} não existe para ${produto.nome}.`
    };
  }

  const tamanhos = produto.variacoes[cor] || {};

  if (
    typeof tamanho !== "string" ||
    !Object.prototype.hasOwnProperty.call(
      tamanhos,
      tamanho
    )
  ) {
    return {
      erro: `O tamanho ${tamanho || "informado"} não existe para ${produto.nome} na cor ${cor}.`
    };
  }

  const estoque = Number(tamanhos[tamanho]);

  if (!Number.isFinite(estoque) || estoque < 0) {
    return {
      erro: `O estoque de ${produto.nome} (${cor}/${tamanho}) está inválido.`
    };
  }

  return { estoque };
}

const buscar = async (req, res) => {
  try {
    const carrinho = await buscarCarrinho(req.usuario.uid);

    res.json(carrinho);
  } catch (erro) {
    console.error(erro);

    res.status(500).json({
      mensagem: "Erro ao buscar carrinho."
    });
  }
};

const adicionar = async (req, res) => {
  try {
    const produto = await buscarProduto(req.body.produtoId);

    if (!produto) {
      return res.status(404).json({
        mensagem: "Produto não encontrado."
      });
    }

    const clienteId = req.usuario.uid;
    const carrinho = await buscarCarrinho(clienteId);

    const quantidade = Number(req.body.quantidade);

    if (!Number.isInteger(quantidade) || quantidade <= 0) {
      return res.status(400).json({
        mensagem: "A quantidade deve ser um número inteiro maior que zero."
      });
    }

    const variacao = obterEstoqueVariacao(
      produto,
      req.body.cor,
      req.body.tamanho
    );

    if (variacao.erro) {
      return res.status(400).json({
        mensagem: variacao.erro
      });
    }

    const item = carrinho.itens.find(
      (i) =>
        String(i.produtoId) === String(produto.id) &&
        i.cor === req.body.cor &&
        i.tamanho === req.body.tamanho
    );

    const quantidadeTotal =
      Number(item?.quantidade || 0) + quantidade;

    if (quantidadeTotal > variacao.estoque) {
      return res.status(400).json({
        mensagem:
          `Estoque insuficiente para ${produto.nome} ` +
          `(${req.body.cor}/${req.body.tamanho}). ` +
          `Disponível: ${variacao.estoque}.`
      });
    }

    if (item) {
      item.quantidade += quantidade;
    } else {
      carrinho.itens.push({
        produtoId: produto.id,
        nome: produto.nome,
        preco: produto.promocao?.ativa
          ? produto.promocao.precoPromocional
          : produto.preco,
        imagem: produto.imagem,
        imagens: produto.imagens || [],
        quantidade,
        cor: req.body.cor,
        tamanho: req.body.tamanho
      });
    }

    await db
      .ref(`carrinhos/${clienteId}`)
      .set(carrinho);

    res.status(201).json(carrinho);
  } catch (erro) {
    console.error(erro);

    res.status(500).json({
      mensagem: "Erro ao adicionar produto ao carrinho."
    });
  }
};

const atualizar = async (req, res) => {
  try {
    const clienteId = req.usuario.uid;
    const carrinho = await buscarCarrinho(clienteId);
    const produto = await buscarProduto(req.params.produtoId);

    if (!produto) {
      return res.status(404).json({
        mensagem: "Produto não encontrado."
      });
    }

    const quantidade = Number(req.body.quantidade);

    if (!Number.isInteger(quantidade) || quantidade <= 0) {
      return res.status(400).json({
        mensagem: "A quantidade deve ser um número inteiro maior que zero."
      });
    }

    const variacao = obterEstoqueVariacao(
      produto,
      req.body.cor,
      req.body.tamanho
    );

    if (variacao.erro) {
      return res.status(400).json({
        mensagem: variacao.erro
      });
    }

    const item = carrinho.itens.find(
      (i) =>
        String(i.produtoId) === String(req.params.produtoId) &&
        i.cor === req.body.cor &&
        i.tamanho === req.body.tamanho
    );

    if (!item) {
      return res.status(404).json({
        mensagem: "Item não encontrado."
      });
    }

    if (quantidade > variacao.estoque) {
      return res.status(400).json({
        mensagem:
          `Estoque insuficiente para ${produto.nome} ` +
          `(${req.body.cor}/${req.body.tamanho}). ` +
          `Disponível: ${variacao.estoque}.`
      });
    }

    item.quantidade = quantidade;

    await db
      .ref(`carrinhos/${clienteId}`)
      .set(carrinho);

    res.json(carrinho);
  } catch (erro) {
    console.error(erro);

    res.status(500).json({
      mensagem: "Erro ao atualizar carrinho."
    });
  }
};

const remover = async (req, res) => {
  try {
    const clienteId = req.usuario.uid;
    const carrinho = await buscarCarrinho(clienteId);

    carrinho.itens = carrinho.itens.filter(
      (i) =>
        !(
          i.produtoId === Number(req.params.produtoId) &&
          i.cor === req.query.cor &&
          i.tamanho === req.query.tamanho
        )
    );

    await db
      .ref(`carrinhos/${clienteId}`)
      .set(carrinho);

    res.json(carrinho);
  } catch (erro) {
    console.error(erro);

    res.status(500).json({
      mensagem: "Erro ao remover item do carrinho."
    });
  }
};

module.exports = {
  buscar,
  adicionar,
  atualizar,
  remover
};
