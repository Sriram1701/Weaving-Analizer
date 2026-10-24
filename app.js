/**
 * TEXTILE WEAVING ANALYZER - MAIN APPLICATION CONTROLLER
 * Integrates WeavingEngine, GstEngine, and StorageEngine
 */

const $ = id => document.getElementById(id);
const num = id => {
  const el = $(id);
  if (!el) return 0;
  const val = parseFloat(el.value);
  return Number.isFinite(val) ? val : 0;
};

// Global App State
let currentActiveView = 'view-home';
let currentActivePresetKey = 'poplin_54';
let currentDocType = 'quotation'; // 'quotation' or 'invoice'
let currentHistoryTab = 'quotes'; // 'quotes' or 'orders'
let isAutoSyncing = true;

// Cached Calculation Results
let lastCalculation = {
  struct: null,
  cost: null,
  proc: null,
  tax: null
};

// --- View Router ---
function switchView(viewId) {
  currentActiveView = viewId;

  // Toggle view containers
  document.querySelectorAll('.view-section').forEach(sec => {
    sec.classList.remove('active');
  });
  const target = $(viewId);
  if (target) {
    target.classList.add('active');
  }

  // Update Bottom Nav active indicator
  document.querySelectorAll('.bottom-nav .nav-item').forEach(item => {
    item.classList.remove('active');
  });
  if (viewId === 'view-home' && $('nav-home')) $('nav-home').classList.add('active');
  if (viewId === 'view-calc' && $('nav-calc')) $('nav-calc').classList.add('active');
  if (viewId === 'view-costing' && $('nav-costing')) $('nav-costing').classList.add('active');
  if (viewId === 'view-history' && $('nav-history')) $('nav-history').classList.add('active');
  if (viewId === 'view-profile' && $('nav-profile')) $('nav-profile').classList.add('active');

  // Sticky bottom bar visibility
  const sticky = $('stickyBottomBar');
  if (sticky) {
    if (viewId === 'view-calc' || viewId === 'view-costing') {
      sticky.style.display = 'block';
    } else {
      sticky.style.display = 'none';
    }
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });

  if (viewId === 'view-history') {
    renderHistoryList();
  }
}

// --- Weaving Sub-tabs ---
function toggleCalcTab(tab) {
  const isConst = tab === 'construction';
  $('calcTabConstruction').style.display = isConst ? 'block' : 'none';
  $('calcTabParameters').style.display = isConst ? 'none' : 'block';
  $('segBtnConst').classList.toggle('active', isConst);
  $('segBtnParams').classList.toggle('active', !isConst);
}

