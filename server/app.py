from flask import Flask, request, jsonify, session
from flask_cors import CORS
import database
import sqlite3
import os
import migrate_db

app = Flask(__name__)
app.secret_key = 'cuhk_course_system_secret_key_2025'

# CORS configuration
CORS(app, 
     supports_credentials=True,
     origins=['http://localhost:8000', 'http://127.0.0.1:8000'],
     methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
     allow_headers=['Content-Type', 'Authorization'])

# Check if database exists, if not initialize it
if not os.path.exists('course_system.db'):
    print("Database file does not exist, initializing...")
    database.init_db()
else:
    print("Database file exists, running migration script...")
    migrate_db.migrate_database()

# User authentication related APIs
@app.route('/api/login', methods=['POST', 'OPTIONS'])
def login():
    if request.method == 'OPTIONS':
        return jsonify({'status': 'ok'}), 200
    
    data = request.get_json()
    if not data:
        return jsonify({'success': False, 'message': 'Invalid request data'}), 400
        
    username = data.get('username')
    password = data.get('password')
    
    print(f"Login attempt: {username}")
    
    conn = database.get_db_connection()
    user = conn.execute(
        'SELECT * FROM users WHERE username = ? AND password = ?', 
        (username, password)
    ).fetchone()
    conn.close()
    
    if user:
        session['user_id'] = user['id']
        session['username'] = user['username']
        session['role'] = user['role']
        
        print(f"Login successful: {user['username']} (role: {user['role']})")
        
        return jsonify({
            'success': True,
            'user': {
                'id': user['id'],
                'username': user['username'],
                'role': user['role'],
                'email': user['email'],
                'phone': user['phone']
            }
        })
    else:
        return jsonify({'success': False, 'message': 'Invalid username or password'})

@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    email = data.get('email')
    phone = data.get('phone')
    
    conn = database.get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            'INSERT INTO users (username, password, role, email, phone) VALUES (?, ?, "student", ?, ?)',
            (username, password, email, phone)
        )
        conn.commit()
        user_id = cursor.lastrowid
        conn.close()
        
        return jsonify({'success': True, 'message': 'Registration successful'})
    except sqlite3.IntegrityError:
        conn.close()
        return jsonify({'success': False, 'message': 'Username already exists'})

