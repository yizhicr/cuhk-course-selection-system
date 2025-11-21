// Student page JavaScript

document.addEventListener('DOMContentLoaded', function() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || user.role !== 'student') {
        window.location.href = 'index.html';
        return;
    }
    
    // Set user information
    document.getElementById('user-name').textContent = user.username;
    
    // Navigation switching
    const navLinks = document.querySelectorAll('.nav-link');
    const contentSections = document.querySelectorAll('.content-section');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Update active navigation link
            navLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');
            
            // Show corresponding content area
            const target = this.getAttribute('data-target');
            contentSections.forEach(section => {
                section.style.display = 'none';
            });
            document.getElementById(`${target}-section`).style.display = 'block';
            
            // Load corresponding content
            if (target === 'courses') {
                loadCourses();
            } else if (target === 'my-courses') {
                loadMyCourses();
            } else if (target === 'profile') {
                loadProfile();
            }
        });
    });
    
    // Load courses
    function loadCourses() {
        fetch('http://localhost:5000/api/courses', {
            credentials: 'include'
        })
        .then(response => response.json())
        .then(courses => {
            const coursesList = document.getElementById('courses-list');
            coursesList.innerHTML = '';
            
            courses.forEach(course => {
                const courseCard = document.createElement('div');
                courseCard.className = 'course-card';
                
                // Calculate total enrollment (confirmed + pending)
                const totalEnrollment = course.current_enrollment + course.pending_enrollment;
                const capacityClass = totalEnrollment >= course.capacity ? 'full' : 'available';
                
                courseCard.innerHTML = `
                    <h3>${course.title}</h3>
                    <div class="course-info">
                        <p><strong>Credits:</strong> ${course.credits}</p>
                        <p><strong>Time:</strong> ${course.time}</p>
                        <p><strong>Location:</strong> ${course.location}</p>
                        <p><strong>Instructor:</strong> ${course.instructor}</p>
                        <p class="capacity ${capacityClass}">
                            <strong>Expected Capacity:</strong> ${totalEnrollment}/${course.capacity}
                        </p>
                        <p><strong>Confirmed:</strong> ${course.current_enrollment} | <strong>Pending:</strong> ${course.pending_enrollment}</p>
                    </div>
                    <div class="button-group">
                        <button class="btn btn-primary enroll-btn" data-course-id="${course.id}" 
                                ${totalEnrollment >= course.capacity ? 'disabled' : ''}>
                            ${totalEnrollment >= course.capacity ? 'Full' : 'Enroll'}
                        </button>
                    </div>
                `;
                
                coursesList.appendChild(courseCard);
            });
            
            // Add enrollment event listeners
            document.querySelectorAll('.enroll-btn').forEach(button => {
                button.addEventListener('click', function() {
                    if (!this.disabled) {
                        const courseId = this.getAttribute('data-course-id');
                        enrollCourse(courseId);
                    }
                });
            });
        })
        .catch(error => {
            console.error('Error loading courses:', error);
            alert('Failed to load courses, please try again later');
        });
    }
    
    // Enroll in course
    function enrollCourse(courseId) {
        fetch('http://localhost:5000/api/enroll', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ course_id: parseInt(courseId) })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Enrollment successful: ' + data.message);
                loadCourses(); // Reload course list
                loadMyCourses(); // Update my courses list
            } else {
                alert('Enrollment failed: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('An error occurred during enrollment, please try again later');
        });
    }
    
    // Load my courses
    function loadMyCourses() {
        fetch('http://localhost:5000/api/enrollments', {
            credentials: 'include'
        })
        .then(response => {
            console.log('Response status:', response.status);
            return response.json();
        })
        .then(enrollments => {
            console.log('Raw enrollments data:', enrollments);
            
            // Check all fields of the first enrollment record
            if (enrollments.length > 0) {
                console.log('First enrollment fields:');
                Object.keys(enrollments[0]).forEach(key => {
                    console.log(`  ${key}: ${enrollments[0][key]}`);
                });
            }
            
            const enrollmentsList = document.getElementById('enrollments-list');
            enrollmentsList.innerHTML = '';
            
            if (enrollments.length === 0) {
                enrollmentsList.innerHTML = '<p>You have not enrolled in any courses yet.</p>';
                return;
            }
            
            enrollments.forEach(enrollment => {
                console.log('Processing enrollment:', enrollment);
                
                const enrollmentCard = document.createElement('div');
                enrollmentCard.className = 'enrollment-card';
                
                // Ensure all fields have values, display "Unknown" if undefined
                const title = enrollment.title || 'Unknown Course';
                const credits = enrollment.credits !== undefined ? enrollment.credits : 'Unknown';
                const time = enrollment.time || 'Unknown Time';
                const location = enrollment.location || 'Unknown Location';
                const instructor = enrollment.instructor || 'Unknown Instructor';
                const status = enrollment.status || 'pending';
                
                enrollmentCard.innerHTML = `
                    <h3>${title}</h3>
                    <div class="enrollment-info">
                        <p><strong>Credits:</strong> ${credits}</p>
                        <p><strong>Time:</strong> ${time}</p>
                        <p><strong>Location:</strong> ${location}</p>
                        <p><strong>Instructor:</strong> ${instructor}</p>
                        <p><strong>Status:</strong> 
                            <span class="status ${status}">${getStatusText(status)}</span>
                        </p>
                    </div>
                    <div class="button-group">
                        <button class="btn btn-danger drop-btn" data-enrollment-id="${enrollment.id}">Drop Course</button>
                    </div>
                `;
                
                enrollmentsList.appendChild(enrollmentCard);
            });
            
            // Add drop course event listeners
            document.querySelectorAll('.drop-btn').forEach(button => {
                button.addEventListener('click', function() {
                    const enrollmentId = this.getAttribute('data-enrollment-id');
                    dropCourse(enrollmentId);
                });
            });
        })
        .catch(error => {
            console.error('Error loading enrollments:', error);
            alert('Failed to load enrollment records, please try again later');
        });
    }
    
    // Drop course
    function dropCourse(enrollmentId) {
        if (!confirm('Are you sure you want to drop this course?')) {
            return;
        }
        
        fetch(`http://localhost:5000/api/enrollments/${enrollmentId}`, {
            method: 'DELETE',
            credentials: 'include'
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Course dropped successfully: ' + data.message);
                loadCourses(); // Reload course list
                loadMyCourses(); // Update my courses list
            } else {
                alert('Failed to drop course: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('An error occurred while dropping the course, please try again later');
        });
    }
    
    // Load profile
    function loadProfile() {
        document.getElementById('profile-username').value = user.username;
        document.getElementById('profile-email').value = user.email || '';
        document.getElementById('profile-phone').value = user.phone || '';
        
        // Profile form submission
        document.getElementById('profile-form').addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = {
                email: document.getElementById('profile-email').value,
                phone: document.getElementById('profile-phone').value
            };
            
            fetch('http://localhost:5000/api/user/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(formData)
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert('Profile updated successfully');
                    // Update locally stored user information
                    user.email = formData.email;
                    user.phone = formData.phone;
                    localStorage.setItem('user', JSON.stringify(user));
                } else {
                    alert('Update failed: ' + data.message);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('An error occurred during update, please try again later');
            });
        });
    }
    
    // Logout
    document.getElementById('logout-btn').addEventListener('click', function() {
        fetch('http://localhost:5000/api/logout', {
            method: 'POST',
            credentials: 'include'
        })
        .then(() => {
            localStorage.removeItem('user');
            window.location.href = 'index.html';
        })
        .catch(error => {
            console.error('Error:', error);
            localStorage.removeItem('user');
            window.location.href = 'index.html';
        });
    });
    
    // Status text conversion
    function getStatusText(status) {
        const statusMap = {
            'pending': 'Pending',
            'confirmed': 'Confirmed',
            'rejected': 'Rejected'
        };
        return statusMap[status] || status;
    }
    
    // Initially load course list
    loadCourses();
});