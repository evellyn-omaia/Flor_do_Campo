const urlConfigurada = String(import.meta.env.VITE_SITE_URL || "").replace(/\/$/, "");

function origemPublica() {
  if (urlConfigurada) return urlConfigurada;
  if (typeof window === "undefined" || /^(localhost|127\.0\.0\.1)$/.test(window.location.hostname)) return "";
  return window.location.origin;
}

export function urlPublica(valor = "") {
  if (!valor) return origemPublica();
  if (/^https?:\/\//i.test(valor)) return valor;
  const origem = origemPublica();
  return origem ? `${origem}${valor.startsWith("/") ? valor : `/${valor}`}` : "";
}
