let cachedEvents = [];

const eventSelect = document.getElementById("event-select");
const marketSelect = document.getElementById("market-select");
const outcomeSelect = document.getElementById("outcome-select");

function pct(x) {
  return (x * 100).toFixed(2) + "%";
}

function getSelectedEvent() {
  return cachedEvents.find((e) => e.event_id === eventSelect.value);
}

function getSelectedMarket() {
  const event = getSelectedEvent();
  if (!event) return null;
  return event.markets.find((m) => m.market_id === marketSelect.value);
}

function populateSelect(select, items, valueKey, labelKey) {
  select.innerHTML = "";
  for (const item of items) {
    const opt = document.createElement("option");
    opt.value = item[valueKey];
    opt.textContent = item[labelKey];
    select.appendChild(opt);
  }
}

function onEventChange() {
  const event = getSelectedEvent();
  populateSelect(marketSelect, event.markets, "market_id", "market_label");
  onMarketChange();
}

function onMarketChange() {
  const market = getSelectedMarket();
  outcomeSelect.innerHTML = "";
  for (const outcome of market.outcomes) {
    const opt = document.createElement("option");
    opt.value = outcome;
    opt.textContent = outcome;
    outcomeSelect.appendChild(opt);
  }
}

async function loadEvents() {
  const res = await fetch("/api/events");
  cachedEvents = await res.json();
  populateSelect(eventSelect, cachedEvents, "event_id", "event_label");
  onEventChange();
}

async function runAnalysis() {
  const params = new URLSearchParams({
    event_id: eventSelect.value,
    market_id: marketSelect.value,
    outcome: outcomeSelect.value,
    kelly_multiplier: document.getElementById("kelly-multiplier").value,
    bankroll: document.getElementById("bankroll").value,
  });
  const userProb = document.getElementById("user-prob-override").value;
  if (userProb !== "") {
    params.set("user_prob", userProb);
  }

  const res = await fetch(`/api/analyze?${params.toString()}`);
  if (!res.ok) {
    const err = await res.json();
    alert(`Error: ${err.detail}`);
    return;
  }
  renderResults(await res.json());
}

function renderResults(data) {
  const banner = document.getElementById("sharp-reference-banner");
  banner.textContent = `True probability for "${data.selected_outcome}" sourced from ${data.p_true_source} → ${pct(data.p_true)}`;

  const body = document.getElementById("results-body");
  body.innerHTML = "";
  for (const row of data.rows) {
    const tr = document.createElement("tr");
    if (row.book === data.best_book) tr.classList.add("best-edge-row");
    if (row.edge < 0) tr.classList.add("negative-edge-row");
    tr.innerHTML = `
      <td>${row.book}</td>
      <td>${row.american_odds > 0 ? "+" : ""}${row.american_odds}</td>
      <td>${row.decimal_odds.toFixed(3)}</td>
      <td>${pct(row.implied_prob)}</td>
      <td>${pct(row.ev)}</td>
      <td>${pct(row.edge)}</td>
      <td>${pct(row.full_kelly_pct)}</td>
      <td>$${row.recommended_stake.toFixed(2)}</td>
    `;
    body.appendChild(tr);
  }
}

async function runParlayCalc() {
  const body = {
    p1: parseFloat(document.getElementById("parlay-p1").value),
    p2: parseFloat(document.getElementById("parlay-p2").value),
    rho: parseFloat(document.getElementById("parlay-rho").value),
    parlay_decimal_odds: parseFloat(document.getElementById("parlay-odds").value),
  };
  const res = await fetch("/api/parlay/correlated", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json();
    alert(`Error: ${JSON.stringify(err.detail)}`);
    return;
  }
  renderParlayResults(await res.json());
}

function renderParlayResults(data) {
  document.getElementById("parlay-prob-independent").textContent = pct(data.independent_prob);
  document.getElementById("parlay-prob-correlated").textContent = pct(data.correlated_prob);
  document.getElementById("parlay-ev-independent").textContent = pct(data.ev_naive_independent);
  document.getElementById("parlay-ev-correlated").textContent = pct(data.ev_correlated);
  document.getElementById("parlay-structural-edge").textContent =
    `Structural edge from correlation: ${pct(data.structural_edge)}`;
}

eventSelect.addEventListener("change", onEventChange);
marketSelect.addEventListener("change", onMarketChange);
document.getElementById("analyze-btn").addEventListener("click", runAnalysis);
document.getElementById("parlay-btn").addEventListener("click", runParlayCalc);
document.getElementById("parlay-rho").addEventListener("input", (e) => {
  document.getElementById("rho-readout").textContent = parseFloat(e.target.value).toFixed(2);
});

loadEvents();
