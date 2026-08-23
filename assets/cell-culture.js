window.CellCultureTool = (() => {
  "use strict";
  const root = document.getElementById("cell-calculator");
  if (!root) return { onShow() {} };

const VESSELS = {
  plate6:   { name: "6-well plate", type: "plate", positions: 6,   area: 9.6,   media: 2.0, rows: 2, cols: 3 },
  plate12:  { name: "12-well plate", type: "plate", positions: 12, area: 3.8,   media: 1.0, rows: 3, cols: 4 },
  plate24:  { name: "24-well plate", type: "plate", positions: 24, area: 1.9,   media: 0.5, rows: 4, cols: 6 },
  plate48:  { name: "48-well plate", type: "plate", positions: 48, area: 1.0,   media: 0.25, rows: 6, cols: 8 },
  plate96:  { name: "96-well plate", type: "plate", positions: 96, area: 0.32,  media: 0.10, rows: 8, cols: 12 },
  plate384: { name: "384-well plate", type: "plate", positions: 384, area: 0.056, media: 0.05, rows: 16, cols: 24 },
  flask25:  { name: "T25 flask", type: "flask", positions: 1, area: 25,  media: 5 },
  flask75:  { name: "T75 flask", type: "flask", positions: 1, area: 75,  media: 15 },
  flask175: { name: "T175 flask", type: "flask", positions: 1, area: 175, media: 35 },
  dish35:   { name: "35 mm dish", type: "dish", positions: 1, area: 9.6,  media: 2 },
  dish60:   { name: "60 mm dish", type: "dish", positions: 1, area: 21,   media: 5 },
  dish100:  { name: "100 mm dish", type: "dish", positions: 1, area: 55,  media: 10 }
};

const state = {
  lastConcentration: null,
  lastViability: null,
  lastPlan: null
};

const $ = (id) => document.getElementById(id);

function fmt(value, digits = 2) {
  if (!Number.isFinite(value)) return "—";
  const abs = Math.abs(value);
  if ((abs >= 1e6 || (abs > 0 && abs < 0.001))) {
    return value.toExponential(2).replace("e+", "e");
  }
  return value.toLocaleString(undefined, { maximumFractionDigits: digits });
}

function fmtCells(value) {
  return `${fmt(value, 0)} cells`;
}

function fmtVolume(mL) {
  if (!Number.isFinite(mL)) return "—";
  if (mL < 1) return `${fmt(mL * 1000, 1)} µL`;
  return `${fmt(mL, 3)} mL`;
}

function positiveNumber(id) {
  return Number($(id).value);
}

function setSession() {
  $("sessionConcentration").textContent = state.lastConcentration ? `${fmt(state.lastConcentration)} cells/mL` : "—";
  $("sessionViability").textContent = state.lastViability !== null ? `${fmt(state.lastViability, 1)}%` : "—";
  $("sessionPlan").textContent = state.lastPlan || "—";
}

function switchTab(tabId) {
  root.querySelectorAll(".tab").forEach(b => b.classList.toggle("active", b.dataset.tab === tabId));
  root.querySelectorAll(".tab-panel").forEach(p => p.classList.toggle("active", p.id === tabId));
  root.scrollIntoView({ behavior: "smooth", block: "start" });
}

root.querySelectorAll(".tab").forEach(btn => btn.addEventListener("click", () => switchTab(btn.dataset.tab)));
root.querySelectorAll(".jump").forEach(btn => btn.addEventListener("click", () => switchTab(btn.dataset.jump)));

function populateVessels(select, defaultKey) {
  select.innerHTML = Object.entries(VESSELS).map(([key, v]) =>
    `<option value="${key}" ${key === defaultKey ? "selected" : ""}>${v.name}</option>`
  ).join("");
}

populateVessels($("seedVessel"), "plate6");
populateVessels($("densityVessel"), "plate96");

function addCountBox(containerId, value = 0) {
  const wrap = document.createElement("div");
  wrap.className = "count-box";
  wrap.innerHTML = `<input type="number" min="0" step="1" value="${value}" aria-label="Cell count" /><button type="button" title="Remove">×</button>`;
  wrap.querySelector("button").addEventListener("click", () => {
    if ($(containerId).children.length > 1) wrap.remove();
  });
  $(containerId).appendChild(wrap);
}

[48, 52, 50, 55].forEach(v => addCountBox("liveSquares", v));
[5, 4, 6, 5].forEach(v => addCountBox("deadSquares", v));
$("addLiveSquare").addEventListener("click", () => addCountBox("liveSquares", 0));
$("addDeadSquare").addEventListener("click", () => addCountBox("deadSquares", 0));

function readCounts(containerId) {
  return [...$(containerId).querySelectorAll("input")]
    .map(i => Number(i.value))
    .filter(v => Number.isFinite(v) && v >= 0);
}

function renderVesselVisual(vesselKey, usedPositions = null) {
  const v = VESSELS[vesselKey];
  if (!v) return "";
  if (v.type === "plate") {
    const total = v.positions;
    const shown = Math.min(total, 96); // keep the 384-well visual lightweight
    const used = usedPositions === null ? total : Math.min(usedPositions, total);
    const scaleUsed = Math.round((used / total) * shown);
    const wells = Array.from({ length: shown }, (_, i) => `<div class="well" style="opacity:${i < scaleUsed ? 1 : .28}"></div>`).join("");
    const rows = total === 384 ? 8 : v.rows;
    const cols = total === 384 ? 12 : v.cols;
    return `<div class="vessel-visual"><div class="plate" style="grid-template-columns:repeat(${cols},1fr);grid-template-rows:repeat(${rows},1fr)">${wells}</div><div class="vessel-caption">${v.name} • ${fmt(v.area)} cm² growth area per well • common working volume ~${fmtVolume(v.media)} per well</div></div>`;
  }
  return `<div class="vessel-visual"><div class="flask"><div class="flask-label">${v.name}<br>${fmt(v.area)} cm² growth area</div></div><div class="vessel-caption">Common working volume ~${fmtVolume(v.media)} per vessel</div></div>`;
}

function badgeForViability(v) {
  if (v >= 90) return `<span class="badge good">High viability</span>`;
  if (v >= 70) return `<span class="badge warn">Moderate viability</span>`;
  return `<span class="badge bad">Low viability</span>`;
}

$("calcViability").addEventListener("click", () => {
  const live = positiveNumber("viableLive");
  const dead = positiveNumber("viableDead");
  const total = live + dead;
  if (!Number.isFinite(total) || total <= 0 || live < 0 || dead < 0) {
    $("viabilityResult").innerHTML = `<div class="warning-box">Enter non-negative live/dead counts with a total greater than zero.</div>`;
    return;
  }
  const viability = live / total * 100;
  state.lastViability = viability;
  setSession();
  $("viabilityResult").innerHTML = `
    <div class="result-top"><div><h3>Viability result</h3><p>${fmtCells(total)} counted</p></div>${badgeForViability(viability)}</div>
    <div class="metric-grid">
      <div class="metric"><div class="label">Viability</div><div class="value">${fmt(viability,1)}%</div></div>
      <div class="metric"><div class="label">Non-viable fraction</div><div class="value">${fmt(100-viability,1)}%</div></div>
      <div class="metric"><div class="label">Live cells</div><div class="value">${fmt(live,0)}</div></div>
      <div class="metric"><div class="label">Dead cells</div><div class="value">${fmt(dead,0)}</div></div>
    </div>
    <div class="progress-wrap"><div class="progress-label"><span>Live fraction</span><span>${fmt(viability,1)}%</span></div><div class="progress"><div style="width:${Math.min(100,viability)}%"></div></div></div>`;
});

$("calcCount").addEventListener("click", () => {
  const live = readCounts("liveSquares");
  const dead = readCounts("deadSquares");
  const dilution = positiveNumber("countDilution");
  const factor = positiveNumber("chamberFactor");
  const suspension = positiveNumber("suspensionVolume");
  if (!live.length || !dead.length || dilution <= 0 || factor <= 0 || suspension < 0) {
    $("countResult").innerHTML = `<div class="warning-box">Check the replicate counts, dilution factor, chamber factor and suspension volume.</div>`;
    return;
  }
  const avgLive = live.reduce((a,b)=>a+b,0)/live.length;
  const avgDead = dead.reduce((a,b)=>a+b,0)/dead.length;
  const liveConc = avgLive * dilution * factor;
  const deadConc = avgDead * dilution * factor;
  const totalConc = liveConc + deadConc;
  const viability = totalConc > 0 ? liveConc / totalConc * 100 : 0;
  const totalLiveCells = liveConc * suspension;
  state.lastConcentration = liveConc;
  state.lastViability = viability;
  setSession();
  $("countResult").innerHTML = `
    <div class="result-top"><div><h3>Cell count result</h3><p>${live.length} live-count squares • ${dead.length} dead-count squares</p></div>${badgeForViability(viability)}</div>
    <div class="metric-grid">
      <div class="metric"><div class="label">Viable cells / mL</div><div class="value">${fmt(liveConc)}</div><div class="sub">Based on average live count ${fmt(avgLive,2)}</div></div>
      <div class="metric"><div class="label">Total cells / mL</div><div class="value">${fmt(totalConc)}</div><div class="sub">Live + dead</div></div>
      <div class="metric"><div class="label">Viability</div><div class="value">${fmt(viability,1)}%</div></div>
      <div class="metric"><div class="label">Viable cells in suspension</div><div class="value">${suspension > 0 ? fmt(totalLiveCells) : "—"}</div><div class="sub">${suspension > 0 ? `${fmtVolume(suspension)} entered` : "Enter suspension volume to calculate"}</div></div>
    </div>
    <div class="steps-box"><h4>Calculation</h4><ol class="steps-list">
      <li><span>1</span><div>Average live count = <b>${fmt(avgLive,2)}</b> cells/square.</div></li>
      <li><span>2</span><div>Apply dilution × chamber factor: ${fmt(avgLive,2)} × ${fmt(dilution,2)} × ${fmt(factor,0)}.</div></li>
      <li><span>3</span><div>Viable concentration = <b>${fmt(liveConc)} cells/mL</b>.</div></li>
      <li><span>4</span><div>Viability = viable concentration ÷ total concentration = <b>${fmt(viability,1)}%</b>.</div></li>
    </ol></div>`;
});

function syncSeedingDefaults() {
  const v = VESSELS[$("seedVessel").value];
  if (!v) return;
  $("seedWells").max = v.positions * Math.max(1, positiveNumber("seedPlateCount"));
  if (v.positions === 1) $("seedWells").value = Math.max(1, positiveNumber("seedPlateCount"));
  else if (positiveNumber("seedWells") > v.positions * positiveNumber("seedPlateCount")) $("seedWells").value = v.positions * positiveNumber("seedPlateCount");
  $("seedMediaPerWell").value = v.media;
}
$("seedVessel").addEventListener("change", () => {
  const v = VESSELS[$("seedVessel").value];
  const plates = Math.max(1, positiveNumber("seedPlateCount"));
  $("seedWells").value = v.positions * plates;
  syncSeedingDefaults();
});
$("seedPlateCount").addEventListener("change", syncSeedingDefaults);

function useLast(targetId) {
  if (state.lastConcentration) $(targetId).value = Math.round(state.lastConcentration);
  else alert("Calculate a cell concentration first, then use this button.");
}
$("useLastCount").addEventListener("click", () => useLast("seedStockConcentration"));
$("batchUseLastCount").addEventListener("click", () => useLast("batchStockConcentration"));

$("calcSeeding").addEventListener("click", () => {
  const stock = positiveNumber("seedStockConcentration");
  const vesselKey = $("seedVessel").value;
  const vessel = VESSELS[vesselKey];
  const plates = positiveNumber("seedPlateCount");
  const positions = positiveNumber("seedWells");
  const cellsPer = positiveNumber("seedCellsPerWell");
  const mediaPer = positiveNumber("seedMediaPerWell");
  const overage = positiveNumber("seedOverage");
  if (stock <= 0 || plates < 1 || positions < 1 || cellsPer <= 0 || mediaPer <= 0 || overage < 0) {
    $("seedingResult").innerHTML = `<div class="warning-box">Enter positive stock concentration, vessel count, positions, target cells and working volume.</div>`;
    return;
  }
  const maxPositions = vessel.positions * plates;
  if (positions > maxPositions) {
    $("seedingResult").innerHTML = `<div class="warning-box">${vessel.name} × ${fmt(plates,0)} provides ${fmt(maxPositions,0)} positions, but ${fmt(positions,0)} were requested.</div>`;
    return;
  }
  const multiplier = 1 + overage / 100;
  const totalCells = cellsPer * positions * multiplier;
  const finalVolume = mediaPer * positions * multiplier;
  const stockVolume = totalCells / stock;
  const mediaVolume = finalVolume - stockVolume;
  const workingConc = cellsPer / mediaPer;
  const stockPerPosition = cellsPer / stock;
  const feasible = mediaVolume >= 0;
  state.lastPlan = `${vessel.name}: ${fmt(positions,0)} position(s), ${fmtCells(cellsPer)} each`;
  setSession();
  $("seedingResult").innerHTML = `
    <div class="result-top"><div><h3>Seeding preparation</h3><p>${vessel.name} • ${fmt(positions,0)} position(s) • ${fmt(overage,1)}% overage</p></div><span class="badge ${feasible ? "good" : "bad"}">${feasible ? "Plan feasible" : "Stock too dilute"}</span></div>
    ${renderVesselVisual(vesselKey, positions / plates)}
    <div class="metric-grid">
      <div class="metric"><div class="label">Total cells to prepare</div><div class="value">${fmt(totalCells)}</div><div class="sub">Includes overage</div></div>
      <div class="metric"><div class="label">Cell-stock volume</div><div class="value">${fmtVolume(stockVolume)}</div><div class="sub">${fmtVolume(stockPerPosition)} stock per seeded position before overage</div></div>
      <div class="metric"><div class="label">Fresh media / diluent</div><div class="value">${feasible ? fmtVolume(mediaVolume) : "Not feasible"}</div><div class="sub">To reach final working volume</div></div>
      <div class="metric"><div class="label">Final suspension volume</div><div class="value">${fmtVolume(finalVolume)}</div><div class="sub">${fmtVolume(mediaPer)} per position</div></div>
      <div class="metric"><div class="label">Working cell concentration</div><div class="value">${fmt(workingConc)} cells/mL</div></div>
      <div class="metric"><div class="label">Target density</div><div class="value">${fmt(cellsPer / vessel.area)} cells/cm²</div><div class="sub">Using ${fmt(vessel.area)} cm² growth area</div></div>
    </div>
    ${feasible ? `<div class="steps-box"><h4>Preparation steps</h4><ol class="steps-list">
      <li><span>1</span><div>Prepare <b>${fmt(totalCells)} cells</b> total, including ${fmt(overage,1)}% excess.</div></li>
      <li><span>2</span><div>Withdraw <b>${fmtVolume(stockVolume)}</b> from the ${fmt(stock)} cells/mL stock.</div></li>
      <li><span>3</span><div>Add <b>${fmtVolume(mediaVolume)}</b> fresh medium/diluent to reach ${fmtVolume(finalVolume)}.</div></li>
      <li><span>4</span><div>Dispense <b>${fmtVolume(mediaPer)}</b> into each of ${fmt(positions,0)} selected position(s).</div></li>
    </ol></div>` : `<div class="warning-box">The requested final working concentration (${fmt(workingConc)} cells/mL) is higher than your stock concentration (${fmt(stock)} cells/mL). Concentrate the stock or reduce cells per position / increase final volume.</div>`}`;
});

let batchId = 0;
function addBatchRow(defaults = {}) {
  batchId += 1;
  const tr = document.createElement("tr");
  tr.dataset.id = batchId;
  tr.innerHTML = `
    <td><select class="batch-vessel">${Object.entries(VESSELS).map(([key,v]) => `<option value="${key}" ${key === (defaults.vessel || "plate96") ? "selected" : ""}>${v.name}</option>`).join("")}</select></td>
    <td><input class="batch-qty" type="number" min="1" step="1" value="${defaults.qty || 1}" /></td>
    <td><input class="batch-positions" type="number" min="1" step="1" value="${defaults.positions || 96}" /></td>
    <td><input class="batch-cells" type="number" min="1" step="1000" value="${defaults.cells || 10000}" /></td>
    <td><input class="batch-media" type="number" min="0.001" step="0.05" value="${defaults.media || 0.1}" /></td>
    <td><button class="remove-row" type="button">Remove</button></td>`;
  const vesselSelect = tr.querySelector(".batch-vessel");
  const qty = tr.querySelector(".batch-qty");
  const positions = tr.querySelector(".batch-positions");
  const media = tr.querySelector(".batch-media");
  function applyVesselDefaults() {
    const v = VESSELS[vesselSelect.value];
    const q = Number(qty.value) || 1;
    positions.value = v.positions * q;
    media.value = v.media;
  }
  vesselSelect.addEventListener("change", applyVesselDefaults);
  qty.addEventListener("change", () => {
    const v = VESSELS[vesselSelect.value];
    positions.max = v.positions * (Number(qty.value)||1);
  });
  tr.querySelector(".remove-row").addEventListener("click", () => {
    if ($("batchRows").children.length > 1) tr.remove();
  });
  $("batchRows").appendChild(tr);
}

addBatchRow({ vessel: "plate96", qty: 1, positions: 96, cells: 10000, media: 0.1 });
addBatchRow({ vessel: "plate6", qty: 1, positions: 6, cells: 200000, media: 2 });
$("addBatchRow").addEventListener("click", () => addBatchRow());

$("calcBatch").addEventListener("click", () => {
  const stock = positiveNumber("batchStockConcentration");
  const overage = positiveNumber("batchOverage");
  if (stock <= 0 || overage < 0) {
    $("batchResult").innerHTML = `<div class="warning-box">Enter a valid cell-stock concentration and overage.</div>`;
    return;
  }
  const rows = [...$("batchRows").querySelectorAll("tr")];
  const multiplier = 1 + overage/100;
  let totalCells = 0, totalFinal = 0, totalStock = 0;
  const groups = [];
  let hasError = false;
  rows.forEach((tr, idx) => {
    const key = tr.querySelector(".batch-vessel").value;
    const v = VESSELS[key];
    const qty = Number(tr.querySelector(".batch-qty").value);
    const positions = Number(tr.querySelector(".batch-positions").value);
    const cells = Number(tr.querySelector(".batch-cells").value);
    const media = Number(tr.querySelector(".batch-media").value);
    const max = v.positions * qty;
    if (qty < 1 || positions < 1 || positions > max || cells <= 0 || media <= 0) { hasError = true; return; }
    const groupCells = cells * positions * multiplier;
    const groupFinal = media * positions * multiplier;
    const groupStock = groupCells / stock;
    groups.push({ idx: idx+1, key, v, qty, positions, cells, media, groupCells, groupFinal, groupStock, groupDiluent: groupFinal-groupStock });
    totalCells += groupCells;
    totalFinal += groupFinal;
    totalStock += groupStock;
  });
  if (hasError || !groups.length) {
    $("batchResult").innerHTML = `<div class="warning-box">Check every group. Positions used cannot exceed the selected vessel capacity × quantity, and all values must be positive.</div>`;
    return;
  }
  const totalDiluent = totalFinal - totalStock;
  const feasible = groups.every(g => g.groupDiluent >= 0);
  state.lastPlan = `${groups.length} vessel group(s), ${fmt(totalCells)} cells total`;
  setSession();
  $("batchResult").innerHTML = `
    <div class="result-top"><div><h3>Complete batch preparation</h3><p>${groups.length} vessel group(s) • ${fmt(overage,1)}% overage</p></div><span class="badge ${feasible ? "good" : "bad"}">${feasible ? "Batch feasible" : "Review dilution"}</span></div>
    <div class="batch-summary">
      <div class="metric"><div class="label">Total cells</div><div class="value">${fmt(totalCells)}</div></div>
      <div class="metric"><div class="label">Total stock volume</div><div class="value">${fmtVolume(totalStock)}</div></div>
      <div class="metric"><div class="label">Total media / diluent</div><div class="value">${feasible ? fmtVolume(totalDiluent) : "Not feasible"}</div></div>
      <div class="metric"><div class="label">Total final volume</div><div class="value">${fmtVolume(totalFinal)}</div></div>
    </div>
    <div class="batch-breakdown">${groups.map(g => `
      <div class="batch-item">
        <strong>Group ${g.idx}: ${g.v.name} × ${fmt(g.qty,0)}</strong>
        <div>${fmt(g.positions,0)} position(s) • ${fmtCells(g.cells)} each • ${fmtVolume(g.media)} each</div>
        <div>Prepare ${fmt(g.groupCells)} cells in ${fmtVolume(g.groupFinal)} total: <b>${fmtVolume(g.groupStock)} stock</b> + <b>${g.groupDiluent >= 0 ? fmtVolume(g.groupDiluent) : "not feasible"} media/diluent</b>.</div>
      </div>`).join("")}</div>
    ${feasible ? `<div class="success-box">The combined totals can be used as a master preparation reference. If different groups need different working concentrations, prepare each group separately using the per-group volumes above.</div>` : `<div class="warning-box">At least one group requests a working concentration higher than the entered stock concentration. Review the affected group(s) before use.</div>`}`;
});

$("densityPreset").addEventListener("change", (e) => {
  if (e.target.value !== "custom") $("densityValue").value = e.target.value;
});

$("calcDensity").addEventListener("click", () => {
  const density = positiveNumber("densityValue");
  const key = $("densityVessel").value;
  const v = VESSELS[key];
  if (density <= 0) {
    $("densityResult").innerHTML = `<div class="warning-box">Enter a positive target density.</div>`;
    return;
  }
  const cellsPer = density * v.area;
  const fullVesselCells = cellsPer * v.positions;
  $("densityResult").innerHTML = `
    <div class="result-top"><div><h3>Density translation</h3><p>${v.name} • ${fmt(density)} cells/cm²</p></div><span class="badge warn">Editable starting estimate</span></div>
    ${renderVesselVisual(key)}
    <div class="metric-grid">
      <div class="metric"><div class="label">Growth area / position</div><div class="value">${fmt(v.area)} cm²</div></div>
      <div class="metric"><div class="label">Calculated cells / position</div><div class="value">${fmt(cellsPer)}</div></div>
      <div class="metric"><div class="label">Full vessel total</div><div class="value">${fmt(fullVesselCells)} cells</div><div class="sub">${fmt(v.positions,0)} position(s)</div></div>
      <div class="metric"><div class="label">Common working volume</div><div class="value">${fmtVolume(v.media)} / position</div></div>
    </div>
    <div class="helper-note">Use this as a geometry conversion, not as a cell-line-specific protocol. Replace the density with your laboratory’s validated value for the exact cell line and assay.</div>`;
});

$("printBtn").addEventListener("click", () => {
  document.body.classList.add("cc-print-mode");
  window.print();
});
window.addEventListener("afterprint", () => document.body.classList.remove("cc-print-mode"));
$("resetBtn").addEventListener("click", () => {
  if (confirm("Reset the cell culture calculator session?")) {
    window.location.hash = "cell-calculator";
    window.location.reload();
  }
});

// Initialize defaults.
syncSeedingDefaults();
setSession();


  function onShow() {
    setSession();
  }

  return { onShow, switchTab };
})();
