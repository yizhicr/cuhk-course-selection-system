import sqlite3
import os

def migrate_database():
    """Migrate database, add new fields"""
    conn = sqlite3.connect('course_system.db')
    cursor = conn.cursor()
    
    # Check if pending_enrollment field already exists
    cursor.execute("PRAGMA table_info(courses)")
    columns = [column[1] for column in cursor.fetchall()]
    
    if 'pending_enrollment' not in columns:
        print("Adding pending_enrollment field to courses table")
        cursor.execute('ALTER TABLE courses ADD COLUMN pending_enrollment INTEGER DEFAULT 0')
        
        # Initialize pending_enrollment values
        cursor.execute('UPDATE courses SET pending_enrollment = 0')
        
        # Recalculate current enrollment and pending enrollment
        cursor.execute('''
            UPDATE courses 
            SET current_enrollment = (
                SELECT COUNT(*) 
                FROM enrollments 
                WHERE enrollments.course_id = courses.id AND enrollments.status = 'confirmed'
            ),
            pending_enrollment = (
                SELECT COUNT(*) 
                FROM enrollments 
                WHERE enrollments.course_id = courses.id AND enrollments.status = 'pending'
            )
        ''')
        
        conn.commit()
        print("Database migration completed")
    else:
        print("Database is already up to date, no migration needed")
    
    conn.close()

if __name__ == '__main__':
    migrate_database()