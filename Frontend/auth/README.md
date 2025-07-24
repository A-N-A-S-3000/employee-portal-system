# Employee Management System - JWT Authentication

A modern admin login system with JWT authentication for the Employee Management System.

## 🚀 Features

✅ **Admin-Only Access**: Only users with `is_staff=True` can log in  
✅ **JWT Authentication**: Secure token-based authentication  
✅ **Protected Dashboard**: Access to all CRUD operations with Bearer tokens  
✅ **Modern UI**: Beautiful, responsive login interface  
✅ **Token Management**: Automatic token refresh and secure storage  
✅ **API Testing**: Built-in interface to test all endpoints  

## 📁 File Structure

```
Frontend/auth/
├── login.html          # Modern login page
├── login.css           # Styling for login page
├── login.js            # Login logic and authentication
├── dashboard.html      # Protected admin dashboard
├── dashboard.css       # Dashboard styling
└── dashboard.js        # Dashboard functionality and API testing
```

## 🔧 Setup Instructions

### 1. Install Dependencies

```bash
cd employee_management
pip install -r requirements.txt
```

### 2. Apply Migrations

```bash
python manage.py makemigrations
python manage.py migrate
```

### 3. Create Admin User

```bash
python manage.py shell
```

Then run:
```python
exec(open('create_demo_admin.py').read())
```

Or create manually:
```python
from django.contrib.auth.models import User
User.objects.create_superuser('admin', 'admin@demo.com', 'admin123')
```

### 4. Start Django Server

```bash
python manage.py runserver
```

### 5. Open Login Page

Navigate to: `Frontend/auth/login.html`

**Default Admin Credentials:**
- Username: `admin`
- Password: `admin123`

## 🔐 Authentication Flow

1. **Login**: User enters credentials on login page
2. **Validation**: Backend validates admin status (`is_staff=True`)
3. **Token Generation**: JWT access and refresh tokens are generated
4. **Storage**: Tokens stored in localStorage/sessionStorage
5. **Dashboard Access**: Protected dashboard loads with API access
6. **API Calls**: All requests include Bearer token in headers
7. **Auto-Refresh**: Tokens refresh automatically every 15 minutes

## 📡 API Endpoints

### Authentication
- `POST /api/admin/login/` - Admin login (returns JWT tokens)
- `GET /api/admin/profile/` - Get admin user profile
- `POST /api/admin/logout/` - Logout (blacklist refresh token)
- `POST /api/token/refresh/` - Refresh access token

### CRUD Operations (Admin Only)
- `GET /departments/list/` - List all departments
- `POST /departments/create/` - Create new department
- `PUT /departments/update/{id}/` - Update department
- `DELETE /departments/delete/{id}/` - Delete department

*(Similar patterns for employees, documents, shifts, swap-requests, leaves)*

## 🎯 Usage

### Login Process
1. Open `login.html` in your browser
2. Enter admin credentials
3. Check "Remember me" for persistent login
4. Click "Sign In"

### Dashboard Features
- **Overview**: Statistics cards showing data counts
- **API Testing**: Test all CRUD operations with authentication
- **Navigation**: Switch between different data sections
- **Logout**: Secure logout with token blacklisting

### API Testing
The dashboard includes a built-in API testing interface:
- Click any API button (List, Create, Update, Delete)
- View formatted JSON responses
- Test authentication and admin permissions
- See real-time error handling

## 🛡️ Security Features

- **Admin-Only Access**: Non-admin users are rejected at login
- **JWT Tokens**: Secure, stateless authentication
- **Token Refresh**: Automatic token renewal
- **CORS Configuration**: Proper cross-origin request handling
- **Input Validation**: Client and server-side validation
- **XSS Protection**: Safe DOM manipulation
- **CSRF Protection**: Django CSRF middleware enabled

## 🎨 UI Features

- **Modern Design**: Clean, professional interface
- **Responsive Layout**: Works on desktop, tablet, and mobile
- **Loading States**: Visual feedback during operations
- **Error Handling**: User-friendly error messages
- **Animations**: Smooth transitions and hover effects
- **Accessibility**: Keyboard navigation and screen reader support

## 🔧 Configuration

### API Base URL
Update in both `login.js` and `dashboard.js`:
```javascript
const API_BASE_URL = 'http://127.0.0.1:8000';
```

### Token Storage
Tokens are stored in:
- `localStorage` (if "Remember me" is checked)
- `sessionStorage` (for session-only login)

### JWT Settings
Configure in `settings.py`:
```python
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=1),
    # ... other settings
}
```

## 🐛 Troubleshooting

### Common Issues

1. **CORS Errors**
   - Ensure `django-cors-headers` is installed
   - Check `CORS_ALLOW_ALL_ORIGINS = True` in settings

2. **Token Errors**
   - Verify JWT settings in `settings.py`
   - Check token expiration times
   - Clear browser storage and re-login

3. **Admin Access Denied**
   - Ensure user has `is_staff=True` or `is_superuser=True`
   - Check user status in Django admin

4. **API Endpoints Not Found**
   - Verify URLs are correctly configured
   - Check Django server is running
   - Confirm endpoint paths match frontend calls

## 📱 Browser Compatibility

- ✅ Chrome 80+
- ✅ Firefox 75+
- ✅ Safari 13+
- ✅ Edge 80+

## 🔮 Future Enhancements

- [ ] Two-factor authentication
- [ ] Role-based permissions
- [ ] Activity logging
- [ ] Password reset functionality
- [ ] User management interface
- [ ] API rate limiting
- [ ] Real-time notifications

---

**Note**: This is a demo implementation. For production use, ensure proper security configurations, HTTPS, and environment-specific settings.
