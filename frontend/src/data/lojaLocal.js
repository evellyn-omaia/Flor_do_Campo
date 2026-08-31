import { signOut } from "firebase/auth";
import { auth } from "../config/firebase";

let perfilAtual = null;

export function definirPerfilAtual(perfil) {
  perfilAtual = perfil;
  window.dispatchEvent(new Event("loja-sessao"));
}

export function usuarioAtual() {
  const usuario = auth.currentUser;
  if (!usuario) return null;
  return {
    uid: usuario.uid,
    email: usuario.email,
    nome: perfilAtual?.nome || usuario.displayName || usuario.email,
    tipo: perfilAtual?.tipo || "cliente",
    ...perfilAtual,
  };
}

export async function sair() {
  await signOut(auth);
}
