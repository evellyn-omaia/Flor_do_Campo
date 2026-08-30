import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Cabecalho from "../components/Cabecalho";
import Rodape from "../components/Rodape";
import CartaoProduto, { imagensProdutos } from "../components/CartaoProduto";
import Icone from "../components/Icone";
import { usuarioAtual } from "../data/lojaLocal";
import { atualizarItemCarrinho, buscarCarrinho, carregarLoja, removerItemCarrinho } from "../services/api";

const dinheiro = (valor) => valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function PaginaCarrinho() {
  const usuario = usuarioAtual();
  const usuarioEmail = usuario?.email;
  const [itens, setItens] = useState([]);
  const [recomendados, setRecomendados] = useState([]);
  const [carregando, setCarregando] = useState(Boolean(usuario));
  const [mensagem, setMensagem] = useState("");
  const [cupom, setCupom] = useState("");
  const [desconto, setDesconto] = useState(0);

  useEffect(() => {
    carregarLoja().then((loja) => setRecomendados(loja.produtos.slice(0, 5))).catch(() => {});
    if (!usuarioEmail) return;
    buscarCarrinho(usuarioEmail)
      .then((carrinho) => setItens(carrinho.itens || []))
      .catch((erro) => setMensagem(erro.message))
      .finally(() => setCarregando(false));
  }, [usuarioEmail]);

  const subtotal = useMemo(() => itens.reduce((soma, item) => soma + item.preco * item.quantidade, 0), [itens]);
  const total = Math.max(0, subtotal - desconto);

  async function alterarQuantidade(item, quantidade) {
    const anterior = itens;
    setItens((lista) => lista.map((i) => i === item ? { ...i, quantidade } : i));
    try {
      const carrinho = await atualizarItemCarrinho(usuario.email, item.produtoId, { quantidade, cor: item.cor, tamanho: item.tamanho });
      setItens(carrinho.itens);
      window.dispatchEvent(new Event("carrinho-atualizado"));
    } catch (erro) {
      setItens(anterior);
      setMensagem(erro.message);
    }
  }

  async function remover(item) {
    try {
      const carrinho = await removerItemCarrinho(usuario.email, item.produtoId, item.cor, item.tamanho);
      setItens(carrinho.itens);
      setMensagem("Produto removido do carrinho.");
      window.dispatchEvent(new Event("carrinho-atualizado"));
    } catch (erro) { setMensagem(erro.message); }
  }

  async function limparCarrinho() {
    try {
      for (const item of itens) await removerItemCarrinho(usuario.email, item.produtoId, item.cor, item.tamanho);
      setItens([]);
      setMensagem("Carrinho limpo com sucesso.");
      window.dispatchEvent(new Event("carrinho-atualizado"));
    } catch (erro) { setMensagem(erro.message); }
  }

  function aplicarCupom(evento) {
    evento.preventDefault();
    if (cupom.trim().toUpperCase() === "FLOR10") {
      setDesconto(subtotal * .1);
      setMensagem("Cupom aplicado: 10% de desconto!");
    } else {
      setDesconto(0);
      setMensagem("Cupom inválido. Experimente FLOR10.");
    }
  }

  return <><Cabecalho /><main className="pagina-carrinho carrinho-referencia">
    <h1>Meu carrinho</h1><p className="breadcrumb"><Link to="/">Início</Link> <span>›</span> Carrinho</p>
    {mensagem && <div className="alerta-carrinho"><span><i className="ri-check-line"/></span>{mensagem}<button onClick={() => setMensagem("")}><i className="ri-close-line"/></button></div>}
    {carregando ? <div className="carrinho-vazio"><p>Carregando seu carrinho...</p></div> : !usuario ?
      <div className="carrinho-vazio"><h2>Entre para ver seu carrinho</h2><p>Seus produtos ficam vinculados à sua conta.</p><Link className="botao-principal" to="/login">Fazer login</Link></div> : itens.length === 0 ?
      <div className="carrinho-vazio"><h2>Seu carrinho está vazio</h2><p>Que tal encontrar algo especial para você?</p><Link className="botao-principal" to="/produtos">Ver produtos</Link></div> :
      <><div className="carrinho-grade"><section className="tabela-carrinho"><div className="tabela-carrinho__cabecalho"><b>Produto</b><b>Preço</b><b>Quantidade</b><b>Total</b><b>Ações</b></div>
        {itens.map((item) => <article className="linha-carrinho" key={`${item.produtoId}-${item.cor}-${item.tamanho}`}>
          <div className="linha-carrinho__produto"><img src={item.imagens?.[0] || imagensProdutos[item.imagem] || imagensProdutos.terno} alt={item.nome}/><span><b>{item.nome}</b><small>Cor: {item.cor}</small><small>Tamanho: {item.tamanho}</small></span></div>
          <strong className="preco-rosa">{dinheiro(item.preco)}</strong>
          <div className="contador-carrinho"><button disabled={item.quantidade <= 1} onClick={() => alterarQuantidade(item, item.quantidade - 1)}>−</button><span>{item.quantidade}</span><button onClick={() => alterarQuantidade(item, item.quantidade + 1)}>+</button></div>
          <strong>{dinheiro(item.preco * item.quantidade)}</strong>
          <button className="lixeira-carrinho" onClick={() => remover(item)} aria-label={`Remover ${item.nome}`}>♲</button>
        </article>)}
        <div className="acoes-carrinho"><Link to="/produtos"><i className="ri-arrow-left-line"/> Continuar comprando</Link><button onClick={limparCarrinho}><i className="ri-delete-bin-6-line"/> Limpar carrinho</button></div>
      </section><aside className="coluna-resumo"><div className="resumo-pedido"><h2>Resumo do pedido</h2><p>{itens.reduce((s,i) => s + i.quantidade, 0)} itens</p><dl><div><dt>Subtotal</dt><dd>{dinheiro(subtotal)}</dd></div>{desconto > 0 && <div><dt>Desconto</dt><dd>− {dinheiro(desconto)}</dd></div>}<div><dt>Frete</dt><dd className="preco-rosa">Calcular</dd></div></dl><div className="resumo-total"><b>Total</b><strong>{dinheiro(total)}</strong></div><Link className="finalizar-compra" to="/checkout"><i className="ri-secure-payment-line"/> Finalizar compra</Link></div>
        <form className="cupom" onSubmit={aplicarCupom}><h3>Cupom de desconto</h3><div><input value={cupom} onChange={(e) => setCupom(e.target.value)} placeholder="Digite seu cupom"/><button>Aplicar</button></div></form>
      </aside></div></>}
    {recomendados.length > 0 && <section className="recomendacoes-carrinho"><h2>Você também pode gostar</h2><div className="grade-produtos recomendados-carrinho">{recomendados.map((produto) => <CartaoProduto key={produto.id} {...produto}/>)}</div></section>}
    <section className="faixa-servicos"><div><Icone nome="caminhao"/><span><b>Frete para todo o Brasil</b><small>Consulte o prazo</small></span></div><div><i className="ri-loop-left-line servico-icone"/><span><b>Troca fácil e gratuita</b><small>Até 7 dias após o recebimento</small></span></div><div><i className="ri-shield-check-line servico-icone"/><span><b>Compra 100% segura</b><small>Seus dados protegidos</small></span></div><div><i className="ri-bank-card-line servico-icone"/><span><b>Parcelamento em até 6x</b><small>Sem juros no cartão</small></span></div></section>
  </main><Rodape /></>;
}
export default PaginaCarrinho;
