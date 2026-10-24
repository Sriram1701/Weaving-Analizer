/**
 * TEXTILE WEAVING ANALYZER - STORAGE & REPOSITORY LAYER
 * Manages presets, saved quotations, order history, company profile, and settings
 * with safe schema migration from legacy Naganathan Weaving Analyzer keys.
 */

const StorageEngine = {
  // Built-in Standard Mill Quality Presets
  DEFAULT_PRESETS: {
    poplin_54: {
      id: 'poplin_54',
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
      id: 'sheeting_66',
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
      id: 'cambric_58',
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
      id: 'grey_sheeting',
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
      id: 'heavy_twill',
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
  },

  DEFAULT_PROFILE: {
    companyName: 'NAGANATHAN WEAVING MILLS',
    ownerName: 'M. Naganathan',
    phone: '+91 98765 43210',
    whatsapp: '919876543210',
    email: 'info@naganathanweaving.com',
    city: 'Erode',
    state: 'Tamil Nadu',
    address: '124, Powerloom Industrial Estate, Erode - 638001',
    gstin: '33AAAAA1234F1Z5',
    hsnCode: '5208',
    invoicePrefix: 'TWA',
    defaultCurrency: 'INR (₹)',
    terms: '1. Rates quoted are Ex-Mill net.\n2. GST 5% extra as applicable.\n3. Quotation valid for 7 days.\n4. Delivery within agreed lead time.'
  },

  DEFAULT_SETTINGS: {
    theme: 'light', // 'light' or 'dark'
    defaultQuality: 'poplin_54',
    gstRate: 5,
    isTaxInclusive: false,
    defaultValidityDays: 7
  },

  // Keys
  KEYS: {
    PROFILE: 'twa_company_profile',
    SETTINGS: 'twa_app_settings',
    PRESETS: 'twa_custom_presets',
    QUOTES: 'twa_saved_quotes',
    ORDERS: 'twa_saved_orders',
    LEGACY_HISTORY: 'texpro_weaving_history',
    LEGACY_PROFILE: 'naganathan_company_profile'
  },

  /**
   * Safe initialization and migration
   */
  init() {
    this.migrateLegacyData();
  },

  migrateLegacyData() {
    try {
      // 1. Profile migration
      if (!localStorage.getItem(this.KEYS.PROFILE)) {
        const legacyProf = localStorage.getItem(this.KEYS.LEGACY_PROFILE);
        if (legacyProf) {
          const parsed = JSON.parse(legacyProf);
          const migrated = Object.assign({}, this.DEFAULT_PROFILE, parsed);
          localStorage.setItem(this.KEYS.PROFILE, JSON.stringify(migrated));
        } else {
          localStorage.setItem(this.KEYS.PROFILE, JSON.stringify(this.DEFAULT_PROFILE));
        }
      }

      // 2. Quotes history migration
      if (!localStorage.getItem(this.KEYS.QUOTES)) {
        const legacyHist = localStorage.getItem(this.KEYS.LEGACY_HISTORY);
        if (legacyHist) {
          const items = JSON.parse(legacyHist);
          const quotes = items.map((item, idx) => ({
            id: item.id || `migrated_${Date.now()}_${idx}`,
            quoteNumber: `QTN-${new Date().getFullYear()}-${String(idx + 1).padStart(3, '0')}`,
            date: item.date || new Date().toISOString().split('T')[0],
            buyerName: item.partyName || 'M/s. Valued Customer',
            buyerPhone: item.partyPhone || '',
            construction: item.construction || '',
            rate: parseFloat(item.rate) || 0,
            width: parseFloat(item.width) || 54,
            warpCount: item.warpCount,
            weftCount: item.weftCount,
            epi: item.epi,
            ppi: item.ppi,
            status: 'finalized',
            details: item
          }));
          localStorage.setItem(this.KEYS.QUOTES, JSON.stringify(quotes));
        } else {
          localStorage.setItem(this.KEYS.QUOTES, JSON.stringify([]));
        }
      }

      // 3. Settings initialization
      if (!localStorage.getItem(this.KEYS.SETTINGS)) {
        localStorage.setItem(this.KEYS.SETTINGS, JSON.stringify(this.DEFAULT_SETTINGS));
      }
    } catch (e) {
      console.error('Storage migration error:', e);
    }
  },

  getProfile() {
    try {
      const data = localStorage.getItem(this.KEYS.PROFILE);
      return data ? Object.assign({}, this.DEFAULT_PROFILE, JSON.parse(data)) : this.DEFAULT_PROFILE;
    } catch (e) {
      return this.DEFAULT_PROFILE;
    }
  },

  saveProfile(profile) {
    localStorage.setItem(this.KEYS.PROFILE, JSON.stringify(profile));
  },

  getSettings() {
    try {
      const data = localStorage.getItem(this.KEYS.SETTINGS);
      return data ? Object.assign({}, this.DEFAULT_SETTINGS, JSON.parse(data)) : this.DEFAULT_SETTINGS;
    } catch (e) {
      return this.DEFAULT_SETTINGS;
    }
  },

  saveSettings(settings) {
    localStorage.setItem(this.KEYS.SETTINGS, JSON.stringify(settings));
  },

  getPresets() {
    try {
      const custom = JSON.parse(localStorage.getItem(this.KEYS.PRESETS) || '{}');
      return Object.assign({}, this.DEFAULT_PRESETS, custom);
    } catch (e) {
      return Object.assign({}, this.DEFAULT_PRESETS);
    }
  },

  saveCustomPreset(preset) {
    try {
      const custom = JSON.parse(localStorage.getItem(this.KEYS.PRESETS) || '{}');
      custom[preset.id] = preset;
      localStorage.setItem(this.KEYS.PRESETS, JSON.stringify(custom));
      return true;
    } catch (e) {
      return false;
    }
  },

  deleteCustomPreset(id) {
    try {
      const custom = JSON.parse(localStorage.getItem(this.KEYS.PRESETS) || '{}');
      delete custom[id];
      localStorage.setItem(this.KEYS.PRESETS, JSON.stringify(custom));
      return true;
    } catch (e) {
      return false;
    }
  },

  getQuotes() {
    try {
      return JSON.parse(localStorage.getItem(this.KEYS.QUOTES) || '[]');
    } catch (e) {
      return [];
    }
  },

  saveQuote(quote) {
    const quotes = this.getQuotes();
    const existingIdx = quotes.findIndex(q => q.id === quote.id);
    if (existingIdx >= 0) {
      quotes[existingIdx] = quote;
    } else {
      quotes.unshift(quote);
    }
    localStorage.setItem(this.KEYS.QUOTES, JSON.stringify(quotes));
    return quote;
  },

  deleteQuote(id) {
    const quotes = this.getQuotes().filter(q => q.id !== id);
    localStorage.setItem(this.KEYS.QUOTES, JSON.stringify(quotes));
  },

  getOrders() {
    try {
      return JSON.parse(localStorage.getItem(this.KEYS.ORDERS) || '[]');
    } catch (e) {
      return [];
    }
  },

  saveOrder(order) {
    const orders = this.getOrders();
    const existingIdx = orders.findIndex(o => o.id === order.id);
    if (existingIdx >= 0) {
      orders[existingIdx] = order;
    } else {
      orders.unshift(order);
    }
    localStorage.setItem(this.KEYS.ORDERS, JSON.stringify(orders));
    return order;
  },

  deleteOrder(id) {
    const orders = this.getOrders().filter(o => o.id !== id);
    localStorage.setItem(this.KEYS.ORDERS, JSON.stringify(orders));
  },

  generateDocumentNumber(type = 'QTN') {
    const yr = new Date().getFullYear();
    const list = type === 'QTN' ? this.getQuotes() : this.getOrders();
    const count = list.length + 1;
    return `${type}-${yr}-${String(count).padStart(3, '0')}`;
  },

  exportAllDataJSON() {
    const payload = {
      version: '2.0.0',
      exportedAt: new Date().toISOString(),
      profile: this.getProfile(),
      settings: this.getSettings(),
      presets: JSON.parse(localStorage.getItem(this.KEYS.PRESETS) || '{}'),
      quotes: this.getQuotes(),
      orders: this.getOrders()
    };
    return JSON.stringify(payload, null, 2);
  },

  importDataJSON(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      if (data.profile) this.saveProfile(data.profile);
      if (data.settings) this.saveSettings(data.settings);
      if (data.presets) localStorage.setItem(this.KEYS.PRESETS, JSON.stringify(data.presets));
      if (data.quotes) localStorage.setItem(this.KEYS.QUOTES, JSON.stringify(data.quotes));
      if (data.orders) localStorage.setItem(this.KEYS.ORDERS, JSON.stringify(data.orders));
      return true;
    } catch (e) {
      return false;
    }
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = StorageEngine;
}
if (typeof window !== 'undefined') {
  window.StorageEngine = StorageEngine;
}
