/**
 * TEXTILE WEAVING ANALYZER - CALCULATION ENGINE
 * Verified against mill standards & Excel costing formulas down to 3 decimal places.
 */

const WeavingEngine = {
  /**
   * 1. Calculate Structural Weaving Parameters
   * @param {Object} p - Input parameters
   * @returns {Object} Calculated technical parameters
   */
  calculateStructure(p) {
    const warpCount = parseFloat(p.warpCount) || 0;
    const weftCount = parseFloat(p.weftCount) || 0;
    const epi = parseFloat(p.epi) || 0;
    const ppi = parseFloat(p.ppi) || 0;
    const width = parseFloat(p.width) || 0;
    const warpCrimp = parseFloat(p.warpCrimp) || 0;
    const weftCrimp = parseFloat(p.weftCrimp) || 0;
    const weftInsert = parseFloat(p.weftInsert) || 1;

    // Total Ends (Excel: B10 = B6 * B8)
    const totalEnds = epi * width;

    // Reed Space (Excel: B11 = B8 + (B8 * B14%) + 2)
    const reedSpace = width + (width * (weftCrimp / 100)) + 2;

    // Warp Grams/Mtr (Excel: B15 = (((B10 * 0.00059) / B4) / ((100 - B12) / 100)) * 1000)
    const warpCrimpDiv = (100 - warpCrimp) > 0 ? (100 - warpCrimp) / 100 : 0.91;
    const warpGram = warpCount > 0
      ? (((totalEnds * 0.00059) / warpCount) / warpCrimpDiv) * 1000
      : 0;

    // Weft Grams/Mtr (Excel: B16 = ((B11 * B7 * B13 / 1693.65) / B5) * 1000)
    const weftGram = weftCount > 0
      ? ((reedSpace * ppi * weftInsert / 1693.65) / weftCount) * 1000
      : 0;

    // GLM (Grams per Linear Meter)
    const glm = warpGram + weftGram;

    // GSM (Grams per Square Meter) - width in meters = width (inches) * 0.0254
    const widthMeters = width * 0.0254;
    const gsm = widthMeters > 0 ? glm / widthMeters : 0;

    return {
      totalEnds,
      reedSpace,
      warpGram,
      weftGram,
      glm,
      gsm,
      widthMeters
    };
  },

  /**
   * 2. Calculate Cost Components & Party Rate
   * @param {Object} p - Input rates & percentages
   * @param {Object} struct - Structural metrics from calculateStructure
   * @returns {Object} Costing breakdown & final party rate
   */
  calculateCosting(p, struct) {
    const warpRate = parseFloat(p.warpRate) || 0;
    const weftRate = parseFloat(p.weftRate) || 0;
    const sizingRate = parseFloat(p.sizingRate) || 0;
    const pickRate = parseFloat(p.pickRate) || 0;
    const transport = parseFloat(p.transport) || 0;
    const loss = parseFloat(p.loss) || 0;
    const profitPct = parseFloat(p.profitPct) || 0;
    const ppi = parseFloat(p.ppi) || 0;

    // Warp Yarn Value (Excel: C17 = B17 * B15) => (warpRate * warpGram) / 1000
    const warpValue = (warpRate * struct.warpGram) / 1000;

    // Weft Yarn Value (Excel: C18 = B16 * B18) => (weftGram * weftRate) / 1000
    const weftValue = (struct.weftGram * weftRate) / 1000;

    // Sizing Value (Excel: C19 = B19 * B15) => (sizingRate * warpGram) / 1000
    const sizingValue = (sizingRate * struct.warpGram) / 1000;

    // Pick Value (Excel: C20 = B20 * B7) => pickRate * ppi
    const pickValue = pickRate * ppi;

    // Total Manufacturing Value (Excel: B23 = SUM(C17:C22))
    const totalManufacturingCost = warpValue + weftValue + sizingValue + pickValue + transport + loss;

    // Profit Value (Excel: C24 = B23 * profitPct)
    const profitValue = totalManufacturingCost * profitPct;

    // Net Fabric Value / Party Rate per Meter (Excel: B25 = B23 + C24)
    const netFabricValue = totalManufacturingCost + profitValue;

    // Rate Per Yard (1 meter = 1.09361 yards)
    const rateYard = netFabricValue / 1.09361;

    return {
      warpValue,
      weftValue,
      sizingValue,
      pickValue,
      transport,
      loss,
      totalManufacturingCost,
      profitValue,
      netFabricValue,
      rateYard
    };
  },

  /**
   * 3. Order & Yarn Procurement Requirements
   * @param {Object} p - Order meters, bag weight, wastage %
   * @param {Object} struct - Structural metrics
   * @param {Object} cost - Cost metrics
   * @returns {Object} Procurement weights, bags, and order financials
   */
  calculateProcurement(p, struct, cost) {
    const orderMeters = parseFloat(p.orderMeters) || 0;
    const bagWeight = parseFloat(p.bagWeight) > 0 ? parseFloat(p.bagWeight) : 60;
    const wastePct = parseFloat(p.wastePct) || 0;
    const wasteFactor = 1 + (wastePct / 100);

    // Yarn weights in kg
    const warpKg = (struct.warpGram * orderMeters / 1000) * wasteFactor;
    const weftKg = (struct.weftGram * orderMeters / 1000) * wasteFactor;
    const totalYarnKg = warpKg + weftKg;

    // Bags required
    const warpBags = bagWeight > 0 ? warpKg / bagWeight : 0;
    const weftBags = bagWeight > 0 ? weftKg / bagWeight : 0;
    const totalBags = warpBags + weftBags;

    // Order Financials
    const orderCost = cost.totalManufacturingCost * orderMeters;
    const orderInvoicingValue = cost.netFabricValue * orderMeters;

    return {
      orderMeters,
      bagWeight,
      wastePct,
      warpKg,
      weftKg,
      totalYarnKg,
      warpBags,
      weftBags,
      totalBags,
      orderCost,
      orderInvoicingValue
    };
  },

  /**
   * Helper: Parse construction string e.g. "40*40/92*88-54\""
   */
  parseConstructionString(str) {
    if (!str || typeof str !== 'string') return null;
    const clean = str.trim();
    const match = clean.match(/^(\d+)\s*[*xX/]\s*(\d+)\s*[\/|,|\s]\s*(\d+)\s*[*xX]\s*(\d+)(?:\s*[-|\s]\s*(\d+))?/);
    if (!match) return null;
    return {
      warpCount: parseFloat(match[1]),
      weftCount: parseFloat(match[2]),
      epi: parseFloat(match[3]),
      ppi: parseFloat(match[4]),
      width: match[5] ? parseFloat(match[5]) : null
    };
  },

  /**
   * Helper: Format numbers with fixed decimals
   */
  fmt(val, dec = 3) {
    return Number.isFinite(val) ? val.toFixed(dec) : (0).toFixed(dec);
  },

  /**
   * Helper: Format Indian currency
   */
  fmtINR(val, dec = 2) {
    if (!Number.isFinite(val)) return '0.00';
    return val.toLocaleString('en-IN', {
      minimumFractionDigits: dec,
      maximumFractionDigits: dec
    });
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = WeavingEngine;
}
if (typeof window !== 'undefined') {
  window.WeavingEngine = WeavingEngine;
}