@app.route('/api/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'success': True})

@app.route('/api/db-status', methods=['GET'])
def db_status():
    conn = database.get_db_connection()
    
    # Get data count for each table
    user_count = conn.execute("SELECT COUNT(*) FROM users").fetchone()[0]
    course_count = conn.execute("SELECT COUNT(*) FROM courses").fetchone()[0]
    enrollment_count = conn.execute("SELECT COUNT(*) FROM enrollments").fetchone()[0]
    
    conn.close()
    
    return jsonify({
        'users': user_count,
        'courses': course_count,
        'enrollments': enrollment_count
    })

# Course related APIs
@app.route('/api/courses', methods=['GET'])
def get_courses():
    conn = database.get_db_connection()
    courses = conn.execute('SELECT * FROM courses').fetchall()
    conn.close()
    
    courses_list = []
    for course in courses:
        courses_list.append(dict(course))
    
    return jsonify(courses_list)

@app.route('/api/courses', methods=['POST'])
def add_course():
    if session.get('role') != 'admin':
        return jsonify({'success': False, 'message': 'Insufficient permissions'})
    
    data = request.get_json()
    conn = database.get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute(
        'INSERT INTO courses (title, credits, time, location, capacity, instructor) VALUES (?, ?, ?, ?, ?, ?)',
        (data['title'], data['credits'], data['time'], data['location'], data['capacity'], data['instructor'])
    )
    conn.commit()
    conn.close()
    
    return jsonify({'success': True, 'message': 'Course added successfully'})

@app.route('/api/courses/<int:course_id>', methods=['PUT', 'OPTIONS'])
def update_course(course_id):
    if request.method == 'OPTIONS':
        return jsonify({'status': 'ok'}), 200
    
    if session.get('role') != 'admin':
        return jsonify({'success': False, 'message': 'Insufficient permissions'})
    
    data = request.get_json()
    conn = database.get_db_connection()
    
    conn.execute(
        'UPDATE courses SET title=?, credits=?, time=?, location=?, capacity=?, instructor=? WHERE id=?',
        (data['title'], data['credits'], data['time'], data['location'], data['capacity'], data['instructor'], course_id)
    )
    conn.commit()
    conn.close()
    
    return jsonify({'success': True, 'message': 'Course updated successfully'})

@app.route('/api/courses/<int:course_id>', methods=['DELETE', 'OPTIONS'])
def delete_course(course_id):
    if request.method == 'OPTIONS':
        return jsonify({'status': 'ok'}), 200
    
    if session.get('role') != 'admin':
        return jsonify({'success': False, 'message': 'Insufficient permissions'})
    
    conn = database.get_db_connection()
    
    # Check if any students have enrolled in this course
    enrollments = conn.execute('SELECT * FROM enrollments WHERE course_id = ?', (course_id,)).fetchall()
    if enrollments:
        conn.close()
        return jsonify({'success': False, 'message': 'Cannot delete course with existing enrollments'})
    
    conn.execute('DELETE FROM courses WHERE id = ?', (course_id,))
    conn.commit()
    conn.close()
    
    return jsonify({'success': True, 'message': 'Course deleted successfully'})

# Enrollment related APIs
@app.route('/api/enrollments', methods=['GET'])
def get_enrollments():
    user_id = session.get('user_id')
    role = session.get('role')
    
    conn = database.get_db_connection()
    
    if role == 'student':
        # Students view their own enrollments
        enrollments = conn.execute('''
            SELECT e.*, c.title, c.credits, c.time, c.location, c.instructor 
            FROM enrollments e 
            JOIN courses c ON e.course_id = c.id 
            WHERE e.student_id = ?
        ''', (user_id,)).fetchall()
    else:
        # Admins view all enrollments
        enrollments = conn.execute('''
            SELECT e.*, u.username, c.title 
            FROM enrollments e 
            JOIN users u ON e.student_id = u.id 
            JOIN courses c ON e.course_id = c.id
        ''').fetchall()
    
    conn.close()
    
    enrollments_list = []
    for enrollment in enrollments:
        enrollments_list.append(dict(enrollment))
    
    return jsonify(enrollments_list)

@app.route('/api/enroll', methods=['POST'])
def enroll_course():
    if session.get('role') != 'student':
        return jsonify({'success': False, 'message': 'Only students can enroll in courses'})
    
    data = request.get_json()
    course_id = data.get('course_id')
    student_id = session.get('user_id')
    
    conn = database.get_db_connection()
    
    # Check if already enrolled in this course
    existing = conn.execute(
        'SELECT * FROM enrollments WHERE student_id = ? AND course_id = ?', 
        (student_id, course_id)
    ).fetchone()
    
    if existing:
        conn.close()
        return jsonify({'success': False, 'message': 'You have already enrolled in this course'})
    
    # Check course capacity (including confirmed and pending enrollments)
    course = conn.execute('SELECT * FROM courses WHERE id = ?', (course_id,)).fetchone()
    total_enrollment = course['current_enrollment'] + course['pending_enrollment']
    if total_enrollment >= course['capacity']:
        conn.close()
        return jsonify({'success': False, 'message': 'Course is full'})
    
    # Check for time conflicts
    student_courses = conn.execute('''
        SELECT c.time FROM enrollments e 
        JOIN courses c ON e.course_id = c.id 
        WHERE e.student_id = ? AND e.status IN ("pending", "confirmed")
    ''', (student_id,)).fetchall()
    
    new_course_time = course['time']
    for sc in student_courses:
        if sc['time'] == new_course_time:
            conn.close()
            return jsonify({'success': False, 'message': 'Time conflict with existing course'})
    
    # Add enrollment record
    conn.execute(
        'INSERT INTO enrollments (student_id, course_id, status) VALUES (?, ?, "pending")',
        (student_id, course_id)
    )
    
    # Update course pending enrollment count (not current enrollment)
    conn.execute(
        'UPDATE courses SET pending_enrollment = pending_enrollment + 1 WHERE id = ?',
        (course_id,)
    )
    
    conn.commit()
    conn.close()
    
    return jsonify({'success': True, 'message': 'Enrollment successful, waiting for approval'})

@app.route('/api/enrollments/<int:enrollment_id>', methods=['DELETE'])
def drop_course(enrollment_id):
    if session.get('role') != 'student':
        return jsonify({'success': False, 'message': 'Insufficient permissions'})
    
    student_id = session.get('user_id')
    
    conn = database.get_db_connection()
    
    enrollment = conn.execute(
        'SELECT * FROM enrollments WHERE id = ? AND student_id = ?', 
        (enrollment_id, student_id)
    ).fetchone()
    
    if not enrollment:
        conn.close()
        return jsonify({'success': False, 'message': 'Enrollment record not found'})
    
    # Update different fields based on enrollment status
    if enrollment['status'] == 'confirmed':
        # Delete confirmed enrollment, decrease current enrollment
        conn.execute(
            'UPDATE courses SET current_enrollment = current_enrollment - 1 WHERE id = ?',
            (enrollment['course_id'],)
        )
    elif enrollment['status'] == 'pending':
        # Delete pending enrollment, decrease pending enrollment
        conn.execute(
            'UPDATE courses SET pending_enrollment = pending_enrollment - 1 WHERE id = ?',
            (enrollment['course_id'],)
        )
    
    # Delete enrollment record
    conn.execute('DELETE FROM enrollments WHERE id = ?', (enrollment_id,))
    
    conn.commit()
    conn.close()
    
    return jsonify({'success': True, 'message': 'Course dropped successfully'})

@app.route('/api/enrollments/<int:enrollment_id>/status', methods=['PUT', 'OPTIONS'])
def update_enrollment_status(enrollment_id):
    if request.method == 'OPTIONS':
        return jsonify({'status': 'ok'}), 200
    
    if session.get('role') != 'admin':
        return jsonify({'success': False, 'message': 'Insufficient permissions'})
    
    data = request.get_json()
    new_status = data.get('status')
    
    conn = database.get_db_connection()
    
    # Get enrollment record and course information
    enrollment = conn.execute(
        'SELECT * FROM enrollments WHERE id = ?', 
        (enrollment_id,)
    ).fetchone()
    
    if not enrollment:
        conn.close()
        return jsonify({'success': False, 'message': 'Enrollment record not found'})
    
    course_id = enrollment['course_id']
    old_status = enrollment['status']
    
    # Update enrollment status
    conn.execute(
        'UPDATE enrollments SET status = ? WHERE id = ?',
        (new_status, enrollment_id)
    )
    
    # Update course enrollment counts based on status change
    if old_status == 'pending' and new_status == 'confirmed':
        # From pending to confirmed: decrease pending count, increase current count
        conn.execute(
            'UPDATE courses SET pending_enrollment = pending_enrollment - 1, current_enrollment = current_enrollment + 1 WHERE id = ?',
            (course_id,)
        )
    elif old_status == 'confirmed' and new_status == 'pending':
        # From confirmed to pending: decrease current count, increase pending count
        conn.execute(
            'UPDATE courses SET current_enrollment = current_enrollment - 1, pending_enrollment = pending_enrollment + 1 WHERE id = ?',
            (course_id,)
        )
    elif old_status == 'pending' and new_status == 'rejected':
        # From pending to rejected: only decrease pending count
        conn.execute(
            'UPDATE courses SET pending_enrollment = pending_enrollment - 1 WHERE id = ?',
            (course_id,)
        )
    elif old_status == 'confirmed' and new_status == 'rejected':
        # From confirmed to rejected: decrease current count
        conn.execute(
            'UPDATE courses SET current_enrollment = current_enrollment - 1 WHERE id = ?',
            (course_id,)
        )
    
    conn.commit()
    conn.close()
    
    return jsonify({'success': True, 'message': 'Status updated successfully'})

@app.route('/api/user/profile', methods=['PUT'])
def update_profile():
    user_id = session.get('user_id')
    data = request.get_json()
    
    conn = database.get_db_connection()
    
    conn.execute(
        'UPDATE users SET email = ?, phone = ? WHERE id = ?',
        (data.get('email'), data.get('phone'), user_id)
    )
    
    conn.commit()
    conn.close()
    
    return jsonify({'success': True, 'message': 'Profile updated successfully'})

if __name__ == '__main__':
    app.run(debug=True, port=5000, host='0.0.0.0')