// --- Recalculate Everything ---
function recalculateAll() {
  const params = {
    warpCount: num('warpCount'),
    weftCount: num('weftCount'),
    epi: num('epi'),
    ppi: num('ppi'),
    width: num('width'),
    warpCrimp: num('warpCrimp'),
    weftCrimp: num('weftCrimp'),
    weftInsert: num('weftInsert'),
    warpRate: num('warpRate'),
    weftRate: num('weftRate'),
    sizingRate: num('sizingRate'),
    pickRate: num('pickRate'),
    transport: num('transport'),
    loss: num('loss'),
    profitPct: num('profitPct'),
    orderMeters: num('orderMeters') || num('quoteMeters') || 5000,
    bagWeight: num('bagWeight') || 60,
    wastePct: num('wastePct') || 2
  };

  // 1. Structural calculations
  const struct = WeavingEngine.calculateStructure(params);

  // 2. Costing calculations
  const cost = WeavingEngine.calculateCosting(params, struct);

  // 3. Yarn procurement
  const proc = WeavingEngine.calculateProcurement(params, struct, cost);

  // 4. Commercial GST calculation
  const quoteMeters = num('quoteMeters') || params.orderMeters;
  const rawSubtotal = quoteMeters * cost.netFabricValue;
  const gstRate = parseFloat($('quoteGstRate') ? $('quoteGstRate').value : 5);
  const isInclusive = $('quoteTaxMode') && $('quoteTaxMode').value === 'inclusive';
  const myProfile = StorageEngine.getProfile();
  const partyState = $('partyState') ? $('partyState').value : 'Tamil Nadu';
  const isInterState = myProfile.state.trim().toLowerCase() !== partyState.trim().toLowerCase();

  const tax = GstEngine.calculateTax({
    subtotal: rawSubtotal,
    gstRatePct: gstRate,
    isTaxInclusive: isInclusive,
    isInterState
  });

  lastCalculation = { struct, cost, proc, tax };

  // Update Weaving Calculation view
  $('ends').value = WeavingEngine.fmt(struct.totalEnds, 3);
  $('reedSpace').value = WeavingEngine.fmt(struct.reedSpace, 3);
  $('warpGram').value = WeavingEngine.fmt(struct.warpGram, 3);
  $('weftGram').value = WeavingEngine.fmt(struct.weftGram, 3);

  $('specGlm').textContent = `${WeavingEngine.fmt(struct.glm, 2)} g/m`;
  $('specGsm').textContent = `${WeavingEngine.fmt(struct.gsm, 1)} g/m²`;
  $('specYard').textContent = `₹${WeavingEngine.fmt(cost.rateYard, 2)} / yd`;

  // Update Costing view
  $('warpValue').value = WeavingEngine.fmt(cost.warpValue, 3);
  $('weftValue').value = WeavingEngine.fmt(cost.weftValue, 3);
  $('sizingValue').value = WeavingEngine.fmt(cost.sizingValue, 3);
  $('pickValue').value = WeavingEngine.fmt(cost.pickValue, 3);
  $('totalValue').textContent = WeavingEngine.fmt(cost.totalManufacturingCost, 3);
  $('netValue').textContent = WeavingEngine.fmt(cost.netFabricValue, 3);
  $('costRateYard').textContent = `₹ ${WeavingEngine.fmt(cost.rateYard, 2)} / yard`;

  // Update Sticky Bottom Bar
  if ($('stickyNetVal')) $('stickyNetVal').textContent = WeavingEngine.fmt(cost.netFabricValue, 3);

  // Update Dashboard KPIs
  if ($('kpiPartyRate')) $('kpiPartyRate').textContent = `₹ ${WeavingEngine.fmt(cost.netFabricValue, 2)} / m`;
  if ($('kpiGsm')) $('kpiGsm').textContent = `${WeavingEngine.fmt(struct.gsm, 1)} g/m²`;
  if ($('kpiEnds')) $('kpiEnds').textContent = Math.round(struct.totalEnds).toLocaleString('en-IN');
  if ($('dashConstruction')) $('dashConstruction').textContent = $('construction').value;
  if ($('dashGlm')) $('dashGlm').textContent = `${WeavingEngine.fmt(struct.glm, 2)} g/m`;
  if ($('dashRateYard')) $('dashRateYard').textContent = `₹ ${WeavingEngine.fmt(cost.rateYard, 2)} / yd`;

  // Update Procurement view
  $('lblWarpCount').textContent = `${params.warpCount}s`;
  $('lblWeftCount').textContent = `${params.weftCount}s`;
  $('resWarpKg').textContent = WeavingEngine.fmt(proc.warpKg, 2);
  $('resWarpBags').textContent = WeavingEngine.fmt(proc.warpBags, 2);
  $('resWeftKg').textContent = WeavingEngine.fmt(proc.weftKg, 2);
  $('resWeftBags').textContent = WeavingEngine.fmt(proc.weftBags, 2);
  $('resTotalYarnKg').textContent = WeavingEngine.fmt(proc.totalYarnKg, 2);
  $('resTotalBags').textContent = WeavingEngine.fmt(proc.totalBags, 2);
  $('resOrderCost').textContent = Math.round(proc.orderCost).toLocaleString('en-IN');
  $('resOrderValue').textContent = Math.round(proc.orderInvoicingValue).toLocaleString('en-IN');

  // Update Quotation & Invoice Financials
  if ($('qRateDisplay')) $('qRateDisplay').textContent = WeavingEngine.fmt(cost.netFabricValue, 2);
  if ($('qSubtotalDisplay')) $('qSubtotalDisplay').textContent = WeavingEngine.fmtINR(tax.taxableAmount, 2);
  if ($('qTaxAmountDisplay')) $('qTaxAmountDisplay').textContent = WeavingEngine.fmtINR(tax.totalTax, 2);
  if ($('qTaxLabel')) {
    const taxType = isInterState ? 'IGST' : 'CGST+SGST';
    $('qTaxLabel').textContent = `${taxType} (${gstRate}%):`;
  }
  if ($('qGrandTotalDisplay')) $('qGrandTotalDisplay').textContent = WeavingEngine.fmtINR(tax.grandTotal, 2);
  if ($('qWordsDisplay')) $('qWordsDisplay').textContent = GstEngine.numberToWordsINR(tax.grandTotal);
}

// --- Presets Management ---
function renderPresetChips() {
  const container = $('presetScrollContainer');
  if (!container) return;

  const presets = StorageEngine.getPresets();
  container.innerHTML = '<span class="preset-label">Quick Qualities <span class="preset-arrow">&rarr;</span></span>';

  Object.keys(presets).forEach(key => {
    const p = presets[key];
    const btn = document.createElement('button');
    btn.className = 'chip' + (key === currentActivePresetKey ? ' active' : '');
    btn.textContent = p.name;
    btn.onclick = () => applyPreset(key);
    container.appendChild(btn);
  });

  const addBtn = document.createElement('button');
  addBtn.className = 'chip add-chip';
  addBtn.textContent = '+ Custom';
  addBtn.onclick = openSavePresetModal;
  container.appendChild(addBtn);
}

function applyPreset(key) {
  const presets = StorageEngine.getPresets();
  const p = presets[key];
  if (!p) return;

  currentActivePresetKey = key;
  isAutoSyncing = false;

  $('construction').value = p.construction || `${p.warpCount}*${p.weftCount}/${p.epi}*${p.ppi}-${p.width}"`;
  $('warpCount').value = p.warpCount;
  $('weftCount').value = p.weftCount;
  $('epi').value = p.epi;
  $('ppi').value = p.ppi;
  $('width').value = p.width;
  if ($('weave') && p.weave) $('weave').value = p.weave;
  $('warpCrimp').value = p.warpCrimp;
  $('weftInsert').value = p.weftInsert !== undefined ? p.weftInsert : 1;
  $('weftCrimp').value = p.weftCrimp;
  $('warpRate').value = p.warpRate;
  $('weftRate').value = p.weftRate;
  $('sizingRate').value = p.sizingRate;
  $('pickRate').value = p.pickRate;
  $('transport').value = p.transport;
  $('loss').value = p.loss;
  $('profitPct').value = p.profitPct;

  if ($('dashQualityName')) $('dashQualityName').textContent = p.name;

  isAutoSyncing = true;
  renderPresetChips();
  recalculateAll();
  showToast(`Applied Quality: ${p.name}`);
}

function openSavePresetModal() {
  $('customPresetName').value = $('construction').value;
  $('savePresetModal').style.display = 'flex';
}

function closeSavePresetModal() {
  $('savePresetModal').style.display = 'none';
}

