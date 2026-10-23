/**
 * NAGANATHAN - WEAVING ANALYZER & FABRIC COSTING
 * Mobile-First Web Application Engine
 */

const $ = id => document.getElementById(id);
const num = id => {
  const el = $(id);
  if (!el) return 0;
  const val = parseFloat(el.value);
  return Number.isFinite(val) ? val : 0;
};
const fmt = (x, dec = 3) => (Number.isFinite(x) ? x.toFixed(dec) : (0).toFixed(dec));

// Preset Qualities (Excel Samples + Industry Standards)
const PRESETS = {
  poplin_54: {
    name: '40*40 54" Plain',
    construction: '40*40/92*88-54"',
    warpCount: 40,
    weftCount: 40,
    epi: 92,
    ppi: 88,
    width: 54,
    weave: 'PLAIN',
    warpCrimp: 9,
    weftInsert: 1,
    weftCrimp: 2,
    warpRate: 372.5,
    weftRate: 372.5,
    sizingRate: 32,
    pickRate: 0.11,
    transport: 1.25,
    loss: 1,
    profitPct: 0.06
  },
  sheeting_66: {
    name: '40*40 66" Sheeting',
    construction: '40*40/100*92-66"',
    warpCount: 40,
    weftCount: 40,
    epi: 100,
    ppi: 92,
    width: 66,
    weave: 'PLAIN',
    warpCrimp: 14,
    weftInsert: 1,
    weftCrimp: 2,
    warpRate: 372.5,
    weftRate: 372.5,
    sizingRate: 26,
    pickRate: 0.11,
    transport: 1,
    loss: 1,
    profitPct: 0.06
  },
  cambric_58: {
    name: '60*60 58" Cambric',
    construction: '60*60/92*88-58"',
    warpCount: 60,
    weftCount: 60,
    epi: 92,
    ppi: 88,
    width: 58,
    weave: 'PLAIN',
    warpCrimp: 10,
    weftInsert: 1,
    weftCrimp: 2.5,
    warpRate: 460,
    weftRate: 460,
    sizingRate: 38,
    pickRate: 0.12,
    transport: 1.25,
    loss: 1.2,
    profitPct: 0.07
  },
  grey_sheeting: {
    name: '30*30 63" Grey',
    construction: '30*30/68*68-63"',
    warpCount: 30,
    weftCount: 30,
    epi: 68,
    ppi: 68,
    width: 63,
    weave: 'PLAIN',
    warpCrimp: 8,
    weftInsert: 1,
    weftCrimp: 2,
    warpRate: 310,
    weftRate: 310,
    sizingRate: 28,
    pickRate: 0.10,
    transport: 1.2,
    loss: 0.8,
    profitPct: 0.05
  },
  heavy_twill: {
    name: '20*20 58" Twill',
    construction: '20*20/108*56-58"',
    warpCount: 20,
    weftCount: 20,
    epi: 108,
    ppi: 56,
    width: 58,
    weave: 'TWILL 2/1',
    warpCrimp: 12,
    weftInsert: 1,
    weftCrimp: 3,
    warpRate: 275,
    weftRate: 275,
    sizingRate: 24,
    pickRate: 0.11,
    transport: 1.5,
    loss: 1.2,
    profitPct: 0.065
  }
};

let historyRecords = JSON.parse(localStorage.getItem('texpro_weaving_history') || '[]');
let isAutoSyncing = true;

/**
 * Main Calculation Engine (Excel Formulas)
 */
