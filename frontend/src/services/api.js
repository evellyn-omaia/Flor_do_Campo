import { auth } from "../config/firebase";
import { getIdToken } from "firebase/auth";

const BASE_URL = (
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD
    ? "https://flor-do-campo-api.onrender.com/api"
    : "http://localhost:3000/api")
).replace(/\/$/, "");

async function requisicao(caminho, opcoes = {}) {
  let resposta;

  try {
    const headers = new Headers(opcoes.headers || {});

    // Adiciona automaticamente o token do Firebase
    if (auth.currentUser) {
      const token = await getIdToken(auth.currentUser);

      headers.set("Authorization", `Bearer ${token}`);
    }

    if (opcoes.body && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    resposta = await fetch(`${BASE_URL}${caminho}`, {
      ...opcoes,
      headers
    });
  } catch {
    throw new Error(
      "Não foi possível conectar à API. Verifique se o backend está rodando na porta 3000."
    );
  }

  const texto = await resposta.text();

  let dados = {};

  try {
    dados = texto ? JSON.parse(texto) : {};
  } catch {
    dados = {
      mensagem:
        resposta.status === 413
          ? "As imagens ultrapassaram o limite permitido."
          : "A API retornou uma resposta inválida."
    };
  }

  if (!resposta.ok) {
    throw new Error(
      dados.mensagem ||
        `Não foi possível concluir a operação (${resposta.status}).`
    );
  }

  return dados;
}

function promocaoValida(banner) {
  if (banner.ativo === false) return false;

  const hoje = new Date().toISOString().slice(0, 10);

  return (
    (!banner.inicio || banner.inicio <= hoje) &&
    (!banner.fim || banner.fim >= hoje) &&
    Boolean(banner.desconto)
  );
}

function numeroDesconto(texto) {
  const n = Number(
    String(texto || "")
      .replace(/[^0-9,.]/g, "")
      .replace(",", ".")
  );

  return Number.isFinite(n) ? n : 0;
}

export async function carregarLoja() {
  const [categorias, produtosBrutos, banners] =
    await Promise.all([
      requisicao("/categorias"),
      requisicao("/produtos"),
      requisicao("/banners")
    ]);

  const promocoes = banners.filter(promocaoValida);

  const produtos = produtosBrutos.map((p) => {
    const banner = promocoes.find((b) =>
      (b.produtoIds || []).some(
        (id) => String(id) === String(p.id)
      )
    );

    const valorBase = p.promocao?.ativa
      ? p.promocao.precoPromocional
      : p.preco;

    const percentual =
      banner?.tipo === "porcentagem"
        ? numeroDesconto(banner.desconto)
        : 0;

    const valorPromocional = percentual
      ? valorBase * (1 - percentual / 100)
      : banner?.tipo === "valor"
        ? Math.max(
            0,
            valorBase - numeroDesconto(banner.desconto)
          )
        : valorBase;

    return {
      id: p.id,
      nome: p.nome,
      identificador: p.imagem || "terno",
      imagens: p.imagens || [],
      preco: `R$ ${valorPromocional
        .toFixed(2)
        .replace(".", ",")}`,
      precoOriginal: banner
        ? `R$ ${valorBase
            .toFixed(2)
            .replace(".", ",")}`
        : null,
      precoNumero: valorPromocional,
      categoriaId: p.categoriaId,
      tipo:
        p.codigo?.split("-")[0]?.toLowerCase() ||
        "outros",
      codigo: p.codigo,
      status: p.status,
      descricao: p.descricao,
      variacoes: p.variacoes,
      emPromocao: Boolean(banner),
      desconto: banner?.desconto || null,
      promocaoTitulo: banner?.titulo || null
    };
  });

  return {
    categorias,
    banners,
    produtos
  };
}

export const listarCategorias = () => requisicao("/categorias");

export const buscarPerfilAtual = () => requisicao("/usuarios/me");

// Categorias
export const criarCategoria = (dados) =>
  requisicao("/categorias", {
    method: "POST",
    body: JSON.stringify(dados)
  });

export const atualizarCategoria = (id, dados) =>
  requisicao(`/categorias/${id}`, {
    method: "PUT",
    body: JSON.stringify(dados)
  });

// Produtos
export const criarProduto = (dados) =>
  requisicao("/produtos", {
    method: "POST",
    body: JSON.stringify(dados)
  });

export const atualizarProduto = (id, dados) =>
  requisicao(`/produtos/${id}`, {
    method: "PUT",
    body: JSON.stringify(dados)
  });

// Banners
export const criarBanner = (dados) =>
  requisicao("/banners", {
    method: "POST",
    body: JSON.stringify(dados)
  });

export const atualizarBanner = (id, dados) =>
  requisicao(`/banners/${id}`, {
    method: "PUT",
    body: JSON.stringify(dados)
  });

// Carrinho
export const buscarCarrinho = () => requisicao("/carrinho");

export const adicionarAoCarrinho = (dados) =>
  requisicao("/carrinho", {
    method: "POST",
    body: JSON.stringify(dados)
  });

export const atualizarItemCarrinho = (produtoId, dados) =>
  requisicao(
    `/carrinho/${produtoId}`,
    {
      method: "PATCH",
      body: JSON.stringify(dados)
    }
  );

export const removerItemCarrinho = (produtoId, cor, tamanho) =>
  requisicao(
    `/carrinho/${produtoId}?cor=${encodeURIComponent(
      cor
    )}&tamanho=${encodeURIComponent(tamanho)}`,
    {
      method: "DELETE"
    }
  );

// Pedidos
export const criarPedido = (dados) =>
  requisicao("/pedidos", {
    method: "POST",
    body: JSON.stringify(dados)
  });

const statusPedidoLegado = {
  pendente: "aguardando",
  finalizado: "retirado",
  concluido: "retirado"
};

function normalizarPedido(pedido) {
  const itens = Array.isArray(pedido.itens)
    ? pedido.itens
    : Object.values(pedido.itens || {});
  const status = statusPedidoLegado[pedido.status] || pedido.status || "aguardando";
  const criadoEm = pedido.criadoEm || pedido.data || null;
  const id = pedido.id || pedido.firebaseId;

  return {
    ...pedido,
    id,
    codigo: pedido.codigo || `LEG-${String(id || "pedido").slice(-6)}`,
    clienteNome: pedido.clienteNome || pedido.cliente?.nome || "Cliente não informado",
    email: pedido.email || pedido.cliente?.email || "",
    telefone: pedido.telefone || pedido.cliente?.telefone || "",
    endereco: pedido.endereco || {},
    pagamento: pedido.pagamento || "nao_informado",
    statusPagamento: pedido.statusPagamento || "nao_informado",
    status,
    criadoEm,
    atualizadoEm: pedido.atualizadoEm || criadoEm,
    itens,
    historico: Array.isArray(pedido.historico)
      ? pedido.historico
      : [{ status, titulo: "Pedido importado do histórico", data: criadoEm }]
  };
}

export const listarPedidos = async () => {
  const pedidos = await requisicao("/pedidos");
  return pedidos.map(normalizarPedido);
};

export const buscarPedido = (id) =>
  requisicao(`/pedidos/${id}`);

export const atualizarStatusPedido = (
  id,
  status
) =>
  requisicao(`/pedidos/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status })
  });
