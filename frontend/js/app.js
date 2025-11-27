// Theme management
class ThemeManager {
    constructor() {
        this.currentTheme = localStorage.getItem('theme') || 'light';
        this.init();
    }

    init() {
        this.applyTheme(this.currentTheme);
        this.setupEventListeners();
    }

    setupEventListeners() {
        const themeSwitch = document.getElementById('themeSwitch');
        if (themeSwitch) {
            themeSwitch.addEventListener('click', () => {
                this.toggleTheme();
            });
        }
    }

    toggleTheme() {
        this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.applyTheme(this.currentTheme);
        localStorage.setItem('theme', this.currentTheme);
    }

    applyTheme(theme) {
        document.body.classList.toggle('dark-mode', theme === 'dark');
        
        const themeIcon = document.querySelector('#themeSwitch i');
        if (themeIcon) {
            themeIcon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        }
    }
}

// Navigation and authentication check
class App {
    constructor() {
        this.themeManager = new ThemeManager();
        this.init();
    }

    init() {
        this.checkAuthentication();
        this.setupNavigation();
    }

    checkAuthentication() {
        const protectedPages = ['books.html', 'quotes.html', 'book-form.html', 'quote-form.html'];
        const currentPage = window.location.pathname.split('/').pop();
        
        console.log('🔍 Current page:', currentPage);
        console.log('🔍 Auth status:', auth.isAuthenticated());
        
        // If user is authenticated AND on login/register pages, redirect to index
        if ((currentPage === "login.html" || currentPage === "register.html") && auth.isAuthenticated()) {
            console.log('🔍 User already logged in, redirecting to index.html');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 100);
        }
        
        // If user is NOT authenticated AND on protected pages, redirect to login
        // ✅ FIX: Use a different variable name instead of reassigning const
        const allProtectedPages = ["index.html", "books.html", "quotes.html", "book-form.html"];
        if (allProtectedPages.includes(currentPage) && !auth.isAuthenticated()) {
            console.log('🔍 User not authenticated, redirecting to login');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 100);
        }
    }

    setupNavigation() {
        // Update navigation based on authentication
        const authLinks = document.getElementById('authLinks');
        const userLinks = document.getElementById('userLinks');
        const usernameSpan = document.getElementById('username');

        if (authLinks && userLinks) {
            if (auth.isAuthenticated()) {
                authLinks.style.display = 'none';
                userLinks.style.display = 'block';
                if (usernameSpan && auth.user) {
                    usernameSpan.textContent = auth.user.username;
                }
            } else {
                authLinks.style.display = 'block';
                userLinks.style.display = 'none';
            }
        }
    }

    logout() {
        auth.logout();
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.app = new App();
    
    // Initialize tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    const tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
});