function calculate() {
  // 1. Total Ends (B10 = B6 * B8)
  const ends = num('epi') * num('width');

  // 2. Reed Space (B11 = B8 + (B8 * B14%) + 2)
  const reed = num('width') + (num('width') * (num('weftCrimp') / 100)) + 2;

  // 3. Warp Grams/Mtr (B15 = (((B10 * 0.00059) / B4) / ((100 - B12) / 100)) * 1000)
  const warpCount = num('warpCount');
  const warpCrimp = num('warpCrimp');
  const warpCrimpDiv = (100 - warpCrimp) > 0 ? (100 - warpCrimp) / 100 : 0.91;
  const warpGram = warpCount > 0 ? (((ends * 0.00059) / warpCount) / warpCrimpDiv) * 1000 : 0;

  // 4. Weft Grams/Mtr (B16 = ((B11 * B7 * B13 / 1693.65) / B5) * 1000)
  const weftCount = num('weftCount');
  const weftGram = weftCount > 0 ? ((reed * num('ppi') * num('weftInsert') / 1693.65) / weftCount) * 1000 : 0;

  // 5. Cost Components
  const warpValue = (num('warpRate') * warpGram) / 1000;       // C17
  const weftValue = (weftGram * num('weftRate')) / 1000;       // C18
  const sizingValue = (num('sizingRate') * warpGram) / 1000;   // C19
  const pickValue = num('pickRate') * num('ppi');              // C20
  const transport = num('transport');                           // C21
  const loss = num('loss');                                     // C22

  // 6. Total Manufacturing Value (B23 = SUM(C17:C22))
  const total = warpValue + weftValue + sizingValue + pickValue + transport + loss;

  // 7. Profit & Net Fabric Value (Party Rate)
  const profit = total * num('profitPct');                      // C24
  const net = total + profit;                                   // B25

  // 8. Fabric Technical Metrics (GSM, GLM, Rate/Yard)
  const glm = warpGram + weftGram;
  const widthM = num('width') * 0.0254;
  const gsm = widthM > 0 ? glm / widthM : 0;
  const rateYard = net / 1.09361;

  // Update Readonly Display Fields
  $('ends').value = fmt(ends, 3);
  $('reedSpace').value = fmt(reed, 3);
  $('warpGram').value = fmt(warpGram, 3);
  $('weftGram').value = fmt(weftGram, 3);
  $('warpValue').value = fmt(warpValue, 3);
  $('weftValue').value = fmt(weftValue, 3);
  $('sizingValue').value = fmt(sizingValue, 3);
  $('pickValue').value = fmt(pickValue, 3);
  $('totalValue').textContent = fmt(total, 3);
  $('netValue').textContent = fmt(net, 3);

  // Update Floating Mobile Sticky Bottom Bar
  if ($('stickyNetVal')) $('stickyNetVal').textContent = fmt(net, 3);

  // Update Quick Technical Specs
  if ($('specGlm')) $('specGlm').textContent = `${fmt(glm, 2)} g/m`;
  if ($specGsm) $specGsm.textContent = `${fmt(gsm, 1)} g/m²`;
  if ($specYard) $specYard.textContent = `₹${fmt(rateYard, 2)} / yd`;

  // Update Invoice Subtotal Bar in Card 5
  const partyMeters = num('partyMeters');
  const invTotal = partyMeters > 0 ? partyMeters * net : 0;
  if ($('invPartyTotal')) {
    $('invPartyTotal').textContent = partyMeters > 0
      ? `₹ ${fmtCurrency(invTotal, 2)} (${partyMeters.toLocaleString('en-IN')} m)`
      : `₹ ${fmt(net, 3)} / m`;
  }

  // Update WhatsApp Message Preview
  updateMessage(net, gsm, glm, rateYard, ends, reed, warpGram, weftGram, total, partyMeters, invTotal);

  // Update Order Calculations if open
  calculateOrder(warpGram, weftGram, total, net);
}

// Company / Sender Profile State
let companyProfile = JSON.parse(localStorage.getItem('naganathan_company_profile') || 'null') || {
  companyName: 'NAGANATHAN WEAVING MILLS',
  ownerName: 'M. Naganathan',
  phone: '+91 98765 43210',
  city: 'Erode, Tamil Nadu',
  gstin: '',
  terms: '1. Rates quoted are Ex-Mill.\n2. GST 5% extra as applicable.\n3. Quotation valid for 7 days.\n4. Delivery within agreed lead time.'
};

