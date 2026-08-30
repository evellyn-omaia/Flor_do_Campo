export const usuariosTeste = [
  {
    email: "cliente@flordocampo.com",
    senha: "cliente123",
    nome: "Maria Silva",
    tipo: "cliente",
  },
  {
    email: "admin@flordocampo.com",
    senha: "admin123",
    nome: "Admin",
    tipo: "admin",
  },
];
export function autenticar(email, senha) {
  const usuario = usuariosTeste.find(
    (item) => item.email === email && item.senha === senha,
  );
  if (usuario) {
    sessionStorage.setItem("flor-do-campo-usuario", JSON.stringify(usuario));
    window.dispatchEvent(new Event("loja-sessao"));
  }
  return usuario;
}
export function usuarioAtual() {
  try {
    return JSON.parse(sessionStorage.getItem("flor-do-campo-usuario"));
  } catch {
    return null;
  }
}
export function sair() {
  sessionStorage.removeItem("flor-do-campo-usuario");
  window.dispatchEvent(new Event("loja-sessao"));
}
