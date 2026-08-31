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

  return (
    snapshot.val() || {
      clienteId,
      itens: []
    }
  );
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

    const item = carrinho.itens.find(
      (i) =>
        i.produtoId === produto.id &&
        i.cor === req.body.cor &&
        i.tamanho === req.body.tamanho
    );

    const quantidade = Number(req.body.quantidade);

    if (!quantidade || quantidade <= 0) {
      return res.status(400).json({
        mensagem: "Quantidade inválida."
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

    const item = carrinho.itens.find(
      (i) =>
        i.produtoId === Number(req.params.produtoId) &&
        i.cor === req.body.cor &&
        i.tamanho === req.body.tamanho
    );

    if (!item) {
      return res.status(404).json({
        mensagem: "Item não encontrado."
      });
    }

    item.quantidade = Math.max(
      1,
      Number(req.body.quantidade)
    );

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
