const { pedidos } = require("./pedidoController");
const { produtos } = require("./produtoController");

const calcularDashboard = (req, res) => {
    let faturamentoTotal = 0;
    let produtosVendidos = 0;
    let pedidosPendentes = 0;

    const vendasPorProduto = {};
    const vendasPorMes = {};

    pedidos.forEach(pedido => {

        // Considera somente pedidos finalizados no faturamento
        if (pedido.status === "finalizado") {
            faturamentoTotal += Number(pedido.total);

            pedido.itens.forEach(item => {
                produtosVendidos += Number(item.quantidade);

                if (!vendasPorProduto[item.produtoId]) {
                    vendasPorProduto[item.produtoId] = {
                        nome: item.nome,
                        quantidade: 0
                    };
                }

                vendasPorProduto[item.produtoId].quantidade +=
                    Number(item.quantidade);
            });

            const data = new Date(pedido.criadoEm);

            const mes = data.toLocaleString("pt-BR", {
                month: "long"
            });

            if (!vendasPorMes[mes]) {
                vendasPorMes[mes] = 0;
            }

            vendasPorMes[mes] += Number(pedido.total);
        }

        if (pedido.status === "pendente") {
            pedidosPendentes++;
        }
    });

    faturamentoTotal = Number(faturamentoTotal.toFixed(2));

    // Produto mais vendido
    let produtoMaisVendido = null;

    Object.values(vendasPorProduto).forEach(produto => {
        if (
            !produtoMaisVendido ||
            produto.quantidade > produtoMaisVendido.quantidade
        ) {
            produtoMaisVendido = produto;
        }
    });

    // Transformar vendas por mês em lista
    const vendasPorMesArray = Object.entries(vendasPorMes).map(
        ([mes, valor]) => ({
            mes,
            valor: Number(valor.toFixed(2))
        })
    );

    // Mês com maior faturamento
    let mesMaiorFaturamento = null;

    vendasPorMesArray.forEach(venda => {
        if (
            !mesMaiorFaturamento ||
            venda.valor > mesMaiorFaturamento.valor
        ) {
            mesMaiorFaturamento = venda;
        }
    });

    res.json({
        faturamentoTotal,
        totalPedidos: pedidos.length,
        produtosVendidos,
        produtoMaisVendido,
        vendasPorMes: vendasPorMesArray,
        mesMaiorFaturamento,
        pedidosPendentes,
      produtosEstoqueBaixo: produtos.filter(
    produto =>
        produto.estoqueTotal > 0 &&
        produto.estoqueTotal <= 5
).length
    });
};

module.exports = {
    calcularDashboard
};