import Cabecalho from "../components/Cabecalho";
import CartaoCategoria from "../components/CartaoCategoria";
import CartaoProduto from "../components/CartaoProduto";
import FaixaWhatsApp from "../components/FaixaWhatsApp";
import Heroi from "../components/Heroi";
import Rodape from "../components/Rodape";
const categorias = [{ nome: "Feminina", tipo: "feminina" }, { nome: "Masculina", tipo: "masculina" }, { nome: "Infantil", tipo: "infantil" }, { nome: "Moda Social", tipo: "social" }, { nome: "Moda Casual", tipo: "casual" }, { nome: "Acessórios", tipo: "acessorios" }];
const produtos = [{ nome: "Vestido", identificador: "vestido" }, { nome: "Terno", identificador: "terno" }, { nome: "Camisa Social", identificador: "camisa" }, { nome: "Calça de Alfaiataria", identificador: "calca" }, { nome: "Bolsa", identificador: "bolsa" }];
function PaginaInicial() { return <><Cabecalho /><main><Heroi /><section className="secao" id="categorias"><div className="secao__conteudo"><h2>Nossas categorias</h2><div className="grade-categorias">{categorias.map((categoria) => <CartaoCategoria key={categoria.tipo} {...categoria} />)}</div></div></section><section className="secao secao--produtos" id="produtos"><div className="secao__conteudo"><h2>Produtos em destaque</h2><div className="grade-produtos">{produtos.map((produto) => <CartaoProduto key={produto.identificador} {...produto} />)}</div></div></section></main><FaixaWhatsApp /><Rodape /></>; }
export default PaginaInicial;
