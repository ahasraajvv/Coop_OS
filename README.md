# Coop_OS 🐔📊

A production-ready, full-stack farm management system designed specifically for country chicken (Naatu Kozhi) farming. Coop_OS tracks batch-wise financials, infrastructure expenses, and mortality rates to provide real-time profit/loss visibility and operational analytics.

## Tech Stack
* **Backend Framework:** Django (v6.1)
* **API Layer:** Django REST Framework (DRF)
* **Database:** SQLite (Configured for relational metrics)
* **Server & Deployment:** Gunicorn (WSGI) & WhiteNoise (Static file serving)

## 💡 Engineering & Architecture Highlights

This project was built to solve a real-world business problem and goes beyond basic CRUD operations by implementing advanced Django and DB features:

* **Advanced DB Aggregation & Annotation:** 
  Instead of computationally expensive Python-level loops, the API utilizes Django's ORM (`Sum`, `Count`, `TruncWeek`) for heavy data lifting. For example, the `WeeklySales` endpoint dynamically groups time-series data at the database level to generate weekly revenue reports.
* **Financial Data Integrity:** 
  Uses strictly defined `DecimalField` types for all financial transactions (buying price, sales, infrastructure expenses) to prevent floating-point rounding errors native to `FloatField`.
* **Dynamic Serializer Switching:** 
  Implemented custom `get_serializer_class` logic in ViewSets (e.g., `BatchSaleViewSet`) to optimize data payloads. Uses simple relational IDs for `POST`/`PUT` requests, while automatically switching to deeply nested serializers for `GET` requests to reduce N+1 frontend queries.
* **Custom API Endpoints (RPC style in REST):** 
  Extensively utilizes DRF `@action` decorators to expose derived, computed data (e.g., `ProfitORLose`, `Mortality_Rate`, `BatchRevenue`) without cluttering standard REST routing.
* **Production-Ready Configuration:** 
  Configured with Gunicorn as the WSGI HTTP server and WhiteNoise for robust, self-contained static file delivery, prepping the application for immediate PaaS deployment (Render/Heroku).

## Core Features
* **Batch Lifecycle Management:** Track a batch of chicks from initial purchase date and price through to final sale.
* **Financial Analytics:** Real-time calculation of overall profit, loss, or break-even status based on aggregated sales, batch expenses, and initial capital.
* **Mortality Tracking:** Log death events with reasons, automatically calculating real-time mortality percentages and adjusting remaining inventory.
* **Customer & Sales Logging:** Relational tracking of customers and their specific batch purchases (by quantity and weight).

## Local Development Setup

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd Coop_OS
   ```
2. **Create and activate a virtual environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows use `venv\Scripts\activate`
   ```
3. **Install requirements:**
   ```bash
   pip install -r requirements.txt
   ```
4. **Run migrations:**
   ```bash
   python manage.py migrate
   ```
5. **(Optional) Seed Database:**
   ```bash
   python seed_test_data.py
   ```
6. **Start the development server:**
   ```bash
   python manage.py runserver
   ```
