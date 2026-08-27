import feminina from "../assets/images/referencia/categoria-feminina.png";
import masculina from "../assets/images/referencia/categoria-masculina.png";
import infantil from "../assets/images/referencia/categoria-infantil.png";
import social from "../assets/images/referencia/categoria-social.png";
import casual from "../assets/images/referencia/categoria-casual.png";
import acessorios from "../assets/images/referencia/categoria-acessorios.png";

const imagensCategorias = { feminina, masculina, infantil, social, casual, acessorios };

function CartaoCategoria({ nome, tipo }) {
  return <a className="cartao-categoria" href="#produtos"><img className="desenho-categoria" src={imagensCategorias[tipo]} alt="" /><span>{nome}</span></a>;
}

export default CartaoCategoria;