function saveCustomPresetAction() {
  const name = $('customPresetName').value.trim();
  if (!name) {
    showToast('Please enter a preset name');
    return;
  }
  const id = 'custom_' + Date.now();
  const preset = {
    id,
    name,
    construction: $('construction').value,
    warpCount: num('warpCount'),
    weftCount: num('weftCount'),
    epi: num('epi'),
    ppi: num('ppi'),
    width: num('width'),
    weave: $('weave').value,
    warpCrimp: num('warpCrimp'),
    weftInsert: num('weftInsert'),
    weftCrimp: num('weftCrimp'),
    warpRate: num('warpRate'),
    weftRate: num('weftRate'),
    sizingRate: num('sizingRate'),
    pickRate: num('pickRate'),
    transport: num('transport'),
    loss: num('loss'),
    profitPct: num('profitPct')
  };

  StorageEngine.saveCustomPreset(preset);
  closeSavePresetModal();
  renderPresetChips();
  showToast(`Saved preset: ${name}`);
}

// --- Live Construction String Auto-Parse & Auto-Sync ---
function parseConstructionLive() {
  const str = $('construction').value.trim();
  const parsed = WeavingEngine.parseConstructionString(str);
  if (parsed) {
    isAutoSyncing = false;
    $('warpCount').value = parsed.warpCount;
    $('weftCount').value = parsed.weftCount;
    $('epi').value = parsed.epi;
    $('ppi').value = parsed.ppi;
    if (parsed.width) $('width').value = parsed.width;
    isAutoSyncing = true;
    recalculateAll();
    showToast('Auto-parsed: Warp, Weft, EPI, PPI & Width!');
  } else {
    showToast('Format example: 40*40/92*88-54"');
  }
}

function autoSyncConstructionLive() {
  if (!isAutoSyncing) return;
  const warp = $('warpCount').value;
  const weft = $('weftCount').value;
  const epi = $('epi').value;
  const ppi = $('ppi').value;
  const width = $('width').value;
  if (warp && weft && epi && ppi && width) {
    $('construction').value = `${warp}*${weft}/${epi}*${ppi}-${width}"`;
  }
}

// --- Document Type: Quotation vs GST Tax Invoice ---
function setDocType(type) {
  currentDocType = type;
  const isQuote = type === 'quotation';
  $('docTypeQuote').classList.toggle('active', isQuote);
  $('docTypeInvoice').classList.toggle('active', !isQuote);
  $('docCardTitle').textContent = isQuote ? 'Buyer & Consignee Details' : 'GST Invoice Consignee Details';
  recalculateAll();
}

// --- Official A4 Printable Invoice Modal ---
function openInvoiceModal() {
  recalculateAll();
  const prof = StorageEngine.getProfile();
  const isInvoice = currentDocType === 'invoice';
  const name = $('partyName').value.trim() || 'M/s. Valued Customer';
  const phone = $('partyPhone').value.trim() || '--';
  const state = $('partyState').value;
  const gstin = $('partyGstin').value.trim();
  const quoteMeters = num('quoteMeters') || num('orderMeters') || 5000;
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const refPrefix = isInvoice ? (prof.invoicePrefix || 'INV') : 'QTN';
  const refNum = `${refPrefix}-${now.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

  // Header & Sender
  $('invModalTitle').textContent = isInvoice ? 'Commercial GST Tax Invoice' : 'Formal Commercial Quotation';
  $('invCardCompany').textContent = prof.companyName;
  $('invCardAddress').textContent = prof.address || prof.city;
  $('invCardPhone').textContent = prof.phone;
  $('invCardState').textContent = prof.state;
  $('invCardGst').textContent = prof.gstin || 'Unregistered / Exempt';

  // Badge & Metadata
  $('invCardBadge').textContent = isInvoice ? 'GST TAX INVOICE' : 'FORMAL QUOTATION';
  $('invCardBadge').style.background = isInvoice ? 'var(--brand-navy)' : 'var(--brand-green)';
  $('invRefNum').textContent = refNum;
  $('invDate').textContent = dateStr;
  $('invValidDays').textContent = isInvoice ? 'N/A' : '7 Days';

  // Buyer Info
  $('invBuyerName').textContent = name;
  $('invBuyerDetails').textContent = `Contact: ${phone} | Place of Supply: ${state}`;
  if (gstin) {
    $('invBuyerGstWrap').style.display = 'block';
    $('invBuyerGst').textContent = gstin;
  } else {
    $('invBuyerGstWrap').style.display = 'none';
  }

  // Items Table
  $('invTableConst').textContent = $('construction').value;
  $('invTableHsn').textContent = prof.hsnCode || '5208';
  $('invTableWeave').textContent = $('weave').value;
  $('invTableWidth').textContent = `${$('width').value}"`;
  $('invTableGsm').textContent = `~${WeavingEngine.fmt(lastCalculation.struct.gsm, 1)}`;
  $('invTableQty').textContent = quoteMeters.toLocaleString('en-IN');
  $('invTableRate').textContent = `₹ ${WeavingEngine.fmt(lastCalculation.cost.netFabricValue, 2)}`;
  $('invTableAmount').textContent = `₹ ${WeavingEngine.fmtINR(lastCalculation.tax.taxableAmount, 2)}`;

  // Totals
  $('invSubTotal').textContent = `₹ ${WeavingEngine.fmtINR(lastCalculation.tax.taxableAmount, 2)}`;
  const taxType = lastCalculation.tax.isInterState ? 'IGST' : 'CGST+SGST';
  $('invTaxLabel').textContent = `${taxType} (${lastCalculation.tax.gstRatePct}%):`;
  $('invTaxAmount').textContent = `₹ ${WeavingEngine.fmtINR(lastCalculation.tax.totalTax, 2)}`;
  $('invGrandTotal').textContent = `₹ ${WeavingEngine.fmtINR(lastCalculation.tax.grandTotal, 2)}`;
  $('invWordsText').textContent = GstEngine.numberToWordsINR(lastCalculation.tax.grandTotal);

  // Terms & Signatures
  $('invCardTerms').textContent = prof.terms;
  $('invPreparedBy').textContent = prof.ownerName;
  $('invSignCompany').textContent = prof.companyName;

  $('invoiceModal').style.display = 'flex';
}

