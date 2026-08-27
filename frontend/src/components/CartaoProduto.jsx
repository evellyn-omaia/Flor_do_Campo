import vestido from "../assets/images/referencia/produto-vestido.png";
import terno from "../assets/images/referencia/produto-terno.png";
import camisa from "../assets/images/referencia/produto-camisa.png";
import calca from "../assets/images/referencia/produto-calca.png";
import bolsa from "../assets/images/referencia/produto-bolsa.png";

const imagensProdutos = { vestido, terno, camisa, calca, bolsa };

function CartaoProduto({ nome, identificador }) {
  return <article className={"cartao-produto cartao-produto--" + identificador}><div className="cartao-produto__imagem"><img src={imagensProdutos[identificador]} alt={nome} /></div><div><h3>{nome}</h3><p>Consulte disponibilidade</p></div></article>;
}

export default CartaoProduto;
