# 🧑‍💼 Employee Management System (Django + HTML/CSS/JS)

A full-stack **Employee Management Web App** for internal use. Built with Django REST Framework for the backend and plain HTML, CSS, and JavaScript for the frontend.

---

## 🚀 Features

### ✅ Employees
- Add, update, delete employee records
- Filter by name, position, department, GIN, phone
- Dynamic dropdowns for departments

### ✅ Departments
- Manage all departments
- Simple CRUD interface

### ✅ Documents
- Track employee documents (license, insurance, etc.)
- Auto-expiry alerts (backend logic)
- Filter by employee, type, date, document ID

### ✅ Shifts
- Assign rotating shifts
- Includes location and date range
- Filter by employee, department, location, date

### ✅ Shift Swap Requests
- Admin-managed shift swapping
- Log swap reason and involved employees
- Filter by from/to employee, shift ID, reason

### ✅ Leaves
- Record sick, annual, or any type of leave
- Tracks start/end date and reason
- Filter by employee, leave type, date, and reason

---

## 🛠 Tech Stack

- **Backend**: Django + Django REST Framework  
- **Frontend**: HTML, CSS, JavaScript (No React)
- **Database**: SQLite (default with Django)
- **CORS**: Enabled for local development



---

## 🧪 How to Run

### Backend

```bash
# Setup
pip install -r requirements.txt

# Run server
python manage.py runserver
```

### Frontend
Open Frontend/index.html in your browser (e.g., with Live Server or localhost).
