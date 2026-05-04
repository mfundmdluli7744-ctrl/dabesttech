// Application State
const appState = {
    role: localStorage.getItem('role') || null,
    token: localStorage.getItem('token') || null,
    userName: localStorage.getItem('name') || null,
};

// DOM Elements
const mainContent = document.getElementById('main-content');
const sidebar = document.getElementById('sidebar');
const navLinks = document.getElementById('nav-links');
const modalContainer = document.getElementById('modal-container');
const toastContainer = document.getElementById('toast-container');

// Navigation Configuration
const navConfig = {
    admin: [
        { name: 'Dashboard', path: '#dashboard', icon: '📊' },
        { name: 'Requests', path: '#requests', icon: '📩' },
        { name: 'Invoices', path: '#invoices', icon: '💰' },
        { name: 'Courses', path: '#courses', icon: '📚' }
    ],
    student: [
        { name: 'Dashboard', path: '#dashboard', icon: '👨‍💻' },
        { name: 'My Projects', path: '#projects', icon: '📁' },
        { name: 'Jobs', path: '#jobs', icon: '💼' }
    ],
    client: [
        { name: 'Dashboard', path: '#dashboard', icon: '📈' },
        { name: 'My Requests', path: '#requests', icon: '📩' },
        { name: 'Invoices', path: '#invoices', icon: '💰' }
    ]
};

// UI Helpers: Toasts
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let icon = 'ℹ️';
    if (type === 'success') icon = '✅';
    if (type === 'error') icon = '❌';
    if (type === 'warning') icon = '⚠️';

    toast.innerHTML = `<span>${icon}</span> ${message}`;
    toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('hide');
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// UI Helpers: Modals
function openModal(content) {
    modalContainer.innerHTML = content;
}

function closeModal() {
    modalContainer.innerHTML = '';
}

// UI Helpers: Confirmation
function showConfirm(title, message, onConfirm) {
    const html = `
        <div class="modal-overlay confirm-dialog">
            <div class="glass-card modal-content fade-in">
                <div class="confirm-icon">❓</div>
                <h3>${title}</h3>
                <p>${message}</p>
                <div class="confirm-actions">
                    <button id="confirm-yes" class="btn btn-primary">Confirm</button>
                    <button id="confirm-no" class="btn btn-secondary">Cancel</button>
                </div>
            </div>
        </div>
    `;
    openModal(html);

    document.getElementById('confirm-yes').onclick = () => {
        onConfirm();
        closeModal();
    };
    document.getElementById('confirm-no').onclick = closeModal;
}

// UI Helpers: Loading State
function renderLoading(container = mainContent) {
    container.innerHTML = `
        <div class="spinner-wrap fade-in">
            <div class="spinner"></div>
            <p>Loading DABEST Hub...</p>
        </div>
    `;
}

// UI Helpers: Empty State
function renderEmptyState(icon, title, description, container = mainContent) {
    container.innerHTML = `
        <div class="empty-state fade-in">
            <div class="empty-state-icon">${icon}</div>
            <h3>${title}</h3>
            <p>${description}</p>
        </div>
    `;
}


// Router
function handleRoute() {
    const hash = window.location.hash || '#dashboard';
    
    // Redirect to login if no token
    if (!appState.token && hash !== '#register') {
        window.location.hash = '#login';
        renderLogin();
        return;
    }

    // Render Navigation if logged in
    if (appState.token) {
        sidebar.classList.remove('hidden');
        mainContent.classList.remove('full-width');
        renderNavigation(hash);
    } else {
        sidebar.classList.add('hidden');
        mainContent.classList.add('full-width');
    }

    // Route logic
    switch (hash) {
        case '#login':
            renderLogin();
            break;
        case '#register':
            renderRegister();
            break;
        case '#dashboard':
            renderDashboard();
            break;
        case '#requests':
        case '#jobs':
            renderRequests();
            break;
        case '#projects':
            renderProjects();
            break;
        case '#invoices':
            renderInvoices();
            break;
        case '#courses':
            renderCourses();
            break;
        default:
            renderDashboard();
    }
}

// Render Navigation
function renderNavigation(currentHash) {
    if (!appState.role || !navConfig[appState.role]) return;
    
    const linksHtml = navConfig[appState.role].map(link => `
        <li class="nav-item">
            <a href="${link.path}" class="nav-link ${currentHash === link.path ? 'active' : ''}">
                <span style="margin-right: 10px;">${link.icon}</span> ${link.name}
            </a>
        </li>
    `).join('');
    
    navLinks.innerHTML = linksHtml;
}

