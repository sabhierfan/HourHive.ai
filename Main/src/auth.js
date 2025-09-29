// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "YOUR_FIREBASE_API_KEY",
    authDomain: "your-project.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project.firebasestorage.app",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID",
    databaseURL: "https://your-project-default-rtdb.firebaseio.com"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

// Set persistence to SESSION so user is logged out on browser close
auth.setPersistence(firebase.auth.Auth.Persistence.SESSION);

// Flag to track signup process
let signupInProgress = false;

// Store the unsubscribe function for the auth state listener
let unsubscribeAuth = null;

// Function to show error message
function showError(message) {
    const errorDiv = document.getElementById('error-message');
    errorDiv.textContent = message;
    errorDiv.classList.remove('d-none');
}

// Function to hide error message
function hideError() {
    const errorDiv = document.getElementById('error-message');
    errorDiv.classList.add('d-none');
}

// Auth state listener for all pages
auth.onAuthStateChanged((user) => {
    const currentPage = window.location.pathname.split('/').pop();
    
    // Check if we're in the middle of a signup process
    const isSignupProcess = localStorage.getItem('isSignupProcess') === 'true';
    
    if (isSignupProcess) {
        // If we're on the signup page and just completed signup, stay here
        if (currentPage === 'signup.html') {
            return;
        }
    }

    if (user) {
        // Only redirect from login page to home
        if (currentPage === 'login.html') {
            window.location.href = 'home.html';
        }
    } else {
        // Handle protected pages
        const protectedPages = [
            'home.html',
            'department-timetable.html',
            'university-timetable.html',
            'export.html',
            'history.html'
        ];

        if (protectedPages.includes(currentPage)) {
            window.location.href = 'login.html';
        }
    }
});

// Handle Sign Up
if (document.getElementById('signupForm')) {
    document.getElementById('signupForm').addEventListener('submit', (e) => {
        e.preventDefault();
        hideError();

        // Set signup process flag
        localStorage.setItem('isSignupProcess', 'true');

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (password !== confirmPassword) {
            showError('Passwords do not match');
            localStorage.removeItem('isSignupProcess');
            return;
        }

        auth.createUserWithEmailAndPassword(email, password)
            .then(() => {
                return auth.signOut();
            })
            .then(() => {
                document.getElementById('signupForm').reset();
                
                const successMessage = document.createElement('div');
                successMessage.className = 'alert alert-success mt-3';
                successMessage.innerHTML = 'Account created successfully! Please <a href="login.html">click here to login</a> with your credentials.';
                document.getElementById('error-message').parentNode.insertBefore(successMessage, document.getElementById('error-message').nextSibling);
            })
            .catch((error) => {
                showError(error.message);
                localStorage.removeItem('isSignupProcess');
            });
    });
}

// Handle Login
if (document.getElementById('loginForm')) {
    document.getElementById('loginForm').addEventListener('submit', (e) => {
        e.preventDefault();
        hideError();

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        auth.signInWithEmailAndPassword(email, password)
            .then(() => {
                // Clear any signup process flag
                localStorage.removeItem('isSignupProcess');
                window.location.href = 'home.html';
            })
            .catch((error) => {
                showError(error.message);
            });
    });
}

// Handle Password Reset
window.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('resetPasswordBtn')) {
        document.getElementById('resetPasswordBtn').addEventListener('click', () => {
            const resetEmail = document.getElementById('resetEmail').value;
            const resetErrorDiv = document.getElementById('reset-error-message');
            const resetSuccessDiv = document.getElementById('reset-success-message');
            
            // Hide any existing messages
            resetErrorDiv.classList.add('d-none');
            resetSuccessDiv.classList.add('d-none');

            if (!resetEmail) {
                resetErrorDiv.textContent = 'Please enter your email address';
                resetErrorDiv.classList.remove('d-none');
                return;
            }

            // Send password reset email
            auth.sendPasswordResetEmail(resetEmail)
                .then(() => {
                    resetSuccessDiv.textContent = 'Password reset link has been sent to your email';
                    resetSuccessDiv.classList.remove('d-none');
                    document.getElementById('resetEmail').value = '';
                    
                    // Close modal after 3 seconds
                    setTimeout(() => {
                        const modal = bootstrap.Modal.getInstance(document.getElementById('forgotPasswordModal'));
                        modal.hide();
                    }, 3000);
                })
                .catch((error) => {
                    resetErrorDiv.textContent = error.message;
                    resetErrorDiv.classList.remove('d-none');
                });
        });
    }
});

// Clear signup process flag when leaving the signup page
window.addEventListener('beforeunload', function() {
    if (window.location.pathname.split('/').pop() !== 'signup.html') {
        localStorage.removeItem('isSignupProcess');
    }
});

// Check if user is on a protected page and redirect if not authenticated
function checkAuth() {
    const currentPage = window.location.pathname.split('/').pop();
    const protectedPages = [
        'home.html',
        'department-timetable.html',
        'university-timetable.html',
        'export.html',
        'history.html'
    ];

    if (protectedPages.includes(currentPage)) {
        auth.onAuthStateChanged((user) => {
            if (!user) {
                window.location.href = 'login.html';
            }
        });
    }
}

// Call checkAuth when the page loads
document.addEventListener('DOMContentLoaded', checkAuth); 