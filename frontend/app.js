let cachedEvents = [];
let selectedSport = null;
let selectedBet = null; // { eventId, marketId, outcome }

const sportTabsEl = document.getElementById("sport-tabs");
const gameListEl = document.getElementById("game-list");
const bankrollInput = document.getElementById("bankroll");

function pct(x) {
  return (x * 100).toFixed(2) + "%";
}

function signedClass(x) {
  return x >= 0 ? "value-positive" : "value-negative";
}

function formatAmerican(odds) {
  return (odds > 0 ? "+" : "") + odds;
}

function formatKickoff(isoString) {
  const date = new Date(isoString);
  return date.toLocaleString(undefined, {
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getEventsForSelectedSport() {
  return cachedEvents.filter((e) => e.sport === selectedSport);
}

function renderSportTabs() {
  const sports = [...new Set(cachedEvents.map((e) => e.sport))].sort();
  sportTabsEl.innerHTML = "";
  for (const sport of sports) {
    const tab = document.createElement("button");
    tab.className = "sport-tab" + (sport === selectedSport ? " active" : "");
    tab.textContent = sport;
    tab.addEventListener("click", () => {
      selectedSport = sport;
      renderSportTabs();
      renderGameList();
    });
    sportTabsEl.appendChild(tab);
  }
}

function renderGameList() {
  const events = getEventsForSelectedSport();
  gameListEl.innerHTML = "";

  if (events.length === 0) {
    gameListEl.innerHTML = `<p class="game-list-empty">No live games right now for this sport.</p>`;
    return;
  }

  for (const event of events) {
    const market = event.markets[0];
    const sharpBook = market.books.find((b) => b.is_sharp);
    if (!sharpBook) continue;

    const card = document.createElement("div");
    card.className = "game-card";

    const header = document.createElement("div");
    header.className = "game-card-header";
    header.innerHTML = `<span class="game-time">${formatKickoff(event.commence_time)}</span><span class="game-market-label">${market.market_label}</span>`;
    card.appendChild(header);

    for (const outcome of market.outcomes) {
      const row = document.createElement("div");
      row.className = "team-row";

      const isSelected =
        selectedBet &&
        selectedBet.eventId === event.event_id &&
        selectedBet.marketId === market.market_id &&
        selectedBet.outcome === outcome;

      row.innerHTML = `
        <span class="team-name">${outcome}</span>
        <button class="odds-btn${isSelected ? " selected" : ""}">${formatAmerican(sharpBook.odds[outcome])}</button>
      `;

      row.querySelector(".odds-btn").addEventListener("click", () => {
        selectedBet = { eventId: event.event_id, marketId: market.market_id, outcome };
        renderGameList();
        runAnalysis();
      });

      card.appendChild(row);
    }

    gameListEl.appendChild(card);
  }
}

async function loadEvents() {
  const res = await fetch("/api/events");
  cachedEvents = await res.json();

  const sports = [...new Set(cachedEvents.map((e) => e.sport))].sort();
  selectedSport = sports[0] || null;

  renderSportTabs();
  renderGameList();
}

async function runAnalysis() {
  if (!selectedBet) return;

  const params = new URLSearchParams({
    event_id: selectedBet.eventId,
    market_id: selectedBet.marketId,
    outcome: selectedBet.outcome,
    bankroll: bankrollInput.value,
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
  const bankroll = parseFloat(bankrollInput.value) || 0;

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
    <div class="rec-detail">${pctOfBankroll.toFixed(2)}% of your $${bankroll.toFixed(2)} bankroll, full Kelly · ${pct(best.edge)} edge at ${formatAmerican(best.american_odds)} (${best.decimal_odds.toFixed(3)} decimal)</div>
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
      <td>${formatAmerican(row.american_odds)}</td>
      <td>${row.decimal_odds.toFixed(3)}</td>
      <td>${pct(row.implied_prob)}</td>
      <td class="${signedClass(row.ev)}">${pct(row.ev)}</td>
      <td class="${signedClass(row.edge)}">${pct(row.edge)}</td>
      <td>${pct(row.full_kelly_pct)}</td>
      <td>$${row.recommended_stake.toFixed(2)}</td>
    `;
    body.appendChild(tr);
  });
}

bankrollInput.addEventListener("input", () => {
  if (selectedBet) runAnalysis();
});

loadEvents();
