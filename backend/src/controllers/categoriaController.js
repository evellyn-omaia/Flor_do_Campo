const { ler, salvar } = require("../data/store");
const listarCategorias = (q, s) => s.json(ler().categorias);
const buscarCategoriaPorId = (q, s) => {
  const x = ler().categorias.find((x) => x.id === +q.params.id);
  x ? s.json(x) : s.status(404).json({ mensagem: "Categoria não encontrada." });
};
const criarCategoria = (q, s) => {
  if (!q.body.nome)
    return s.status(400).json({ mensagem: "Nome obrigatório." });
  const d = ler(),
    categoria = {
      id: Date.now(),
      ativo: true,
      ...q.body,
      slug: q.body.slug || q.body.nome.toLowerCase().replace(/\s+/g, "-"),
    };
  d.categorias.push(categoria);
  salvar(d);
  s.status(201).json({ categoria });
};
const atualizarCategoria = (q, s) => {
  const d = ler(),
    x = d.categorias.find((x) => x.id === +q.params.id);
  if (!x) return s.status(404).json({ mensagem: "Categoria não encontrada." });
  Object.assign(x, q.body);
  salvar(d);
  s.json({ categoria: x });
};
const excluirCategoria = (q, s) => {
  const d = ler();
  d.categorias = d.categorias.filter((x) => x.id !== +q.params.id);
  salvar(d);
  s.json({ mensagem: "Categoria excluída." });
};
module.exports = {
  listarCategorias,
  buscarCategoriaPorId,
  criarCategoria,
  atualizarCategoria,
  excluirCategoria,
};
