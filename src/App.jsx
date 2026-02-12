import { useMemo, useState, useEffect } from "react";
import quoteData, { formatCurrency, integrityCheck } from "./utils/quote";

const navItems = [
  { path: "/quote", label: "Customer view" },
  { path: "/quote/line-items", label: "Line items" },
  { path: "/quote/investment-appendix", label: "Investment appendix" },
];

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
  return (
    <div className="proposal">
      <header className="hero">
        <h1>Investment appendix (neutral framing)</h1>
      </header>
      <ul>
        <li>
          NSC optimization examples indicate capture rate around 75% of theoretical maximum, with simulations
          closer to 80% over longer periods.
        </li>
        <li>
          Entelios can be used for long-term market framing. Forecasts are directional only and do not guarantee
          returns.
        </li>
      </ul>
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
