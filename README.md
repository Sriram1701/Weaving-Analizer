# TEXTILE WEAVING ANALYZER
> **Smart Costing. Accurate Weaving.**

A precision, professional mobile application & Android APK engineered for textile manufacturers, powerloom owners, weaving mills, and fabric traders. Matches mill calculations and Excel costing sheets down to 3 decimal places.

---

## 🌟 Brand Identity
- **App Name:** TEXTILE WEAVING ANALYZER
- **Tagline:** Smart Costing. Accurate Weaving.
- **Palette:** Navy Blue (`#16324F`), Emerald Green (`#159765`), White (`#FFFFFF`), Light Background (`#F4F7FA`), Dark Text (`#17212F`), Muted Grey (`#667085`).
- **Logo:** Interwoven warp and weft threads vector lattice emblem.

---

## 🚀 Key Modules & Architecture

### 1. Mathematical Calculation Engine (`engine/weavingCalc.js`)
- **Total Ends:** $\text{EPI} \times \text{Width}$
- **Reed Space:** $\text{Width} + (\text{Width} \times \text{Weft Crimp \%}) + 2$
- **Warp Grams/Mtr:** $[((\text{Total Ends} \times 0.00059) / \text{Warp Count}) / ((100 - \text{Warp Crimp \%}) / 100)] \times 1000$
- **Weft Grams/Mtr:** $[((\text{Reed Space} \times \text{PPI} \times \text{Weft Insert}) / 1693.65) / \text{Weft Count}] \times 1000$
- **Technical Metrics:** GLM (g/m), GSM ($\text{g/m}^2$), and Rate per Yard ($₹/\text{yd}$).

### 2. Commercial Fabric Costing Engine
- Warp & Weft Yarn Values per meter
- Sizing Cost per meter
- Pick Cost per meter
- Transport & Value Loss allocations
- Profit percentage and Final Ex-Mill Party Rate

### 3. Yarn Procurement Planner
- Computes exact Warp & Weft yarn weights in Kilograms and Bags (60 kg standard bags)
- Wastage allowance adjustment
- Total production order cost and invoicing value

### 4. Commercial GST Invoice & Quotation Generator (`engine/gstEngine.js`)
- Formal Commercial Quotation & GST Tax Invoice switcher
- Intra-state (CGST + SGST) vs Inter-state (IGST) tax calculation
- Indian currency amount in words converter (Lakhs & Crores)
- Printable A4 layout with print stylesheets
- 1-Click customer-facing WhatsApp direct sharing

### 5. Repository & Data Persistence (`engine/storage.js`)
- LocalStorage persistence with backward compatible migration
- Preset library (Poplin 54", Sheeting 66", Cambric 58", Grey Sheeting 63", Twill 58" + Custom presets)
- Saved Quotes and Order History with CSV export & JSON backup/restore
- Company Profile Manager

---

## 📱 Android APK & Building

The signed Android application package is ready in the repository:
- **`Textile_Weaving_Analyzer.apk`** (~27.85 MB)
- Supports Android 7.0 (Nougat, API 24) through Android 16 (API 36)
- Signed using v2 and v3 APK Signature Schemes

### To Rebuild the Android APK:
```powershell
powershell -ExecutionPolicy Bypass -File make_apk.ps1
```

### To Run Locally in Browser:
```bash
node server.js
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Automated Regression Tests:
```bash
node test/regressionTest.js
```
All 38 test suites pass, verifying Excel formula parity down to 3 decimal places.
