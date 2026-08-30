const { ler, salvar } = require("../data/store");
const listar = (q, s) => s.json(ler().banners);
const criar = (q, s) => {
  if (!q.body.titulo)
    return s.status(400).json({ mensagem: "Título obrigatório." });
  const d = ler(),
    banner = { id: Date.now(), ativo: true, produtoIds: [], ...q.body };
  d.banners.push(banner);
  salvar(d);
  s.status(201).json({ banner });
};
const atualizar = (q, s) => {
  const d = ler(),
    b = d.banners.find((x) => x.id === +q.params.id);
  if (!b) return s.status(404).json({ mensagem: "Banner não encontrado." });
  Object.assign(b, q.body);
  salvar(d);
  s.json({ banner: b });
};
module.exports = { listar, criar, atualizar };
