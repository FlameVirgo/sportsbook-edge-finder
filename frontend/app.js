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

// Tab Switching logic
const tabValueBets = document.getElementById("tab-value-bets");
const tabArbitrage = document.getElementById("tab-arbitrage");
const valueBetsView = document.getElementById("value-bets-view");
const arbitrageView = document.getElementById("arbitrage-view");

function switchTab(target) {
  if (target === "value-bets") {
    tabValueBets.classList.add("active");
    tabArbitrage.classList.remove("active");
    valueBetsView.classList.add("active");
    arbitrageView.classList.remove("active");
  } else {
    tabValueBets.classList.remove("active");
    tabArbitrage.classList.add("active");
    valueBetsView.classList.remove("active");
    arbitrageView.classList.add("active");
    // Run arbitrage scan automatically on first tab visit
    runArbitrageScan();
  }
}

tabValueBets.addEventListener("click", () => switchTab("value-bets"));
tabArbitrage.addEventListener("click", () => switchTab("arbitrage"));

// Bankroll syncing
const bankrollInput = document.getElementById("bankroll");
const arbBankrollInput = document.getElementById("arb-bankroll");

bankrollInput.addEventListener("input", (e) => {
  arbBankrollInput.value = e.target.value;
});

arbBankrollInput.addEventListener("input", (e) => {
  bankrollInput.value = e.target.value;
  // If user is currently looking at arbitrage, automatically re-scan to update stakes
  if (arbitrageView.classList.contains("active")) {
    runArbitrageScan();
  }
});

// Run Arbitrage Scan
async function runArbitrageScan() {
  const bankroll = parseFloat(arbBankrollInput.value) || 1000.0;
  const res = await fetch(`/api/arbitrage?bankroll=${bankroll}`);
  if (!res.ok) {
    const err = await res.json();
    alert(`Error scanning for arbitrage: ${err.detail}`);
    return;
  }
  const data = await res.json();
  renderArbitrageResults(data, bankroll);
}

function renderArbitrageResults(opportunities, bankroll) {
  const banner = document.getElementById("arb-summary-banner");
  const list = document.getElementById("arb-list");
  
  if (opportunities.length === 0) {
    banner.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--danger-color);"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      No arbitrage opportunities found across the current markets.
    `;
    list.innerHTML = `
      <div style="text-align: center; color: var(--text-muted); padding: 3rem;">
        No arbitrage opportunities are currently available. Check back when odds shift!
      </div>
    `;
    return;
  }
  
  banner.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--success-color);"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
    Found ${opportunities.length} guaranteed arbitrage opportunities!
  `;
  
  list.innerHTML = "";
  opportunities.forEach((opp) => {
    const card = document.createElement("div");
    card.className = "arb-card";
    
    let outcomesHtml = "";
    opp.outcomes.forEach((out) => {
      outcomesHtml += `
        <tr>
          <td><strong>${out.outcome}</strong></td>
          <td>${out.book}</td>
          <td>${out.american_odds > 0 ? "+" : ""}${out.american_odds}</td>
          <td>${out.decimal_odds.toFixed(3)}</td>
          <td>${pct(out.implied_prob)}</td>
          <td><strong style="color: var(--accent-color);">$${out.stake.toFixed(2)}</strong></td>
          <td>$${(out.stake * out.decimal_odds).toFixed(2)}</td>
        </tr>
      `;
    });
    
    card.innerHTML = `
      <div class="arb-card-header">
        <div>
          <h3 class="arb-card-title">${opp.event_label}</h3>
          <div class="arb-card-meta">
            <span>${opp.sport}</span>
            <span>${opp.market_label}</span>
          </div>
        </div>
        <div class="arb-badge">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          +${pct(opp.profit_pct)} Profit
        </div>
      </div>
      <div class="arb-card-body">
        <div class="table-container" style="overflow-x: auto;">
          <table>
            <thead>
              <tr>
                <th>Outcome</th>
                <th>Best Book</th>
                <th>American</th>
                <th>Decimal</th>
                <th>Implied %</th>
                <th>Required Stake</th>
                <th>Guaranteed Payout</th>
              </tr>
            </thead>
            <tbody>
              ${outcomesHtml}
            </tbody>
          </table>
        </div>
      </div>
      <div class="arb-card-footer">
        <div>Total Implied Probability: <strong>${pct(opp.total_implied_prob)}</strong></div>
        <div>Total Stake: <strong>$${bankroll.toFixed(2)}</strong></div>
        <div class="arb-profit-highlight">Guaranteed Profit: +$${opp.profit_amount.toFixed(2)}</div>
      </div>
    `;
    list.appendChild(card);
  });
}

document.getElementById("scan-arb-btn").addEventListener("click", runArbitrageScan);

loadEvents();