// Automatic migration if user previously had CLOTHING saved
if (companyProfile && (companyProfile.companyName === 'NAGANATHAN CLOTHING' || companyProfile.companyName === 'CLOTHING')) {
  companyProfile.companyName = 'NAGANATHAN WEAVING MILLS';
  try {
    localStorage.setItem('naganathan_company_profile', JSON.stringify(companyProfile));
  } catch (e) {}
}

function updateProfileUI() {
  const p = companyProfile;
  if ($('invSenderDisplay')) $('invSenderDisplay').textContent = p.companyName;
  if ($('drawerCompanyTitle')) $('drawerCompanyTitle').textContent = p.companyName;
  if ($('menuProfileName')) $('menuProfileName').textContent = p.companyName;
  if ($('menuFooterCompany')) $('menuFooterCompany').textContent = p.companyName;
}

function openProfileModal() {
  const p = companyProfile;
  $('profCompany').value = p.companyName || '';
  $('profOwner').value = p.ownerName || '';
  $('profPhone').value = p.phone || '';
  $('profCity').value = p.city || '';
  $('profGst').value = p.gstin || '';
  $('profTerms').value = p.terms || '';
  $('profileModal').style.display = 'flex';
}

function closeProfileModal() {
  $('profileModal').style.display = 'none';
}

function saveCompanyProfile() {
  companyProfile = {
    companyName: $('profCompany').value.trim() || 'NAGANATHAN WEAVING MILLS',
    ownerName: $('profOwner').value.trim() || 'Authorized Signatory',
    phone: $('profPhone').value.trim(),
    city: $('profCity').value.trim() || 'Tamil Nadu',
    gstin: $('profGst').value.trim(),
    terms: $('profTerms').value.trim()
  };
  localStorage.setItem('naganathan_company_profile', JSON.stringify(companyProfile));
  updateProfileUI();
  closeProfileModal();
  calculate();
  showToast('Company profile saved successfully!');
}

/**
 * Quotation & Invoice Message Formatter
 */
function updateMessage(netVal, gsm, glm, rateYard, ends, reed, warpGram, weftGram, total, partyMeters, invTotal) {
  const name = $('partyName').value.trim();
  const construction = $('construction').value.trim();
  const format = $('quoteFormatSelect') ? $('quoteFormatSelect').value : 'invoice';
  const rate = netVal !== undefined ? fmt(netVal, 2) : $('netValue').textContent;
  const p = companyProfile;
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const refNum = `NC-${now.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

  let msg = '';

  if (format === 'invoice') {
    // 1. Formal Commercial Invoice & Quotation
    msg += `📄 *COMMERCIAL INVOICE / QUOTATION*\n`;
    msg += `*${p.companyName.toUpperCase()}*\n`;
    msg += `${p.city} | Ph: ${p.phone}\n`;
    if (p.gstin) msg += `GSTIN: ${p.gstin}\n`;
    msg += `Date: ${dateStr} | Ref: ${refNum}\n`;
    msg += `----------------------------------------\n`;
    msg += `*TO (BUYER):* ${name ? name : 'M/s. Valued Customer'}\n`;
    msg += `----------------------------------------\n`;
    msg += `*FABRIC SPECIFICATIONS*\n`;
    msg += `• Quality: *${construction}*\n`;
    msg += `• Weave: ${$('weave').value}\n`;
    msg += `• Finished Width: ${$('width').value}" Inches\n`;
    if (gsm) msg += `• Fabric Weight: ~${fmt(gsm, 1)} GSM (${fmt(glm, 1)} g/m)\n`;
    msg += `----------------------------------------\n`;
    msg += `• *Ex-Mill Rate: ₹ ${rate} / Metre*\n`;
    if (rateYard) msg += `• Equivalent: ₹ ${fmt(rateYard, 2)} / Yard\n`;
    if (partyMeters && partyMeters > 0) {
      msg += `• Order Quantity: *${partyMeters.toLocaleString('en-IN')} Metres*\n`;
      msg += `----------------------------------------\n`;
      msg += `💰 *TOTAL AMOUNT: ₹ ${fmtCurrency(invTotal, 2)}*\n`;
    }
    msg += `----------------------------------------\n`;
    msg += `*TERMS & CONDITIONS*\n`;
    msg += `${p.terms}\n\n`;
    msg += `For *${p.companyName}*\n`;
    msg += `${p.ownerName} (Authorized Signatory)`;
  } else if (format === 'customer') {
    // 2. Quick WhatsApp Rate Quote
    if (name) msg += 'Dear ' + name + ',\n\n';
    msg += 'Fabric Construction & Rate\n';
    msg += 'Construction: ' + construction + '\n';
    msg += 'Rate: ₹' + rate + ' / metre\n\n';
    msg += 'Regards\n' + p.companyName;
  } else {
    // 3. Detailed Technical Sheet for Mill / Party
    msg += `⚙️ Fabric Technical & Costing Sheet\n`;
    msg += `Company: ${p.companyName}\n`;
    msg += `Construction: ${construction}\n`;
    msg += `Weave: ${$('weave').value} | Width: ${$('width').value}"\n`;
    if (ends) msg += `Total Ends: ${Math.round(ends)} | Reed Space: ${fmt(reed, 2)}"\n`;
    if (gsm) msg += `Weight: ~${fmt(gsm, 1)} GSM (${fmt(glm, 1)} g/m)\n\n`;
    if (warpGram) msg += `• Warp Weight: ${fmt(warpGram, 2)} g/m\n`;
    if (weftGram) msg += `• Weft Weight: ${fmt(weftGram, 2)} g/m\n`;
    if (total) msg += `• Manufacturing Cost: ₹${fmt(total, 2)} / m\n`;
    msg += `• Final Party Rate: ₹${rate} / metre\n\n`;
    msg += `Regards\n${p.companyName}`;
  }

  $('messagePreview').textContent = msg;
  return msg;
}

