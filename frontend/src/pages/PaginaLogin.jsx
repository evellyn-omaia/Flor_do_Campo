import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";

import Cabecalho from "../components/Cabecalho";
import Rodape from "../components/Rodape";
import Icone from "../components/Icone";

import { auth } from "../config/firebase";

function PaginaLogin() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");

  const navegar = useNavigate();

  async function entrar(e) {
    e.preventDefault();
    setErro("");

    try {
      await signInWithEmailAndPassword(
        auth,
        email,
        senha
      );

      navegar("/");
    } catch (erro) {
      console.error(erro);

      setErro("E-mail ou senha inválidos.");
    }
  }

  return (
    <>
      <Cabecalho />

      <main className="pagina-conta">
        <form
          className="formulario-login"
          onSubmit={entrar}
        >
          <div className="avatar">
            <Icone nome="usuario" />
          </div>

          <h1>Entrar na sua conta</h1>

          <p>Faça login para continuar</p>

          <label>
            E-mail
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Digite seu e-mail"
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
              required
            />
          </label>

          {erro && <p className="erro">{erro}</p>}

          <button type="submit">
            Entrar
          </button>
        </form>
      </main>

      <Rodape />
    </>
  );
}

export default PaginaLogin;
