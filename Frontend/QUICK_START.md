# Quick Start Guide - JWT Admin Authentication

## 🚀 Quick Setup and Test

### 1. Start Django Server
```bash
cd employee_management
python manage.py runserver
```

### 2. Create Admin User
Open another terminal and run:
```bash
cd employee_management
python manage.py shell
```

Then execute:
```python
from django.contrib.auth.models import User
User.objects.create_superuser('admin', 'admin@demo.com', 'admin123')
exit()
```

### 3. Test the Login Flow

1. **Open Login Page**: Navigate to `Frontend/auth/login.html`
2. **Login**: Use credentials:
   - Username: `admin`
   - Password: `admin123`
3. **Success**: You should be redirected to `Frontend/index.html`
4. **Verification**: Look for:
   - "Welcome, admin" in top right
   - Logout button
   - Protected access to all pages

### 4. Test Authentication Features

✅ **Login with wrong credentials** - Should show error  
✅ **Login with non-admin user** - Should be denied  
✅ **Access index.html directly** - Should redirect to login  
✅ **Logout** - Should clear tokens and redirect to login  
✅ **Remember me** - Tokens persist after browser restart  

### 5. Verify API Protection

After login, you can test the API endpoints:
- All requests will include Bearer token
- Only admin users can access CRUD operations
- Non-authenticated requests are rejected

### 🔧 Troubleshooting

If you encounter issues:

1. **CORS Error**: Ensure Django server is running on `127.0.0.1:8000`
2. **Token Error**: Clear browser storage and re-login
3. **Redirect Loop**: Check console for authentication errors
4. **Admin Access Denied**: Verify user has `is_staff=True`

### 📱 Test in Browser

1. Open Developer Tools (F12)
2. Check Console for any errors
3. Check Network tab for API requests
4. Check Application/Storage for stored tokens

---

**Default Credentials:**
- Username: `admin`
- Password: `admin123`

**Flow:** `login.html` → `index.html` (with logout option)
