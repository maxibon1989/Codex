import quoteData from "../../data/quote.hoja.powerbox.json";

export function formatCurrency(value, currency = quoteData.quote.currency) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export function computeTotals(data = quoteData) {
  const sectionTotals = data.line_items.reduce((acc, item) => {
    acc[item.section] = (acc[item.section] || 0) + item.line_total;
    return acc;
  }, {});

  return {
    bess_products: sectionTotals["BESS products"] || 0,
    transformers: sectionTotals.Transformers || 0,
    other_products_services: sectionTotals["Other products and services"] || 0,
    capex_sum: Object.values(sectionTotals).reduce((sum, v) => sum + v, 0),
    opex_sum: data.service_agreement.yearly_price,
  };
}

export function integrityCheck(data = quoteData) {
  const computed = computeTotals(data);
  const expectedCapex = data.totals.capex;
  const expectedOpex = data.totals.opex;

  const checks = [
    computed.bess_products === expectedCapex.bess_products,
    computed.transformers === expectedCapex.transformers,
    computed.other_products_services === expectedCapex.other_products_services,
    computed.capex_sum === expectedCapex.capex_sum,
    computed.opex_sum === expectedOpex.opex_sum,
  ];

  return {
    ok: checks.every(Boolean),
    computed,
  };
}

export default quoteData;
