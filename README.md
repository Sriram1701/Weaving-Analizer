# Naganathan - Weaving Analyzer & Fabric Costing

A precision mobile-first Web Application & Android APK for textile fabric costing and weaving parameter calculations. Engineered to match mill calculations and Excel costing sheets down to 3 decimal places.

## 🚀 Key Features

- **Mathematical Calculation Engine:**
  - Warp & Weft Yarn Grams per Metre
  - Total Ends & Reed Space estimation
  - Sizing & Pick Costing
  - Transportation, Value Loss & Mill Profit
  - Final Ex-Mill Party Rate per Metre & per Yard
- **Quick Qualities Swiping Bar:**
  - One-tap quick presets: *40\*40 54" Plain*, *40\*40 66" Sheeting*, *60\*60 58" Cambric*, *30\*30 63" Grey*, *20\*20 58" Twill*
  - Add & save custom qualities on the fly
- **☰ Slide-out Features Menu:**
  - **Company / Sender Profile Manager:** Customize Mill name, phone, GSTIN, and terms
  - **Commercial A4 Invoice & Quotation:** Generate formal printable invoice with GST and signatory
  - **Order Yarn Procurement Tool:** Automatically compute warp/weft requirements in Bags and Kilograms
  - **Quote History & CSV Export:** Save past costings locally on your device and export to spreadsheet
- **1-Click WhatsApp Direct Share:**
  - Instantly shares clean customer-facing fabric specification & party rate without exposing internal production margins
- **100% Offline & PWA Ready:**
  - Runs in any modern browser, mobile device, or natively via Android APK

## 📱 Android APK

The pre-built, signed Android application package is included in this repository:
- **`Naganathan_Weaving_Analyzer.apk`** (~27.8 MB)
- Supports Android 7.0 (Nougat) through Android 15+

### Build from Source
To rebuild the Android APK locally:
```powershell
powershell -ExecutionPolicy Bypass -File make_apk.ps1
```

## 💻 Local Web Server
To run locally:
```bash
node server.js
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---
Developed for **Naganathan Weaving Mills**.
