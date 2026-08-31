const db = require("../config/firebase");

function calcularEstoque(variacoes = {}) {
  return Object.values(variacoes).reduce(
    (totalCores, tamanhos) =>
      totalCores +
      Object.values(tamanhos || {}).reduce(
        (totalTamanhos, quantidade) =>
          totalTamanhos + Number(quantidade || 0),
        0
      ),
    0
  );
}

function preparar(p) {
  const estoqueTotal = calcularEstoque(p.variacoes);

  return {
    ...p,
    estoqueTotal,
    statusEstoque:
      estoqueTotal > 0 ? "em_estoque" : "esgotado",
  };
}

async function obterProdutos() {
  const snapshot = await db.ref("produtos").once("value");
  const dados = snapshot.val() || {};

  return Object.entries(dados).map(([chave, produto]) => ({
    ...produto,
    firebaseId: chave,
  }));
}

async function listarProdutos(req, res) {
  try {
    const produtos = await obterProdutos();

    res.json(produtos.map(preparar));
  } catch (erro) {
    console.error(erro);

    res.status(500).json({
      mensagem: "Erro ao listar produtos.",
    });
  }
}

async function buscarProdutoPorId(req, res) {
  try {
    const produtos = await obterProdutos();

    const produto = produtos.find(
      (p) => String(p.id) === String(req.params.id)
    );

    if (!produto) {
      return res.status(404).json({
        mensagem: "Produto não encontrado.",
      });
    }

    res.json(preparar(produto));
  } catch (erro) {
    console.error(erro);

    res.status(500).json({
      mensagem: "Erro ao buscar produto.",
    });
  }
}

async function criarProduto(req, res) {
  try {
    const { nome, preco, categoriaId } = req.body;

    if (!nome || preco === undefined || !categoriaId) {
      return res.status(400).json({
        mensagem: "Nome, preço e categoria são obrigatórios.",
      });
    }

    const produto = preparar({
      id: Date.now(),
      descricao: "",
      codigo: "",
      status: "ativo",
      imagem: "terno",
      promocao: {
        ativa: false,
      },
      variacoes: {},
      ...req.body,
      preco: Number(preco),
    });

    const referencia = db.ref("produtos").push();

    await referencia.set(produto);

    res.status(201).json({
      produto: preparar({
        ...produto,
        firebaseId: referencia.key,
      }),
    });
  } catch (erro) {
    console.error(erro);

    res.status(500).json({
      mensagem: "Erro ao criar produto.",
    });
  }
}

async function atualizarProduto(req, res) {
  try {
    const produtos = await obterProdutos();

    const produto = produtos.find(
      (p) => String(p.id) === String(req.params.id)
    );

    if (!produto) {
      return res.status(404).json({
        mensagem: "Produto não encontrado.",
      });
    }

    const atualizado = preparar({
      ...produto,
      ...req.body,
      firebaseId: undefined,
    });

    delete atualizado.firebaseId;

    await db
      .ref(`produtos/${produto.firebaseId}`)
      .set(atualizado);

    res.json({
      produto: preparar(atualizado),
    });
  } catch (erro) {
    console.error(erro);

    res.status(500).json({
      mensagem: "Erro ao atualizar produto.",
    });
  }
}

async function excluirProduto(req, res) {
  try {
    const produtos = await obterProdutos();

    const produto = produtos.find(
      (p) => String(p.id) === String(req.params.id)
    );

    if (!produto) {
      return res.status(404).json({
        mensagem: "Produto não encontrado.",
      });
    }

    await db
      .ref(`produtos/${produto.firebaseId}`)
      .remove();

    res.json({
      mensagem: "Produto excluído.",
    });
  } catch (erro) {
    console.error(erro);

    res.status(500).json({
      mensagem: "Erro ao excluir produto.",
    });
  }
}

module.exports = {
  listarProdutos,
  buscarProdutoPorId,
  criarProduto,
  atualizarProduto,
  excluirProduto,
};
