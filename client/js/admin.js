// Admin page JavaScript

document.addEventListener('DOMContentLoaded', function() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || user.role !== 'admin') {
        window.location.href = 'index.html';
        return;
    }
    
    // Set user information
    document.getElementById('user-name').textContent = user.username;
    
    // Global variable to store course data
    let currentCourses = [];
    
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
            
            // Also hide edit course section (unless in edit mode)
            document.getElementById('edit-course-section').style.display = 'none';
            
            document.getElementById(`${target}-section`).style.display = 'block';
            
            // Load corresponding content
            if (target === 'courses') {
                loadCourses();
            } else if (target === 'enrollments') {
                loadEnrollments();
            } else if (target === 'add-course') {
                // Reset add course form
                document.getElementById('add-course-form').reset();
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
            currentCourses = courses; // Store course data
            
            const coursesList = document.getElementById('courses-list');
            coursesList.innerHTML = '';
            
            courses.forEach(course => {
                const courseCard = document.createElement('div');
                courseCard.className = 'course-card';
                
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
                        <p><strong>Status:</strong> ${course.status === 'open' ? 'Open' : 'Closed'}</p>
                    </div>
                    <div class="button-group">
                        <button class="btn btn-primary edit-btn" data-course-id="${course.id}">Edit</button>
                        <button class="btn btn-danger delete-btn" data-course-id="${course.id}">Delete</button>
                    </div>
                `;
                
                coursesList.appendChild(courseCard);
            });
            
            // Add edit event listeners
            document.querySelectorAll('.edit-btn').forEach(button => {
                button.addEventListener('click', function() {
                    const courseId = this.getAttribute('data-course-id');
                    editCourse(courseId);
                });
            });
            
            // Add delete event listeners
            document.querySelectorAll('.delete-btn').forEach(button => {
                button.addEventListener('click', function() {
                    const courseId = this.getAttribute('data-course-id');
                    deleteCourse(courseId);
                });
            });
        })
        .catch(error => {
            console.error('Error loading courses:', error);
            alert('Failed to load courses, please try again later');
        });
    }
    
    // Edit course function
    function editCourse(courseId) {
        // Find course data from current course list
        const course = currentCourses.find(c => c.id == courseId);
        if (course) {
            // Populate edit form
            document.getElementById('edit-course-id').value = course.id;
            document.getElementById('edit-course-title').value = course.title;
            document.getElementById('edit-course-credits').value = course.credits;
            document.getElementById('edit-course-time').value = course.time;
            document.getElementById('edit-course-location').value = course.location;
            document.getElementById('edit-course-capacity').value = course.capacity;
            document.getElementById('edit-course-instructor').value = course.instructor;
            
            // Hide other sections, show edit form
            contentSections.forEach(section => {
                section.style.display = 'none';
            });
            document.getElementById('edit-course-section').style.display = 'block';
            
            // Update navigation state
            navLinks.forEach(link => link.classList.remove('active'));
        } else {
            alert('Course data not found');
        }
    }
    
    // Edit course form submission
    document.getElementById('edit-course-form').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const courseId = document.getElementById('edit-course-id').value;
        const formData = {
            title: document.getElementById('edit-course-title').value,
            credits: parseInt(document.getElementById('edit-course-credits').value),
            time: document.getElementById('edit-course-time').value,
            location: document.getElementById('edit-course-location').value,
            capacity: parseInt(document.getElementById('edit-course-capacity').value),
            instructor: document.getElementById('edit-course-instructor').value
        };
        
        fetch(`http://localhost:5000/api/courses/${courseId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(formData)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                alert('Course updated successfully');
                // Return to course management page
                document.querySelector('[data-target="courses"]').click();
                // Reload course list
                loadCourses();
            } else {
                alert('Update failed: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('An error occurred during update, please try again later');
        });
    });
    
    // Cancel edit
    document.getElementById('cancel-edit-btn').addEventListener('click', function() {
        // Return to course management page
        document.querySelector('[data-target="courses"]').click();
    });
    
    // Delete course
    function deleteCourse(courseId) {
        if (!confirm('Are you sure you want to delete this course?')) {
            return;
        }
        
        fetch(`http://localhost:5000/api/courses/${courseId}`, {
            method: 'DELETE',
            credentials: 'include'
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                alert('Course deleted successfully');
                loadCourses(); // Reload course list
            } else {
                alert('Deletion failed: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('An error occurred during deletion, please try again later');
        });
    }
    
    // Load enrollments
    function loadEnrollments() {
        fetch('http://localhost:5000/api/enrollments', {
            credentials: 'include'
        })
        .then(response => response.json())
        .then(enrollments => {
            console.log('Admin enrollments data:', enrollments);
            const enrollmentsList = document.getElementById('enrollments-list');
            enrollmentsList.innerHTML = '';
            
            if (enrollments.length === 0) {
                enrollmentsList.innerHTML = '<p>No enrollment records found.</p>';
                return;
            }
            
            enrollments.forEach(enrollment => {
                const enrollmentCard = document.createElement('div');
                enrollmentCard.className = 'enrollment-card';
                
                enrollmentCard.innerHTML = `
                    <h3>${enrollment.title} - ${enrollment.username}</h3>
                    <div class="enrollment-info">
                        <p><strong>Status:</strong> 
                            <span class="status ${enrollment.status}">${getStatusText(enrollment.status)}</span>
                        </p>
                    </div>
                    <div class="button-group">
                        <button class="btn btn-success confirm-btn" data-enrollment-id="${enrollment.id}">Approve</button>
                        <button class="btn btn-warning reject-btn" data-enrollment-id="${enrollment.id}">Reject</button>
                    </div>
                `;
                
                enrollmentsList.appendChild(enrollmentCard);
            });
            
            // Add review event listeners
            document.querySelectorAll('.confirm-btn').forEach(button => {
                button.addEventListener('click', function() {
                    const enrollmentId = this.getAttribute('data-enrollment-id');
                    updateEnrollmentStatus(enrollmentId, 'confirmed');
                });
            });
            
            document.querySelectorAll('.reject-btn').forEach(button => {
                button.addEventListener('click', function() {
                    const enrollmentId = this.getAttribute('data-enrollment-id');
                    updateEnrollmentStatus(enrollmentId, 'rejected');
                });
            });
        })
        .catch(error => {
            console.error('Error loading enrollments:', error);
            alert('Failed to load enrollment records, please try again later');
        });
    }
    
    // Update enrollment status
    function updateEnrollmentStatus(enrollmentId, status) {
        fetch(`http://localhost:5000/api/enrollments/${enrollmentId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ status: status })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                alert('Status updated successfully');
                loadEnrollments(); // Reload enrollment records
            } else {
                alert('Update failed: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('An error occurred during update, please try again later');
        });
    }
    
    // Add course form submission
    document.getElementById('add-course-form').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formData = {
            title: document.getElementById('course-title').value,
            credits: parseInt(document.getElementById('course-credits').value),
            time: document.getElementById('course-time').value,
            location: document.getElementById('course-location').value,
            capacity: parseInt(document.getElementById('course-capacity').value),
            instructor: document.getElementById('course-instructor').value
        };
        
        fetch('http://localhost:5000/api/courses', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(formData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Course added successfully');
                this.reset();
                // Switch to course management page
                document.querySelector('[data-target="courses"]').click();
            } else {
                alert('Addition failed: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('An error occurred during addition, please try again later');
        });
    });
    
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