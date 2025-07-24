# 🔒 Security Configuration Guide

## Before Deploying to Production

### ✅ Environment Variables Setup
1. Copy `.env.example` to `.env`
2. Generate a new SECRET_KEY:
   ```python
   from django.core.management.utils import get_random_secret_key
   print(get_random_secret_key())
   ```
3. Set `DEBUG=False` in your `.env` file
4. Configure your domain in `ALLOWED_HOSTS`

### ✅ Database Security
- The SQLite database (`db.sqlite3`) is excluded from version control
- For production, consider using PostgreSQL or MySQL
- Ensure database backups are secure and encrypted

### ✅ CORS Configuration
- Update `CORS_ALLOWED_ORIGINS` in your environment variables
- Never use `CORS_ALLOW_ALL_ORIGINS = True` in production

### ✅ Additional Security Headers
Consider adding these middleware for production:
```python
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    # ... other middleware
]

# Security settings
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'
```

### ✅ JWT Token Security
- Tokens are configured with reasonable expiration times
- Refresh token rotation is enabled
- Consider implementing token blacklisting for logout

## Files Excluded from Git
- `.env` - Environment variables
- `db.sqlite3` - Database file
- `__pycache__/` - Python cache files
- `*.pyc` - Compiled Python files

## Before First Git Commit
1. Ensure `.gitignore` is in place
2. Create your `.env` file from `.env.example`
3. Verify no sensitive data is staged: `git status`
4. Remove any existing sensitive files from git history if needed
