const { getAuth } = require("firebase-admin/auth");

const autenticar = async (req, res, next) => {
  try {
    const authorization = req.headers.authorization;

    if (!authorization || !authorization.startsWith("Bearer ")) {
      return res.status(401).json({
        mensagem: "Usuário não autenticado."
      });
    }

    const token = authorization.split("Bearer ")[1];

    const decodedToken = await getAuth().verifyIdToken(token);

    req.usuario = decodedToken;

    next();
  } catch (erro) {
    console.error("Erro na autenticação:", erro);

    return res.status(401).json({
      mensagem: "Token inválido ou expirado."
    });
  }
};

module.exports = autenticar;