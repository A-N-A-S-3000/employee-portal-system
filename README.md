# 🏢 Employee Portal System

> A comprehensive full-stack employee management solution built with Django REST Framework and modern web technologies.

[![Python](https://img.shields.io/badge/Python-3.8+-blue.svg)](https://python.org)
[![Django](https://img.shields.io/badge/Django-4.2+-green.svg)](https://djangoproject.com)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-yellow.svg)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![License](https://img.shields.io/badge/License-MIT-red.svg)](LICENSE)

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Screenshots](#screenshots)
- [Installation](#installation)
- [Configuration](#configuration)
- [API Documentation](#api-documentation)
- [Contributing](#contributing)
- [License](#license)

## 🎯 Overview

The Employee Portal System is a modern, full-stack web application designed to streamline HR operations and employee management. It provides a comprehensive dashboard for managing employees, departments, shifts, leave requests, and document tracking with an intuitive user interface.

**Key Highlights:**
- 🔐 JWT-based authentication system
- 📱 Responsive design for all devices
- 🔄 Real-time data synchronization
- 📊 Advanced filtering and search capabilities
- 🛡️ Secure API endpoints with proper validation

## ✨ Features

### 👥 Employee Management
- **Complete CRUD Operations**: Add, view, edit, and delete employee records
- **Advanced Search**: Filter by name, position, department, GIN, phone number
- **Department Integration**: Dynamic department assignment with real-time updates
- **Profile Management**: Comprehensive employee profiles with all relevant details

### 🏢 Department Management
- **Department Structure**: Organize employees by departments
- **Hierarchical Management**: Easy department creation and modification
- **Employee Assignment**: Seamless employee-department relationships

### 📄 Document Management
- **Document Tracking**: Manage employee documents (licenses, insurance, certificates)
- **Expiry Monitoring**: Automated alerts for document expiration
- **Categorization**: Filter by employee, document type, date, and document ID
- **Secure Storage**: Safe document handling and retrieval

### ⏰ Shift Management
- **Shift Scheduling**: Assign and manage employee shifts
- **Location Tracking**: Multi-location shift management
- **Date Range Support**: Flexible shift duration and scheduling
- **Advanced Filtering**: Search by employee, department, location, and date

### 🔄 Shift Swap System
- **Swap Requests**: Employee shift exchange management
- **Admin Approval**: Administrative control over shift swaps
- **Reason Tracking**: Log and monitor swap justifications
- **History Management**: Complete swap request history

### 🏖️ Leave Management
- **Leave Types**: Support for sick leave, annual leave, and custom types
- **Duration Tracking**: Precise start and end date management
- **Reason Documentation**: Detailed leave reason tracking
- **Approval Workflow**: Structured leave approval process

## 🛠 Tech Stack

### Backend
- **Framework**: Django 4.2+ with Django REST Framework
- **Authentication**: JWT (JSON Web Tokens) with SimpleJWT
- **Database**: SQLite (development) / PostgreSQL (production ready)
- **API Documentation**: drf-spectacular (OpenAPI/Swagger)
- **CORS**: django-cors-headers for frontend integration

### Frontend
- **Languages**: HTML5, CSS3, ES6+ JavaScript
- **Architecture**: Vanilla JS with modular design
- **Styling**: Custom CSS with responsive design
- **HTTP Client**: Fetch API with error handling
- **Authentication**: Token-based with automatic refresh

### Development Tools
- **Environment Management**: python-dotenv
- **Code Quality**: Django best practices
- **Security**: Environment-based configuration
- **Documentation**: Comprehensive API docs

## 📸 Screenshots

### 🏠 Dashboard & Main Interface
<details>

![Dashboard Overview](Screenshots/1.png)

![Employee Management Interface](Screenshots/2.png)

</details>

### 👥 Employee Management
<details>

![Employee List](Screenshots/3.png)

![Add New Employee](Screenshots/4.png)

![Employee Details](Screenshots/5.png)

</details>

### 🏢 Department & Shift Management
<details>
<summary>Click to view department and shift screenshots</summary>

![Department Management](Screenshots/6.png)

![Shift Management](Screenshots/7.png)

</details>

### 📄 Documents & Leave Management
<details>
<summary>Click to view additional features</summary>

![Document Management](Screenshots/8.png)
*Document tracking and management system*

![Leave Management](Screenshots/9.png)
*Leave request and approval interface*

</details>

### ✨ Key Features Highlighted
- 🔐 **Secure Authentication**: JWT-based login system
- 📱 **Responsive Design**: Works seamlessly on all devices
- 🔍 **Advanced Search**: Real-time filtering and search capabilities
- 📊 **Data Management**: Comprehensive CRUD operations
- 🎨 **Modern UI**: Clean and intuitive user interface

## 🚀 Installation

### Prerequisites
- Python 3.8 or higher
- pip (Python package manager)
- Git

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/A-N-A-S-3000/employee-portal-system.git
   cd employee-portal-system
   ```

2. **Set up virtual environment** (recommended)
   ```bash
   python -m venv employee_env
   
   # Windows
   employee_env\Scripts\activate
   
   # macOS/Linux
   source employee_env/bin/activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Environment configuration**
   ```bash
   # Copy environment template
   cp .env.example .env
   
   # Edit .env with your settings (see Configuration section)
   ```

5. **Database setup**
   ```bash
   cd backend
   python manage.py makemigrations
   python manage.py migrate
   python manage.py createsuperuser 
   ```

6. **Start the development server**
   ```bash
   python manage.py runserver
   ```

7. **Open the frontend**
   - Navigate to `Frontend/index.html`
   - Open with Live Server extension in VS Code, or
   - Serve with any local HTTP server

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Django Configuration
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# CORS Settings
CORS_ALLOW_ALL_ORIGINS=True
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:5500

# Database (for production)
# DATABASE_URL=postgres://user:password@localhost:5432/dbname

# Email Configuration (optional)
# EMAIL_HOST=smtp.gmail.com
# EMAIL_PORT=587
# EMAIL_HOST_USER=your-email@gmail.com
# EMAIL_HOST_PASSWORD=your-app-password
```

### Production Deployment

For production deployment, ensure:

1. **Generate a secure SECRET_KEY**
   ```python
   from django.core.management.utils import get_random_secret_key
   print(get_random_secret_key())
   ```

2. **Set DEBUG=False**

3. **Configure ALLOWED_HOSTS** with your domain

4. **Use a production database** (PostgreSQL recommended)

5. **Set up proper CORS origins**

## 📚 API Documentation

The API is fully documented using OpenAPI/Swagger. Once the server is running, visit:

- **Swagger UI**: `http://127.0.0.1:8000/api/schema/swagger-ui/`
- **ReDoc**: `http://127.0.0.1:8000/api/schema/redoc/`
- **OpenAPI Schema**: `http://127.0.0.1:8000/api/schema/`

### Key Endpoints

```
Authentication:
POST /api/auth/login/          # User login
POST /api/auth/refresh/        # Token refresh
POST /api/auth/logout/         # User logout

Employees:
GET    /api/employees/         # List all employees
POST   /api/employees/         # Create employee
GET    /api/employees/{id}/    # Get employee details
PUT    /api/employees/{id}/    # Update employee
DELETE /api/employees/{id}/    # Delete employee

Departments:
GET    /api/departments/       # List departments
POST   /api/departments/       # Create department

Shifts:
GET    /api/shifts/           # List shifts
POST   /api/shifts/           # Create shift

Documents:
GET    /api/documents/        # List documents
POST   /api/documents/        # Upload document

Leave:
GET    /api/leave/           # List leave requests
POST   /api/leave/           # Create leave request

Swap Requests:
GET    /api/swap-requests/   # List swap requests
POST   /api/swap-requests/   # Create swap request
```

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Commit your changes**
   ```bash
   git commit -m 'Add some amazing feature'
   ```
4. **Push to the branch**
   ```bash
   git push origin feature/amazing-feature
   ```
5. **Open a Pull Request**

### Development Guidelines

- Follow PEP 8 for Python code
- Use meaningful commit messages
- Add tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**ANAS** - [GitHub Profile](https://github.com/A-N-A-S-3000)

## 🙏 Acknowledgments

- Django REST Framework team for the excellent API framework
- The open-source community for various tools and libraries
- Contributors and testers who helped improve this project

---

⭐ **Star this repository if you found it helpful!**
