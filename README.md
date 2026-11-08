# 🐔 CoopOS — Commercial Poultry Farm ERP & CRM Workstation

![React](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS_v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Django](https://img.shields.io/badge/Django_6.1-092E20?style=for-the-badge&logo=django&logoColor=white)
![Django REST](https://img.shields.io/badge/DJANGO--REST-ff1709?style=for-the-badge&logo=django&logoColor=white)
![SQLite/PostgreSQL](https://img.shields.io/badge/PostgreSQL%20/%20SQLite-316192?style=for-the-badge&logo=postgresql&logoColor=white)

**CoopOS** is a commercial-grade Enterprise Resource Planning (ERP) and Customer Relationship Management (CRM) workstation built to digitize and manage the entire lifecycle of commercial poultry farm operations (broiler, layer, and country chicken).

> **Live Demo:** [https://Ahas.pythonanywhere.com/](https://Ahas.pythonanywhere.com/)

Redesigned as a full-screen laptop/desktop workstation optimized for 13"-16" laptop screens and external desktop monitors.

---

## 🏗️ Architecture & Technical Highlights

This project follows an **API-First Decoupled Architecture**:

* **Frontend:** Modern Single Page Application (SPA) built with **React 19**, **Vite**, **Tailwind CSS v4**, **Lucide Icons**, and **Recharts**.
* **Backend:** **Django 6.1** & **Django REST Framework (DRF)** with Token Authentication (`rest_framework.authtoken`).
* **Cross-Origin Security:** `django-cors-headers` configured for seamless local development and production serving.
* **Database:** SQLite for local instant development, plug-and-play PostgreSQL on cloud deployments via `dj-database-url`.
* **Localization:** Instant bilingual toggle between English and Tamil (தமிழ்).

---

## 🚀 Core Business & CRM Features

1. **Executive Workstation Dashboard:**
   - Real-time KPIs: Gross Sales Revenue (₹), Total Flock Outlay (₹), Net Profit / Loss (₹) with margin %, and Live Flock Population.
   - Interactive Recharts: Batch economics (Revenue vs Cost) and Recent Sales volume trends.
   - Real-time transaction feed and active flock status ledger.

2. **Flock Lifecycle & Batch ERP:**
   - Day-old chick acquisition tracking, mortality, sales, and remaining live birds.
   - Batch Financial Audit Drawer: In-depth P&L calculation, weekly sales breakdown, itemized feed expenses, and mortality logs.
   - Visual status indicators: *Profitable*, *In Loss*, *Active Flock*, *Completed*.

3. **Customer Relationship Management (CRM):**
   - Commercial buyer directory for hotels, wholesale meat traders, and retail buyers.
   - Real-time CRM Metrics: Total Orders count, Lifetime Spend (LTV), Total Birds Bought (Kg), and Last Purchase date.
   - Direct communication shortcuts (Phone Call, WhatsApp one-click chat, Email).
   - Itemized customer ledger and order history drawer.

4. **Commercial Sales & Orders Ledger:**
   - Multi-parameter live weighment calculator: Birds count (hens + roosters), live weight (kg), price/kg, and auto-computed total.
   - Flock inventory check: Verifies remaining live chicks before booking.
   - Printable Tax Invoice / Cash Memo modal with print/save PDF layout.
   - Instant CSV export for spreadsheet accounting.

5. **Operational & Infrastructure Expenses:**
   - Dual-tab classification: Direct Batch Expenses (Starter/Grower Feed, Vaccines, Bedding, Labor) vs Infrastructure Overhead (Electricity/EB, Water, Shed Maintenance).
   - Pre-populated commercial category presets.

6. **Flock Mortality & Health Biosecurity:**
   - Real-time survivability index meter (benchmark &gt; 95%).
   - Loss classification by diagnosed cause (Transport stress, Heatwave/Dehydration, Bacterial/Viral infection, Predator attack).
   - Horizontal bar chart of recurring causes for biosecurity audits.

7. **Financial Statements & Data Export Center:**
   - Complete Profit & Loss reconciliation statement.
   - Master CSV data export for Sales, Expenses, Customers, and Batches.

---

## ⚙️ Local Setup & Running

### 1. Clone & Setup Virtual Environment
```bash
git clone https://github.com/ahasraajvv/Coop_OS.git
cd Coop_OS

# Activate Python Virtual Environment
.\venv\Scripts\activate   # On Windows
# or source venv/bin/activate on Linux/Mac
```

### 2. Install Dependencies & Setup Admin User
```bash
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
```

### 3. Build & Run Frontend + Backend
**Option A — All-in-One via Django (Serves built React SPA at `http://127.0.0.1:8000/`):**
```bash
cd frontend
npm install
npm run build
cd ..
python manage.py runserver
```
Open [http://127.0.0.1:8000/](http://127.0.0.1:8000/) in your browser!

**Option B — Live Hot-Reload React Development Server:**
```bash
# Terminal 1: Backend
python manage.py runserver

# Terminal 2: Vite React Hot Reload
cd frontend
npm run dev
```
Open [http://localhost:5173/](http://localhost:5173/) (proxies `/api` directly to Django).

### 4. Running Automated Tests
```bash
python manage.py test
```
All unit tests verify batch validation, P&L calculations, mortality tracking, customer auto-id generation, and frontend rendering.
