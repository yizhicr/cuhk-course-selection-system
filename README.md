# CUHK(SZ) Course Selection System

A modern web-based course selection system with separate student and administrator interfaces.

## Quick Start

```bash
# Backend
cd server && pip install -r requirements.txt
python -c "import database; database.init_db()"
python app.py

# Frontend (new terminal)
cd client && python -m http.server 8000

Visit http://localhost:8000 and use:
Admin: admin / admin123
Student: student1 / student123

# Features
## For Students
Course browsing and enrollment

Time conflict detection

Enrollment status tracking

Profile management

## For Administrators
Course management (CRUD)

Enrollment approval system

Real-time statistics

# Tech Stack

Backend: Python, Flask, SQLite

Frontend: HTML, CSS, JavaScript

Architecture: Client-Server with REST API

# Project Structure
```bash
├── server/          # Flask backend
├── client/          # Web frontend
└── README.md

Developed for The Chinese University of Hong Kong, Shenzhen