import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const publica = path.join(raiz, "public");
async function lerAmbiente() {
  const valores = {};
  for (const arquivo of [".env", ".env.production"]) {
    try {
      const texto = await readFile(path.join(raiz, arquivo), "utf8");
      texto.split(/\r?\n/).forEach(linha => {
        const resultado = linha.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
        if (resultado) valores[resultado[1]] = resultado[2].replace(/^['"]|['"]$/g, "");
      });
    } catch { /* arquivo de ambiente opcional */ }
  }
  return { ...valores, ...process.env };
}

const ambiente = await lerAmbiente();
const site = String(ambiente.VITE_SITE_URL || "").replace(/\/$/, "");
const api = String(ambiente.VITE_API_URL || "").replace(/\/$/, "");
const fixas = ["/", "/produtos", "/categorias", "/categoria/promocoes", "/sobre", "/contato", "/localizacao"];
const categoriasIniciais = ["feminina", "masculina", "infantil", "social", "casual", "acessorios"];
const produtosIniciais = ["Terno Slim Preto", "Camisa Social Branca", "Camisa Social Azul", "Calça de Alfaiataria", "Vestido Midi Rosé", "Bolsa Feminina Marrom"];

function escapar(valor) { return valor.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }

async function dadosPublicos() {
  if (!api) return { categorias: categoriasIniciais, produtos: produtosIniciais };
  try {
    const [resCategorias, resProdutos] = await Promise.all([fetch(`${api}/categorias`), fetch(`${api}/produtos`)]);
    if (!resCategorias.ok || !resProdutos.ok) throw new Error("API indisponível");
    const [categorias, produtos] = await Promise.all([resCategorias.json(), resProdutos.json()]);
    return {
      categorias: categorias.filter(item => item.ativo !== false && item.slug && item.slug !== "promocoes").map(item => item.slug),
      produtos: produtos.filter(item => item.status !== "inativo" && item.nome).map(item => item.nome)
    };
  } catch {
    console.warn("Sitemap: API indisponível; usando os dados públicos iniciais do projeto.");
    return { categorias: categoriasIniciais, produtos: produtosIniciais };
  }
}

const robotsBase = "User-agent: *\nAllow: /\n";
if (!site) {
  await writeFile(path.join(publica, "robots.txt"), `${robotsBase}\n# Configure VITE_SITE_URL para gerar sitemap e canonical.\n`, "utf8");
  console.warn("Sitemap não gerado: configure VITE_SITE_URL com o domínio público.");
  process.exit(0);
}

if (!/^https:\/\//i.test(site)) throw new Error("VITE_SITE_URL deve ser uma URL pública HTTPS.");
const dados = await dadosPublicos();
const caminhos = [...new Set([...fixas, ...dados.categorias.map(slug => `/categoria/${encodeURIComponent(slug)}`), ...dados.produtos.map(nome => `/produto/${encodeURIComponent(nome)}`)])];
const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${caminhos.map(caminho => `  <url><loc>${escapar(`${site}${caminho}`)}</loc></url>`).join("\n")}\n</urlset>\n`;
await writeFile(path.join(publica, "sitemap.xml"), xml, "utf8");
await writeFile(path.join(publica, "robots.txt"), `${robotsBase}\nSitemap: ${site}/sitemap.xml\n`, "utf8");
console.log(`Sitemap gerado com ${caminhos.length} URLs públicas.`);
