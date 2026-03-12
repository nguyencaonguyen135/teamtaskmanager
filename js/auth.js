// ===== TaskFlow Authentication System =====

// ===== Constants =====
const AUTH_KEYS = {
    USERS: 'taskflow_users',
    CURRENT_USER: 'taskflow_current_user',
    REMEMBER_ME: 'taskflow_remember_me'
};

// ===== Default Users (Demo Accounts) =====
const DEFAULT_USERS = [
    {
        id: 1,
        email: 'admin@taskflow.com',
        password: 'admin123',
        fullName: 'Admin TaskFlow',
        role: 'admin',
        avatar: '#6366f1',
        createdAt: new Date().toISOString()
    },
    {
        id: 2,
        email: 'member@taskflow.com',
        password: 'member123',
        fullName: 'Member Demo',
        role: 'member',
        avatar: '#8b5cf6',
        createdAt: new Date().toISOString()
    }
];

// ===== Auth Store =====
const AuthStore = {
    // Initialize default users if not exists
    init() {
        if (!localStorage.getItem(AUTH_KEYS.USERS)) {
            localStorage.setItem(AUTH_KEYS.USERS, JSON.stringify(DEFAULT_USERS));
        }
    },

    // Get all users
    getUsers() {
        const users = localStorage.getItem(AUTH_KEYS.USERS);
        return users ? JSON.parse(users) : [];
    },

    // Save users
    saveUsers(users) {
        localStorage.setItem(AUTH_KEYS.USERS, JSON.stringify(users));
    },

    // Get current logged in user
    getCurrentUser() {
        const user = localStorage.getItem(AUTH_KEYS.CURRENT_USER);
        return user ? JSON.parse(user) : null;
    },

    // Set current user (login)
    setCurrentUser(user, rememberMe = false) {
        // Remove password before storing
        const safeUser = { ...user };
        delete safeUser.password;
        
        localStorage.setItem(AUTH_KEYS.CURRENT_USER, JSON.stringify(safeUser));
        
        if (rememberMe) {
            localStorage.setItem(AUTH_KEYS.REMEMBER_ME, 'true');
        }
    },

    // Clear current user (logout)
    clearCurrentUser() {
        localStorage.removeItem(AUTH_KEYS.CURRENT_USER);
        localStorage.removeItem(AUTH_KEYS.REMEMBER_ME);
    },

    // Check if user is logged in
    isLoggedIn() {
        return this.getCurrentUser() !== null;
    },

    // Find user by email
    findUserByEmail(email) {
        const users = this.getUsers();
        return users.find(u => u.email.toLowerCase() === email.toLowerCase());
    },

    // Register new user
    registerUser(userData) {
        const users = this.getUsers();
        
        // Check if email exists
        if (this.findUserByEmail(userData.email)) {
            return { success: false, message: 'Email đã được sử dụng' };
        }

        const newUser = {
            id: Date.now(),
            email: userData.email,
            password: userData.password,
            fullName: userData.fullName,
            role: 'member', // Default role
            avatar: getRandomColor(),
            createdAt: new Date().toISOString()
        };

        users.push(newUser);
        this.saveUsers(users);

        return { success: true, user: newUser };
    },

    // Login user
    loginUser(email, password) {
        const user = this.findUserByEmail(email);

        if (!user) {
            return { success: false, message: 'Email không tồn tại' };
        }

        if (user.password !== password) {
            return { success: false, message: 'Mật khẩu không chính xác' };
        }

        return { success: true, user };
    }
};

// ===== Utility Functions =====
function getRandomColor() {
    const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#14b8a6', '#f59e0b', '#ef4444'];
    return colors[Math.floor(Math.random() * colors.length)];
}

