import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Cabecalho from "../components/Cabecalho";
import CartaoProduto, { corrigirImagemProduto, imagensProdutos } from "../components/CartaoProduto";
import Rodape from "../components/Rodape";
import SEO from "../components/SEO";
import { urlPublica } from "../components/seoConfig";
import { adicionarAoCarrinho, carregarLoja } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import { alternarFavorito, produtoFavorito } from "../data/favoritos";

const coresCss = { Preto: "#111", Branco: "#fff", "Azul Claro": "#8bc8e8", Azul: "#2277bb", Marrom: "#7b4a2e", Rosé: "#d991a7", Cinza: "#999", Bege: "#d8c0a0", Nude: "#d7b49e", Vermelho: "#d92525", Verde: "#219653", Rosa: "#ee7ba8", Amarelo: "#f2c94c", Laranja: "#f2994a", Roxo: "#9b51e0" };
const corCss = cor => coresCss[cor] || cor;

export default function PaginaProduto() {
  const { usuario } = useAuth();
  const { nome } = useParams(), navegar = useNavigate();
  const [dados, setDados] = useState({ produtos: [], categorias: [] }), [carregando, setCarregando] = useState(true);
  const [quantidade, setQuantidade] = useState(1), [cor, setCor] = useState(""), [tamanho, setTamanho] = useState("");
  const [aviso, setAviso] = useState(""), [favorito, setFavorito] = useState(false), [imagemAtiva, setImagemAtiva] = useState(0);

  useEffect(() => { carregarLoja().then(setDados).catch(() => setDados({ produtos: [], categorias: [] })).finally(() => setCarregando(false)); }, []);
  const produto = dados.produtos.find(item => item.nome === nome);
  useEffect(() => { if (produto) setFavorito(produtoFavorito(produto.id)); }, [produto?.id]);

  if (carregando) return <><SEO title="Carregando produto | Flor do Campo" description="Carregando informações do produto." path={`/produto/${encodeURIComponent(nome)}`} robots="noindex,follow"/><Cabecalho/><main className="produto-detalhe"><h1>Carregando produto...</h1></main></>;
  if (!produto) return <><SEO title="Produto não encontrado | Flor do Campo" description="O produto solicitado não foi encontrado." path={`/produto/${encodeURIComponent(nome)}`} robots="noindex,follow"/><Cabecalho/><main className="produto-detalhe"><div className="carrinho-vazio"><h1>Produto não encontrado</h1><p>Esse produto não existe ou não está mais disponível.</p><Link className="botao-principal" to="/produtos">Ver outros produtos</Link></div></main><Rodape/></>;

  const cores = Object.keys(produto.variacoes || {}), tamanhos = Object.keys(produto.variacoes?.[cor] || {});
  const categoriaDados = dados.categorias.find(item => item.id === produto.categoriaId), categoria = categoriaDados?.nome || "Produto";
  const fotos = produto.imagens?.length ? produto.imagens : [imagensProdutos[produto.identificador] || imagensProdutos.terno];
  const caminho = `/produto/${encodeURIComponent(produto.nome)}`, produtoUrl = urlPublica(caminho);
  const estoque = Object.values(produto.variacoes || {}).some(variacao => Object.values(variacao).some(valor => Number(valor) > 0));
  const breadcrumb = produtoUrl && urlPublica("/") ? { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Início", item: urlPublica("/") }, { "@type": "ListItem", position: 2, name: categoria, item: urlPublica(`/categoria/${categoriaDados?.slug || ""}`) }, { "@type": "ListItem", position: 3, name: produto.nome, item: produtoUrl }] } : null;
  const schema = { "@context": "https://schema.org", "@type": "Product", name: produto.nome, description: produto.descricao, sku: produto.codigo || undefined, image: urlPublica(fotos[0]) || undefined, url: produtoUrl || undefined, brand: { "@type": "Brand", name: "Flor do Campo" }, offers: { "@type": "Offer", priceCurrency: "BRL", price: produto.precoNumero, availability: estoque ? "https://schema.org/InStock" : "https://schema.org/OutOfStock", url: produtoUrl || undefined, seller: { "@type": "Organization", name: "Flor do Campo" } } };

  async function adicionar() { if (!usuario) return navegar("/login"); if (!cor || !tamanho) return setAviso("Escolha uma cor e um tamanho."); try { await adicionarAoCarrinho({ produtoId: produto.id, quantidade, cor, tamanho }); window.dispatchEvent(new Event("carrinho-atualizado")); setAviso("Produto adicionado ao carrinho!"); } catch (erro) { setAviso(erro.message); } }
  function favoritar() { if (!usuario) return navegar("/login"); setFavorito(alternarFavorito({ ...produto, categoria })); }

  return <><SEO title={`${produto.nome} | Flor do Campo`} description={`${produto.nome} na Flor do Campo, loja de roupas em Caxias do Sul. Consulte cores e tamanhos e retire seu pedido na loja.`} path={caminho} type="product" image={fotos[0]} schema={[schema, breadcrumb].filter(Boolean)}/><Cabecalho/><main className="produto-detalhe"><p className="breadcrumb"><Link to="/">Início</Link> &gt; {categoria} &gt; {produto.nome}</p><section className="produto-principal"><div className="produto-galeria"><div className="miniaturas">{fotos.map((foto, indice) => <button className={indice === imagemAtiva ? "ativa" : ""} onClick={() => setImagemAtiva(indice)} key={`${foto.slice(-15)}-${indice}`} aria-label={`Ver imagem ${indice + 1} de ${produto.nome}`}><img src={foto} onError={corrigirImagemProduto} alt={`${produto.nome} - imagem ${indice + 1}`}/></button>)}</div><div className="imagem-principal"><img src={fotos[imagemAtiva] || fotos[0]} onError={corrigirImagemProduto} alt={`${produto.nome} na Flor do Campo`}/></div></div><div className="produto-info"><span className="selo-categoria">{categoria}</span><h1>{produto.nome}</h1><p className="avaliacao">★★★★★ <b>4,8</b> (126 avaliações)</p><p>{produto.descricao || "Peça selecionada com acabamento de qualidade."}</p><hr/><strong className="preco-detalhe">{produto.preco}</strong><p className="parcelamento">Até 3x sem juros</p><b>Cor: {cor || "Selecione"}</b><div className="opcoes-cores cores-cliente">{cores.map(item => <button className={cor === item ? "selecionado" : ""} onClick={() => { setCor(item); setTamanho(""); }} key={item} title={item} style={{ background: corCss(item) }}><span>{item}</span></button>)}</div><b>Tamanho:</b><div className="tamanhos">{tamanhos.map(item => <button className={tamanho === item ? "selecionado" : ""} onClick={() => setTamanho(item)} key={item}>{item}</button>)}</div><p className="estoque-info">{cor && tamanho ? `${produto.variacoes[cor][tamanho]} unidades disponíveis` : "Selecione cor e tamanho para ver o estoque"}</p><b>Quantidade:</b><div className="comprar"><div className="quantidade"><button onClick={() => setQuantidade(Math.max(1, quantidade - 1))}>−</button><span>{quantidade}</span><button onClick={() => setQuantidade(quantidade + 1)}>+</button></div><button className="adicionar-carrinho" onClick={adicionar}>Adicionar ao carrinho</button><button className={`botao-favorito ${favorito ? "ativo" : ""}`} onClick={favoritar} aria-label="Adicionar à lista de desejos">♥</button></div>{aviso && <p className="aviso">{aviso}</p>}</div></section><section className="produto-complemento"><div><h2>Descrição</h2><p>{produto.descricao}</p></div><div><h2>Você também pode gostar</h2><div className="grade-produtos recomendados">{dados.produtos.filter(item => item.id !== produto.id).slice(0, 3).map(item => <CartaoProduto key={item.id}{...item}/>)}</div></div></section></main><Rodape/></>;
}
