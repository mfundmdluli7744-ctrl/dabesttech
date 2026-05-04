# DABEST Tech Hub

A modern, glassmorphic management system for Tech Hubs, featuring role-based dashboards for Admins, Students, and Clients.

## 🚀 Features

- **Role-Based Authentication**: Secure login for Admin, Student, and Client roles.
- **Project Hub**: Students can upload and showcase their projects.
- **Client Requests**: Clients can submit project requests that Admins can assign to Students.
- **Automated Invoicing**: Automated PDF invoice generation for completed projects.
- **Learning Resources**: A centralized hub for courses and learning materials.
- **Glassmorphic UI**: A premium, modern design with smooth animations and transitions.

## 🛠️ Tech Stack

- **Backend**: Flask (Python)
- **Database**: SQLite / PostgreSQL (SQLAlchemy)
- **Frontend**: Vanilla JS, HTML5, CSS3 (Glassmorphism)
- **PDF Generation**: ReportLab
- **Authentication**: JWT (JSON Web Tokens)

## 📦 Installation

1. **Clone the repository**:
   ```bash
   git clone <your-repository-url>
   cd dabest-tech-hub
   ```

2. **Set up the backend**:
   ```bash
   # Create a virtual environment
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate

   # Install dependencies
   pip install -r requirements.txt

   # Configure environment variables
   cp .env.example .env
   # Edit .env with your secrets
   ```

3. **Run the application**:
   ```bash
   # From the root directory
   python backend/app.py
   ```

4. **Access the frontend**:
   Open `frontend/index.html` in your browser (or use a Live Server).

## 📄 License

MIT License
