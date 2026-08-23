window.BioBufferTool = (() => {
  'use strict';

  const root = document.getElementById('buffer-calculator');
  if (!root) return { onShow() {} };
  const D = window.BUFFER_CHEM_DATA;
  const $ = (id) => root.querySelector(`#${id}`);
  const $$ = (sel, scope = root) => [...scope.querySelectorAll(sel)];

  const VOLUME_UNITS = {
    L: { label: 'L', toL: 1 },
    mL: { label: 'mL', toL: 1e-3 },
    uL: { label: 'µL', toL: 1e-6 },
    nL: { label: 'nL', toL: 1e-9 }
  };

  const MASS_UNITS = {
    kg: { label: 'kg', toG: 1000 },
    g: { label: 'g', toG: 1 },
    mg: { label: 'mg', toG: 1e-3 },
    ug: { label: 'µg', toG: 1e-6 },
    ng: { label: 'ng', toG: 1e-9 }
  };

  const CONC_UNITS = {
    M:       { label: 'M', category: 'molar', factor: 1 },
    mM:      { label: 'mM', category: 'molar', factor: 1e-3 },
    uM:      { label: 'µM', category: 'molar', factor: 1e-6 },
    nM:      { label: 'nM', category: 'molar', factor: 1e-9 },
    pM:      { label: 'pM', category: 'molar', factor: 1e-12 },
    'g/L':   { label: 'g/L', category: 'mass', factor: 1 },
    'mg/mL': { label: 'mg/mL', category: 'mass', factor: 1 },
    'mg/L':  { label: 'mg/L', category: 'mass', factor: 1e-3 },
    'mg/dL': { label: 'mg/dL', category: 'mass', factor: 1e-2 },
    'ug/mL': { label: 'µg/mL', category: 'mass', factor: 1e-3 },
    'ug/L':  { label: 'µg/L', category: 'mass', factor: 1e-6 },
    'ng/mL': { label: 'ng/mL', category: 'mass', factor: 1e-6 },
    '%w/v':  { label: '% w/v', category: 'mass', factor: 10 },
    '%v/v':  { label: '% v/v', category: 'volumeFraction', factor: 0.01 },
    X:       { label: '× (fold)', category: 'fold', factor: 1 }
  };

  const MOLAR_UNITS = ['M','mM','uM','nM'];
  const SOLID_CONC_UNITS = ['M','mM','uM','nM','g/L','mg/mL','mg/L','mg/dL','ug/mL','ug/L','ng/mL','%w/v'];

  function finitePositive(value, label = 'Value', allowZero = false) {
    const n = Number(value);
    if (!Number.isFinite(n) || (allowZero ? n < 0 : n <= 0)) throw new Error(`${label} must be ${allowZero ? 'zero or greater' : 'greater than zero'}.`);
    return n;
  }

  function toL(value, unit) { return finitePositive(value, 'Volume') * VOLUME_UNITS[unit].toL; }
  function toG(value, unit) { return finitePositive(value, 'Mass') * MASS_UNITS[unit].toG; }

  function fmt(value, digits = 6) {
    if (!Number.isFinite(value)) return '—';
    const abs = Math.abs(value);
    const max = abs >= 1000 ? 2 : abs >= 10 ? 3 : digits;
    return new Intl.NumberFormat('en-US', { maximumFractionDigits: max }).format(value);
  }

  function fmtMass(g) {
    const a = Math.abs(g);
    if (a >= 1000) return `${fmt(g / 1000, 4)} kg`;
    if (a >= 1) return `${fmt(g, 5)} g`;
    if (a >= 1e-3) return `${fmt(g * 1e3, 5)} mg`;
    if (a >= 1e-6) return `${fmt(g * 1e6, 5)} µg`;
    return `${fmt(g * 1e9, 5)} ng`;
  }

  function fmtVolume(liters) {
    const a = Math.abs(liters);
    if (a >= 1) return `${fmt(liters, 5)} L`;
    if (a >= 1e-3) return `${fmt(liters * 1e3, 5)} mL`;
    if (a >= 1e-6) return `${fmt(liters * 1e6, 5)} µL`;
    return `${fmt(liters * 1e9, 5)} nL`;
  }

  function fmtMolar(M) {
    const a = Math.abs(M);
    if (a >= 1) return `${fmt(M, 5)} M`;
    if (a >= 1e-3) return `${fmt(M * 1e3, 5)} mM`;
    if (a >= 1e-6) return `${fmt(M * 1e6, 5)} µM`;
    if (a >= 1e-9) return `${fmt(M * 1e9, 5)} nM`;
    return `${fmt(M * 1e12, 5)} pM`;
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  }

  function alertUser(message, type = 'error') {
    const el = document.createElement('div');
    el.className = `alert ${type}`;
    el.textContent = message;
    $('alerts').appendChild(el);
    setTimeout(() => el.remove(), 5200);
  }

  function parseFormula(rawFormula) {
    let formula = String(rawFormula || '').trim().replace(/\s+/g, '').replace(/[•⋅]/g, '·');
    if (!formula) throw new Error('Enter a chemical formula or select a common reagent.');
    formula = formula.replace(/[⁺⁻]+$/g, '').replace(/\^(?:\d+)?[+-]$/g, '');

    const totalCounts = {};
    const parts = formula.split(/[·.]/).filter(Boolean);
    if (!parts.length) throw new Error('The chemical formula could not be read.');

    function addCount(symbol, count, target) { target[symbol] = (target[symbol] || 0) + count; }

    function parsePart(part) {
      let multiplier = 1;
      const leading = part.match(/^(\d+(?:\.\d+)?)(?=[A-Z(\[])/);
      if (leading) {
        multiplier = Number(leading[1]);
        part = part.slice(leading[1].length);
      }
      let i = 0;

      function readNumber() {
        const start = i;
        while (i < part.length && /[0-9.]/.test(part[i])) i++;
        if (start === i) return 1;
        const n = Number(part.slice(start, i));
        if (!Number.isFinite(n) || n <= 0) throw new Error(`Invalid subscript in formula: ${rawFormula}`);
        return n;
      }

      function parseSequence(closeChar = null) {
        const counts = {};
        while (i < part.length) {
          const ch = part[i];
          if (closeChar && ch === closeChar) { i++; return counts; }
          if (ch === '(' || ch === '[') {
            const expected = ch === '(' ? ')' : ']';
            i++;
            const inner = parseSequence(expected);
            const factor = readNumber();
            Object.entries(inner).forEach(([sym, n]) => addCount(sym, n * factor, counts));
            continue;
          }
          if (ch === ')' || ch === ']') throw new Error(`Unmatched bracket in formula: ${rawFormula}`);
          if (/[A-Z]/.test(ch)) {
            let symbol = ch; i++;
            if (i < part.length && /[a-z]/.test(part[i])) { symbol += part[i]; i++; }
            if (!(symbol in D.atomicWeights)) throw new Error(`Unknown element symbol “${symbol}”.`);
            addCount(symbol, readNumber(), counts);
            continue;
          }
          throw new Error(`Unsupported character “${ch}” in formula.`);
        }
        if (closeChar) throw new Error(`Missing “${closeChar}” in formula.`);
        return counts;
      }

      const counts = parseSequence();
      Object.keys(counts).forEach(k => counts[k] *= multiplier);
      return counts;
    }

    parts.forEach(part => {
      const counts = parsePart(part);
      Object.entries(counts).forEach(([sym, n]) => addCount(sym, n, totalCounts));
    });

    const mw = Object.entries(totalCounts).reduce((sum, [sym, n]) => sum + D.atomicWeights[sym] * n, 0);
    return { formula, counts: totalCounts, mw };
  }

  function findReagent(input) {
    const q = String(input || '').trim().toLowerCase();
    if (!q) return null;
    return D.commonReagents.find(r =>
      r.name.toLowerCase() === q ||
      (r.formula && r.formula.toLowerCase() === q) ||
      (r.aliases || '').toLowerCase().split(/\s+/).includes(q)
    ) || null;
  }

  function resolveFormulaInput(input) {
    const reagent = findReagent(input);
    if (reagent) {
      if (!reagent.formula) throw new Error(reagent.note || `No single molecular formula is stored for ${reagent.name}. Enter MW manually.`);
      const parsed = parseFormula(reagent.formula);
      return { ...parsed, displayName: reagent.name, note: reagent.note || '' };
    }
    const parsed = parseFormula(input);
    return { ...parsed, displayName: parsed.formula, note: '' };
  }

  function resolveMw(manualValue, formulaValue) {
    const manual = Number(manualValue);
    if (Number.isFinite(manual) && manual > 0) return { mw: manual, source: 'manual MW' };
    const r = resolveFormulaInput(formulaValue);
    return { mw: r.mw, source: r.displayName, formula: r.formula };
  }

  function concentrationToBase(value, unit, mw = null) {
    const n = finitePositive(value, 'Concentration');
    const def = CONC_UNITS[unit];
    if (!def) throw new Error(`Unsupported concentration unit: ${unit}`);
    return { value: n * def.factor, category: def.category };
  }

  function convertConcentration(value, fromUnit, toUnit, mw = null) {
    const from = concentrationToBase(value, fromUnit, mw);
    const to = CONC_UNITS[toUnit];
    if (from.category === to.category) return from.value / to.factor;

    if ((from.category === 'molar' && to.category === 'mass') || (from.category === 'mass' && to.category === 'molar')) {
      const molecularWeight = finitePositive(mw, 'Molecular weight');
      if (from.category === 'molar') {
        const gPerL = from.value * molecularWeight;
        return gPerL / to.factor;
      }
      const molar = from.value / molecularWeight;
      return molar / to.factor;
    }
    throw new Error(`Cannot directly convert ${CONC_UNITS[fromUnit].label} to ${to.label}. Use compatible concentration types.`);
  }

  function commonConcentrationBasis(value, unit, mw = null) {
    const base = concentrationToBase(value, unit);
    if (base.category === 'molar') return { value: base.value, category: 'molar' };
    if (base.category === 'mass') return { value: base.value, category: 'mass' };
    return base;
  }

  function ratioForDilution(c1, u1, c2, u2, mw = null) {
    let b1 = commonConcentrationBasis(c1, u1, mw);
    let b2 = commonConcentrationBasis(c2, u2, mw);
    if (b1.category !== b2.category) {
      const molecularWeight = finitePositive(mw, 'Molecular weight');
      if (b1.category === 'molar' && b2.category === 'mass') b2 = { value: b2.value / molecularWeight, category: 'molar' };
      else if (b1.category === 'mass' && b2.category === 'molar') b2 = { value: b2.value * molecularWeight, category: 'mass' };
      else throw new Error('Stock and target concentration units are incompatible for a dilution calculation.');
    }
    return b2.value / b1.value;
  }

  function metric(label, value, sub = '') {
    return `<div class="metric"><small>${escapeHtml(label)}</small><strong>${value}</strong>${sub ? `<span>${sub}</span>` : ''}</div>`;
  }

  function steps(items) { return `<ol class="steps">${items.map(i => `<li>${i}</li>`).join('')}</ol>`; }

  function volumeVisual(stockL, totalL, stockLabel = 'Stock') {
    const pct = Math.max(0, Math.min(100, stockL / totalL * 100));
    return `<div class="volume-visual">
      <div class="volume-bar"><div class="volume-part stock" style="width:${pct}%"></div><div class="volume-part solvent" style="width:${100-pct}%"></div></div>
      <div class="volume-legend"><span><i class="dot stock"></i>${escapeHtml(stockLabel)} ${fmt(pct,2)}%</span><span><i class="dot solvent"></i>Solvent ${fmt(100-pct,2)}%</span></div>
    </div>`;
  }

  function initSelects() {
    $$('.volume-unit').forEach(select => {
      select.innerHTML = Object.entries(VOLUME_UNITS).map(([v,d]) => `<option value="${v}">${d.label}</option>`).join('');
      if (select.id.includes('Vol') || select.id.includes('Volume') || select.id === 'dilV2' || select.id === 'mixFinalVolUnit') select.value = 'mL';
    });
    $$('.conc-unit').forEach(select => {
      const units = select.id === 'solidConcUnit' ? SOLID_CONC_UNITS : Object.keys(CONC_UNITS);
      select.innerHTML = units.map(v => `<option value="${v}">${CONC_UNITS[v].label}</option>`).join('');
    });
    $$('.molar-unit').forEach(select => {
      select.innerHTML = MOLAR_UNITS.map(v => `<option value="${v}">${CONC_UNITS[v].label}</option>`).join('');
    });

    $('solidConcUnit').value = 'mM'; $('solidVolumeUnit').value = 'mL';
    $('dilC1Unit').value = 'X'; $('dilC2Unit').value = 'X'; $('dilV2Unit').value = 'mL';
    $('bufferConcUnit').value = 'mM'; $('bufferVolumeUnit').value = 'mL';
    $('mixFinalVolUnit').value = 'mL';
    $('convFrom').value = 'mM'; $('convTo').value = 'M';
    $('volConvFrom').value = 'mL'; $('volConvTo').value = 'uL';
  }

  function initReagents() {
    $('reagentList').innerHTML = D.commonReagents.map(r => `<option value="${escapeHtml(r.name)}">${escapeHtml(r.formula || 'manual MW')}</option>`).join('');
  }

  function updateSolidMwVisibility() {
    const needsMw = CONC_UNITS[$('solidConcUnit').value].category === 'molar';
    $('solidMwBlock').classList.toggle('hidden', !needsMw);
  }

  function updateSolidMwPreview() {
    try {
      const r = resolveFormulaInput($('solidFormula').value);
      $('solidMwPreview').innerHTML = `<strong>${fmt(r.mw,5)} g/mol</strong> · ${escapeHtml(r.formula)}${r.displayName !== r.formula ? ` · ${escapeHtml(r.displayName)}` : ''}`;
    } catch (e) { $('solidMwPreview').textContent = e.message; }
  }

  function calculateSolid() {
    try {
      const conc = finitePositive($('solidConc').value, 'Target concentration');
      const unit = $('solidConcUnit').value;
      const volumeL = toL($('solidVolume').value, $('solidVolumeUnit').value);
      const def = CONC_UNITS[unit];
      let grams, mwInfo = null, equation;

      if (def.category === 'molar') {
        if ($('solidMwMode').value === 'manual') mwInfo = resolveMw($('solidManualMw').value, '');
        else mwInfo = resolveMw('', $('solidFormula').value);
        const molar = conc * def.factor;
        grams = molar * volumeL * mwInfo.mw;
        equation = `mass = concentration × volume × MW = ${fmt(molar,6)} mol/L × ${fmt(volumeL,6)} L × ${fmt(mwInfo.mw,6)} g/mol`;
      } else if (def.category === 'mass') {
        const gPerL = conc * def.factor;
        grams = gPerL * volumeL;
        equation = `mass = ${fmt(gPerL,6)} g/L × ${fmt(volumeL,6)} L`;
      } else throw new Error('This concentration type is not suitable for preparing a solution from a weighed solid.');

      $('solidResult').innerHTML = `<div class="result-kicker">Preparation result</div><div class="result-title">Weigh ${fmtMass(grams)}</div>
        <div class="metric-grid">
          ${metric('Material to weigh', fmtMass(grams), `${fmt(grams,6)} g`)}
          ${metric('Final solution volume', fmtVolume(volumeL), 'Bring to this final volume')}
          ${metric('Target concentration', `${fmt(conc)} ${CONC_UNITS[unit].label}`)}
          ${mwInfo ? metric('Molecular weight', `${fmt(mwInfo.mw,5)} g/mol`, mwInfo.source) : metric('Concentration basis', CONC_UNITS[unit].label)}
        </div>
        ${steps([
          `Weigh <strong>${fmtMass(grams)}</strong> of the selected material.`,
          `Dissolve it in less than the final volume of the appropriate solvent or buffer vehicle.`,
          `After dissolution and any required pH adjustment, bring the solution to a final volume of <strong>${fmtVolume(volumeL)}</strong>.`,
          `Mix thoroughly and label with concentration, preparation date, and any protocol-required storage information.`
        ])}
        <div class="equation">${escapeHtml(equation)}</div>`;
      alertUser('Preparation calculated.', 'success');
    } catch (e) { alertUser(e.message); }
  }

  function calculateDilution() {
    try {
      const c1 = finitePositive($('dilC1').value, 'Stock concentration');
      const c2 = finitePositive($('dilC2').value, 'Desired concentration');
      const u1 = $('dilC1Unit').value, u2 = $('dilC2Unit').value;
      const v2 = toL($('dilV2').value, $('dilV2Unit').value);
      const mw = Number($('dilMw').value) || null;
      const ratio = ratioForDilution(c1,u1,c2,u2,mw);
      if (!(ratio > 0)) throw new Error('The dilution ratio could not be calculated.');
      if (ratio > 1 + 1e-12) throw new Error('The desired concentration is higher than the stock concentration. A simple dilution cannot make this solution.');
      const v1 = v2 * ratio;
      const solvent = Math.max(0, v2 - v1);
      const fold = 1 / ratio;
      $('dilResult').innerHTML = `<div class="result-kicker">Dilution result</div><div class="result-title">Take ${fmtVolume(v1)} of stock</div>
        <div class="metric-grid">
          ${metric('Stock to add', fmtVolume(v1), 'V₁')}
          ${metric('Nominal diluent', fmtVolume(solvent), 'V₂ − V₁')}
          ${metric('Final volume', fmtVolume(v2), 'V₂')}
          ${metric('Dilution factor', `${fmt(fold,5)}×`, `Stock is ${fmt(fold,5)} times stronger`)}
        </div>
        ${volumeVisual(v1,v2,'Stock')}
        ${steps([
          `Measure <strong>${fmtVolume(v1)}</strong> of the starting stock.`,
          `Add approximately <strong>${fmtVolume(solvent)}</strong> of diluent as the nominal volume balance.`,
          `For best volumetric accuracy, mix and then bring the preparation to a final volume of <strong>${fmtVolume(v2)}</strong>.`
        ])}
        <div class="equation">C₁V₁ = C₂V₂ → V₁ = (${fmt(c2)} ${escapeHtml(CONC_UNITS[u2].label)} / ${fmt(c1)} ${escapeHtml(CONC_UNITS[u1].label)}) × ${fmtVolume(v2)}</div>`;
    } catch (e) { alertUser(e.message); }
  }

  function unknownFields() {
    const mode = $('unknownMode').value;
    const mwInputs = `<div class="input-row"><label>Molecular weight (g/mol)<input id="unknownMw" type="number" min="0" step="any" placeholder="optional if formula entered"></label><label>Formula / reagent<input id="unknownFormula" list="reagentList" placeholder="e.g. NaCl"></label></div>`;
    if (mode === 'massToMolar') {
      $('unknownFields').innerHTML = `<label>Mass of solute<div class="input-row"><input id="unknownMass" type="number" min="0" step="any" value="5"><select id="unknownMassUnit"></select></div></label>
      <label>Final solution volume<div class="input-row"><input id="unknownVol" type="number" min="0" step="any" value="500"><select id="unknownVolUnit"></select></div></label>${mwInputs}`;
      fillMassSelect($('unknownMassUnit'),'g'); fillVolumeSelect($('unknownVolUnit'),'mL');
    } else if (mode === 'molarToMass') {
      $('unknownFields').innerHTML = `<label>Molar concentration<div class="input-row"><input id="unknownMolar" type="number" min="0" step="any" value="100"><select id="unknownMolarUnit"></select></div></label>${mwInputs}`;
      fillMolarSelect($('unknownMolarUnit'),'mM');
    } else {
      $('unknownFields').innerHTML = `<label>Mass concentration<div class="input-row"><input id="unknownMassConc" type="number" min="0" step="any" value="5"><select id="unknownMassConcUnit"></select></div></label>${mwInputs}`;
      fillSelect($('unknownMassConcUnit'), ['g/L','mg/mL','mg/L','mg/dL','ug/mL','ug/L','ng/mL','%w/v'],'g/L');
    }
  }

  function calculateUnknown() {
    try {
      const mode = $('unknownMode').value;
      const mwInfo = resolveMw($('unknownMw').value, $('unknownFormula').value);
      let html;
      if (mode === 'massToMolar') {
        const massG = toG($('unknownMass').value, $('unknownMassUnit').value);
        const volL = toL($('unknownVol').value, $('unknownVolUnit').value);
        const moles = massG / mwInfo.mw;
        const M = moles / volL;
        html = `<div class="result-kicker">Calculated concentration</div><div class="result-title">${fmtMolar(M)}</div><div class="metric-grid">
          ${metric('Molarity', `${fmt(M,8)} M`, fmtMolar(M))}${metric('Moles of solute', `${fmt(moles,8)} mol`)}${metric('Mass concentration', `${fmt(M*mwInfo.mw,6)} g/L`, `${fmt(M*mwInfo.mw,6)} mg/mL`)}${metric('MW used', `${fmt(mwInfo.mw,5)} g/mol`, mwInfo.source)}</div>
          <div class="equation">M = (mass / MW) / volume = (${fmt(massG,8)} g / ${fmt(mwInfo.mw,8)} g/mol) / ${fmt(volL,8)} L</div>`;
      } else if (mode === 'molarToMass') {
        const M = finitePositive($('unknownMolar').value,'Molar concentration') * CONC_UNITS[$('unknownMolarUnit').value].factor;
        const gL = M * mwInfo.mw;
        html = `<div class="result-kicker">Mass concentration</div><div class="result-title">${fmt(gL,6)} g/L</div><div class="metric-grid">${metric('g/L', `${fmt(gL,6)} g/L`)}${metric('mg/mL', `${fmt(gL,6)} mg/mL`)}${metric('mg/L', `${fmt(gL*1000,6)} mg/L`)}${metric('MW used', `${fmt(mwInfo.mw,5)} g/mol`, mwInfo.source)}</div><div class="equation">g/L = mol/L × g/mol</div>`;
      } else {
        const input = finitePositive($('unknownMassConc').value,'Mass concentration');
        const unit = $('unknownMassConcUnit').value;
        const gL = input * CONC_UNITS[unit].factor;
        const M = gL / mwInfo.mw;
        html = `<div class="result-kicker">Molar concentration</div><div class="result-title">${fmtMolar(M)}</div><div class="metric-grid">${metric('Molarity', `${fmt(M,8)} M`, fmtMolar(M))}${metric('Mass concentration', `${fmt(gL,6)} g/L`)}${metric('MW used', `${fmt(mwInfo.mw,5)} g/mol`, mwInfo.source)}</div><div class="equation">M = (g/L) / (g/mol) = ${fmt(gL,8)} / ${fmt(mwInfo.mw,8)}</div>`;
      }
      $('unknownResult').innerHTML = html;
    } catch (e) { alertUser(e.message); }
  }

  function initBufferSystems() {
    $('bufferSystem').innerHTML = D.bufferSystems.map((b,i)=>`<option value="${i}">${escapeHtml(b.name)}</option>`).join('');
    const phosphateIndex = D.bufferSystems.findIndex(b => b.name.startsWith('Phosphate'));
    $('bufferSystem').value = String(phosphateIndex >= 0 ? phosphateIndex : 0);
    bufferSystemChanged();
  }

  function bufferSystemChanged() {
    const b = D.bufferSystems[Number($('bufferSystem').value)];
    $('bufferPka').value = b.pKa;
    $('bufferNote').textContent = b.note;
  }

  function bufferRouteFields() {
    if ($('bufferRoute').value === 'stocks') {
      $('bufferRouteFields').innerHTML = `<div class="input-row"><label>Acid-form stock concentration<div class="input-row"><input id="bufferAcidStock" type="number" min="0" step="any" value="1"><select id="bufferAcidStockUnit"></select></div></label><label>Base-form stock concentration<div class="input-row"><input id="bufferBaseStock" type="number" min="0" step="any" value="1"><select id="bufferBaseStockUnit"></select></div></label></div>`;
      fillMolarSelect($('bufferAcidStockUnit'),'M'); fillMolarSelect($('bufferBaseStockUnit'),'M');
    } else {
      $('bufferRouteFields').innerHTML = `<div class="input-row"><label>Acid-form formula / reagent<input id="bufferAcidFormula" list="reagentList" placeholder="or enter MW below"></label><label>Acid-form MW (g/mol)<input id="bufferAcidMw" type="number" min="0" step="any" placeholder="manual override"></label></div>
      <div class="input-row"><label>Base-form formula / reagent<input id="bufferBaseFormula" list="reagentList" placeholder="or enter MW below"></label><label>Base-form MW (g/mol)<input id="bufferBaseMw" type="number" min="0" step="any" placeholder="manual override"></label></div>`;
    }
  }

  function calculateBuffer() {
    try {
      const ph = Number($('bufferPh').value), pka = Number($('bufferPka').value);
      if (!Number.isFinite(ph) || !Number.isFinite(pka)) throw new Error('Enter valid pH and pKa values.');
      const cTotal = finitePositive($('bufferConc').value,'Buffer concentration') * CONC_UNITS[$('bufferConcUnit').value].factor;
      const vFinal = toL($('bufferVolume').value,$('bufferVolumeUnit').value);
      const ratio = Math.pow(10, ph - pka);
      const totalMoles = cTotal * vFinal;
      const acidMoles = totalMoles / (1 + ratio);
      const baseMoles = totalMoles - acidMoles;
      const acidPct = acidMoles / totalMoles * 100;
      const basePct = 100 - acidPct;
      let prepHtml = '';

      if ($('bufferRoute').value === 'stocks') {
        const acidStockM = finitePositive($('bufferAcidStock').value,'Acid stock concentration') * CONC_UNITS[$('bufferAcidStockUnit').value].factor;
        const baseStockM = finitePositive($('bufferBaseStock').value,'Base stock concentration') * CONC_UNITS[$('bufferBaseStockUnit').value].factor;
        const acidVol = acidMoles / acidStockM;
        const baseVol = baseMoles / baseStockM;
        const combined = acidVol + baseVol;
        if (combined > vFinal * (1 + 1e-10)) throw new Error(`The selected stocks are too dilute: they require ${fmtVolume(combined)}, which exceeds the ${fmtVolume(vFinal)} final volume.`);
        const nominalSolvent = Math.max(0, vFinal - combined);
        prepHtml = `<div class="metric-grid">${metric('Acid-form stock', fmtVolume(acidVol), `${fmt(acidStockM,6)} M stock`)}${metric('Base-form stock', fmtVolume(baseVol), `${fmt(baseStockM,6)} M stock`)}${metric('Nominal solvent balance', fmtVolume(nominalSolvent), 'Then q.s. to final volume')}${metric('Final volume', fmtVolume(vFinal))}</div>
          ${volumeVisual(combined,vFinal,'Combined buffer stocks')}
          ${steps([
            `Add <strong>${fmtVolume(acidVol)}</strong> of the acid-form stock.`,
            `Add <strong>${fmtVolume(baseVol)}</strong> of the base-form stock.`,
            `Add solvent below the final volume; the nominal balance is <strong>${fmtVolume(nominalSolvent)}</strong>.`,
            `Mix, measure the actual pH, make protocol-appropriate pH adjustment if needed, then bring exactly to <strong>${fmtVolume(vFinal)}</strong>.`
          ])}`;
      } else {
        const acid = resolveMw($('bufferAcidMw').value,$('bufferAcidFormula').value);
        const base = resolveMw($('bufferBaseMw').value,$('bufferBaseFormula').value);
        const acidG = acidMoles * acid.mw;
        const baseG = baseMoles * base.mw;
        prepHtml = `<div class="metric-grid">${metric('Acid form to weigh', fmtMass(acidG), acid.source)}${metric('Base form to weigh', fmtMass(baseG), base.source)}${metric('Total buffer amount', `${fmt(totalMoles,7)} mol`)}${metric('Final volume', fmtVolume(vFinal))}</div>
          ${steps([
            `Weigh <strong>${fmtMass(acidG)}</strong> of the acid form and <strong>${fmtMass(baseG)}</strong> of the base form.`,
            `Dissolve both in less than the final volume of solvent.`,
            `Measure pH and make protocol-appropriate adjustments if required. Henderson–Hasselbalch gives an estimate, not a substitute for pH measurement.`,
            `Bring the preparation to a final volume of <strong>${fmtVolume(vFinal)}</strong>.`
          ])}`;
      }

      $('bufferResult').innerHTML = `<div class="result-kicker">Buffer design</div><div class="result-title">Base : acid = ${fmt(ratio,5)} : 1</div>
        <div class="metric-grid">${metric('Target pH', fmt(ph,3), `pKa ${fmt(pka,3)}`)}${metric('Acid form', `${fmt(acidPct,3)}%`, `${fmt(acidMoles,7)} mol`)}${metric('Base form', `${fmt(basePct,3)}%`, `${fmt(baseMoles,7)} mol`)}${metric('Total buffer', fmtMolar(cTotal), fmtVolume(vFinal))}</div>
        ${prepHtml}<div class="equation">pH = pKa + log₁₀([base]/[acid]) → [base]/[acid] = 10^(${fmt(ph,3)} − ${fmt(pka,3)}) = ${fmt(ratio,6)}</div>`;
    } catch (e) { alertUser(e.message); }
  }

  let mixRowCounter = 0;
  function mixRow(values = {}) {
    const id = ++mixRowCounter;
    const tr = document.createElement('tr');
    tr.dataset.rowId = id;
    tr.innerHTML = `<td><input class="mix-name" value="${escapeHtml(values.name || `Component ${id}`)}" /></td>
      <td><div class="mix-cell"><input class="mix-stock" type="number" min="0" step="any" value="${values.stock ?? 1}"><select class="mix-stock-unit"></select></div></td>
      <td><div class="mix-cell"><input class="mix-target" type="number" min="0" step="any" value="${values.target ?? 1}"><select class="mix-target-unit"></select></div></td>
      <td><input class="mix-mw" type="number" min="0" step="any" value="${values.mw ?? ''}" placeholder="g/mol"></td>
      <td><button class="icon-btn mix-delete" title="Remove component">×</button></td>`;
    $('mixRows').appendChild(tr);
    fillSelect(tr.querySelector('.mix-stock-unit'),Object.keys(CONC_UNITS),values.stockUnit || 'M');
    fillSelect(tr.querySelector('.mix-target-unit'),Object.keys(CONC_UNITS),values.targetUnit || 'mM');
    tr.querySelector('.mix-delete').addEventListener('click', () => tr.remove());
  }

  function calculateMix() {
    try {
      const finalL = toL($('mixFinalVol').value,$('mixFinalVolUnit').value);
      const rows = $$('#mixRows tr');
      if (!rows.length) throw new Error('Add at least one component.');
      let totalL = 0;
      const results = rows.map((tr,i) => {
        const name = tr.querySelector('.mix-name').value.trim() || `Component ${i+1}`;
        const stock = finitePositive(tr.querySelector('.mix-stock').value,`${name} stock concentration`);
        const target = finitePositive(tr.querySelector('.mix-target').value,`${name} target concentration`, true);
        const su = tr.querySelector('.mix-stock-unit').value;
        const tu = tr.querySelector('.mix-target-unit').value;
        const mw = Number(tr.querySelector('.mix-mw').value) || null;
        const ratio = target === 0 ? 0 : ratioForDilution(stock,su,target,tu,mw);
        if (ratio > 1 + 1e-12) throw new Error(`${name}: target concentration is higher than the stock concentration.`);
        const vol = finalL * ratio;
        totalL += vol;
        return {name, stock, target, su, tu, vol};
      });
      if (totalL > finalL * (1 + 1e-10)) throw new Error(`Combined stock volumes (${fmtVolume(totalL)}) exceed the final volume (${fmtVolume(finalL)}). Use stronger stocks or a larger final volume.`);
      const solvent = Math.max(0, finalL-totalL);
      const table = `<table class="result-table"><thead><tr><th>Component</th><th>Stock</th><th>Target</th><th>Add</th></tr></thead><tbody>${results.map(r=>`<tr><td>${escapeHtml(r.name)}</td><td>${fmt(r.stock)} ${escapeHtml(CONC_UNITS[r.su].label)}</td><td>${fmt(r.target)} ${escapeHtml(CONC_UNITS[r.tu].label)}</td><td><strong>${fmtVolume(r.vol)}</strong></td></tr>`).join('')}</tbody></table>`;
      const segments = results.map((r,i)=>`<div style="width:${Math.max(0,r.vol/finalL*100)}%;background:hsl(${170+i*37} 38% ${42+i%2*10}%);height:100%" title="${escapeHtml(r.name)}"></div>`).join('') + `<div class="volume-part solvent" style="width:${solvent/finalL*100}%"></div>`;
      $('mixResult').innerHTML = `<div class="result-kicker">Mixture plan</div><div class="result-title">Prepare ${fmtVolume(finalL)} total</div>
        ${table}<div class="metric-grid">${metric('Total stock additions',fmtVolume(totalL))}${metric('Nominal solvent',fmtVolume(solvent),'Then q.s. to final volume')}</div>
        <div class="volume-visual"><div class="volume-bar">${segments}</div><div class="volume-legend"><span>Colored segments = stock additions</span><span><i class="dot solvent"></i>Remaining solvent</span></div></div>
        ${steps([...results.map(r=>`Add <strong>${fmtVolume(r.vol)}</strong> of ${escapeHtml(r.name)}.`),`Add solvent below the final volume; nominal remaining volume is <strong>${fmtVolume(solvent)}</strong>.`,`Mix and bring exactly to <strong>${fmtVolume(finalL)}</strong>.`])}`;
    } catch (e) { alertUser(e.message); }
  }

  function calculateMw() {
    try {
      const r = resolveFormulaInput($('mwFormula').value);
      const composition = Object.entries(r.counts).map(([sym,n]) => {
        const contribution = D.atomicWeights[sym]*n;
        return `${sym}: ${fmt(n,4)} atom${n===1?'':'s'} (${fmt(contribution/r.mw*100,3)}%)`;
      }).join(' · ');
      $('mwResult').innerHTML = `<div class="result-kicker">Molecular weight</div><strong style="font-size:1.5rem">${fmt(r.mw,6)} g/mol</strong><div>${escapeHtml(r.formula)}${r.displayName !== r.formula ? ` <span class="badge">${escapeHtml(r.displayName)}</span>`:''}</div><div class="composition">${escapeHtml(composition)}</div>${r.note?`<div class="hint">${escapeHtml(r.note)}</div>`:''}`;
    } catch (e) { alertUser(e.message); }
  }

  function calculateConversion() {
    try {
      const value = finitePositive($('convValue').value,'Value',true);
      const from = $('convFrom').value, to = $('convTo').value;
      if (value === 0) { $('convResult').innerHTML = `<strong>0 ${escapeHtml(CONC_UNITS[to].label)}</strong>`; return; }
      const result = convertConcentration(value,from,to,Number($('convMw').value)||null);
      $('convResult').innerHTML = `<div class="result-kicker">Converted concentration</div><strong style="font-size:1.35rem">${fmt(result,8)} ${escapeHtml(CONC_UNITS[to].label)}</strong><div class="subtle">${fmt(value,8)} ${escapeHtml(CONC_UNITS[from].label)}</div>`;
    } catch (e) { alertUser(e.message); }
  }

  function calculateVolumeConversion() {
    try {
      const value = finitePositive($('volConvValue').value,'Volume',true);
      const from = $('volConvFrom').value, to = $('volConvTo').value;
      const l = value * VOLUME_UNITS[from].toL;
      const out = l / VOLUME_UNITS[to].toL;
      $('volConvResult').innerHTML = `<div class="result-kicker">Converted volume</div><strong style="font-size:1.35rem">${fmt(out,9)} ${escapeHtml(VOLUME_UNITS[to].label)}</strong><div class="subtle">${fmt(value,9)} ${escapeHtml(VOLUME_UNITS[from].label)}</div>`;
    } catch (e) { alertUser(e.message); }
  }

  function fillSelect(select, values, selected) {
    select.innerHTML = values.map(v=>`<option value="${v}">${escapeHtml(CONC_UNITS[v]?.label || v)}</option>`).join('');
    if (selected) select.value = selected;
  }
  function fillMolarSelect(select,selected='M'){fillSelect(select,MOLAR_UNITS,selected)}
  function fillVolumeSelect(select,selected='mL'){select.innerHTML=Object.entries(VOLUME_UNITS).map(([v,d])=>`<option value="${v}">${d.label}</option>`).join('');select.value=selected}
  function fillMassSelect(select,selected='g'){select.innerHTML=Object.entries(MASS_UNITS).map(([v,d])=>`<option value="${v}">${d.label}</option>`).join('');select.value=selected}

  function setupTabs() {
    $$('.tab').forEach(tab => tab.addEventListener('click', () => {
      $$('.tab').forEach(t => t.classList.remove('active'));
      $$('.tool').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const target = $(`tool-${tab.dataset.tool}`);
      if (target) target.classList.add('active');
    }));
  }

  function setupSegmented() {
    $$('.segmented').forEach(group => {
      group.addEventListener('click', e => {
        const btn = e.target.closest('button'); if (!btn) return;
        group.querySelectorAll('button').forEach(b=>b.classList.remove('active')); btn.classList.add('active');
        const target = $(group.dataset.target); target.value = btn.dataset.value;
        if (target.id === 'solidMwMode') {
          $('solidFormulaWrap').classList.toggle('hidden', target.value !== 'formula');
          $('solidManualMwWrap').classList.toggle('hidden', target.value !== 'manual');
        }
      });
    });
  }

  function wireEvents() {
    $('solidCalcBtn').addEventListener('click',calculateSolid);
    $('solidConcUnit').addEventListener('change',updateSolidMwVisibility);
    $('solidFormula').addEventListener('input',updateSolidMwPreview);
    $('dilCalcBtn').addEventListener('click',calculateDilution);
    $('unknownMode').addEventListener('change',unknownFields);
    $('unknownCalcBtn').addEventListener('click',calculateUnknown);
    $('bufferSystem').addEventListener('change',bufferSystemChanged);
    $('bufferRoute').addEventListener('change',bufferRouteFields);
    $('bufferCalcBtn').addEventListener('click',calculateBuffer);
    $('addMixRowBtn').addEventListener('click',()=>mixRow());
    $('mixCalcBtn').addEventListener('click',calculateMix);
    $('mwCalcBtn').addEventListener('click',calculateMw);
    $('convCalcBtn').addEventListener('click',calculateConversion);
    $('volConvBtn').addEventListener('click',calculateVolumeConversion);
    $('bufferPrintBtn').addEventListener('click',()=>window.print());
    $('bufferResetBtn').addEventListener('click',()=>location.reload());
  }

  function init() {
    initSelects(); initReagents(); setupTabs(); setupSegmented(); wireEvents();
    updateSolidMwVisibility(); updateSolidMwPreview(); unknownFields(); initBufferSystems(); bufferRouteFields();
    mixRow({name:'NaCl',stock:5,stockUnit:'M',target:150,targetUnit:'mM'});
    mixRow({name:'HEPES',stock:1,stockUnit:'M',target:20,targetUnit:'mM'});
    mixRow({name:'MgCl₂',stock:1,stockUnit:'M',target:2,targetUnit:'mM'});
    calculateMw();
  }

  window.BioBuffer = { parseFormula, convertConcentration, ratioForDilution };
  init();
  return {
    onShow() {
      const active = root.querySelector('.tool.active');
      if (!active) root.querySelector('.tab')?.click();
    }
  };
})();
