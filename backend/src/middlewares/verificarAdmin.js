const verificarAdmin = (req, res, next) => {
    const tipoUsuario = req.headers["tipo-usuario"];

    if (!tipoUsuario) {
        return res.status(401).json({
            mensagem: "Usuário não autenticado."
        });
    }

    if (tipoUsuario !== "admin") {
        return res.status(403).json({
            mensagem: "Acesso permitido somente para administradores."
        });
    }

    next();
};

module.exports = verificarAdmin;