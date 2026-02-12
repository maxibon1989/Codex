import { useMemo, useState, useEffect } from "react";
import quoteData, { formatCurrency, integrityCheck } from "./utils/quote";

const navItems = [
  { path: "/quote", label: "Customer view" },
  { path: "/quote/line-items", label: "Line items" },
  { path: "/quote/investment-appendix", label: "Investment appendix" },
];

const CAPEX = quoteData.totals.capex.capex_sum;
const OPEX = quoteData.totals.opex.opex_sum;
const LIFE_YEARS = 10;
const HOJA_SIZE = "4 MW / ~9 MWh";

const NSC_REVENUE = 330000 * 4;
const ENTELIOS_REVENUE = 535712 * 4;

function navigate(path) {
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

function usePathname() {
  const [pathname, setPathname] = useState(window.location.pathname);

  useEffect(() => {
    const updatePath = () => setPathname(window.location.pathname);
    window.addEventListener("popstate", updatePath);
    return () => window.removeEventListener("popstate", updatePath);
  }, []);

  return pathname;
}

function DownloadButton() {
  return (
    <button className="btn" onClick={() => window.print()}>
      Download PDF
    </button>
  );
}

function calcScenario(annualRevenue) {
  const netAnnualCashFlow = annualRevenue - OPEX;
  const payback = CAPEX / netAnnualCashFlow;
  const tenYearNet = netAnnualCashFlow * LIFE_YEARS;
  const roi = ((tenYearNet - CAPEX) / CAPEX) * 100;

  return { annualRevenue, netAnnualCashFlow, payback, tenYearNet, roi };
}

function RevenueChart({ nsc, entelios }) {
  const max = Math.max(nsc.annualRevenue, entelios.annualRevenue, OPEX);
  const barHeight = (value) => `${(value / max) * 100}%`;

  return (
    <div className="chart-card">
      <h3>Annual Revenue by Scenario</h3>
      <div className="bars">
        <div className="bar-group">
          <div className="bar bar-nsc" style={{ height: barHeight(nsc.annualRevenue) }} />
          <div className="bar bar-opex" style={{ height: barHeight(OPEX) }} />
          <p>NSC Real</p>
        </div>
        <div className="bar-group">
          <div className="bar bar-entelios" style={{ height: barHeight(entelios.annualRevenue) }} />
          <div className="bar bar-opex" style={{ height: barHeight(OPEX) }} />
          <p>Entelios Forecast</p>
        </div>
      </div>
      <p className="muted-note">
        NSC: {formatCurrency(nsc.annualRevenue)} · Entelios: {formatCurrency(entelios.annualRevenue)} · OPEX baseline:
        {" "}{formatCurrency(OPEX)}
      </p>
    </div>
  );
}

function PaybackChart({ nsc, entelios }) {
  const years = [0, 1, 2, 3, 4, 5];

  const nscCumulative = years.map((year) => year * nsc.netAnnualCashFlow);
  const enteliosCumulative = years.map((year) => year * entelios.netAnnualCashFlow);
  const max = Math.max(CAPEX, ...nscCumulative, ...enteliosCumulative);

  const pointString = (values) =>
    values
      .map((value, idx) => {
        const x = 20 + (idx / (years.length - 1)) * 460;
        const y = 220 - (value / max) * 180;
        return `${x},${y}`;
      })
      .join(" ");

  const capexY = 220 - (CAPEX / max) * 180;

  return (
    <div className="chart-card">
      <h3>Payback Timeline (Years 0–5)</h3>
      <svg viewBox="0 0 500 240" className="timeline-svg" role="img" aria-label="Payback timeline chart">
        <line x1="20" y1="220" x2="480" y2="220" className="axis" />
        <line x1="20" y1={capexY} x2="480" y2={capexY} className="capex-line" />
        <polyline points={pointString(nscCumulative)} className="line-nsc" />
        <polyline points={pointString(enteliosCumulative)} className="line-entelios" />
      </svg>
      <p className="muted-note">
        CAPEX threshold at {formatCurrency(CAPEX)}. NSC reaches payback at ~{nsc.payback.toFixed(2)} years; Entelios at
        ~{entelios.payback.toFixed(2)} years.
      </p>
    </div>
  );
}

function CustomerView() {
  const integrity = useMemo(() => integrityCheck(), []);

  return (
    <div className="proposal" id="quote-document">
      <header className="hero">
        <p className="eyebrow">Capture Energy · Commercial and Technical Proposal</p>
        <h1>{quoteData.quote.title}</h1>
        <p>Quote ID {quoteData.quote.id} · Date {quoteData.quote.date}</p>
        <div className="hero-actions no-print">
          <DownloadButton />
        </div>
      </header>

      {import.meta.env.DEV && (
        <aside className={`banner ${integrity.ok ? "ok" : "bad"}`}>
          Integrity check: {integrity.ok ? "PASS" : "MISMATCH"}
        </aside>
      )}

      <section className="section">
        <h2>Executive summary</h2>
        <p>
          Capture Energy proposes a PowerBox-based BESS configuration for the Hoja project, designed to be
          trading-ready from day one through Capture Controller and Capture Cloud.
        </p>
        <div className="callout">
          <h3>Key answers to your last-minute changes</h3>
          <ul>
            {quoteData.scope_notes.customer_requests.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p>{quoteData.scope_notes.compliance_statement}</p>
        </div>
      </section>

      <section className="section two-col">
        <article>
          <h2>Scope</h2>
          <p>
            Seller: {quoteData.parties.seller.name}, {quoteData.parties.seller.address}
          </p>
          <p>
            Customer: {quoteData.parties.customer.name}, {quoteData.parties.customer.address}
          </p>
          {quoteData.parties.contacts.map((c) => (
            <p key={c.email}>
              {c.name} · {c.role} · {c.email} · {c.phone}
            </p>
          ))}
        </article>
        <article>
          <h2>Commercials</h2>
          <p>CAPEX total: {formatCurrency(quoteData.totals.capex.capex_sum)}</p>
          <p>OPEX yearly: {formatCurrency(quoteData.totals.opex.opex_sum)}</p>
          <p>Offer validity: {quoteData.quote.validity_days} days from document date.</p>
        </article>
      </section>

      <section className="section two-col">
        <article>
          <h2>Warranty and Service</h2>
          <p>
            {quoteData.service_agreement.warranty_years_included}-year warranty included; upgrade to
            {" "}{quoteData.service_agreement.warranty_upgrade_available_years} years available.
          </p>
          <p>Annual service agreement: {formatCurrency(quoteData.service_agreement.yearly_price)}.</p>
          <ul>
            {quoteData.service_agreement.includes.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
        <article>
          <h2>Payment and Delivery</h2>
          <ul>
            {quoteData.payment_terms.powerbox.map((term) => (
              <li key={term.percent}>
                {term.percent}% · {term.milestone}
              </li>
            ))}
          </ul>
          <ul>
            {quoteData.delivery_plan.map((item) => (
              <li key={item.phase}>
                {item.phase}: {item.weeks} weeks
              </li>
            ))}
          </ul>
        </article>
      </section>

      <section className="section">
        <h2>Annexes</h2>
        <p>
          This quote references Terms and Conditions, full annex pack, and ESG annexes including independent
          assurance aligned with AA1000AS.
        </p>
      </section>
    </div>
  );
}

function LineItemsView() {
  return (
    <div className="proposal">
      <header className="hero">
        <h1>Line item view</h1>
        <p>Exact table values from source quote JSON.</p>
      </header>

      <table>
        <thead>
          <tr>
            <th>Section</th>
            <th>Item</th>
            <th>Qty</th>
            <th>Unit price</th>
            <th>Line total</th>
          </tr>
        </thead>
        <tbody>
          {quoteData.line_items.map((item) => (
            <tr key={item.name}>
              <td>{item.section}</td>
              <td>{item.name}</td>
              <td>{item.qty}</td>
              <td>{formatCurrency(item.unit_price)}</td>
              <td>{formatCurrency(item.line_total)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="totals">
        <p>BESS products: {formatCurrency(quoteData.totals.capex.bess_products)}</p>
        <p>Transformers: {formatCurrency(quoteData.totals.capex.transformers)}</p>
        <p>Other products/services: {formatCurrency(quoteData.totals.capex.other_products_services)}</p>
        <p>CAPEX sum: {formatCurrency(quoteData.totals.capex.capex_sum)}</p>
        <p>OPEX yearly: {formatCurrency(quoteData.totals.opex.opex_sum)}</p>
      </div>
    </div>
  );
}

function AppendixView() {
  const nsc = calcScenario(NSC_REVENUE);
  const entelios = calcScenario(ENTELIOS_REVENUE);

  return (
    <div className="proposal">
      <header className="hero">
        <h1>Investment appendix (realized vs forecast scenarios)</h1>
      </header>

      <section className="section">
        <h2>1) Key Inputs (unchanged from your quote)</h2>
        <ul>
          <li>Total CAPEX (PowerBox Hoja): {formatCurrency(CAPEX)}</li>
          <li>Total OPEX/year: {formatCurrency(OPEX)}</li>
          <li>Hoja system size (ancillary revenue driver): {HOJA_SIZE} (quote basis)</li>
        </ul>
        <p>ROI formulas (industry standard):</p>
        <ul>
          <li>Net Annual Cash Flow = Annual Revenue − OPEX</li>
          <li>Payback (years) = CAPEX ÷ Net Annual Cash Flow</li>
          <li>
            ROI (%) = [((Net Annual Cash Flow × Life) − CAPEX) ÷ CAPEX] × 100%
          </li>
        </ul>
        <p>
          Typical energy storage projects aim for 3–7 year payback; BESS can deliver positive returns within this
          range in grid service applications.
        </p>
      </section>

      <section className="section">
        <h2>2) NSC-Based ROI (Realized Operational Case)</h2>
        <p>From NSC’s 2025 real performance chart for 1 MW: approximately {formatCurrency(330000)} per MW/year.</p>
        <p>Scaled to Hoja (4 MW): {formatCurrency(NSC_REVENUE)} annual revenue.</p>
        <p>
          Net Annual Cash Flow: {formatCurrency(nsc.annualRevenue)} − {formatCurrency(OPEX)} =
          {" "}{formatCurrency(Math.round(nsc.netAnnualCashFlow))}
        </p>
        <p>Payback: {formatCurrency(CAPEX)} / {formatCurrency(Math.round(nsc.netAnnualCashFlow))} ≈ {nsc.payback.toFixed(2)} years</p>
        <p>
          10-year ROI: [({formatCurrency(Math.round(nsc.tenYearNet))} − {formatCurrency(CAPEX)}) ÷
          {" "}{formatCurrency(CAPEX)}] × 100 ≈ {Math.round(nsc.roi)}%
        </p>
        <p className="muted-note">
          What this means: this scenario uses recent realized market trading performance from NSC under strong
          market conditions and active optimization; it is not a theoretical maximum.
        </p>
      </section>

      <section className="section">
        <h2>3) Entelios-Based ROI (Forward Forecast Case)</h2>
        <p>Entelios 2025 central-case estimate for 1 MW: approximately {formatCurrency(535712)}.</p>
        <p>Scaled to Hoja (4 MW): {formatCurrency(ENTELIOS_REVENUE)} annual revenue.</p>
        <p>
          Net Annual Cash Flow: {formatCurrency(entelios.annualRevenue)} − {formatCurrency(OPEX)} =
          {" "}{formatCurrency(Math.round(entelios.netAnnualCashFlow))}
        </p>
        <p>
          Payback: {formatCurrency(CAPEX)} / {formatCurrency(Math.round(entelios.netAnnualCashFlow))} ≈
          {" "}{entelios.payback.toFixed(2)} years
        </p>
        <p>
          10-year ROI: [({formatCurrency(Math.round(entelios.tenYearNet))} − {formatCurrency(CAPEX)}) ÷
          {" "}{formatCurrency(CAPEX)}] × 100 ≈ {Math.round(entelios.roi)}%
        </p>
        <p className="muted-note">
          Important nuance: this uses forecasted market prices and award assumptions. Actual operational
          performance may vary with capture rate, awards, and market volatility.
        </p>
      </section>

      <section className="section">
        <h2>4) Side-by-side scenario table</h2>
        <table>
          <thead>
            <tr>
              <th>Scenario</th>
              <th>Annual Revenue</th>
              <th>Net Annual Cash Flow</th>
              <th>Payback (years)</th>
              <th>10-year ROI</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>NSC Real Performance</td>
              <td>{formatCurrency(nsc.annualRevenue)}</td>
              <td>{formatCurrency(Math.round(nsc.netAnnualCashFlow))}</td>
              <td>{nsc.payback.toFixed(2)}</td>
              <td>~{Math.round(nsc.roi)}%</td>
            </tr>
            <tr>
              <td>Entelios Forecast</td>
              <td>{formatCurrency(entelios.annualRevenue)}</td>
              <td>{formatCurrency(Math.round(entelios.netAnnualCashFlow))}</td>
              <td>{entelios.payback.toFixed(2)}</td>
              <td>~{Math.round(entelios.roi)}%</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="section viz-grid">
        <RevenueChart nsc={nsc} entelios={entelios} />
        <PaybackChart nsc={nsc} entelios={entelios} />
      </section>

      <section className="section summary-boxes">
        <article className="metric-tile">
          <p className="metric-label">Payback (NSC)</p>
          <p className="metric-value">~{nsc.payback.toFixed(1)} yrs</p>
        </article>
        <article className="metric-tile">
          <p className="metric-label">Payback (Entelios)</p>
          <p className="metric-value">~{entelios.payback.toFixed(1)} yrs</p>
        </article>
        <article className="metric-tile">
          <p className="metric-label">ROI summary (10 yr)</p>
          <p className="metric-sub">NSC: ~{Math.round(nsc.roi)}%</p>
          <p className="metric-sub">Entelios: ~{Math.round(entelios.roi)}%</p>
          <p className="metric-sub">CAPEX: {formatCurrency(CAPEX)}</p>
          <p className="metric-sub">OPEX: {formatCurrency(OPEX)}/yr</p>
        </article>
      </section>

      <section className="section callout">
        <p>
          “Based on real optimized trading performance from NSC, Hoja is expected to generate approximately
          {" "}{formatCurrency(NSC_REVENUE)}/year in ancillary revenue with investment recovery in ~{nsc.payback.toFixed(1)} years.
          Under Entelios forecast prices, Hoja could generate approximately {formatCurrency(ENTELIOS_REVENUE)}/year,
          recovering in &lt;1 year. This range provides realistic and forward market expectations to support both
          conservative and optimistic ROI analysis.”
        </p>
      </section>
    </div>
  );
}

export default function App() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname === "/") navigate("/quote");
  }, [pathname]);

  return (
    <div className="page">
      <nav className="topnav no-print">
        {navItems.map((item) => (
          <button
            key={item.path}
            className={pathname === item.path ? "active" : ""}
            onClick={() => navigate(item.path)}
          >
            {item.label}
          </button>
        ))}
      </nav>

      {pathname === "/quote/line-items" ? (
        <LineItemsView />
      ) : pathname === "/quote/investment-appendix" ? (
        <AppendixView />
      ) : (
        <CustomerView />
      )}
    </div>
  );
}