/**
 * Official A4 Invoice Modal Viewer
 */
function openInvoiceModal() {
  const p = companyProfile;
  const name = $('partyName').value.trim() || 'M/s. Valued Customer';
  const phone = $('partyPhone').value.trim() || '--';
  const meters = num('partyMeters') || num('orderMeters') || 1000;
  const netRate = num('netValue') || 76.45;
  const totalAmount = meters * netRate;

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const refNum = `NC-${now.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

  // Header & Sender
  $('invCardCompany').textContent = p.companyName;
  $('invCardCity').textContent = p.city;
  $('invCardPhone').textContent = p.phone;
  if (p.gstin) {
    $('invCardGstWrap').style.display = 'block';
    $('invCardGst').textContent = p.gstin;
  } else {
    $('invCardGstWrap').style.display = 'none';
  }

  // Meta
  $('invRefNum').textContent = refNum;
  $('invDate').textContent = dateStr;

  // Buyer
  $('invBuyerName').textContent = name;
  $('invBuyerPhone').textContent = `Contact: ${phone}`;

  // Table
  $('invTableConst').textContent = $('construction').value;
  $('invTableWeave').textContent = $('weave').value;
  $('invTableWidth').textContent = `${$('width').value}"`;
  $('invTableGsm').textContent = $('specGsm') ? $('specGsm').textContent.replace(' g/m²', '') : '~112.8';
  $('invTableQty').textContent = meters.toLocaleString('en-IN');
  $('invTableRate').textContent = `₹ ${fmt(netRate, 2)}`;
  $('invTableTotal').textContent = `₹ ${fmtCurrency(totalAmount, 2)}`;

  // Totals & Terms
  $('invSubTotal').textContent = `₹ ${fmtCurrency(totalAmount, 2)}`;
  $('invGrandTotal').textContent = `₹ ${fmtCurrency(totalAmount, 2)}`;
  $('invCardTerms').textContent = p.terms;

  // Signatures
  $('invPreparedBy').textContent = p.ownerName;
  $('invForCompany').textContent = p.companyName;

  $('invoiceModal').style.display = 'flex';
}

function closeInvoiceModal() {
  $('invoiceModal').style.display = 'none';
}

function fmtCurrency(x, dec = 2) {
  return Number.isFinite(x) ? x.toLocaleString('en-IN', { minimumFractionDigits: dec, maximumFractionDigits: dec }) : '0.00';
}