// Render Views
function renderLogin() {
    mainContent.innerHTML = `
        <div class="auth-container fade-in">
            <div class="glass-card">
                <h2>Welcome Back</h2>
                <p>Login to your DABEST Hub account</p>
                <form id="login-form" class="auth-form">
                    <div class="form-group">
                        <label>Email Address</label>
                        <input type="email" id="email" class="form-control" placeholder="name@example.com" required>
                    </div>
                    <div class="form-group">
                        <label>Password</label>
                        <input type="password" id="password" class="form-control" placeholder="••••••••" required>
                    </div>
                    <button type="submit" id="login-btn" class="btn btn-primary btn-full">Sign In</button>
                    <p class="mt-4" style="font-size: 0.9rem;">
                        Don't have an account? <a href="#register" style="color: var(--accent-primary); font-weight: 600;">Create one</a>
                    </p>
                </form>
            </div>
        </div>
    `;

    document.getElementById('login-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('login-btn');
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        btn.disabled = true;
        btn.innerText = 'Signing in...';

        try {
            const res = await api.post('/auth/login', { email, password });
            localStorage.setItem('token', res.token);
            localStorage.setItem('role', res.role);
            localStorage.setItem('name', res.name);
            appState.token = res.token;
            appState.role = res.role;
            appState.userName = res.name;
            showToast(`Welcome back, ${res.name}!`, 'success');
            window.location.hash = '#dashboard';
        } catch (error) {
            showToast(error.message, 'error');
            btn.disabled = false;
            btn.innerText = 'Sign In';
        }
    });
}

function renderRegister() {
    mainContent.innerHTML = `
        <div class="auth-container fade-in">
            <div class="glass-card">
                <h2>Create Account</h2>
                <p>Join the DABEST Tech community</p>
                <form id="register-form" class="auth-form">
                    <div class="form-group">
                        <label>Full Name</label>
                        <input type="text" id="reg-name" class="form-control" placeholder="John Doe" required>
                    </div>
                    <div class="form-group">
                        <label>Email Address</label>
                        <input type="email" id="reg-email" class="form-control" placeholder="john@example.com" required>
                    </div>
                    <div class="form-group">
                        <label>Password</label>
                        <input type="password" id="reg-password" class="form-control" placeholder="Min. 8 characters" required>
                    </div>
                    <div class="form-group">
                        <label>Join as a...</label>
                        <select id="reg-role" class="form-control">
                            <option value="student">Student / Developer</option>
                            <option value="client">Client / Employer</option>
                        </select>
                    </div>
                    <button type="submit" id="reg-btn" class="btn btn-primary btn-full">Register</button>
                    <p class="mt-4" style="font-size: 0.9rem;">
                        Already have an account? <a href="#login" style="color: var(--accent-primary); font-weight: 600;">Sign in here</a>
                    </p>
                </form>
            </div>
        </div>
    `;

    document.getElementById('register-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('reg-btn');
        const name = document.getElementById('reg-name').value;
        const email = document.getElementById('reg-email').value;
        const password = document.getElementById('reg-password').value;
        const role = document.getElementById('reg-role').value;
        
        btn.disabled = true;
        btn.innerText = 'Creating account...';

        try {
            await api.post('/auth/register', { name, email, password, role });
            showToast("Registration successful! You can now log in.", 'success');
            window.location.hash = '#login';
        } catch (error) {
            showToast(error.message, 'error');
            btn.disabled = false;
            btn.innerText = 'Register';
        }
    });
}

