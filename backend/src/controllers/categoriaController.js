const db = require("../config/firebase");

async function obterCategorias() {
  const snapshot = await db.ref("categorias").once("value");
  const dados = snapshot.val() || {};

  return Object.entries(dados).map(([firebaseId, categoria]) => ({
    ...categoria,
    firebaseId
  }));
}

const listarCategorias = async (req, res) => {
  try {
    const categorias = await obterCategorias();

    res.json(categorias);
  } catch (erro) {
    console.error(erro);

    res.status(500).json({
      mensagem: "Erro ao listar categorias."
    });
  }
};

const buscarCategoriaPorId = async (req, res) => {
  try {
    const categorias = await obterCategorias();

    const categoria = categorias.find(
      (x) => String(x.id) === String(req.params.id)
    );

    if (!categoria) {
      return res.status(404).json({
        mensagem: "Categoria não encontrada."
      });
    }

    res.json(categoria);
  } catch (erro) {
    console.error(erro);

    res.status(500).json({
      mensagem: "Erro ao buscar categoria."
    });
  }
};

const criarCategoria = async (req, res) => {
  try {
    if (!req.body.nome) {
      return res.status(400).json({
        mensagem: "Nome obrigatório."
      });
    }

    const categoria = {
      id: Date.now(),
      ativo: true,
      ...req.body,
      slug:
        req.body.slug ||
        req.body.nome.toLowerCase().replace(/\s+/g, "-")
    };

    const referencia = db.ref("categorias").push();

    await referencia.set(categoria);

    res.status(201).json({
      categoria: {
        ...categoria,
        firebaseId: referencia.key
      }
    });
  } catch (erro) {
    console.error(erro);

    res.status(500).json({
      mensagem: "Erro ao criar categoria."
    });
  }
};

const atualizarCategoria = async (req, res) => {
  try {
    const categorias = await obterCategorias();

    const categoria = categorias.find(
      (x) => String(x.id) === String(req.params.id)
    );

    if (!categoria) {
      return res.status(404).json({
        mensagem: "Categoria não encontrada."
      });
    }

    const atualizada = {
      ...categoria,
      ...req.body
    };

    delete atualizada.firebaseId;

    await db
      .ref(`categorias/${categoria.firebaseId}`)
      .set(atualizada);

    res.json({
      categoria: {
        ...atualizada,
        firebaseId: categoria.firebaseId
      }
    });
  } catch (erro) {
    console.error(erro);

    res.status(500).json({
      mensagem: "Erro ao atualizar categoria."
    });
  }
};

const excluirCategoria = async (req, res) => {
  try {
    const categorias = await obterCategorias();

    const categoria = categorias.find(
      (x) => String(x.id) === String(req.params.id)
    );

    if (!categoria) {
      return res.status(404).json({
        mensagem: "Categoria não encontrada."
      });
    }

    await db
      .ref(`categorias/${categoria.firebaseId}`)
      .remove();

    res.json({
      mensagem: "Categoria excluída."
    });
  } catch (erro) {
    console.error(erro);

    res.status(500).json({
      mensagem: "Erro ao excluir categoria."
    });
  }
};

module.exports = {
  listarCategorias,
  buscarCategoriaPorId,
  criarCategoria,
  atualizarCategoria,
  excluirCategoria
};