const db = require("../config/firebase");

async function obterBanners() {
  const snapshot = await db.ref("banners").once("value");
  const dados = snapshot.val() || {};

  return Object.entries(dados).map(([firebaseId, banner]) => ({
    ...banner,
    firebaseId
  }));
}

const listar = async (req, res) => {
  try {
    const banners = await obterBanners();

    res.json(banners);
  } catch (erro) {
    console.error(erro);

    res.status(500).json({
      mensagem: "Erro ao listar banners."
    });
  }
};

const criar = async (req, res) => {
  try {
    if (!req.body.titulo) {
      return res.status(400).json({
        mensagem: "Título obrigatório."
      });
    }

    const banner = {
      id: Date.now(),
      ativo: true,
      produtoIds: [],
      ...req.body
    };

    const referencia = db.ref("banners").push();

    await referencia.set(banner);

    res.status(201).json({
      banner: {
        ...banner,
        firebaseId: referencia.key
      }
    });
  } catch (erro) {
    console.error(erro);

    res.status(500).json({
      mensagem: "Erro ao criar banner."
    });
  }
};

const atualizar = async (req, res) => {
  try {
    const banners = await obterBanners();

    const banner = banners.find(
      (x) => String(x.id) === String(req.params.id)
    );

    if (!banner) {
      return res.status(404).json({
        mensagem: "Banner não encontrado."
      });
    }

    const atualizado = {
      ...banner,
      ...req.body
    };

    delete atualizado.firebaseId;

    await db
      .ref(`banners/${banner.firebaseId}`)
      .set(atualizado);

    res.json({
      banner: {
        ...atualizado,
        firebaseId: banner.firebaseId
      }
    });
  } catch (erro) {
    console.error(erro);

    res.status(500).json({
      mensagem: "Erro ao atualizar banner."
    });
  }
};

module.exports = {
  listar,
  criar,
  atualizar
};