async function renderDashboard() {
    if (!appState.role) return;
    renderLoading();
    
    try {
        const stats = await api.get(`/dashboard/${appState.role}/stats`);
        
        let html = `
            <div class="fade-in">
                <div class="page-header">
                    <div>
                        <h2>Welcome, ${appState.userName || 'User'}</h2>
                        <p>Here's what's happening today at the Hub.</p>
                    </div>
                </div>
                <div class="dashboard-grid">
        `;
        
        if (appState.role === 'admin') {
            html += `
                <div class="glass-card stat-card">
                    <span class="stat-label">Total Users</span>
                    <span class="stat-value">${stats.users}</span>
                </div>
                <div class="glass-card stat-card">
                    <span class="stat-label">Project Hub</span>
                    <span class="stat-value">${stats.projects}</span>
                </div>
                <div class="glass-card stat-card">
                    <span class="stat-label">Client Requests</span>
                    <span class="stat-value">${stats.requests}</span>
                </div>
                <div class="glass-card stat-card">
                    <span class="stat-label">Total Revenue</span>
                    <span class="stat-value">$${stats.revenue.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                </div>
            `;
        } else if (appState.role === 'student') {
             html += `
                <div class="glass-card stat-card">
                    <span class="stat-label">My Projects</span>
                    <span class="stat-value">${stats.projects}</span>
                </div>
                <div class="glass-card stat-card">
                    <span class="stat-label">Active Jobs</span>
                    <span class="stat-value">${stats.jobs_assigned}</span>
                </div>
                <div class="glass-card stat-card">
                    <span class="stat-label">My Earnings</span>
                    <span class="stat-value">$${stats.earnings.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                </div>
            `;
        } else if (appState.role === 'client') {
            html += `
                <div class="glass-card stat-card">
                    <span class="stat-label">Total Requests</span>
                    <span class="stat-value">${stats.total_requests}</span>
                </div>
                <div class="glass-card stat-card">
                    <span class="stat-label">Pending Approval</span>
                    <span class="stat-value">${stats.pending_requests}</span>
                </div>
                <div class="glass-card stat-card">
                    <span class="stat-label">Completed Projects</span>
                    <span class="stat-value">${stats.completed_requests}</span>
                </div>
            `;
        }
        
        html += '</div></div>';
        mainContent.innerHTML = html;
        
    } catch (error) {
        renderEmptyState('⚠️', 'Dashboard Error', error.message);
    }
}


async function renderRequests() {
    renderLoading();
    
    try {
        const requests = await api.get('/requests/');
        
        if (requests.length === 0) {
            renderEmptyState('📩', 'No Requests Found', 
                appState.role === 'client' ? 'You haven\'t submitted any requests yet.' : 'There are no active requests in the system.');
            if (appState.role === 'client') {
                const btn = document.createElement('button');
                btn.className = 'btn btn-primary mt-4';
                btn.innerText = '+ Submit New Request';
                btn.onclick = renderRequestForm;
                mainContent.querySelector('.empty-state').appendChild(btn);
            }
            return;
        }

        let html = `
            <div class="fade-in">
                <div class="page-header">
                    <h2>${appState.role === 'client' ? 'My Requests' : (appState.role === 'student' ? 'Assigned Jobs' : 'Requests Overview')}</h2>
                    ${appState.role === 'client' ? '<button class="btn btn-primary" onclick="renderRequestForm()">+ New Request</button>' : ''}
                </div>
                
                <div class="table-container glass-panel">
                    <table>
                        <thead>
                            <tr>
                                <th>Title</th>
                                <th>${appState.role === 'admin' ? 'Client' : 'Description'}</th>
                                <th>Budget</th>
                                <th>Status</th>
                                <th>${appState.role === 'student' ? 'Client' : 'Assigned Student'}</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${requests.map(req => `
                                <tr>
                                    <td><strong>${req.title}</strong></td>
                                    <td>${appState.role === 'admin' ? req.client_name : (appState.role === 'student' ? req.client_name : req.description.substring(0, 50) + '...')}</td>
                                    <td>$${req.budget.toLocaleString()}</td>
                                    <td><span class="badge badge-${getStatusClass(req.status)}">${req.status}</span></td>
                                    <td>${appState.role === 'student' ? req.client_name : req.student_name}</td>
                                    <td>
                                        ${appState.role === 'admin' ? 
                                            (req.status === 'Pending' ? 
                                                `<button class="btn btn-secondary btn-sm" onclick="showAssignModal(${req.id})">Assign</button>` : 
                                                (req.status === 'Completed' && !req.has_invoice ? 
                                                    `<button class="btn btn-warning btn-sm" onclick="generateInvoice(${req.id})">Gen Invoice</button>` :
                                                    '<button class="btn btn-secondary btn-sm" disabled>View</button>'
                                                )
                                            ) : 
                                            (appState.role === 'student' && req.status === 'Assigned' ?
                                                `<button class="btn btn-success btn-sm" onclick="completeJob(${req.id})">Complete</button>` :
                                                '<button class="btn btn-secondary btn-sm" disabled>View</button>'
                                            )
                                        }
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
        
        mainContent.innerHTML = html;
        
    } catch (error) {
        renderEmptyState('❌', 'Error Loading Requests', error.message);
    }
}

