# CUHK(SZ) Course Selection System

A modern web-based course selection system with separate student and administrator interfaces.

## Quick Start

### Prerequisites
- Python 3.7+
- Web browser

### Installation & Running

```bash
# Backend
cd server && pip install -r requirements.txt
python -c "import database; database.init_db()"
python app.py

# Frontend (new terminal)
cd client && python -m http.server 8000
```
Visit http://localhost:8000 and use demo accounts::
- Admin: admin / admin123
- Student: student1 / student123

# Features
## For Students
Course browsing and enrollment

- Time conflict detection
- Enrollment status tracking
- Profile management

## For Administrators
- Course management (CRUD)
- Enrollment approval system
- Real-time statistics

# Tech Stack

- Backend: Python, Flask, SQLite
- Frontend: HTML, CSS, JavaScript
- Architecture: Client-Server with REST API

# Project Structure
```markdown
cuhk-course-selection-system/
├── server/                 # Backend Flask application
│   ├── app.py             # Main Flask application
│   ├── database.py        # Database initialization
│   └── requirements.txt   # Python dependencies
├── client/                # Frontend web application
│   ├── index.html         # Login page
│   ├── student.html       # Student interface
│   ├── admin.html         # Admin interface
│   ├── css/style.css      # Stylesheets
│   └── js/                # JavaScript files
└── README.md              # Project documentation
```
Developed for The Chinese University of Hong Kong, Shenzhen
