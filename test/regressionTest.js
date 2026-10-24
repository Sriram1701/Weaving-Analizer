/**
 * AUTOMATED REGRESSION SUITE - WEAVING ENGINE & GST ENGINE
 * Verifies calculation accuracy against Excel mill costing formulas.
 */

const WeavingEngine = require('../engine/weavingCalc');
const GstEngine = require('../engine/gstEngine');
const StorageEngine = require('../engine/storage');

let passedTests = 0;
let failedTests = 0;

function assertClose(actual, expected, tolerance, desc) {
  const diff = Math.abs(actual - expected);
  if (diff <= tolerance) {
    console.log(`  ✓ PASS: ${desc} -> got ${actual.toFixed(4)}, expected ~${expected.toFixed(4)} (diff: ${diff.toFixed(6)})`);
    passedTests++;
  } else {
    console.error(`  ✗ FAIL: ${desc} -> got ${actual}, expected ${expected} (diff: ${diff})`);
    failedTests++;
  }
}

function assertEqual(actual, expected, desc) {
  if (actual === expected) {
    console.log(`  ✓ PASS: ${desc} -> "${actual}"`);
    passedTests++;
  } else {
    console.error(`  ✗ FAIL: ${desc} -> got "${actual}", expected "${expected}"`);
    failedTests++;
  }
}

console.log('=== 1. TESTING EXCEL SAMPLE 1 (40*40 54" Plain Poplin) ===');
const sample1 = StorageEngine.DEFAULT_PRESETS.poplin_54;
const struct1 = WeavingEngine.calculateStructure(sample1);
const cost1 = WeavingEngine.calculateCosting(sample1, struct1);

// Excel references:
// Ends = 4968
assertClose(struct1.totalEnds, 4968, 0.001, 'Total Ends (B10 = B6 * B8)');
// Reed space = 57.08
assertClose(struct1.reedSpace, 57.08, 0.001, 'Reed Space (B11 = B8 + B8*B14% + 2)');
// Warp g/m = 80.525
assertClose(struct1.warpGram, 80.525, 0.005, 'Warp Grams/Mtr (B15 = 80.525 g/m)');
// Weft g/m = 74.145
assertClose(struct1.weftGram, 74.145, 0.005, 'Weft Grams/Mtr (B16 = 74.145 g/m)');
// Warp Yarn Value = 29.996
assertClose(cost1.warpValue, 29.996, 0.005, 'Warp Yarn Value (C17 = ₹29.996)');
// Weft Yarn Value = 27.619
assertClose(cost1.weftValue, 27.619, 0.005, 'Weft Yarn Value (C18 = ₹27.619)');
// Sizing Value = 2.577
assertClose(cost1.sizingValue, 2.577, 0.005, 'Sizing Value (C19 = ₹2.577)');
// Pick Value = 9.680
assertClose(cost1.pickValue, 9.680, 0.001, 'Pick Value (C20 = ₹9.680)');
// Total Value = 72.122
assertClose(cost1.totalManufacturingCost, 72.122, 0.005, 'Total Manufacturing Value (B23 = ₹72.122)');
// Profit Value = 4.327
assertClose(cost1.profitValue, 4.327, 0.005, 'Profit 6% (C24 = ₹4.327)');
// Net Fabric Value = 76.449
assertClose(cost1.netFabricValue, 76.449, 0.005, 'Net Fabric Value / Party Rate (B25 = ₹76.449/m)');
// GSM ~ 112.77
assertClose(struct1.gsm, 112.77, 0.1, 'Fabric GSM (~112.8 g/m²)');

console.log('\n=== 2. TESTING EXCEL SAMPLE 2 (40*40 66" Sheeting) ===');
const sample2 = StorageEngine.DEFAULT_PRESETS.sheeting_66;
const struct2 = WeavingEngine.calculateStructure(sample2);
const cost2 = WeavingEngine.calculateCosting(sample2, struct2);