function getStatusClass(status) {
    switch (status) {
        case 'Pending': return 'warning';
        case 'Assigned': return 'primary';
        case 'Completed': return 'success';
        default: return 'secondary';
    }
}

function renderRequestForm() {
    const html = `
        <div class="modal-overlay">
            <div class="glass-card modal-content fade-in">
                <div class="modal-header">
                    <h3>Submit New Request</h3>
                    <button class="modal-close" onclick="closeModal()">×</button>
                </div>
                <form id="submit-request-form" class="auth-form">
                    <div class="form-group">
                        <label>Project Title</label>
                        <input type="text" id="req-title" class="form-control" placeholder="e.g. E-commerce Website" required>
                    </div>
                    <div class="form-group">
                        <label>Description</label>
                        <textarea id="req-desc" class="form-control" rows="4" placeholder="Describe your project requirements..." required></textarea>
                    </div>
                    <div class="form-group">
                        <label>Budget ($)</label>
                        <input type="number" id="req-budget" class="form-control" placeholder="500" required>
                    </div>
                    <div class="d-flex gap-2 mt-4">
                        <button type="submit" id="submit-req-btn" class="btn btn-primary">Submit Request</button>
                        <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    openModal(html);
    
    document.getElementById('submit-request-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('submit-req-btn');
        const title = document.getElementById('req-title').value;
        const description = document.getElementById('req-desc').value;
        const budget = document.getElementById('req-budget').value;
        
        btn.disabled = true;
        btn.innerText = 'Submitting...';

        try {
            await api.post('/requests/submit', { title, description, budget });
            showToast("Request submitted successfully!", 'success');
            closeModal();
            renderRequests();
        } catch (error) {
            showToast(error.message, 'error');
            btn.disabled = false;
            btn.innerText = 'Submit Request';
        }
    });
}

async function showAssignModal(reqId) {
    try {
        const students = await api.get('/auth/students');
        const html = `
            <div class="modal-overlay">
                <div class="glass-card modal-content fade-in">
                    <div class="modal-header">
                        <h3>Assign Student</h3>
                        <button class="modal-close" onclick="closeModal()">×</button>
                    </div>
                    <p class="mb-4">Select a student to work on this project.</p>
                    <div class="form-group">
                        <label>Student</label>
                        <select id="student-select" class="form-control">
                            ${students.map(s => `<option value="${s.id}">${s.name}</option>`).join('')}
                        </select>
                    </div>
                    <div class="d-flex gap-2 mt-4">
                        <button id="assign-btn" onclick="assignRequest(${reqId})" class="btn btn-primary">Assign Student</button>
                        <button onclick="closeModal()" class="btn btn-secondary">Cancel</button>
                    </div>
                </div>
            </div>
        `;
        openModal(html);
    } catch (error) {
        showToast("Failed to load students: " + error.message, 'error');
    }
}

async function assignRequest(reqId) {
    const btn = document.getElementById('assign-btn');
    const studentId = document.getElementById('student-select').value;
    
    btn.disabled = true;
    btn.innerText = 'Assigning...';

    try {
        await api.post(`/requests/${reqId}/assign`, { student_id: studentId });
        showToast("Request assigned successfully!", 'success');
        closeModal();
        renderRequests();
    } catch (error) {
        showToast(error.message, 'error');
        btn.disabled = false;
        btn.innerText = 'Assign Student';
    }
}

async function completeJob(reqId) {
    showConfirm('Complete Job', 'Are you sure you want to mark this job as completed?', async () => {
        try {
            await api.post(`/requests/${reqId}/complete`);
            showToast("Job marked as completed!", 'success');
            renderRequests();
        } catch (error) {
            showToast(error.message, 'error');
        }
    });
}

async function generateInvoice(reqId) {
    try {
        await api.post(`/invoices/generate/${reqId}`);
        showToast("Invoice generated successfully!", 'success');
        renderRequests();
    } catch (error) {
        showToast(error.message, 'error');
    }
}


async function renderProjects() {
    renderLoading();
    
    try {
        const projects = await api.get('/projects/');
        
        if (projects.length === 0) {
            renderEmptyState('📁', 'No Projects Yet', 
                appState.role === 'student' ? 'Be the first to upload a project to the hub!' : 'No projects have been uploaded yet.');
            if (appState.role === 'student') {
                const btn = document.createElement('button');
                btn.className = 'btn btn-primary mt-4';
                btn.innerText = '+ Upload Your First Project';
                btn.onclick = renderUploadForm;
                mainContent.querySelector('.empty-state').appendChild(btn);
            }
            return;
        }

        let html = `
            <div class="fade-in">
                <div class="page-header">
                    <h2>Project Hub</h2>
                    ${appState.role === 'student' ? '<button class="btn btn-primary" onclick="renderUploadForm()">+ Upload Project</button>' : ''}
                </div>
                
                <div class="card-grid">
                    ${projects.map(p => `
                        <div class="glass-card project-card">
                            <div class="project-card-body">
                                <div class="mb-2">
                                    <span class="badge badge-primary">${p.category}</span>
                                </div>
                                <h3>${p.title}</h3>
                                <p class="mb-4">${p.description.substring(0, 120)}${p.description.length > 120 ? '...' : ''}</p>
                            </div>
                            <div class="project-card-footer">
                                <span class="text-sm text-muted">By <strong>${p.student_name}</strong></span>
                                <div class="d-flex gap-2">
                                    <a href="${p.github_link}" target="_blank" class="btn btn-secondary btn-sm">GitHub</a>
                                    <button class="btn btn-primary btn-sm">View</button>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        mainContent.innerHTML = html;
        
    } catch (error) {
        renderEmptyState('❌', 'Error Loading Projects', error.message);
    }
}

function renderUploadForm() {
    const html = `
        <div class="modal-overlay">
            <div class="glass-card modal-content fade-in">
                <div class="modal-header">
                    <h3>Upload New Project</h3>
                    <button class="modal-close" onclick="closeModal()">×</button>
                </div>
                <form id="upload-project-form" class="auth-form">
                    <div class="form-group">
                        <label>Project Title</label>
                        <input type="text" id="proj-title" class="form-control" placeholder="e.g. My Portfolio" required>
                    </div>
                    <div class="form-group">
                        <label>Category</label>
                        <select id="proj-category" class="form-control">
                            <option value="Web Development">Web Development</option>
                            <option value="Mobile App">Mobile App</option>
                            <option value="AI / Data Science">AI / Data Science</option>
                            <option value="Cybersecurity">Cybersecurity</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Description</label>
                        <textarea id="proj-desc" class="form-control" rows="3" placeholder="Tell us about your project..." required></textarea>
                    </div>
                    <div class="form-group">
                        <label>GitHub Link</label>
                        <input type="url" id="proj-github" class="form-control" placeholder="https://github.com/..." required>
                    </div>
                    <div class="form-group">
                        <label>Project Files (ZIP/Source)</label>
                        <input type="file" id="proj-file" class="form-control" required>
                    </div>
                    <div class="d-flex gap-2 mt-4">
                        <button type="submit" id="upload-btn" class="btn btn-primary">Upload Project</button>
                        <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    openModal(html);
    
    document.getElementById('upload-project-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('upload-btn');
        const formData = new FormData();
        formData.append('title', document.getElementById('proj-title').value);
        formData.append('category', document.getElementById('proj-category').value);
        formData.append('description', document.getElementById('proj-desc').value);
        formData.append('github_link', document.getElementById('proj-github').value);
        formData.append('file', document.getElementById('proj-file').files[0]);
        
        btn.disabled = true;
        btn.innerText = 'Uploading...';

        try {
            await api.post('/projects/upload', formData);
            showToast("Project uploaded successfully!", 'success');
            closeModal();
            renderProjects();
        } catch (error) {
            showToast(error.message, 'error');
            btn.disabled = false;
            btn.innerText = 'Upload Project';
        }
    });
}

async function renderInvoices() {
    renderLoading();
    
    try {
        const invoices = await api.get('/invoices/');
        
        if (invoices.length === 0) {
            renderEmptyState('💰', 'No Invoices', 'You don\'t have any invoices yet.');
            return;
        }

        let html = `
            <div class="fade-in">
                <div class="page-header">
                    <h2>Invoices</h2>
                </div>
                <div class="table-container glass-panel">
                    <table>
                        <thead>
                            <tr>
                                <th>Invoice ID</th>
                                <th>Project / Request</th>
                                <th>Amount</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${invoices.map(inv => `
                                <tr>
                                    <td><strong>#${inv.id.toString().padStart(4, '0')}</strong></td>
                                    <td>${inv.request_title}</td>
                                    <td>$${inv.amount.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                                    <td><span class="badge badge-${inv.status === 'Paid' ? 'success' : 'warning'}">${inv.status}</span></td>
                                    <td>
                                        <button class="btn btn-secondary btn-sm" onclick="downloadInvoice(${inv.id})">
                                            <span>📥</span> Download PDF
                                        </button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
        
        mainContent.innerHTML = html;
        
    } catch (error) {
        renderEmptyState('❌', 'Error Loading Invoices', error.message);
    }
}

async function downloadInvoice(invId) {
    try {
        showToast("Generating download...", 'info');
        const blob = await api.request(`/invoices/download/${invId}`, { responseType: 'blob' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `DABEST_Invoice_${invId}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        showToast("Invoice downloaded!", 'success');
    } catch (error) {
        showToast("Failed to download invoice: " + error.message, 'error');
    }
}


async function renderCourses() {
    renderLoading();
    
    try {
        const courses = await api.get('/courses/');
        
        if (courses.length === 0) {
            renderEmptyState('📚', 'No Courses Available', 'Check back later for new learning resources.');
            if (appState.role === 'admin') {
                const btn = document.createElement('button');
                btn.className = 'btn btn-primary mt-4';
                btn.innerText = '+ Add Your First Course';
                btn.onclick = renderCourseForm;
                mainContent.querySelector('.empty-state').appendChild(btn);
            }
            return;
        }

        let html = `
            <div class="fade-in">
                <div class="page-header">
                    <h2>Learning Resources</h2>
                    ${appState.role === 'admin' ? '<button class="btn btn-primary" onclick="renderCourseForm()">+ Add Course</button>' : ''}
                </div>
                
                <div class="card-grid">
                    ${courses.map(c => `
                        <div class="glass-card project-card">
                            <div class="project-card-body">
                                <div class="mb-2">
                                    <span class="badge badge-success">${c.category}</span>
                                </div>
                                <h3>${c.title}</h3>
                                <p class="mb-4">${c.description}</p>
                            </div>
                            <div class="project-card-footer">
                                <a href="${c.url}" target="_blank" class="btn btn-primary btn-sm btn-full">View Material</a>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        mainContent.innerHTML = html;
        
    } catch (error) {
        renderEmptyState('❌', 'Error Loading Courses', error.message);
    }
}

function renderCourseForm() {
    const html = `
        <div class="modal-overlay">
            <div class="glass-card modal-content fade-in">
                <div class="modal-header">
                    <h3>Add New Course</h3>
                    <button class="modal-close" onclick="closeModal()">×</button>
                </div>
                <form id="add-course-form" class="auth-form">
                    <div class="form-group">
                        <label>Course Title</label>
                        <input type="text" id="course-title" class="form-control" placeholder="e.g. Intro to Python" required>
                    </div>
                    <div class="form-group">
                        <label>Category</label>
                        <input type="text" id="course-category" class="form-control" placeholder="e.g. Backend" required>
                    </div>
                    <div class="form-group">
                        <label>Description</label>
                        <textarea id="course-desc" class="form-control" rows="3" placeholder="Brief overview..." required></textarea>
                    </div>
                    <div class="form-group">
                        <label>Resource URL</label>
                        <input type="url" id="course-url" class="form-control" placeholder="https://..." required>
                    </div>
                    <div class="d-flex gap-2 mt-4">
                        <button type="submit" id="add-course-btn" class="btn btn-primary">Add Course</button>
                        <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    openModal(html);
    
    document.getElementById('add-course-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('add-course-btn');
        const title = document.getElementById('course-title').value;
        const category = document.getElementById('course-category').value;
        const description = document.getElementById('course-desc').value;
        const url = document.getElementById('course-url').value;
        
        btn.disabled = true;
        btn.innerText = 'Adding...';

        try {
            await api.post('/courses/add', { title, category, description, url });
            showToast("Course added successfully!", 'success');
            closeModal();
            renderCourses();
        } catch (error) {
            showToast(error.message, 'error');
            btn.disabled = false;
            btn.innerText = 'Add Course';
        }
    });
}

function logout() {
    showConfirm('Logout', 'Are you sure you want to log out of DABEST Hub?', () => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('name');
        appState.token = null;
        appState.role = null;
        appState.userName = null;
        showToast("You have been logged out.", 'info');
        window.location.hash = '#login';
    });
}

// Event Listeners
window.addEventListener('hashchange', handleRoute);
window.addEventListener('load', handleRoute);

