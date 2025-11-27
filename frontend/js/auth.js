class Auth {
    constructor() {
        this.token = localStorage.getItem('token');
        this.user = JSON.parse(localStorage.getItem('user') || 'null');
        this.apiBase = 'http://localhost:8000';
        console.log('🔍 Auth initialized - Token exists:', !!this.token);
        console.log('🔍 Full token:', this.token);
    }

    async register(userData) {
        try {
            const response = await fetch(`${this.apiBase}/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Registration failed');
            }

            return await response.json();
        } catch (error) {
            throw error;
        }
    }

    async login(username, password) {
        console.log('🔍 Sending login request for:', username);
        
        try {
            const response = await fetch(`${this.apiBase}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: username,
                    password: password
                })
            });
            
            console.log('🔍 Login response status:', response.status);
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || `Login failed: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('✅ Login successful:', data);
            
            // ✅ CRITICAL: Store token in both places
            this.token = data.access_token;
            localStorage.setItem('token', data.access_token);
            
            console.log('✅ Token stored in localStorage:', !!localStorage.getItem('token'));
            console.log('✅ Token value in localStorage:', localStorage.getItem('token'));
            console.log('✅ Auth instance token:', !!this.token);
            
            // Store user info if available
            if (data.user) {
                this.user = data.user;
                localStorage.setItem('user', JSON.stringify(data.user));
            }
            
            // Redirect after successful login
            setTimeout(() => {
                console.log('🔄 Redirecting to books.html...');
                window.location.href = 'books.html';
            }, 500);
            
            return data;
        } catch (error) {
            console.error('❌ Login error:', error);
            throw error;
        }
    }

    logout() {
        console.log('🔍 Logging out...');
        this.token = null;
        this.user = null;
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'login.html';
    }

    isAuthenticated() {
        // Check both instance token and localStorage
        const token = this.token || localStorage.getItem('token');
        const isAuthenticated = !!token;
        console.log('🔍 isAuthenticated check:');
        console.log('  - this.token:', !!this.token);
        console.log('  - localStorage token:', !!localStorage.getItem('token'));
        console.log('  - Result:', isAuthenticated);
        return isAuthenticated;
    }

    // ✅ ADD THIS MISSING METHOD
    getToken() {
        return this.token;
    }

    getAuthHeaders() {
        // Always get the latest token from localStorage
        const token = localStorage.getItem('token') || this.token;
        console.log('🔍 getAuthHeaders - Token:', token ? token.substring(0, 20) + '...' : 'null');
        
        if (!token) {
            console.warn('⚠️ No token available for auth headers');
            return { 'Content-Type': 'application/json' };
        }
        
        const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
        
        console.log('🔍 Final headers:', headers);
        return headers;
    }

    // Helper method to check token status
    checkAuthStatus() {
        return {
            hasToken: !!this.token,
            token: this.token ? this.token.substring(0, 20) + '...' : 'null',
            user: this.user
        };
    }

    checkTokenStatus() {
        const token = localStorage.getItem('token');
        console.log('🔍 Token Status Check:');
        console.log('  - Token in localStorage:', !!token);
        console.log('  - Token in auth instance:', !!this.token);
        
        if (token) {
            try {
                // Decode JWT token to check expiration
                const payload = JSON.parse(atob(token.split('.')[1]));
                const expiration = new Date(payload.exp * 1000);
                const now = new Date();
                console.log('  - Token expires:', expiration);
                console.log('  - Current time:', now);
                console.log('  - Is expired:', now > expiration);
                console.log('  - Token payload:', payload);
            } catch (e) {
                console.log('  - Token decoding failed:', e);
            }
        }
    }
}

const auth = new Auth();