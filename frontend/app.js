let cachedEvents = [];

const sportSelect = document.getElementById("sport-select");
const eventSelect = document.getElementById("event-select");
const marketSelect = document.getElementById("market-select");
const outcomeSelect = document.getElementById("outcome-select");

function pct(x) {
  return (x * 100).toFixed(2) + "%";
}

function getEventsForSelectedSport() {
  return cachedEvents.filter((e) => e.sport === sportSelect.value);
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

function onSportChange() {
  const events = getEventsForSelectedSport();
  populateSelect(eventSelect, events, "event_id", "event_label");
  onEventChange();
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

  const sports = [...new Set(cachedEvents.map((e) => e.sport))].sort();
  sportSelect.innerHTML = "";
  for (const sport of sports) {
    const opt = document.createElement("option");
    opt.value = sport;
    opt.textContent = sport;
    sportSelect.appendChild(opt);
  }

  onSportChange();
}

async function runAnalysis() {
  const params = new URLSearchParams({
    event_id: eventSelect.value,
    market_id: marketSelect.value,
    outcome: outcomeSelect.value,
    bankroll: document.getElementById("bankroll").value,
  });

  const res = await fetch(`/api/analyze?${params.toString()}`);
  if (!res.ok) {
    const err = await res.json();
    alert(`Error: ${err.detail}`);
    return;
  }
  renderResults(await res.json());
}

function renderRecommendation(data) {
  const box = document.getElementById("bankroll-recommendation");
  const best = data.rows[0];
  const bankroll = parseFloat(document.getElementById("bankroll").value) || 0;

  if (!best || best.edge <= 0) {
    box.className = "no-edge";
    box.innerHTML = `
      <div class="rec-headline">No positive-EV bet found</div>
      <div class="rec-detail">Every book's price is at or below the true probability for "${data.selected_outcome}" — sit this one out rather than bet into a -EV line.</div>
    `;
    return;
  }

  const pctOfBankroll = bankroll > 0 ? (best.recommended_stake / bankroll) * 100 : 0;
  box.className = "has-edge";
  box.innerHTML = `
    <div class="rec-headline">Bet $${best.recommended_stake.toFixed(2)} on ${best.book}</div>
    <div class="rec-detail">${pctOfBankroll.toFixed(2)}% of your $${bankroll.toFixed(2)} bankroll, full Kelly · ${pct(best.edge)} edge at ${best.american_odds > 0 ? "+" : ""}${best.american_odds} (${best.decimal_odds.toFixed(3)} decimal)</div>
  `;
}

function renderResults(data) {
  const banner = document.getElementById("sharp-reference-banner");
  banner.textContent = `True probability for "${data.selected_outcome}" sourced from ${data.p_true_source} → ${pct(data.p_true)}`;

  renderRecommendation(data);

  const body = document.getElementById("results-body");
  body.innerHTML = "";
  data.rows.forEach((row, index) => {
    const tr = document.createElement("tr");
    if (index < 3 && row.edge > 0) tr.classList.add("best-edge-row");
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
  });
}

sportSelect.addEventListener("change", onSportChange);
eventSelect.addEventListener("change", onEventChange);
marketSelect.addEventListener("change", onMarketChange);
document.getElementById("analyze-btn").addEventListener("click", runAnalysis);

loadEvents();
