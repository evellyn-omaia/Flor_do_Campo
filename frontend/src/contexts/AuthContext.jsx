import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../config/firebase";
import { buscarPerfilAtual } from "../services/api";
import { definirPerfilAtual } from "../data/lojaLocal";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuarioFirebase, setUsuarioFirebase] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => onAuthStateChanged(auth, async (usuario) => {
    setUsuarioFirebase(usuario);
    setPerfil(null);
    let perfilCarregado = null;

    if (usuario) {
      try {
        perfilCarregado = await buscarPerfilAtual();
      } catch (erro) {
        console.error("Não foi possível carregar o perfil do usuário:", erro);
        perfilCarregado = { uid: usuario.uid, email: usuario.email, nome: usuario.displayName || usuario.email };
      }
    }

    setPerfil(perfilCarregado);
    definirPerfilAtual(perfilCarregado);

    setCarregando(false);
  }), []);

  useEffect(() => {
    definirPerfilAtual(perfil);
  }, [perfil]);

  const usuario = useMemo(() => usuarioFirebase ? {
    uid: usuarioFirebase.uid,
    email: usuarioFirebase.email,
    nome: perfil?.nome || usuarioFirebase.displayName || usuarioFirebase.email,
    tipo: perfil?.tipo || "cliente",
    telefone: perfil?.telefone || "",
    ...perfil
  } : null, [usuarioFirebase, perfil]);

  const sair = () => signOut(auth);

  return <AuthContext.Provider value={{ usuario, carregando, sair }}>{carregando ? null : children}</AuthContext.Provider>;
}

export function useAuth() {
  const contexto = useContext(AuthContext);
  if (!contexto) throw new Error("useAuth deve ser usado dentro de AuthProvider.");
  return contexto;
}
