// Main JavaScript file - Handles login and registration

document.addEventListener('DOMContentLoaded', function() {
    const loginSection = document.getElementById('login-section');
    const registerSection = document.getElementById('register-section');
    const showRegisterLink = document.getElementById('show-register');
    const showLoginLink = document.getElementById('show-login');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    
    // Toggle between login and registration forms
    showRegisterLink.addEventListener('click', function(e) {
        e.preventDefault();
        loginSection.style.display = 'none';
        registerSection.style.display = 'block';
    });
    
    showLoginLink.addEventListener('click', function(e) {
        e.preventDefault();
        registerSection.style.display = 'none';
        loginSection.style.display = 'block';
    });
    
    // Handle login form submission
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formData = {
            username: document.getElementById('username').value,
            password: document.getElementById('password').value
        };
        
        console.log('Sending login request:', formData);
        
        fetch('http://localhost:5000/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(formData)
        })
        .then(response => {
            console.log('Response status:', response.status);
            return response.json();
        })
        .then(data => {
            console.log('Login response:', data);
            if (data.success) {
                // Login successful, redirect based on user role
                localStorage.setItem('user', JSON.stringify(data.user));
                if (data.user.role === 'student') {
                    window.location.href = 'student.html';
                } else if (data.user.role === 'admin') {
                    window.location.href = 'admin.html';
                }
            } else {
                alert('Login failed: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('An error occurred during login, please try again later');
        });
    });
    
    // Handle registration form submission
    registerForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formData = {
            username: document.getElementById('reg-username').value,
            password: document.getElementById('reg-password').value,
            email: document.getElementById('reg-email').value,
            phone: document.getElementById('reg-phone').value
        };
        
        fetch('http://localhost:5000/api/register', {
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
                alert('Registration successful, please login');
                registerSection.style.display = 'none';
                loginSection.style.display = 'block';
                registerForm.reset();
            } else {
                alert('Registration failed: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('An error occurred during registration, please try again later');
        });
    });
});