import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  deleteUser,
  setPersistence,
  signInWithEmailAndPassword,
  updateProfile
} from "firebase/auth";
import { ref, set } from "firebase/database";

import Cabecalho from "../components/Cabecalho";
import Rodape from "../components/Rodape";
import Icone from "../components/Icone";
import { auth, database } from "../config/firebase";

function mensagemDeErro(erro, cadastro) {
  const mensagens = {
    "auth/email-already-in-use": "Este e-mail já possui uma conta.",
    "auth/invalid-email": "Informe um e-mail válido.",
    "auth/invalid-credential": "E-mail ou senha inválidos.",
    "auth/weak-password": "A senha deve ter pelo menos 6 caracteres.",
    "auth/network-request-failed": "Não foi possível conectar. Tente novamente."
  };

  return mensagens[erro?.code] || erro?.message ||
    (cadastro ? "Não foi possível criar sua conta." : "E-mail ou senha inválidos.");
}

function PaginaLogin() {
  const [modo, setModo] = useState("entrar");
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);
  const navegar = useNavigate();
  const cadastro = modo === "cadastro";

  function alterarModo(novoModo) {
    setModo(novoModo);
    setErro("");
    setSenha("");
    setConfirmacao("");
  }

  async function enviar(e) {
    e.preventDefault();
    setErro("");

    if (cadastro && senha !== confirmacao) {
      setErro("As senhas não coincidem.");
      return;
    }

    if (cadastro && senha.length < 6) {
      setErro("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    setCarregando(true);
    let usuarioCriado = null;

    try {
      await setPersistence(auth, browserLocalPersistence);

      if (cadastro) {
        const credencial = await createUserWithEmailAndPassword(
          auth,
          email.trim(),
          senha
        );
        usuarioCriado = credencial.user;

        await updateProfile(usuarioCriado, { displayName: nome.trim() });
        await set(ref(database, `usuarios/${usuarioCriado.uid}`), {
          nome: nome.trim(),
          email: usuarioCriado.email,
          telefone: telefone.trim(),
          tipo: "cliente",
          ativo: true,
          criadoEm: new Date().toISOString()
        });
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), senha);
      }

      navegar("/");
    } catch (falha) {
      console.error(falha);

      // Não deixa uma conta de autenticação incompleta se o perfil falhar.
      if (usuarioCriado) {
        try {
          await deleteUser(usuarioCriado);
        } catch (falhaAoRemover) {
          console.error("Não foi possível remover o cadastro incompleto:", falhaAoRemover);
        }
      }

      setErro(mensagemDeErro(falha, cadastro));
    } finally {
      setCarregando(false);
    }
  }

  return (
    <>
      <Cabecalho />

      <main className="pagina-conta">
        <form
          className={`formulario-login${cadastro ? " formulario-login--cadastro" : ""}`}
          onSubmit={enviar}
        >
          <div className="alternar-autenticacao" aria-label="Entrar ou criar conta">
            <button
              className={!cadastro ? "ativo" : ""}
              type="button"
              onClick={() => alterarModo("entrar")}
            >
              Entrar
            </button>
            <button
              className={cadastro ? "ativo" : ""}
              type="button"
              onClick={() => alterarModo("cadastro")}
            >
              Criar conta
            </button>
          </div>

          <div className="avatar"><Icone nome="usuario" /></div>
          <h1>{cadastro ? "Crie sua conta" : "Entrar na sua conta"}</h1>
          <p>{cadastro ? "Cadastre-se como cliente da Flor do Campo" : "Faça login para continuar"}</p>

          {cadastro && (
            <>
              <label>
                Nome completo
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Digite seu nome"
                  minLength="2"
                  autoComplete="name"
                  required
                />
              </label>
              <label>
                Telefone
                <input
                  type="tel"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  placeholder="(54) 99999-9999"
                  autoComplete="tel"
                />
              </label>
            </>
          )}

          <label>
            E-mail
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Digite seu e-mail"
              autoComplete="email"
              required
            />
          </label>

          <label>
            Senha
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="Digite sua senha"
              minLength={cadastro ? 6 : undefined}
              autoComplete={cadastro ? "new-password" : "current-password"}
              required
            />
          </label>

          {cadastro && (
            <label>
              Confirmar senha
              <input
                type="password"
                value={confirmacao}
                onChange={(e) => setConfirmacao(e.target.value)}
                placeholder="Digite a senha novamente"
                minLength="6"
                autoComplete="new-password"
                required
              />
            </label>
          )}

          {erro && <p className="erro">{erro}</p>}

          <button type="submit" disabled={carregando}>
            {carregando ? "Aguarde..." : cadastro ? "Criar minha conta" : "Entrar"}
          </button>

          {cadastro && (
            <p className="aviso-cadastro">
              Sua conta será salva com acesso exclusivo de cliente.
            </p>
          )}
        </form>
      </main>

      <Rodape />
    </>
  );
}

export default PaginaLogin;