function closeInvoiceModal() {
  $('invoiceModal').style.display = 'none';
}

function printInvoicePDF() {
  openInvoiceModal();
  setTimeout(() => {
    window.print();
  }, 120);
}

// --- WhatsApp Sharing & Messaging ---
function shareWhatsAppQuickRate() {
  const prof = StorageEngine.getProfile();
  const constr = $('construction').value.trim();
  const rate = WeavingEngine.fmt(lastCalculation.cost.netFabricValue, 2);
  const yardRate = WeavingEngine.fmt(lastCalculation.cost.rateYard, 2);
  const gsm = WeavingEngine.fmt(lastCalculation.struct.gsm, 1);
  const width = $('width').value;
  const buyer = $('partyName').value.trim();

  let msg = `*FABRIC SPECIFICATION & PARTY RATE*\n`;
  if (buyer) msg += `To: *${buyer}*\n\n`;
  msg += `• Quality: *${constr}*\n`;
  msg += `• Weave: ${$('weave').value} | Width: ${width}"\n`;
  msg += `• Fabric GSM: ~${gsm} g/m²\n`;
  msg += `• *Ex-Mill Party Rate: ₹ ${rate} / Metre*\n`;
  msg += `• Equivalent: ₹ ${yardRate} / Yard\n\n`;
  msg += `Terms: Rates quoted are Ex-Mill net. GST extra as applicable.\n\n`;
  msg += `Regards,\n*${prof.companyName}*\nPh: ${prof.phone}`;

  openWhatsAppMessage(msg);
}

function copyWhatsAppQuickRate() {
  const prof = StorageEngine.getProfile();
  const constr = $('construction').value.trim();
  const rate = WeavingEngine.fmt(lastCalculation.cost.netFabricValue, 2);
  const msg = `Quality: ${constr} | Party Rate: ₹ ${rate} / Metre | ${prof.companyName}`;
  copyToClipboard(msg, 'Quick rate copied to clipboard!');
}

function shareProcurementWhatsApp() {
  const prof = StorageEngine.getProfile();
  const constr = $('construction').value.trim();
  const p = lastCalculation.proc;
  const meters = num('orderMeters') || 5000;

  let msg = `📦 *YARN PROCUREMENT ORDER REQUIREMENT*\n`;
  msg += `*${prof.companyName}*\n`;
  msg += `Quality: *${constr}* (${meters.toLocaleString('en-IN')} Metres)\n`;
  msg += `----------------------------------------\n`;
  msg += `• Warp Yarn (${num('warpCount')}s): *${WeavingEngine.fmt(p.warpKg, 2)} kg* (${WeavingEngine.fmt(p.warpBags, 2)} Bags)\n`;
  msg += `• Weft Yarn (${num('weftCount')}s): *${WeavingEngine.fmt(p.weftKg, 2)} kg* (${WeavingEngine.fmt(p.weftBags, 2)} Bags)\n`;
  msg += `• *Total Yarn: ${WeavingEngine.fmt(p.totalYarnKg, 2)} kg (${WeavingEngine.fmt(p.totalBags, 2)} Bags)*\n`;
  msg += `----------------------------------------\n`;
  msg += `Date: ${new Date().toLocaleDateString('en-GB')}`;

  openWhatsAppMessage(msg);
}

function copyProcurementNote() {
  const p = lastCalculation.proc;
  const msg = `Warp: ${WeavingEngine.fmt(p.warpKg, 2)} kg (${WeavingEngine.fmt(p.warpBags, 2)} Bags), Weft: ${WeavingEngine.fmt(p.weftKg, 2)} kg (${WeavingEngine.fmt(p.weftBags, 2)} Bags), Total: ${WeavingEngine.fmt(p.totalBags, 2)} Bags.`;
  copyToClipboard(msg, 'Procurement summary copied!');
}

function sendQuotationWhatsApp() {
  const prof = StorageEngine.getProfile();
  const isInvoice = currentDocType === 'invoice';
  const name = $('partyName').value.trim() || 'Valued Customer';
  const constr = $('construction').value.trim();
  const qty = (num('quoteMeters') || 5000).toLocaleString('en-IN');
  const rate = WeavingEngine.fmt(lastCalculation.cost.netFabricValue, 2);
  const subtotal = WeavingEngine.fmtINR(lastCalculation.tax.taxableAmount, 2);
  const grandTotal = WeavingEngine.fmtINR(lastCalculation.tax.grandTotal, 2);
  const taxPct = lastCalculation.tax.gstRatePct;

  let msg = `📄 *${isInvoice ? 'COMMERCIAL GST TAX INVOICE' : 'FORMAL COMMERCIAL QUOTATION'}*\n`;
  msg += `*${prof.companyName}*\n`;
  msg += `${prof.city}, ${prof.state} | Ph: ${prof.phone}\n`;
  if (prof.gstin) msg += `GSTIN: ${prof.gstin}\n`;
  msg += `----------------------------------------\n`;
  msg += `*TO:* ${name}\n`;
  msg += `• Fabric: *${constr}*\n`;
  msg += `• Weave: ${$('weave').value} | Width: ${$('width').value}"\n`;
  msg += `• Quantity: *${qty} Metres*\n`;
  msg += `• Rate: *₹ ${rate} / Metre*\n`;
  msg += `• Taxable Amount: ₹ ${subtotal}\n`;
  msg += `• GST (${taxPct}%): ₹ ${WeavingEngine.fmtINR(lastCalculation.tax.totalTax, 2)}\n`;
  msg += `💰 *GRAND TOTAL: ₹ ${grandTotal}*\n`;
  msg += `----------------------------------------\n`;
  msg += `*Terms:*\n${prof.terms}\n\n`;
  msg += `Authorized Signatory: ${prof.ownerName}`;

  openWhatsAppMessage(msg);
}

