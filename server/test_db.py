import sqlite3

def test_database():
    conn = sqlite3.connect('course_system.db')
    cursor = conn.cursor()
    
    # 测试用户表
    print("=== 用户表数据 ===")
    cursor.execute("SELECT * FROM users")
    users = cursor.fetchall()
    for user in users:
        print(f"ID: {user[0]}, 用户名: {user[1]}, 密码: {user[2]}, 角色: {user[3]}, 邮箱: {user[4]}, 电话: {user[5]}")
    
    # 测试课程表
    print("\n=== 课程表数据 ===")
    cursor.execute("SELECT * FROM courses")
    courses = cursor.fetchall()
    for course in courses:
        print(f"ID: {course[0]}, 课程名: {course[1]}, 学分: {course[2]}, 时间: {course[3]}, 地点: {course[4]}, 容量: {course[5]}")
    
    conn.close()

if __name__ == '__main__':
    test_database()