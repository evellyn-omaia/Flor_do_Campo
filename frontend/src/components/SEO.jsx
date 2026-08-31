import { useEffect } from "react";
import imagemSocialPadrao from "../assets/images/referencia/hero-referencia.png";
import { urlPublica } from "./seoConfig";

const nomeLoja = "Flor do Campo";
const imagemConfigurada = import.meta.env.VITE_SOCIAL_IMAGE || "";

function definirMeta(seletor, atributos) {
  let elemento = document.head.querySelector(seletor);
  if (!elemento) {
    elemento = document.createElement("meta");
    document.head.appendChild(elemento);
  }
  Object.entries(atributos).forEach(([chave, valor]) => elemento.setAttribute(chave, valor));
}

export default function SEO({ title, description, path, robots = "index,follow", type = "website", image, schema }) {
  useEffect(() => {
    document.title = title;
    definirMeta('meta[name="description"]', { name: "description", content: description });
    definirMeta('meta[name="robots"]', { name: "robots", content: robots });
    definirMeta('meta[property="og:title"]', { property: "og:title", content: title });
    definirMeta('meta[property="og:description"]', { property: "og:description", content: description });
    definirMeta('meta[property="og:type"]', { property: "og:type", content: type });
    definirMeta('meta[property="og:site_name"]', { property: "og:site_name", content: nomeLoja });
    definirMeta('meta[property="og:locale"]', { property: "og:locale", content: "pt_BR" });
    definirMeta('meta[name="twitter:card"]', { name: "twitter:card", content: "summary_large_image" });
    definirMeta('meta[name="twitter:title"]', { name: "twitter:title", content: title });
    definirMeta('meta[name="twitter:description"]', { name: "twitter:description", content: description });

    const canonical = robots.startsWith("index") ? urlPublica(path) : "";
    let link = document.head.querySelector('link[rel="canonical"]');
    if (canonical) {
      if (!link) {
        link = document.createElement("link");
        link.rel = "canonical";
        document.head.appendChild(link);
      }
      link.href = canonical;
      definirMeta('meta[property="og:url"]', { property: "og:url", content: canonical });
    } else {
      link?.remove();
      document.head.querySelector('meta[property="og:url"]')?.remove();
    }

    const social = urlPublica(image || imagemConfigurada || imagemSocialPadrao);
    if (social) {
      definirMeta('meta[property="og:image"]', { property: "og:image", content: social });
      definirMeta('meta[name="twitter:image"]', { name: "twitter:image", content: social });
    } else {
      document.head.querySelector('meta[property="og:image"]')?.remove();
      document.head.querySelector('meta[name="twitter:image"]')?.remove();
    }

    document.head.querySelectorAll('script[data-seo-schema="true"]').forEach(item => item.remove());
    const blocos = Array.isArray(schema) ? schema : schema ? [schema] : [];
    blocos.forEach(dados => {
      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.dataset.seoSchema = "true";
      script.textContent = JSON.stringify(dados);
      document.head.appendChild(script);
    });
  }, [title, description, path, robots, type, image, schema]);

  return null;
}