assertClose(struct2.totalEnds, 6600, 0.001, 'Total Ends (E10 = 6600)');
assertClose(struct2.reedSpace, 69.32, 0.005, 'Reed Space (E11 = 69.32)');
assertClose(struct2.warpGram, 113.198, 0.005, 'Warp Grams/Mtr (E15 = 113.198 g/m)');
assertClose(struct2.weftGram, 94.138, 0.005, 'Weft Grams/Mtr (E16 = 94.138 g/m)');
assertClose(cost2.totalManufacturingCost, 92.295, 0.01, 'Total Manufacturing Value (E23 = ₹92.295)');
assertClose(cost2.netFabricValue, 97.833, 0.01, 'Net Fabric Value / Party Rate (E25 = ₹97.833/m)');

console.log('\n=== 3. TESTING YARN PROCUREMENT ENGINE ===');
const proc1 = WeavingEngine.calculateProcurement(
  { orderMeters: 5000, bagWeight: 60, wastePct: 2 },
  struct1,
  cost1
);
assertClose(proc1.warpKg, 410.68, 0.05, 'Procurement Warp kg (410.68 kg)');
assertClose(proc1.warpBags, 6.84, 0.02, 'Procurement Warp Bags (6.84 Bags)');
assertClose(proc1.weftKg, 378.14, 0.05, 'Procurement Weft kg (378.14 kg)');
assertClose(proc1.weftBags, 6.30, 0.02, 'Procurement Weft Bags (6.30 Bags)');
assertClose(proc1.totalYarnKg, 788.82, 0.1, 'Procurement Total Yarn kg (788.82 kg)');
assertClose(proc1.totalBags, 13.15, 0.05, 'Procurement Total Bags (13.15 Bags)');
assertClose(proc1.orderCost, 360608, 10, 'Total Order Cost (~₹3,60,610)');
assertClose(proc1.orderInvoicingValue, 382244, 10, 'Total Order Invoicing Value (~₹3,82,245)');

console.log('\n=== 4. TESTING CONSTRUCTION PARSER ===');
const parsed = WeavingEngine.parseConstructionString('40*40/92*88-54"');
assertEqual(parsed.warpCount, 40, 'Parsed Warp Count');
assertEqual(parsed.weftCount, 40, 'Parsed Weft Count');
assertEqual(parsed.epi, 92, 'Parsed EPI');
assertEqual(parsed.ppi, 88, 'Parsed PPI');
assertEqual(parsed.width, 54, 'Parsed Width');

console.log('\n=== 5. TESTING GST ENGINE ===');
const intraGst = GstEngine.calculateTax({ subtotal: 382245, gstRatePct: 5, isInterState: false });
assertClose(intraGst.cgstRate, 2.5, 0.001, 'CGST Rate (2.5%)');
assertClose(intraGst.sgstRate, 2.5, 0.001, 'SGST Rate (2.5%)');
assertClose(intraGst.totalTax, 19112.25, 0.01, 'Total GST 5% on 3,82,245 (₹19,112.25)');
assertClose(intraGst.grandTotal, 401357.25, 0.01, 'Grand Total (₹4,01,357.25)');

const interGst = GstEngine.calculateTax({ subtotal: 382245, gstRatePct: 5, isInterState: true });
assertClose(interGst.igstRate, 5.0, 0.001, 'IGST Rate (5%)');
assertClose(interGst.igstAmount, 19112.25, 0.01, 'IGST Amount (₹19,112.25)');

const words = GstEngine.numberToWordsINR(401357);
console.log(`  Amount in Words: "${words}"`);
assertEqual(words, 'Rupees Four Lakh One Thousand Three Hundred and Fifty-Seven Only', 'Indian Currency Words Format');

console.log(`\n========================================`);
console.log(`TEST SUMMARY: ${passedTests} PASSED, ${failedTests} FAILED`);
console.log(`========================================`);

if (failedTests > 0) {
  process.exit(1);
}
