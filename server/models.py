# 数据模型定义
class User:
    def __init__(self, id, username, password, role, email=None, phone=None):
        self.id = id
        self.username = username
        self.password = password
        self.role = role  # 'student' 或 'admin'
        self.email = email
        self.phone = phone

class Course:
    def __init__(self, id, title, credits, time, location, capacity, instructor, status='open'):
        self.id = id
        self.title = title
        self.credits = credits
        self.time = time
        self.location = location
        self.capacity = capacity
        self.current_enrollment = 0
        self.instructor = instructor
        self.status = status  # 'open', 'closed', 'cancelled'

class Enrollment:
    def __init__(self, id, student_id, course_id, status='pending'):
        self.id = id
        self.student_id = student_id
        self.course_id = course_id
        self.status = status  # 'pending', 'confirmed', 'rejected'