function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const icons = {
        success: 'fa-check-circle',
        error: 'fa-times-circle',
        warning: 'fa-exclamation-circle'
    };

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <i class="fas ${icons[type]}"></i>
        <span class="toast-message">${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function checkPasswordStrength(password) {
    if (password.length < 6) return { level: 'weak', text: 'Yếu - Cần ít nhất 6 ký tự' };
    
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;

    if (strength < 2) return { level: 'weak', text: 'Yếu - Thêm chữ hoa, số hoặc ký tự đặc biệt' };
    if (strength < 3) return { level: 'medium', text: 'Trung bình' };
    return { level: 'strong', text: 'Mạnh' };
}

function setLoading(button, isLoading) {
    const textEl = button.querySelector('.btn-text');
    const loaderEl = button.querySelector('.btn-loader');
    
    if (isLoading) {
        button.disabled = true;
        if (textEl) textEl.style.display = 'none';
        if (loaderEl) loaderEl.style.display = 'inline-flex';
    } else {
        button.disabled = false;
        if (textEl) textEl.style.display = 'inline';
        if (loaderEl) loaderEl.style.display = 'none';
    }
}

function showError(inputId, message) {
    const input = document.getElementById(inputId);
    const errorEl = document.getElementById(inputId + 'Error');
    
    if (input) input.classList.add('error');
    if (errorEl) errorEl.textContent = message;
}

function clearError(inputId) {
    const input = document.getElementById(inputId);
    const errorEl = document.getElementById(inputId + 'Error');
    
    if (input) input.classList.remove('error');
    if (errorEl) errorEl.textContent = '';
}

function clearAllErrors() {
    document.querySelectorAll('.error-message').forEach(el => el.textContent = '');
    document.querySelectorAll('input.error').forEach(el => el.classList.remove('error'));
}

// ===== Toggle Password Visibility =====
function setupPasswordToggle(toggleId, inputId) {
    const toggle = document.getElementById(toggleId);
    const input = document.getElementById(inputId);
    
    if (toggle && input) {
        toggle.addEventListener('click', () => {
            const type = input.type === 'password' ? 'text' : 'password';
            input.type = type;
            toggle.innerHTML = `<i class="fas ${type === 'password' ? 'fa-eye' : 'fa-eye-slash'}"></i>`;
        });
    }
}

// ===== Login Page Logic =====
function initLoginPage() {
    const form = document.getElementById('loginForm');
    if (!form) return;

    // Setup password toggle
    setupPasswordToggle('togglePassword', 'password');

    // Demo account buttons
    document.querySelectorAll('.demo-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.getElementById('email').value = btn.dataset.email;
            document.getElementById('password').value = btn.dataset.password;
        });
    });

    // Form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearAllErrors();

        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const rememberMe = document.getElementById('rememberMe').checked;
        const submitBtn = document.getElementById('loginBtn');

        // Validate
        let hasError = false;

        if (!email) {
            showError('email', 'Vui lòng nhập email');
            hasError = true;
        } else if (!validateEmail(email)) {
            showError('email', 'Email không hợp lệ');
            hasError = true;
        }

        if (!password) {
            showError('password', 'Vui lòng nhập mật khẩu');
            hasError = true;
        }

        if (hasError) return;

        // Simulate loading
        setLoading(submitBtn, true);
        await new Promise(resolve => setTimeout(resolve, 800));

        // Attempt login
        const result = AuthStore.loginUser(email, password);

        if (result.success) {
            AuthStore.setCurrentUser(result.user, rememberMe);
            showToast('Đăng nhập thành công!', 'success');
            
            // Redirect to dashboard
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 500);
        } else {
            setLoading(submitBtn, false);
            showToast(result.message, 'error');
            
            if (result.message.includes('Email')) {
                showError('email', result.message);
            } else {
                showError('password', result.message);
            }
        }
    });

    // Clear errors on input
    ['email', 'password'].forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('input', () => clearError(id));
        }
    });
}

