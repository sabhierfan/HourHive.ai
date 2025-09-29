// UI Helper Functions
export function showError(message, formId = null) {
    const errorElement = formId ? 
        document.querySelector(`#${formId} .error-message`) : 
        document.querySelector('.error-message');
    
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    } else {
        console.error('Error element not found');
    }
}

export function hideError(formId = null) {
    const errorElement = formId ? 
        document.querySelector(`#${formId} .error-message`) : 
        document.querySelector('.error-message');
    
    if (errorElement) {
        errorElement.style.display = 'none';
    }
}

export function showLoading(formId) {
    const submitButton = document.querySelector(`#${formId} button[type="submit"]`);
    if (submitButton) {
        submitButton.disabled = true;
        submitButton.innerHTML = '<span class="spinner"></span> Loading...';
    }
}

export function hideLoading(formId) {
    const submitButton = document.querySelector(`#${formId} button[type="submit"]`);
    if (submitButton) {
        submitButton.disabled = false;
        submitButton.innerHTML = submitButton.getAttribute('data-original-text') || 'Submit';
    }
}

// Password validation UI
export function setupPasswordValidation() {
    const passwordInput = document.querySelector('input[type="password"]');
    const confirmPasswordInput = document.querySelector('input[name="confirmPassword"]');
    
    if (passwordInput && confirmPasswordInput) {
        confirmPasswordInput.addEventListener('input', () => {
            if (passwordInput.value !== confirmPasswordInput.value) {
                confirmPasswordInput.setCustomValidity('Passwords do not match');
            } else {
                confirmPasswordInput.setCustomValidity('');
            }
        });
    }
}

// Update user welcome message
export function updateUserWelcome(email) {
    const welcomeElement = document.querySelector('.user-welcome');
    if (welcomeElement) {
        const userName = sessionStorage.getItem('userName') || email.split('@')[0];
        welcomeElement.textContent = `Welcome, ${userName}!`;
    }
}

// Redirect to a page
export function redirectTo(page) {
    window.location.href = page;
}

// Check if we're on a specific page
export function isOnPage(pageName) {
    return window.location.pathname.includes(pageName);
}

// Validate email format
export function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Validate password strength
export function validatePassword(password) {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
    const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;
    return re.test(password);
}

// Validate name (letters and spaces only)
export function validateName(name) {
    const re = /^[a-zA-Z\s]{2,}$/;
    return re.test(name);
} 