function openWhatsAppMessage(text) {
  const phone = $('partyPhone') ? $('partyPhone').value.replace(/\D/g, '') : '';
  const url = phone
    ? `https://wa.me/${phone}?text=${encodeURIComponent(text)}`
    : `https://wa.me/?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank');
}

async function copyToClipboard(text, successMsg) {
  try {
    await navigator.clipboard.writeText(text);
    showToast(successMsg);
  } catch (e) {
    showToast('Copied to clipboard');
  }
}

// --- History Persistence & Management ---
function saveCurrentDocument() {
  const prof = StorageEngine.getProfile();
  const isInvoice = currentDocType === 'invoice';
  const name = $('partyName').value.trim() || 'M/s. Valued Customer';
  const quoteMeters = num('quoteMeters') || 5000;
  const docNum = StorageEngine.generateDocumentNumber(isInvoice ? 'INV' : 'QTN');

  const record = {
    id: `doc_${Date.now()}`,
    docNumber: docNum,
    docType: currentDocType,
    date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    buyerName: name,
    buyerPhone: $('partyPhone').value.trim(),
    buyerState: $('partyState').value,
    buyerGstin: $('partyGstin').value.trim(),
    construction: $('construction').value,
    width: num('width'),
    meters: quoteMeters,
    rate: lastCalculation.cost.netFabricValue,
    subtotal: lastCalculation.tax.taxableAmount,
    gstRate: parseFloat($('quoteGstRate') ? $('quoteGstRate').value : 5),
    totalTax: lastCalculation.tax.totalTax,
    grandTotal: lastCalculation.tax.grandTotal,
    status: 'finalized',
    params: {
      warpCount: num('warpCount'),
      weftCount: num('weftCount'),
      epi: num('epi'),
      ppi: num('ppi'),
      width: num('width'),
      weave: $('weave').value,
      warpCrimp: num('warpCrimp'),
      weftInsert: num('weftInsert'),
      weftCrimp: num('weftCrimp'),
      warpRate: num('warpRate'),
      weftRate: num('weftRate'),
      sizingRate: num('sizingRate'),
      pickRate: num('pickRate'),
      transport: num('transport'),
      loss: num('loss'),
      profitPct: num('profitPct')
    },
    struct: lastCalculation ? lastCalculation.struct : null,
    cost: lastCalculation ? lastCalculation.cost : null,
    proc: lastCalculation ? lastCalculation.proc : null,
    tax: lastCalculation ? lastCalculation.tax : null
  };

  if (isInvoice) {
    StorageEngine.saveOrder(record);
    showToast(`Saved Invoice #${docNum}`);
  } else {
    StorageEngine.saveQuote(record);
    showToast(`Saved Quote #${docNum}`);
  }

  updateHistoryCountBadges();
}

function updateHistoryCountBadges() {
  const quotes = StorageEngine.getQuotes();
  const orders = StorageEngine.getOrders();
  if ($('countQuotes')) $('countQuotes').textContent = quotes.length;
  if ($('countOrders')) $('countOrders').textContent = orders.length;
}

function toggleHistoryTab(tab) {
  currentHistoryTab = tab;
  $('histTabQuotes').classList.toggle('active', tab === 'quotes');
  $('histTabOrders').classList.toggle('active', tab === 'orders');
  renderHistoryList();
}