/**
 * Menu Drawer Toggle
 */
function toggleMenu(open) {
  const drawer = $('menuDrawer');
  const overlay = $('menuOverlay');
  if (open) {
    updateMenuHistory();
    drawer.classList.add('open');
    overlay.classList.add('open');
  } else {
    drawer.classList.remove('open');
    overlay.classList.remove('open');
  }
}

function applyPresetAndClose(key) {
  applyPreset(key);
  toggleMenu(false);
}

function updateMenuHistory() {
  const badge = $('menuHistoryBadge');
  if (badge) badge.textContent = historyRecords.length;
  renderHistory();
}

/**
 * WhatsApp Send Action
 */
function sendWhatsApp() {
  const msg = $('messagePreview').textContent;
  const phone = $('partyPhone').value.replace(/\D/g, '');

  if (navigator.share && !phone) {
    navigator.share({
      title: 'Commercial Invoice / Quotation',
      text: msg
    }).catch(() => {
      openWhatsAppUrl(msg, phone);
    });
    return;
  }

  openWhatsAppUrl(msg, phone);
}

function openWhatsAppUrl(msg, phone) {
  const url = phone
    ? 'https://wa.me/' + phone + '?text=' + encodeURIComponent(msg)
    : 'https://wa.me/?text=' + encodeURIComponent(msg);
  window.open(url, '_blank');
}

/**
 * Copy to Clipboard
 */
async function copyMessage() {
  const msg = $('messagePreview').textContent;
  try {
    await navigator.clipboard.writeText(msg);
    showToast('Invoice / Quotation copied to clipboard!');
  } catch (e) {
    showToast('Please copy from the preview box.');
  }
}

function showToast(text) {
  const t = $('toast');
  if (!t) return;
  t.textContent = text;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2200);
}

/**
 * Fast Preset Application
 */
function applyPreset(key) {
  const p = PRESETS[key];
  if (!p) return;

  isAutoSyncing = false;
  $('construction').value = p.construction;
  $('warpCount').value = p.warpCount;
  $('weftCount').value = p.weftCount;
  $('epi').value = p.epi;
  $('ppi').value = p.ppi;
  $('width').value = p.width;
  $('weave').value = p.weave;
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

  // Update active chip styling
  document.querySelectorAll('.preset-scroll .chip').forEach(c => c.classList.remove('active'));
  const foundBtn = Array.from(document.querySelectorAll('.preset-scroll .chip')).find(b => b.textContent.includes(p.name));
  if (foundBtn) foundBtn.classList.add('active');

  calculate();
  showToast(`Applied: ${p.name}`);
}

