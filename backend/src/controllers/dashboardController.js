const db = require("../config/firebase");

const statusConcluidos = new Set([
  "retirado",
  "finalizado",
  "concluido"
]);

const statusPendentes = new Set([
  "aguardando",
  "em_preparo",
  "pronto",
  "pendente"
]);

function transformarEmLista(dados) {
  return Object.values(dados || {});
}

function calcularEstoqueTotal(produto) {
  if (Number.isFinite(Number(produto.estoqueTotal))) {
    return Number(produto.estoqueTotal);
  }

  return Object.values(produto.variacoes || {}).reduce(
    (totalCores, tamanhos) =>
      totalCores + Object.values(tamanhos || {}).reduce(
        (totalTamanhos, quantidade) =>
          totalTamanhos + Number(quantidade || 0),
        0
      ),
    0
  );
}

const calcularDashboard = async (req, res) => {
  try {
    const [pedidosSnapshot, produtosSnapshot] = await Promise.all([
      db.ref("pedidos").once("value"),
      db.ref("produtos").once("value")
    ]);

    const pedidos = transformarEmLista(pedidosSnapshot.val());
    const produtos = transformarEmLista(produtosSnapshot.val());

    let faturamentoTotal = 0;
    let produtosVendidos = 0;
    let pedidosPendentes = 0;

    const vendasPorProduto = {};
    const vendasPorMes = {};

    for (const pedido of pedidos) {
      if (statusPendentes.has(pedido.status)) {
        pedidosPendentes++;
      }

      if (
        pedido.status === "cancelado" ||
        !statusConcluidos.has(pedido.status)
      ) {
        continue;
      }

      const totalPedido = Number(pedido.total || 0);

      if (Number.isFinite(totalPedido)) {
        faturamentoTotal += totalPedido;
      }

      const itens = Array.isArray(pedido.itens)
        ? pedido.itens
        : Object.values(pedido.itens || {});

      for (const item of itens) {
        const quantidade = Number(item.quantidade || 0);

        if (!Number.isFinite(quantidade)) {
          continue;
        }

        produtosVendidos += quantidade;

        const produtoId = String(
          item.produtoId ?? item.nome ?? "produto"
        );

        if (!vendasPorProduto[produtoId]) {
          vendasPorProduto[produtoId] = {
            nome: item.nome || "Produto não informado",
            quantidade: 0
          };
        }

        vendasPorProduto[produtoId].quantidade += quantidade;
      }

      const dataPedido = pedido.criadoEm || pedido.data;
      const data = new Date(dataPedido);

      if (!Number.isNaN(data.getTime())) {
        const mes = data.toLocaleString("pt-BR", {
          month: "long"
        });

        vendasPorMes[mes] =
          (vendasPorMes[mes] || 0) +
          (Number.isFinite(totalPedido) ? totalPedido : 0);
      }
    }

    faturamentoTotal = Number(faturamentoTotal.toFixed(2));

    let produtoMaisVendido = null;

    for (const produto of Object.values(vendasPorProduto)) {
      if (
        !produtoMaisVendido ||
        produto.quantidade > produtoMaisVendido.quantidade
      ) {
        produtoMaisVendido = produto;
      }
    }

    const vendasPorMesArray = Object.entries(vendasPorMes).map(
      ([mes, valor]) => ({
        mes,
        valor: Number(valor.toFixed(2))
      })
    );

    let mesMaiorFaturamento = null;

    for (const venda of vendasPorMesArray) {
      if (
        !mesMaiorFaturamento ||
        venda.valor > mesMaiorFaturamento.valor
      ) {
        mesMaiorFaturamento = venda;
      }
    }

    const produtosEstoqueBaixo = produtos.filter((produto) => {
      const estoqueTotal = calcularEstoqueTotal(produto);

      return estoqueTotal > 0 && estoqueTotal <= 5;
    }).length;

    res.json({
      faturamentoTotal,
      totalPedidos: pedidos.length,
      produtosVendidos,
      produtoMaisVendido,
      vendasPorMes: vendasPorMesArray,
      mesMaiorFaturamento,
      pedidosPendentes,
      produtosEstoqueBaixo
    });
  } catch (erro) {
    console.error("Erro ao calcular dashboard:", erro);

    res.status(500).json({
      mensagem: "Erro ao calcular dashboard."
    });
  }
};

module.exports = {
  calcularDashboard
};
