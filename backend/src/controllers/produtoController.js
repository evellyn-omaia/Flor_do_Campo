const { ler, salvar } = require("../data/store");
function preparar(p) {
  const total = Object.values(p.variacoes || {}).reduce(
    (a, c) => a + Object.values(c).reduce((s, n) => s + Number(n), 0),
    0,
  );
  return {
    ...p,
    estoqueTotal: total,
    statusEstoque: total ? "em_estoque" : "esgotado",
  };
}
const produtosProxy = { find: (fn) => ler().produtos.find(fn) };
const listarProdutos = (q, s) => s.json(ler().produtos.map(preparar));
const buscarProdutoPorId = (q, s) => {
  const p = ler().produtos.find((x) => x.id === +q.params.id);
  p
    ? s.json(preparar(p))
    : s.status(404).json({ mensagem: "Produto não encontrado." });
};
const criarProduto = (q, s) => {
  const d = ler();
  if (!q.body.nome || q.body.preco === undefined || !q.body.categoriaId)
    return s
      .status(400)
      .json({ mensagem: "Nome, preço e categoria são obrigatórios." });
  const p = {
    id: Date.now(),
    descricao: "",
    codigo: "",
    status: "ativo",
    imagem: "terno",
    promocao: { ativa: false },
    variacoes: {},
    ...q.body,
    preco: +q.body.preco,
  };
  d.produtos.push(p);
  salvar(d);
  s.status(201).json({ produto: preparar(p) });
};
const atualizarProduto = (q, s) => {
  const d = ler(),
    p = d.produtos.find((x) => x.id === +q.params.id);
  if (!p) return s.status(404).json({ mensagem: "Produto não encontrado." });
  Object.assign(p, q.body);
  salvar(d);
  s.json({ produto: preparar(p) });
};
const excluirProduto = (q, s) => {
  const d = ler();
  d.produtos = d.produtos.filter((x) => x.id !== +q.params.id);
  salvar(d);
  s.json({ mensagem: "Produto excluído." });
};
module.exports = {
  produtos: produtosProxy,
  listarProdutos,
  buscarProdutoPorId,
  criarProduto,
  atualizarProduto,
  excluirProduto,
};
