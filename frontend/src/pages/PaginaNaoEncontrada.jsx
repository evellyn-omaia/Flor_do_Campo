import { Link } from "react-router-dom";
import Cabecalho from "../components/Cabecalho";
import Rodape from "../components/Rodape";

export default function PaginaNaoEncontrada() {
  return <><Cabecalho/><main className="pagina-conta"><div className="formulario-login"><h1>Página não encontrada</h1><p>O endereço acessado não existe ou não está mais disponível.</p><Link className="botao-principal" to="/">Voltar para o início</Link></div></main><Rodape/></>;
}