function renderHistoryList() {
  const container = $('historyListContainer');
  if (!container) return;

  const isQuotes = currentHistoryTab === 'quotes';
  const list = isQuotes ? StorageEngine.getQuotes() : StorageEngine.getOrders();
  const search = $('historySearchInput') ? $('historySearchInput').value.toLowerCase().trim() : '';

  updateHistoryCountBadges();

  const filtered = list.filter(item => {
    if (!search) return true;
    return (item.buyerName && item.buyerName.toLowerCase().includes(search)) ||
           (item.docNumber && item.docNumber.toLowerCase().includes(search)) ||
           (item.construction && item.construction.toLowerCase().includes(search));
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="card" style="text-align:center; padding:30px 10px; color:var(--text-muted);">
        <div style="font-size:28px; margin-bottom:6px;">📁</div>
        <strong>No ${isQuotes ? 'quotes' : 'orders'} found</strong>
        <p style="font-size:12px; margin-top:4px;">Save quotations or orders from the generator to access them anytime offline.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = '';
  filtered.forEach(item => {
    const div = document.createElement('div');
    div.className = 'history-item';
    div.innerHTML = `
      <div class="history-info">
        <strong>${item.docNumber || 'DOC'} • ${item.buyerName || 'Valued Buyer'}</strong>
        <small>${item.date} • ${item.construction} (${item.meters || 0} m)</small>
      </div>
      <div class="history-actions">
        <span class="history-rate">₹ ${WeavingEngine.fmtINR(item.grandTotal || item.rate || 0, 2)}</span>
        <button class="btn-secondary" style="padding:4px 8px; font-size:11px;" onclick="loadHistoryRecord('${item.id}', '${item.docType}')">Load</button>
        <button class="btn-secondary" style="padding:4px 8px; font-size:11px; color:var(--color-danger);" onclick="deleteHistoryRecord('${item.id}', '${item.docType}')">&times;</button>
      </div>
    `;
    container.appendChild(div);
  });
}

function loadHistoryRecord(id, type) {
  const list = type === 'invoice' ? StorageEngine.getOrders() : StorageEngine.getQuotes();
  const record = list.find(x => x.id === id);
  if (!record) return;

  if (record.params) {
    const p = record.params;
    isAutoSyncing = false;
    $('construction').value = record.construction || '';
    $('warpCount').value = p.warpCount;
    $('weftCount').value = p.weftCount;
    $('epi').value = p.epi;
    $('ppi').value = p.ppi;
    $('width').value = p.width;
    if ($('weave') && p.weave) $('weave').value = p.weave;
    $('warpCrimp').value = p.warpCrimp;
    $('weftInsert').value = p.weftInsert;
    $('weftCrimp').value = p.weftCrimp;
    $('warpRate').value = p.warpRate;
    $('weftRate').value = p.weftRate;
    $('sizingRate').value = p.sizingRate;
    $('pickRate').value = p.pickRate;
    $('transport').value = p.transport;
    $('loss').value = p.loss;
    $('profitPct').value = p.profitPct;
    isAutoSyncing = true;
  }

  if (record.buyerName) $('partyName').value = record.buyerName;
  if (record.buyerPhone) $('partyPhone').value = record.buyerPhone;
  if (record.buyerState) $('partyState').value = record.buyerState;
  if (record.buyerGstin) $('partyGstin').value = record.buyerGstin;
  if (record.meters) {
    $('quoteMeters').value = record.meters;
    $('orderMeters').value = record.meters;
  }

  recalculateAll();
  switchView('view-calc');
  showToast(`Loaded ${record.docNumber || 'record'}!`);
}

function deleteHistoryRecord(id, type) {
  if (confirm('Delete this saved record?')) {
    if (type === 'invoice') {
      StorageEngine.deleteOrder(id);
    } else {
      StorageEngine.deleteQuote(id);
    }
    renderHistoryList();
    showToast('Record deleted');
  }
}

function clearAllHistoryConfirm() {
  if (confirm('Are you sure you want to clear all saved quotes & orders history?')) {
    localStorage.setItem(StorageEngine.KEYS.QUOTES, '[]');
    localStorage.setItem(StorageEngine.KEYS.ORDERS, '[]');
    renderHistoryList();
    showToast('History cleared');
  }
}

const CSV_EXPORT_HEADERS = [
  'Document No', 'Document Type', 'Date', 'Buyer / Party Name', 'Phone', 'State', 'GSTIN',
  'Fabric Construction', 'Weave', 'Warp Count (Ne)', 'Weft Count (Ne)', 'EPI', 'PPI', 'Width (inch)',
  'Total Ends', 'Reed Space (inch)', 'Warp Crimp (%)', 'Weft Crimp (%)', 'Weft Insert',
  'Warp Yarn (g/m)', 'Weft Yarn (g/m)', 'Fabric GLM (g/m)', 'Fabric GSM (g/m²)',
  'Warp Rate (₹/kg)', 'Weft Rate (₹/kg)', 'Sizing Rate (₹/kg)', 'Pick Rate (₹/pick)',
  'Transport (₹/m)', 'Loss (₹/m)', 'Warp Cost (₹/m)', 'Weft Cost (₹/m)', 'Sizing Cost (₹/m)',
  'Weaving Cost (₹/m)', 'Mfg Cost (₹/m)', 'Profit Margin', 'Profit Amount (₹/m)',
  'Rate Per Meter (₹)', 'Rate Per Yard (₹)', 'Order Meters', 'Taxable Subtotal (₹)',
  'GST Rate', 'GST Amount (₹)', 'Grand Total (₹)',
  'Warp Yarn Req (kg)', 'Weft Yarn Req (kg)', 'Total Yarn Req (kg)', 'Total Bags (60kg)'
];

function csvCell(val) {
  if (val === null || val === undefined) return '""';
  const str = String(val);
  return `"${str.replace(/"/g, '""')}"`;
}

function recordToCsvDetails(r) {
  const docNum = r.docNumber || r.quoteNumber || r.orderNumber || 'DOC';
  const docType = (r.docType === 'invoice' || r.orderNumber) ? 'Tax Invoice' : 'Quotation';
  const date = r.date || '';
  const buyerName = r.buyerName || (r.details && r.details.partyName) || 'M/s. Valued Customer';
  const phone = r.buyerPhone || (r.details && r.details.partyPhone) || '';
  const state = r.buyerState || '';
  const gstin = r.buyerGstin || '';
  const construction = r.construction || '';

  const p = Object.assign({}, r.params || (r.details && (r.details.params || r.details)) || {});
  if (!p.warpCount && r.warpCount) p.warpCount = r.warpCount;
  if (!p.weftCount && r.weftCount) p.weftCount = r.weftCount;
  if (!p.epi && r.epi) p.epi = r.epi;
  if (!p.ppi && r.ppi) p.ppi = r.ppi;
  if (!p.width && (r.width || (r.details && r.details.width))) p.width = r.width || (r.details && r.details.width);

  if ((!p.warpCount || !p.epi) && construction) {
    const parsed = WeavingEngine.parseConstructionString(construction);
    if (parsed) {
      if (!p.warpCount) p.warpCount = parsed.warpCount;
      if (!p.weftCount) p.weftCount = parsed.weftCount;
      if (!p.epi) p.epi = parsed.epi;
      if (!p.ppi) p.ppi = parsed.ppi;
      if (!p.width && parsed.width) p.width = parsed.width;
    }
  }

  if (p.warpCrimp === undefined || p.warpCrimp === null) p.warpCrimp = 9;
  if (p.weftCrimp === undefined || p.weftCrimp === null) p.weftCrimp = 2;
  if (!p.weftInsert) p.weftInsert = 1;
  if (!p.profitPct && p.profitPct !== 0) p.profitPct = 0.06;
  if (!p.width) p.width = 54;

  let struct = r.struct;
  if (!struct && p.warpCount && p.epi) {
    struct = WeavingEngine.calculateStructure(p);
  }

  let cost = r.cost;
  if (!cost && struct) {
    cost = WeavingEngine.calculateCosting(p, struct);
  }

  const meters = parseFloat(r.meters) || (r.details && parseFloat(r.details.meters)) || 0;
  const rateMtr = parseFloat(r.rate) || (cost ? cost.netFabricValue : 0);
  const rateYd = cost ? cost.rateYard : (rateMtr / 1.09361);
  const subtotal = parseFloat(r.subtotal) || (meters > 0 ? meters * rateMtr : 0);
  const gstRate = parseFloat(r.gstRate || (r.tax ? r.tax.gstRatePct : 5)) || 5;
  const gstAmount = parseFloat(r.totalTax) || (r.tax ? r.tax.totalTax : (subtotal * gstRate / 100));
  const grandTotal = parseFloat(r.grandTotal) || (r.tax ? r.tax.grandTotal : (subtotal + gstAmount));

  let proc = r.proc;
  if (!proc && struct && cost && meters > 0) {
    proc = WeavingEngine.calculateProcurement({ orderMeters: meters, bagWeight: 60, wastePct: 2 }, struct, cost);
  }

  return [
    docNum,
    docType,
    date,
    buyerName,
    phone,
    state,
    gstin,
    construction,
    p.weave || 'PLAIN',
    p.warpCount || '',
    p.weftCount || '',
    p.epi || '',
    p.ppi || '',
    p.width || '',
    struct ? Math.round(struct.totalEnds) : '',
    struct ? WeavingEngine.fmt(struct.reedSpace, 2) : '',
    p.warpCrimp ?? '',
    p.weftCrimp ?? '',
    p.weftInsert ?? 1,
    struct ? WeavingEngine.fmt(struct.warpGram, 3) : '',
    struct ? WeavingEngine.fmt(struct.weftGram, 3) : '',
    struct ? WeavingEngine.fmt(struct.glm, 3) : '',
    struct ? WeavingEngine.fmt(struct.gsm, 2) : '',
    p.warpRate !== undefined ? WeavingEngine.fmt(p.warpRate, 2) : '',
    p.weftRate !== undefined ? WeavingEngine.fmt(p.weftRate, 2) : '',
    p.sizingRate !== undefined ? WeavingEngine.fmt(p.sizingRate, 2) : '',
    p.pickRate !== undefined ? WeavingEngine.fmt(p.pickRate, 3) : '',
    p.transport !== undefined ? WeavingEngine.fmt(p.transport, 2) : '',
    p.loss !== undefined ? WeavingEngine.fmt(p.loss, 2) : '',
    cost ? WeavingEngine.fmt(cost.warpValue, 3) : '',
    cost ? WeavingEngine.fmt(cost.weftValue, 3) : '',
    cost ? WeavingEngine.fmt(cost.sizingValue, 3) : '',
    cost ? WeavingEngine.fmt(cost.pickValue, 3) : '',
    cost ? WeavingEngine.fmt(cost.totalManufacturingCost, 3) : '',
    p.profitPct !== undefined ? `${(p.profitPct * 100).toFixed(1)}%` : '',
    cost ? WeavingEngine.fmt(cost.profitValue, 3) : '',
    WeavingEngine.fmt(rateMtr, 3),
    WeavingEngine.fmt(rateYd, 3),
    meters,
    WeavingEngine.fmt(subtotal, 2),
    `${gstRate}%`,
    WeavingEngine.fmt(gstAmount, 2),
    WeavingEngine.fmt(grandTotal, 2),
    proc ? WeavingEngine.fmt(proc.warpKg, 2) : '',
    proc ? WeavingEngine.fmt(proc.weftKg, 2) : '',
    proc ? WeavingEngine.fmt(proc.totalYarnKg, 2) : '',
    proc ? WeavingEngine.fmt(proc.totalBags, 2) : ''
  ];
}

function downloadCsvBlob(content, filename) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function exportHistoryCsv() {
  const quotes = StorageEngine.getQuotes();
  const orders = StorageEngine.getOrders();
  const combined = [...quotes, ...orders];
  if (combined.length === 0) {
    showToast('No history records to export');
    return;
  }

  const csvContent = '\uFEFF' + [
    CSV_EXPORT_HEADERS.map(csvCell).join(','),
    ...combined.map(r => recordToCsvDetails(r).map(csvCell).join(','))
  ].join('\r\n');

  downloadCsvBlob(csvContent, `weaving_analyzer_history_${Date.now()}.csv`);
  showToast('Exported complete Excel CSV with full details!');
}

function exportActiveQuotationCsv() {
  const isInvoice = currentDocType === 'invoice';
  const name = $('partyName').value.trim() || 'M/s. Valued Customer';
  const quoteMeters = num('quoteMeters') || 5000;
  const docNum = StorageEngine.generateDocumentNumber(isInvoice ? 'INV' : 'QTN');

  const currentRecord = {
    id: `active_${Date.now()}`,
    docNumber: docNum,
    docType: currentDocType,
    date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    buyerName: name,
    buyerPhone: $('partyPhone').value.trim(),
    buyerState: $('partyState').value,
    buyerGstin: $('partyGstin').value.trim(),
    construction: $('construction').value,
    width: num('width'),
    meters: quoteMeters,
    rate: lastCalculation.cost.netFabricValue,
    subtotal: lastCalculation.tax.taxableAmount,
    gstRate: parseFloat($('quoteGstRate') ? $('quoteGstRate').value : 5),
    totalTax: lastCalculation.tax.totalTax,
    grandTotal: lastCalculation.tax.grandTotal,
    status: 'finalized',
    params: {
      warpCount: num('warpCount'),
      weftCount: num('weftCount'),
      epi: num('epi'),
      ppi: num('ppi'),
      width: num('width'),
      weave: $('weave').value,
      warpCrimp: num('warpCrimp'),
      weftInsert: num('weftInsert'),
      weftCrimp: num('weftCrimp'),
      warpRate: num('warpRate'),
      weftRate: num('weftRate'),
      sizingRate: num('sizingRate'),
      pickRate: num('pickRate'),
      transport: num('transport'),
      loss: num('loss'),
      profitPct: num('profitPct')
    },
    struct: lastCalculation ? lastCalculation.struct : null,
    cost: lastCalculation ? lastCalculation.cost : null,
    proc: lastCalculation ? lastCalculation.proc : null,
    tax: lastCalculation ? lastCalculation.tax : null
  };

  const csvContent = '\uFEFF' + [
    CSV_EXPORT_HEADERS.map(csvCell).join(','),
    recordToCsvDetails(currentRecord).map(csvCell).join(',')
  ].join('\r\n');

  downloadCsvBlob(csvContent, `${docNum}_${currentRecord.construction.replace(/[^a-zA-Z0-9]/g, '_')}_costing.csv`);
  showToast(`Exported ${docNum} Excel CSV!`);
}

function backupDataJSON() {
  const json = StorageEngine.exportAllDataJSON();
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `textile_weaving_backup_${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  showToast('Backup JSON downloaded');
}

function importDataJSONFile(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(evt) {
    const success = StorageEngine.importDataJSON(evt.target.result);
    if (success) {
      loadProfileToForm();
      renderPresetChips();
      renderHistoryList();
      recalculateAll();
      showToast('Backup restored successfully!');
    } else {
      showToast('Failed to import JSON file');
    }
  };
  reader.readAsText(file);
}

// --- Company Profile Controller ---
function loadProfileToForm() {
  const prof = StorageEngine.getProfile();
  $('profCompany').value = prof.companyName || '';
  $('profOwner').value = prof.ownerName || '';
  $('profPhone').value = prof.phone || '';
  $('profWhatsapp').value = prof.whatsapp || '';
  $('profAddress').value = prof.address || '';
  $('profCity').value = prof.city || '';
  $('profState').value = prof.state || '';
  $('profGst').value = prof.gstin || '';
  $('profHsn').value = prof.hsnCode || '5208';
  $('profTerms').value = prof.terms || '';

  if ($('dashWelcomeTitle')) {
    const firstName = (prof.ownerName || 'Sriram').split(' ')[0];
    $('dashWelcomeTitle').textContent = `Welcome ${firstName}`;
  }
}

function saveCompanyProfile() {
  const updated = {
    companyName: $('profCompany').value.trim() || 'NAGANATHAN WEAVING MILLS',
    ownerName: $('profOwner').value.trim() || 'M. Naganathan',
    phone: $('profPhone').value.trim(),
    whatsapp: $('profWhatsapp').value.trim(),
    address: $('profAddress').value.trim(),
    city: $('profCity').value.trim() || 'Erode',
    state: $('profState').value.trim() || 'Tamil Nadu',
    gstin: $('profGst').value.trim(),
    hsnCode: $('profHsn').value.trim() || '5208',
    terms: $('profTerms').value.trim()
  };

  StorageEngine.saveProfile(updated);
  loadProfileToForm();
  recalculateAll();
  showToast('Company profile saved successfully!');
}

// --- Theme Controller ---
function toggleTheme() {
  const html = document.documentElement;
  const isDark = html.getAttribute('data-theme') === 'dark';
  const newTheme = isDark ? 'light' : 'dark';
  html.setAttribute('data-theme', newTheme);
  if ($('themeIcon')) $('themeIcon').textContent = newTheme === 'dark' ? '☀️' : '🌙';
  if ($('themeBtnText')) $('themeBtnText').textContent = newTheme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode';

  const s = StorageEngine.getSettings();
  s.theme = newTheme;
  StorageEngine.saveSettings(s);
}

// --- Toast Notice ---
function showToast(msg) {
  const t = $('toastNotice');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2200);
}

// --- Initialization & Event Binding ---
document.addEventListener('DOMContentLoaded', () => {
  StorageEngine.init();

  // Load saved theme
  const settings = StorageEngine.getSettings();
  if (settings.theme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
    if ($('themeIcon')) $('themeIcon').textContent = '☀️';
    if ($('themeBtnText')) $('themeBtnText').textContent = 'Switch to Light Mode';
  }

  loadProfileToForm();
  renderPresetChips();
  updateHistoryCountBadges();

  // Bind live calculation listeners to all inputs
  document.querySelectorAll('input, select').forEach(el => {
    el.addEventListener('input', () => {
      if (['warpCount', 'weftCount', 'epi', 'ppi', 'width'].includes(el.id)) {
        autoSyncConstructionLive();
      } else if (el.id === 'construction') {
        const match = WeavingEngine.parseConstructionString(el.value);
        if (match) {
          isAutoSyncing = false;
          $('warpCount').value = match.warpCount;
          $('weftCount').value = match.weftCount;
          $('epi').value = match.epi;
          $('ppi').value = match.ppi;
          if (match.width) $('width').value = match.width;
          isAutoSyncing = true;
        }
      }
      recalculateAll();
    });
  });

  // Calculate initial preset
  applyPreset('poplin_54');
});

// Offline PWA Service Worker Registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}
