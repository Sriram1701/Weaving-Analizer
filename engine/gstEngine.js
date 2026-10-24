/**
 * TEXTILE WEAVING ANALYZER - GST & COMMERCIAL INVOICING ENGINE
 * Indian GST calculations, intra-state (CGST+SGST) vs inter-state (IGST),
 * HSN 5208 classifications, and Indian numbering amount-to-words converter.
 */

const GstEngine = {
  /**
   * Calculate GST Breakdown
   * @param {Object} options
   *   - subtotal: Amount in INR
   *   - gstRatePct: e.g. 5, 12, 18 or 0
   *   - isTaxInclusive: boolean (default false: tax is added on top)
   *   - isInterState: boolean (true = IGST, false = CGST + SGST)
   */
  calculateTax(options) {
    const rawSubtotal = parseFloat(options.subtotal) || 0;
    const ratePct = parseFloat(options.gstRatePct) || 0;
    const isInclusive = !!options.isTaxInclusive;
    const isInterState = !!options.isInterState;

    let taxableAmount = 0;
    let totalTax = 0;
    let grandTotal = 0;

    if (isInclusive) {
      taxableAmount = ratePct > 0 ? (rawSubtotal * 100) / (100 + ratePct) : rawSubtotal;
      totalTax = rawSubtotal - taxableAmount;
      grandTotal = rawSubtotal;
    } else {
      taxableAmount = rawSubtotal;
      totalTax = (taxableAmount * ratePct) / 100;
      grandTotal = taxableAmount + totalTax;
    }

    let cgstRate = 0;
    let cgstAmount = 0;
    let sgstRate = 0;
    let sgstAmount = 0;
    let igstRate = 0;
    let igstAmount = 0;

    if (isInterState) {
      igstRate = ratePct;
      igstAmount = totalTax;
    } else {
      cgstRate = ratePct / 2;
      cgstAmount = totalTax / 2;
      sgstRate = ratePct / 2;
      sgstAmount = totalTax / 2;
    }

    return {
      taxableAmount,
      gstRatePct: ratePct,
      isTaxInclusive: isInclusive,
      isInterState,
      cgstRate,
      cgstAmount,
      sgstRate,
      sgstAmount,
      igstRate,
      igstAmount,
      totalTax,
      grandTotal
    };
  },

  /**
   * Convert Number to Indian Currency Words (e.g. 3,82,245 => "Rupees Three Lakh Eighty-Two Thousand Two Hundred Forty-Five Only")
   */
  numberToWordsINR(amount) {
    if (!Number.isFinite(amount) || amount === 0) return 'Rupees Zero Only';

    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
                  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    function twoDigits(n) {
      if (n < 20) return ones[n];
      const t = Math.floor(n / 10);
      const o = n % 10;
      return tens[t] + (o > 0 ? '-' + ones[o] : '');
    }

    function threeDigits(n) {
      const h = Math.floor(n / 100);
      const rem = n % 100;
      let res = '';
      if (h > 0) res += ones[h] + ' Hundred';
      if (rem > 0) res += (res ? ' and ' : '') + twoDigits(rem);
      return res;
    }

    const whole = Math.floor(Math.abs(amount));
    const paise = Math.round((Math.abs(amount) - whole) * 100);

    const crore = Math.floor(whole / 10000000);
    const lakh = Math.floor((whole % 10000000) / 100000);
    const thousand = Math.floor((whole % 100000) / 1000);
    const remainder = whole % 1000;

    const parts = [];
    if (crore > 0) parts.push(threeDigits(crore) + ' Crore');
    if (lakh > 0) parts.push(threeDigits(lakh) + ' Lakh');
    if (thousand > 0) parts.push(threeDigits(thousand) + ' Thousand');
    if (remainder > 0) parts.push(threeDigits(remainder));

    let words = 'Rupees ' + (parts.join(' ') || 'Zero');
    if (paise > 0) {
      words += ' and ' + twoDigits(paise) + ' Paise';
    }
    words += ' Only';

    return words;
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = GstEngine;
}
if (typeof window !== 'undefined') {
  window.GstEngine = GstEngine;
}
