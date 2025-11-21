import sqlite3
import os

def init_db():
    """Initialize database and tables"""
    conn = sqlite3.connect('course_system.db')
    cursor = conn.cursor()
    
    # Create users table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT NOT NULL,
            email TEXT,
            phone TEXT
        )
    ''')
    
    # Create courses table - with pending_enrollment field
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS courses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            credits INTEGER NOT NULL,
            time TEXT NOT NULL,
            location TEXT NOT NULL,
            capacity INTEGER NOT NULL,
            current_enrollment INTEGER DEFAULT 0,
            pending_enrollment INTEGER DEFAULT 0,  -- New field: pending enrollment count
            instructor TEXT NOT NULL,
            status TEXT DEFAULT 'open'
        )
    ''')
    
    # Create enrollments table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS enrollments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_id INTEGER NOT NULL,
            course_id INTEGER NOT NULL,
            status TEXT DEFAULT 'pending',
            FOREIGN KEY (student_id) REFERENCES users (id),
            FOREIGN KEY (course_id) REFERENCES courses (id)
        )
    ''')
    
    # Check if data already exists to avoid duplicate insertion
    cursor.execute("SELECT COUNT(*) FROM users")
    user_count = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM courses")
    course_count = cursor.fetchone()[0]
    
    # Only insert initial data if tables are empty
    if user_count == 0:
        # Insert initial user data
        cursor.execute("INSERT OR IGNORE INTO users (username, password, role) VALUES ('admin', 'admin123', 'admin')")
        cursor.execute("INSERT OR IGNORE INTO users (username, password, role, email) VALUES ('student1', 'student123', 'student', 'student1@cuhk.edu.cn')")
        print("Initial user data inserted")
    
    if course_count == 0:
        # Insert sample courses in English
        cursor.execute('''
            INSERT OR IGNORE INTO courses (title, credits, time, location, capacity, instructor) 
            VALUES 
            ('Introduction to Computer Science', 3, 'Monday 9:00-11:00', 'Dao Yuan Building 101', 50, 'Professor Zhang'),
            ('Data Structures and Algorithms', 4, 'Tuesday 14:00-16:00', 'Zhi Xin Building 201', 40, 'Professor Li'),
            ('Database Systems', 3, 'Wednesday 10:00-12:00', 'Science Building 301', 45, 'Professor Wang'),
            ('Introduction to Artificial Intelligence', 3, 'Thursday 15:00-17:00', 'Dao Yuan Building 102', 35, 'Professor Chen')
        ''')
        print("Initial course data inserted")
    
    conn.commit()
    conn.close()
    print("Database initialization completed")

def get_db_connection():
    """Get database connection"""
    conn = sqlite3.connect('course_system.db')
    conn.row_factory = sqlite3.Row  # This allows us to access data by column name
    return conn