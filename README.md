# 🐔 CoopOS - Poultry Farm ERP

![Django](https://img.shields.io/badge/Django-092E20?style=for-the-badge&logo=django&logoColor=white)
![Django REST](https://img.shields.io/badge/DJANGO-REST-ff1709?style=for-the-badge&logo=django&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-323330?style=for-the-badge&logo=javascript&logoColor=F7DF1E)

**CoopOS** is a specialized Enterprise Resource Planning (ERP) application built to digitize and manage the lifecycle of commercial poultry farm batches. 

> **Live Demo:** https://Ahas.pythonanywhere.com/
---

## 📸 Application Walkthrough

*(Replace this section with a GIF or screenshots of your Dashboard, Login Screen, and Profit/Loss calculation)*

![Dashboard Screenshot](link_to_your_screenshot_here)

---

## 🏗️ Architecture & Technical Highlights

This project was built using an **API-First Architecture**, strictly decoupling the backend business logic from the frontend UI.

* **Backend:** Django & Django REST Framework (DRF)
* **Frontend:** Single Page Application (SPA) using Vanilla JS, HTML, and Tailwind CSS.
* **Database:** Migrated from local SQLite to a cloud **PostgreSQL** instance.
* **Authentication:** Implemented **Token-Based Authentication** (`rest_framework.authtoken`) for secure, stateless API communication. Tokens are managed via browser `localStorage` and custom HTTP interceptors.
* **Security:** Route guarding enforced on the frontend SPA; API endpoints locked globally via `IsAuthenticated` permissions.

---

## 🚀 Core Features

* **Batch Lifecycle Management:** Track batches from day 1 to sale, monitoring active chick counts.
* **Financial Engine:** Automated calculation of Profit/Loss, tracking Batch Expenses (feed, medicine) vs. Batch Sales.
* **Mortality Tracking:** Daily logging of mortality rates to calculate flock survivability percentages dynamically.
* **Infrastructure Expenses:** Global tracking of non-batch specific overhead (electricity, maintenance).
* **Token Authentication:** Secure login/logout flows blocking unauthorized data access.

---

## ⚙️ Local Setup & Installation

**1. Clone the repository**
```bash
git clone https://github.com/ahasraajvv/Coop_OS.git
cd Coop_OS
```

**2. Set up the virtual environment**
```bash
python -m venv venv
source venv/Scripts/activate  # On Windows
```

**3. Install dependencies**
```bash
pip install -r requirements.txt
```

**4. Run Migrations & Setup Database**
```bash
python manage.py migrate
python setup_db.py  # Automatically provisions the admin user
```

**5. Start the Server**
```bash
python manage.py runserver
```