// ===== Register Page Logic =====
function initRegisterPage() {
    const form = document.getElementById('registerForm');
    if (!form) return;

    // Setup password toggles
    setupPasswordToggle('togglePassword', 'password');
    setupPasswordToggle('toggleConfirmPassword', 'confirmPassword');

    // Password strength indicator
    const passwordInput = document.getElementById('password');
    const strengthContainer = document.getElementById('passwordStrength');
    const strengthFill = document.getElementById('strengthFill');
    const strengthText = document.getElementById('strengthText');

    if (passwordInput && strengthContainer) {
        passwordInput.addEventListener('input', () => {
            const password = passwordInput.value;
            
            if (password.length === 0) {
                strengthContainer.classList.remove('show');
                return;
            }

            strengthContainer.classList.add('show');
            const strength = checkPasswordStrength(password);
            
            strengthFill.className = 'strength-fill ' + strength.level;
            strengthText.className = 'strength-text ' + strength.level;
            strengthText.textContent = strength.text;
        });
    }

    // Form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearAllErrors();

        const fullName = document.getElementById('fullName').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const agreeTerms = document.getElementById('agreeTerms').checked;
        const submitBtn = document.getElementById('registerBtn');

        // Validate
        let hasError = false;

        if (!fullName) {
            showError('fullName', 'Vui lòng nhập họ tên');
            hasError = true;
        } else if (fullName.length < 2) {
            showError('fullName', 'Họ tên quá ngắn');
            hasError = true;
        }

        if (!email) {
            showError('email', 'Vui lòng nhập email');
            hasError = true;
        } else if (!validateEmail(email)) {
            showError('email', 'Email không hợp lệ');
            hasError = true;
        }

        if (!password) {
            showError('password', 'Vui lòng nhập mật khẩu');
            hasError = true;
        } else if (password.length < 6) {
            showError('password', 'Mật khẩu phải có ít nhất 6 ký tự');
            hasError = true;
        }

        if (!confirmPassword) {
            showError('confirmPassword', 'Vui lòng xác nhận mật khẩu');
            hasError = true;
        } else if (password !== confirmPassword) {
            showError('confirmPassword', 'Mật khẩu xác nhận không khớp');
            hasError = true;
        }

        if (!agreeTerms) {
            showToast('Vui lòng đồng ý với điều khoản sử dụng', 'error');
            hasError = true;
        }

        if (hasError) return;

        // Simulate loading
        setLoading(submitBtn, true);
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Attempt registration
        const result = AuthStore.registerUser({ fullName, email, password });

        if (result.success) {
            // Auto login after registration
            AuthStore.setCurrentUser(result.user, false);
            showToast('Đăng ký thành công! Đang chuyển hướng...', 'success');
            
            // Redirect to dashboard
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        } else {
            setLoading(submitBtn, false);
            showToast(result.message, 'error');
            showError('email', result.message);
        }
    });

    // Clear errors on input
    ['fullName', 'email', 'password', 'confirmPassword'].forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('input', () => clearError(id));
        }
    });
}

// ===== Auth Guard (for protected pages) =====
function checkAuth() {
    // Skip auth check on login/register pages
    const currentPage = window.location.pathname.split('/').pop();
    const publicPages = ['login.html', 'register.html', ''];
    
    if (publicPages.includes(currentPage)) {
        // If already logged in and on login/register, redirect to dashboard
        if (AuthStore.isLoggedIn() && (currentPage === 'login.html' || currentPage === 'register.html')) {
            window.location.href = 'index.html';
        }
        return;
    }

    // Protected page - check if logged in
    if (!AuthStore.isLoggedIn()) {
        window.location.href = 'login.html';
    }
}

// ===== Logout Function =====
function logout() {
    AuthStore.clearCurrentUser();
    showToast('Đã đăng xuất', 'success');
    setTimeout(() => {
        window.location.href = 'login.html';
    }, 500);
}

// ===== Initialize =====
document.addEventListener('DOMContentLoaded', () => {
    // Initialize auth store with default users
    AuthStore.init();
    
    // Check authentication
    checkAuth();
    
    // Initialize appropriate page
    const currentPage = window.location.pathname.split('/').pop();
    
    if (currentPage === 'login.html' || currentPage === '') {
        initLoginPage();
    } else if (currentPage === 'register.html') {
        initRegisterPage();
    }
});

// Export for use in other scripts
window.AuthStore = AuthStore;
window.logout = logout;
