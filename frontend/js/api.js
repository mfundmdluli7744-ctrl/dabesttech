// API base URL — use relative path so it works on any host.
// In local dev, the frontend is served from a different port than the Flask API,
// so we fall back to an explicit localhost URL only when running locally.
const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://127.0.0.1:5000/api'
    : '/api';

const api = {
    async request(endpoint, options = {}) {
        const token = localStorage.getItem('token');
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        // Handle FormData — let browser set Content-Type with boundary
        if (options.body instanceof FormData) {
            delete headers['Content-Type'];
        }

        let response;
        try {
            response = await fetch(`${API_URL}${endpoint}`, {
                ...options,
                headers
            });
        } catch (err) {
            throw new Error('Cannot reach the server. Please check your connection.');
        }

        if (response.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('role');
            localStorage.removeItem('name');
            window.location.hash = '#login';
            return null;
        }

        // For file downloads, return blob directly
        if (options.responseType === 'blob') {
            if (!response.ok) throw new Error('Download failed');
            return response.blob();
        }

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || `Request failed (${response.status})`);
        }

        return data;
    },

    async get(endpoint) {
        return this.request(endpoint, { method: 'GET' });
    },

    async post(endpoint, data) {
        const options = {
            method: 'POST',
            body: data instanceof FormData ? data : JSON.stringify(data)
        };
        return this.request(endpoint, options);
    },

    async put(endpoint, data) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },

    async delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }
};
