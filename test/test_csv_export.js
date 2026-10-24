const WeavingEngine = require('../engine/weavingCalc');
const GstEngine = require('../engine/gstEngine');
const StorageEngine = require('../engine/storage');

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

const headers = [
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

// Test with exact user sample from screenshot:
const testRecord = {
  docNumber: 'QTN-2026-001',
  docType: 'quote',
  date: '23-Oct',
  buyerName: 'M/s. Valued Customer',
  buyerPhone: '+91 98765 43210',
  buyerState: 'Tamil Nadu',
  construction: '40*40/92*88-54"',
  meters: 5000,
  rate: 76.449,
  subtotal: 382245,
  grandTotal: 401357.25,
  params: StorageEngine.DEFAULT_PRESETS.poplin_54
};

// Test with legacy minimal record (no params, just construction & rate):
const legacyRecord = {
  docType: 'quote',
  date: '23-Oct',
  buyerName: 'M/s. Valued Customer',
  construction: '40*40/92*88-54"',
  rate: 76.449
};

const row1 = recordToCsvDetails(testRecord);
const row2 = recordToCsvDetails(legacyRecord);

console.log('Headers count:', headers.length);
console.log('Row 1 values count:', row1.length);
console.log('Row 2 (legacy) values count:', row2.length);

if (headers.length !== row1.length || headers.length !== row2.length) {
  console.error('MISMATCH between headers and row columns!');
  process.exit(1);
}

const csv = '\uFEFF' + [
  headers.map(csvCell).join(','),
  row1.map(csvCell).join(','),
  row2.map(csvCell).join(',')
].join('\r\n');

console.log('Row 2 construction field:', csvCell(legacyRecord.construction));
console.log('Row 2 calculated warpCount:', row2[9], 'weftCount:', row2[10], 'EPI:', row2[11], 'PPI:', row2[12], 'Width:', row2[13]);
if (csvCell(legacyRecord.construction) === '"40*40/92*88-54"""' && row2[9] === 40 && row2[11] === 92) {
  console.log('✓ Legacy fallback SUCCESS: Successfully parsed construction and populated columns!');
} else {
  console.error('✗ Legacy fallback failed');
  process.exit(1);
}

