import { useLocation } from "react-router-dom";
import SEO from "./SEO";
import { urlPublica } from "./seoConfig";

const endereco = {
  "@type": "PostalAddress",
  streetAddress: "Rua Elpídio Pereira da Silva, 1674",
  addressLocality: "Caxias do Sul",
  addressRegion: "RS",
  addressCountry: "BR"
};

const loja = {
  "@context": "https://schema.org",
  "@type": "ClothingStore",
  name: "Flor do Campo",
  description: "Loja de roupas e moda no Bairro Serrano, em Caxias do Sul, com retirada na loja.",
  telephone: "+55 54 99206-6660",
  address: endereco,
  sameAs: ["https://instagram.com/loja.flordocampo01"]
};

const publicas = {
  "/": ["Flor do Campo | Loja de Roupas em Caxias do Sul", "Conheça a Flor do Campo, loja de roupas no Bairro Serrano, em Caxias do Sul. Moda feminina, masculina, infantil, social e casual com retirada na loja."],
  "/produtos": ["Produtos | Flor do Campo – Moda em Caxias do Sul", "Veja roupas e acessórios da Flor do Campo em Caxias do Sul. Escolha seus produtos online e retire na loja no Bairro Serrano."],
  "/categorias": ["Categorias | Flor do Campo – Moda em Caxias do Sul", "Encontre moda feminina, masculina, infantil, social e casual na Flor do Campo, loja de roupas em Caxias do Sul."],
  "/sobre": ["Sobre a Flor do Campo | Moda e Beleza", "Conheça a história da Flor do Campo, loja de roupas e moda para toda a família no Bairro Serrano, em Caxias do Sul."],
  "/contato": ["Contato | Flor do Campo – WhatsApp", "Entre em contato com a Flor do Campo pelo WhatsApp ou visite nossa loja de roupas no Bairro Serrano, em Caxias do Sul."],
  "/localizacao": ["Localização | Flor do Campo – Caxias do Sul", "Visite a Flor do Campo na Rua Elpídio Pereira da Silva, 1674, Bairro Serrano, em Caxias do Sul - RS."]
};

const privadas = ["/login", "/carrinho", "/checkout", "/favoritos", "/perfil", "/admin"];
const nomesPrivados = { "/login": "Login", "/carrinho": "Carrinho", "/checkout": "Finalizar compra", "/favoritos": "Lista de desejos", "/perfil": "Meu perfil", "/admin": "Painel administrativo" };
const titulosCategoria = { feminina: "Moda Feminina", masculina: "Moda Masculina", infantil: "Moda Infantil", social: "Moda Social", casual: "Moda Casual", acessorios: "Acessórios", promocoes: "Promoções" };

function breadcrumb(path, nome) {
  const base = urlPublica("/");
  const atual = urlPublica(path);
  if (!base || !atual) return null;
  return { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
    { "@type": "ListItem", position: 1, name: "Início", item: base },
    { "@type": "ListItem", position: 2, name: nome, item: atual }
  ] };
}

export default function SEODeRota() {
  const { pathname, search } = useLocation();
  if (pathname.startsWith("/produto/")) return null;

  if (privadas.includes(pathname)) return <SEO title={`${nomesPrivados[pathname]} | Flor do Campo`} description="Área reservada da Flor do Campo." path={pathname} robots="noindex,follow" />;
  if (pathname === "/produtos" && new URLSearchParams(search).has("busca")) return <SEO title="Resultados de busca | Flor do Campo" description="Resultados da busca interna da Flor do Campo." path={pathname} robots="noindex,follow" />;

  if (pathname.startsWith("/categoria/")) {
    const slug = decodeURIComponent(pathname.split("/").filter(Boolean).at(-1));
    const nome = titulosCategoria[slug] || slug.replace(/-/g, " ").replace(/\b\w/g, letra => letra.toUpperCase());
    const title = slug === "promocoes" ? "Promoções | Flor do Campo – Caxias do Sul" : `${nome} em Caxias do Sul | Flor do Campo`;
    const description = `Encontre ${nome.toLowerCase()} na Flor do Campo, loja de roupas no Bairro Serrano, em Caxias do Sul, com retirada na loja.`;
    return <SEO title={title} description={description} path={pathname} schema={breadcrumb(pathname, nome)} />;
  }

  const dados = publicas[pathname];
  if (!dados) return <SEO title="Página não encontrada | Flor do Campo" description="A página solicitada não foi encontrada." path={pathname} robots="noindex,follow" />;
  const schemas = pathname === "/" || pathname === "/localizacao" ? [{ ...loja, url: urlPublica(pathname) || undefined }, breadcrumb(pathname, dados[0].split("|")[0].trim())].filter(Boolean) : breadcrumb(pathname, dados[0].split("|")[0].trim());
  return <SEO title={dados[0]} description={dados[1]} path={pathname} schema={schemas} />;
}
