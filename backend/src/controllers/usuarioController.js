const db = require("../config/firebase");

const obterPerfilAtual = async (req, res) => {
  try {
    const snapshot = await db
      .ref(`usuarios/${req.usuario.uid}`)
      .once("value");
    const dados = snapshot.val();

    if (!dados) {
      return res.status(404).json({
        mensagem: "Perfil do usuário não encontrado."
      });
    }

    res.json({
      ...dados,
      uid: req.usuario.uid,
      email: req.usuario.email || dados.email || ""
    });
  } catch (erro) {
    console.error("Erro ao buscar perfil:", erro);
    res.status(500).json({ mensagem: "Erro ao buscar perfil." });
  }
};

module.exports = { obterPerfilAtual };
