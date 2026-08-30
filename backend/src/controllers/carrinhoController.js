const { ler, salvar } = require("../data/store");
const buscar = (q, s) =>
  s.json(
    ler().carrinhos[q.params.clienteId] || {
      clienteId: q.params.clienteId,
      itens: [],
    },
  );
const adicionar = (q, s) => {
  const d = ler(),
    produto = d.produtos.find((p) => p.id === +q.body.produtoId);
  if (!produto)
    return s.status(404).json({ mensagem: "Produto não encontrado." });
  const carrinho = d.carrinhos[q.params.clienteId] || {
      clienteId: q.params.clienteId,
      itens: [],
    },
    item = carrinho.itens.find(
      (i) =>
        i.produtoId === produto.id &&
        i.cor === q.body.cor &&
        i.tamanho === q.body.tamanho,
    );
  if (item) item.quantidade += +q.body.quantidade;
  else
    carrinho.itens.push({
      produtoId: produto.id,
      nome: produto.nome,
      preco: produto.promocao?.ativa
        ? produto.promocao.precoPromocional
        : produto.preco,
      imagem: produto.imagem,
      imagens: produto.imagens || [],
      quantidade: +q.body.quantidade,
      cor: q.body.cor,
      tamanho: q.body.tamanho,
    });
  d.carrinhos[q.params.clienteId] = carrinho;
  salvar(d);
  s.status(201).json(carrinho);
};
const atualizar = (q, s) => {
  const d = ler(),
    c = d.carrinhos[q.params.clienteId],
    i = c?.itens.find(
      (i) =>
        i.produtoId === +q.params.produtoId &&
        i.cor === q.body.cor &&
        i.tamanho === q.body.tamanho,
    );
  if (!i) return s.status(404).json({ mensagem: "Item não encontrado." });
  i.quantidade = Math.max(1, +q.body.quantidade);
  salvar(d);
  s.json(c);
};
const remover = (q, s) => {
  const d = ler(),
    c = d.carrinhos[q.params.clienteId] || { itens: [] };
  c.itens = c.itens.filter(
    (i) =>
      !(
        i.produtoId === +q.params.produtoId &&
        i.cor === q.query.cor &&
        i.tamanho === q.query.tamanho
      ),
  );
  d.carrinhos[q.params.clienteId] = c;
  salvar(d);
  s.json(c);
};
module.exports = { buscar, adicionar, atualizar, remover };
