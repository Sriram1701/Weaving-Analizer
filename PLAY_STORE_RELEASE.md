# Google Play Store Release Documentation

**Application Name:** Textile Weaving Analyzer  
**Tagline:** Smart Costing. Accurate Weaving.  
**Package ID:** `com.htmltoapk.nathanweaving`  
**Category:** Business / Productivity / Tools  
**Release Artifact:** `Textile_Weaving_Analyzer.apk` (~27.85 MB)  
**Target SDK:** 36 (Android 16 / Latest Google Play Compliance)  
**Min SDK:** 24 (Android 7.0 Nougat+)  

---

## 1. Google Play Store Listing Copy

### App Title (Max 30 chars)
```
Textile Weaving Analyzer
```

### Short Description (Max 80 chars)
```
Smart textile fabric costing, weaving calculations, yarn bags & GST invoicing.
```

### Full Description (Up to 4,000 chars)
```
Textile Weaving Analyzer — Smart Costing. Accurate Weaving.

Designed specifically for textile manufacturers, powerloom owners, weaving mills, fabric traders, and textile engineers. Textile Weaving Analyzer transforms complex mill calculations and spreadsheet costing sheets into an instant, precision mobile tool.

Engineered to match real-world mill formulas and Excel costing models down to 3 decimal places.

🚀 KEY FEATURES & CAPABILITIES

1. Precision Weaving Calculation Engine
• Total Number of Ends estimation
• Reed Space calculation based on fabric width & weft crimp
• Warp Grams per Linear Meter (g/m)
• Weft Grams per Linear Meter (g/m)
• Total Fabric Linear Weight (GLM)
• Fabric Weight (GSM in g/m²)
• Party Rate per Meter & Equivalent Rate per Yard

2. Complete Commercial Fabric Costing
• Warp & Weft Yarn Value breakdown
• Sizing Cost calculation based on warp weight
• Pick Costing based on PPI and pick rate
• Transport, Checking, and Handling charges
• Value Loss per kg allocation
• Mill Profit margin percentage
• Ex-Mill Party Rate per meter

3. Yarn Procurement Planner (Bags & Kilograms)
• Calculates exact Warp & Weft yarn requirements
• Converts yarn requirement into Kilograms and standard Yarn Bags (e.g., 60 kg bags)
• Customizable wastage allowance %
• Computes total order production cost and order invoicing value

4. Commercial GST Invoice & Quotation Generator
• Generate formal printable A4 Commercial Quotations & Tax Invoices
• Automatic Indian GST tax breakdown (CGST + SGST for intra-state, IGST for inter-state)
• Automatic Number-to-Words converter in Indian numbering format (Lakhs & Crores)
• Standard HSN 5208 fabric classification
• 1-Click direct WhatsApp share of customer-facing quotations without exposing internal mill margins

5. 1-Tap Quick Quality Presets
• Poplin (40*40 / 92*88 - 54" Plain)
• Sheeting (40*40 / 100*92 - 66" Sheeting)
• Cambric (60*60 / 92*88 - 58" Plain)
• Grey Sheeting (30*30 / 68*68 - 63" Grey)
• Heavy Twill (20*20 / 108*56 - 58" Twill 2/1)
• Save your own custom qualities on the fly

6. Offline & Data Privacy First
• 100% offline capability — works in mills and remote weaving clusters without internet
• All quotes and presets remain securely stored on your device
• One-click CSV export and JSON backup/restore

Built for professionals in Surat, Erode, Tirupur, Bhiwandi, Ichalkaranji, Salem, Coimbatore, Ahmedabad, and textile hubs worldwide.
```

---

## 2. Play Store Visual Assets & Specifications

| Asset | Dimensions | Format | Status |
| :--- | :--- | :--- | :--- |
| **App Icon** | 512 × 512 px | 32-bit PNG / SVG | Provided (`logo.svg`, vector icon) |
| **Feature Graphic** | 1024 × 500 px | PNG / JPEG | Matches promotional brand card |
| **Phone Screenshots** | Min 2, Max 8 (1080 × 1920 or 1080 × 2400) | JPEG / 24-bit PNG | 6 major screens documented |

---

## 3. Data Safety & Privacy Declarations

- **Data Collected:** None. The application stores company profiles, quotes, and presets locally on the device using HTML5 LocalStorage.
- **Data Shared:** None. Data is never transmitted to external third-party servers.
- **Network Permissions:** `android.permission.INTERNET` (used strictly for web view asset rendering and standard outbound WhatsApp sharing intent).
- **Target Audience:** 18+ (Business / Commercial).

---

## 4. How to Build & Sign Future Releases

To rebuild and sign the APK:
```powershell
powershell -ExecutionPolicy Bypass -File make_apk.ps1
```
Output verified artifacts:
- `Textile_Weaving_Analyzer.apk`
- `Naganathan_Weaving_Analyzer.apk` (backward compatible mirror)
