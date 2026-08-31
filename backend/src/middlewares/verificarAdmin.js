const db = require("../config/firebase");

const verificarAdmin = async (req, res, next) => {
  try {
    if (!req.usuario || !req.usuario.uid) {
      return res.status(401).json({
        mensagem: "Usuário não autenticado."
      });
    }

    const snapshot = await db
      .ref(`usuarios/${req.usuario.uid}`)
      .once("value");

    const usuario = snapshot.val();

    if (!usuario) {
      return res.status(403).json({
        mensagem: "Usuário não encontrado."
      });
    }

    if (usuario.tipo !== "admin") {
      return res.status(403).json({
        mensagem: "Acesso permitido somente para administradores."
      });
    }

    req.usuarioDados = usuario;

    next();
  } catch (erro) {
    console.error("Erro ao verificar administrador:", erro);

    return res.status(500).json({
      mensagem: "Erro ao verificar permissões."
    });
  }
};

module.exports = verificarAdmin;