function saveAsCustomPreset() {
  const name = prompt('Enter a name for this custom quality preset:');
  if (!name || !name.trim()) return;

  const key = 'custom_' + Date.now();
  PRESETS[key] = {
    name: name.trim(),
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

  // Create chip in scrollbar
  const chip = document.createElement('button');
  chip.className = 'chip';
  chip.textContent = name.trim();
  chip.onclick = () => applyPreset(key);
  const addBtn = document.querySelector('.chip.add-chip');
  if (addBtn && addBtn.parentNode) {
    addBtn.parentNode.insertBefore(chip, addBtn);
  }

  showToast(`Saved preset "${name.trim()}"!`);
}

/**
 * Auto-Parse Construction String
 * e.g. 40*40/92*88-54"
 */
function parseConstruction() {
  const str = $('construction').value.trim();
  const match = str.match(/(\d+)\s*[*xX/]\s*(\d+)\s*[\/|,|\s]\s*(\d+)\s*[*xX]\s*(\d+)(?:\s*[-|\s]\s*(\d+))?/);
  if (match) {
    isAutoSyncing = false;
    $('warpCount').value = match[1];
    $('weftCount').value = match[2];
    $('epi').value = match[3];
    $('ppi').value = match[4];
    if (match[5]) $('width').value = match[5];
    isAutoSyncing = true;
    calculate();
    showToast('Auto-parsed: Warp, Weft, EPI, PPI & Width!');
  } else {
    showToast('Format example: 40*40/92*88-54"');
  }
}

function autoSyncConstruction() {
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

function resetDefaults() {
  applyPreset('poplin_54');
  $('partyName').value = '';
  $('partyPhone').value = '';
}

/**
 * Order & Yarn Requirement Calculator
 */
function toggleOrderDrawer() {
  const sec = $('orderSection');
  if (!sec) return;
  const isHidden = sec.style.display === 'none';
  sec.style.display = isHidden ? 'block' : 'none';
  $('orderToggleBtn').textContent = isHidden
    ? '▲ Hide Order Yarn Requirements'
    : '📦 Calculate Order Yarn Requirements (Bags & Kgs)';
  if (isHidden) {
    calculate();
    sec.scrollIntoView({ behavior: 'smooth' });
  }
}

function calculateOrder(warpGram, weftGram, totalCostMtr, netPriceMtr) {
  if (!$('orderMeters')) return;
  const meters = num('orderMeters') || 5000;
  const bagWeight = num('bagWeight') || 60;
  const waste = 1 + (num('wastePct') / 100);

  const warpKg = (warpGram * meters / 1000) * waste;
  const weftKg = (weftGram * meters / 1000) * waste;
  const totalYarnKg = warpKg + weftKg;

  const warpBags = bagWeight > 0 ? warpKg / bagWeight : 0;
  const weftBags = bagWeight > 0 ? weftKg / bagWeight : 0;
  const totalBags = warpBags + weftBags;

  const orderCost = totalCostMtr * meters;
  const orderValue = netPriceMtr * meters;

  $('lblWarpCount').textContent = `${num('warpCount')}s`;
  $('lblWeftCount').textContent = `${num('weftCount')}s`;
  $('resWarpKg').textContent = fmt(warpKg, 2);
  $('resWarpBags').textContent = fmt(warpBags, 2);
  $('resWeftKg').textContent = fmt(weftKg, 2);
  $('resWeftBags').textContent = fmt(weftBags, 2);
  $('resTotalYarnKg').textContent = fmt(totalYarnKg, 2);
  $('resTotalBags').textContent = fmt(totalBags, 2);
  $('resOrderCost').textContent = Math.round(orderCost).toLocaleString('en-IN');
  $('resOrderValue').textContent = Math.round(orderValue).toLocaleString('en-IN');
}

/**
 * Saved Costings History (LocalStorage)
 */
function saveCurrentCosting() {
  const record = {
    id: Date.now().toString(),
    date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
    construction: $('construction').value,
    rate: $('netValue').textContent,
    warpCount: $('warpCount').value,
    weftCount: $('weftCount').value,
    epi: $('epi').value,
    ppi: $('ppi').value,
    width: $('width').value,
    weave: $('weave').value,
    warpRate: $('warpRate').value,
    weftRate: $('weftRate').value,
    sizingRate: $('sizingRate').value,
    pickRate: $('pickRate').value,
    transport: $('transport').value,
    loss: $('loss').value,
    profitPct: $('profitPct').value,
    warpCrimp: $('warpCrimp').value,
    weftCrimp: $('weftCrimp'),
    weftInsert: $('weftInsert').value
  };

  historyRecords.unshift(record);
  localStorage.setItem('texpro_weaving_history', JSON.stringify(historyRecords));
  updateHistoryBadge();
  showToast(`Saved ${record.construction} (₹${record.rate}/m)`);
}

function updateHistoryBadge() {
  const el = $('historyCount');
  if (el) el.textContent = historyRecords.length;
}

function toggleDrawer(open) {
  const drawer = $('historyDrawer');
  const overlay = $('drawerOverlay');
  if (open) {
    renderHistory();
    drawer.classList.add('open');
    overlay.classList.add('open');
  } else {
    drawer.classList.remove('open');
    overlay.classList.remove('open');
  }
}

function renderHistory() {
  const list = $('historyList');
  if (!list) return;

  if (historyRecords.length === 0) {
    list.innerHTML = '<p style="text-align:center;color:#64748b;padding:20px 0;">No saved quotes yet.<br>Click "Save Quote" on the app to store quotes.</p>';
    return;
  }

  list.innerHTML = '';
  historyRecords.forEach(item => {
    const div = document.createElement('div');
    div.className = 'history-item';
    div.innerHTML = `
      <div class="history-item-info">
        <span class="history-item-title">${item.construction}</span>
        <span class="history-item-sub">${item.date} • Width: ${item.width}"</span>
      </div>
      <div class="history-item-actions">
        <span class="history-rate">₹${item.rate}</span>
        <button class="pill-btn mini" onclick="loadHistoryItem('${item.id}')">Load</button>
        <button class="pill-btn mini danger" onclick="deleteHistoryItem('${item.id}')">&times;</button>
      </div>
    `;
    list.appendChild(div);
  });
}

function loadHistoryItem(id) {
  const item = historyRecords.find(x => x.id === id);
  if (!item) return;

  isAutoSyncing = false;
  $('construction').value = item.construction;
  $('warpCount').value = item.warpCount;
  $('weftCount').value = item.weftCount;
  $('epi').value = item.epi;
  $('ppi').value = item.ppi;
  $('width').value = item.width;
  if (item.weave) $('weave').value = item.weave;
  if (item.warpRate) $('warpRate').value = item.warpRate;
  if (item.weftRate) $('weftRate').value = item.weftRate;
  if (item.sizingRate) $('sizingRate').value = item.sizingRate;
  if (item.pickRate) $('pickRate').value = item.pickRate;
  if (item.transport) $('transport').value = item.transport;
  if (item.loss) $('loss').value = item.loss;
  if (item.profitPct) $('profitPct').value = item.profitPct;
  isAutoSyncing = true;

  calculate();
  toggleDrawer(false);
  showToast(`Loaded ${item.construction}!`);
}

function deleteHistoryItem(id) {
  historyRecords = historyRecords.filter(x => x.id !== id);
  localStorage.setItem('texpro_weaving_history', JSON.stringify(historyRecords));
  updateHistoryBadge();
  renderHistory();
  showToast('Record deleted.');
}

function clearAllHistory() {
  if (confirm('Clear all saved quotes history?')) {
    historyRecords = [];
    localStorage.setItem('texpro_weaving_history', '[]');
    updateHistoryBadge();
    renderHistory();
    showToast('History cleared.');
  }
}

function exportHistoryCsv() {
  if (historyRecords.length === 0) {
    showToast('No history to export.');
    return;
  }
  const headers = ['Date', 'Construction', 'Width', 'Warp Count', 'Weft Count', 'EPI', 'PPI', 'Rate/Meter'];
  const rows = historyRecords.map(r => [
    `"${r.date}"`,
    `"${r.construction}"`,
    r.width,
    r.warpCount,
    r.weftCount,
    r.epi,
    r.ppi,
    r.rate
  ]);
  const csv = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
  const uri = 'data:text/csv;charset=utf-8,' + encodeURI(csv);
  const a = document.createElement('a');
  a.href = uri;
  a.download = `weaving_quotes_${Date.now()}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// Service Worker Registration for PWA / Mobile
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}

// Initialization & Event Binding
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('input').forEach(el => {
    el.addEventListener('input', () => {
      if (['warpCount', 'weftCount', 'epi', 'ppi', 'width'].includes(el.id)) {
        autoSyncConstruction();
      } else if (el.id === 'construction') {
        // Live auto-parse if user types/pastes a valid construction string
        const match = el.value.trim().match(/^(\d+)\s*[*xX/]\s*(\d+)\s*[\/|,|\s]\s*(\d+)\s*[*xX]\s*(\d+)(?:\s*[-|\s]\s*(\d+))?/);
        if (match) {
          isAutoSyncing = false;
          $('warpCount').value = match[1];
          $('weftCount').value = match[2];
          $('epi').value = match[3];
          $('ppi').value = match[4];
          if (match[5]) $('width').value = match[5];
          isAutoSyncing = true;
        }
      }
      calculate();
    });
  });

  updateProfileUI();
  updateHistoryBadge();
  calculate();
});
