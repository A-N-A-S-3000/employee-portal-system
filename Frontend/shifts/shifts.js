const SHIFT_API = "http://127.0.0.1:8000/shifts/";
const EMP_API = "http://127.0.0.1:8000/employees/";
const DEP_API = "http://127.0.0.1:8000/departments/";

let shiftsData = [];
let employeesData = [];
let departmentsData = [];
let empMap = {};
let depMap = {};
let currentEditId = null;
let deleteShiftId = null;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
  fetchEmployeesAndDepartments();
  setupEventListeners();
});

// Setup all event listeners
function setupEventListeners() {
  // Filter event listeners
  ["filter-employee", "filter-department", "filter-location", "filter-start", "filter-end"].forEach(id => {
    document.getElementById(id).addEventListener("input", applyFilters);
  });

  // Modal event listeners
  document.getElementById('shiftModal').addEventListener('click', function(e) {
    if (e.target === this) closeModal();
  });

  document.getElementById('deleteModal').addEventListener('click', function(e) {
    if (e.target === this) closeDeleteModal();
  });

  // Form submission
  document.getElementById('shiftForm').addEventListener('submit', function(e) {
    e.preventDefault();
    saveShift();
  });
}

// Fetch employees and departments
function fetchEmployeesAndDepartments() {
  Promise.all([
    authenticatedFetch(EMP_API + "list/").then(res => {
      if (!res.ok) throw new Error('Failed to fetch employees');
      return res.json();
    }),
    authenticatedFetch(DEP_API + "list/").then(res => {
      if (!res.ok) throw new Error('Failed to fetch departments');
      return res.json();
    })
  ])
  .then(([employees, departments]) => {
    employeesData = employees;
    departmentsData = departments;
    
    // Build maps for quick lookup
    employees.forEach(e => empMap[e.id] = e.full_name);
    departments.forEach(d => depMap[d.id] = d.name);
    
    // Populate form dropdowns
    populateFormDropdowns();
    
    // Fetch shifts
    fetchShifts();
  })
  .catch(error => {
    console.error('Error fetching data:', error);
    showAlert('Failed to load initial data', 'danger');
  });
}

// Populate form dropdowns
function populateFormDropdowns() {
  // Populate employee dropdown
  const employeeSelect = document.getElementById("employee");
  employeeSelect.innerHTML = '<option value="">Select Employee</option>';
  employeesData.forEach(emp => {
    const option = document.createElement("option");
    option.value = emp.id;
    option.textContent = emp.full_name;
    employeeSelect.appendChild(option);
  });
  
  // Populate department dropdown
  const departmentSelect = document.getElementById("department");
  departmentSelect.innerHTML = '<option value="">Select Department</option>';
  departmentsData.forEach(dep => {
    const option = document.createElement("option");
    option.value = dep.id;
    option.textContent = dep.name;
    departmentSelect.appendChild(option);
  });
}

// Fetch shifts from API
function fetchShifts() {
  authenticatedFetch(SHIFT_API + "list/")
    .then(res => {
      if (!res.ok) throw new Error('Failed to fetch shifts');
      return res.json();
    })
    .then(data => {
      shiftsData = data;
      renderTable(shiftsData);
    })
    .catch(error => {
      console.error('Error fetching shifts:', error);
      showAlert('Failed to load shifts', 'danger');
    });
}

// Calculate shift duration
function calculateDuration(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end dates
  return diffDays;
}

// Render the shifts table
function renderTable(data) {
  const tbody = document.querySelector("#shifts-table tbody");
  tbody.innerHTML = "";
  
  if (data.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center">No shifts found</td>
      </tr>
    `;
    return;
  }
  
  data.forEach(shift => {
    const empName = empMap[shift.employee] || "Unknown";
    const depName = depMap[shift.department] || "Unknown";
    const startDate = new Date(shift.start_date).toLocaleDateString();
    const endDate = new Date(shift.end_date).toLocaleDateString();
    const duration = calculateDuration(shift.start_date, shift.end_date);
    
    tbody.innerHTML += `
      <tr>
        <td>${shift.id}</td>
        <td>${empName}</td>
        <td>${depName}</td>
        <td>${startDate}</td>
        <td>${endDate}</td>
        <td>${duration} day${duration !== 1 ? 's' : ''}</td>
        <td>${shift.location}</td>
        <td>
          <div class="action-buttons">
            <button class="btn btn-sm btn-primary" onclick="editShift(${shift.id})" title="Edit">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn btn-sm btn-danger" onclick="openDeleteModal(${shift.id})" title="Delete">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  });
}

// Apply filters to the table
function applyFilters() {
  const employee = document.getElementById("filter-employee").value.toLowerCase();
  const department = document.getElementById("filter-department").value.toLowerCase();
  const location = document.getElementById("filter-location").value.toLowerCase();
  const startDate = document.getElementById("filter-start").value;
  const endDate = document.getElementById("filter-end").value;

  const filtered = shiftsData.filter(shift => {
    const empName = empMap[shift.employee]?.toLowerCase() || "";
    const depName = depMap[shift.department]?.toLowerCase() || "";
    
    const matchesEmployee = empName.includes(employee);
    const matchesDepartment = depName.includes(department);
    const matchesLocation = shift.location.toLowerCase().includes(location);
    const matchesStartDate = !startDate || shift.start_date >= startDate;
    const matchesEndDate = !endDate || shift.end_date <= endDate;
    
    return matchesEmployee && matchesDepartment && matchesLocation && matchesStartDate && matchesEndDate;
  });

  renderTable(filtered);
}

// Modal functions
function openAddModal() {
  currentEditId = null;
  document.getElementById('modalTitle').textContent = 'Add Shift';
  document.getElementById('saveBtn').innerHTML = '<i class="fas fa-save"></i> Save';
  resetForm();
  document.getElementById('shiftModal').classList.add('show');
}

function editShift(id) {
  const shift = shiftsData.find(s => s.id === id);
  if (!shift) {
    showAlert('Shift not found', 'danger');
    return;
  }
  
  currentEditId = id;
  document.getElementById('modalTitle').textContent = 'Edit Shift';
  document.getElementById('saveBtn').innerHTML = '<i class="fas fa-save"></i> Update';
  
  // Populate form with shift data
  document.getElementById('shiftId').value = shift.id;
  document.getElementById('employee').value = shift.employee;
  document.getElementById('department').value = shift.department;
  document.getElementById('startDate').value = shift.start_date;
  document.getElementById('endDate').value = shift.end_date;
  document.getElementById('location').value = shift.location;
  
  document.getElementById('shiftModal').classList.add('show');
}

function closeModal() {
  document.getElementById('shiftModal').classList.remove('show');
  resetForm();
}

function resetForm() {
  document.getElementById('shiftForm').reset();
  document.getElementById('shiftId').value = '';
}

// Save shift (create or update)
function saveShift() {
  const formData = {
    employee: document.getElementById('employee').value,
    department: document.getElementById('department').value,
    start_date: document.getElementById('startDate').value,
    end_date: document.getElementById('endDate').value,
    location: document.getElementById('location').value.trim()
  };

  // Validation
  if (!formData.employee || !formData.department || !formData.start_date || !formData.end_date || !formData.location) {
    showAlert('Please fill in all required fields', 'danger');
    return;
  }

  // Validate date range
  if (new Date(formData.start_date) > new Date(formData.end_date)) {
    showAlert('End date must be after start date', 'danger');
    return;
  }

  const saveBtn = document.getElementById('saveBtn');
  const originalText = saveBtn.innerHTML;
  saveBtn.innerHTML = '<span class="spinner"></span> Saving...';
  saveBtn.disabled = true;

  const url = currentEditId ? `${SHIFT_API}update/${currentEditId}/` : `${SHIFT_API}create/`;
  const method = currentEditId ? 'PUT' : 'POST';

  authenticatedFetch(url, {
    method: method,
    body: JSON.stringify(formData)
  })
  .then(res => {
    if (!res.ok) {
      return res.json().then(err => Promise.reject(err));
    }
    return res.json();
  })
  .then(data => {
    const message = currentEditId ? 'Shift updated successfully' : 'Shift created successfully';
    showAlert(message, 'success');
    closeModal();
    fetchShifts(); // Refresh the table
  })
  .catch(error => {
    console.error('Error saving shift:', error);
    showAlert('Failed to save shift', 'danger');
  })
  .finally(() => {
    saveBtn.innerHTML = originalText;
    saveBtn.disabled = false;
  });
}

// Delete modal functions
function openDeleteModal(id) {
  const shift = shiftsData.find(s => s.id === id);
  if (!shift) {
    showAlert('Shift not found', 'danger');
    return;
  }
  
  deleteShiftId = id;
  document.getElementById('deleteShiftInfo').innerHTML = `
    <p><strong>Employee:</strong> ${empMap[shift.employee] || 'Unknown'}</p>
    <p><strong>Department:</strong> ${depMap[shift.department] || 'Unknown'}</p>
    <p><strong>Period:</strong> ${new Date(shift.start_date).toLocaleDateString()} - ${new Date(shift.end_date).toLocaleDateString()}</p>
    <p><strong>Location:</strong> ${shift.location}</p>
  `;
  
  document.getElementById('deleteModal').classList.add('show');
}

function closeDeleteModal() {
  document.getElementById('deleteModal').classList.remove('show');
  deleteShiftId = null;
}

function confirmDelete() {
  if (!deleteShiftId) return;
  
  const confirmBtn = document.getElementById('confirmDeleteBtn');
  const originalText = confirmBtn.innerHTML;
  confirmBtn.innerHTML = '<span class="spinner"></span> Deleting...';
  confirmBtn.disabled = true;

  authenticatedFetch(`${SHIFT_API}delete/${deleteShiftId}/`, {
    method: 'DELETE'
  })
  .then(res => {
    if (!res.ok) throw new Error('Failed to delete shift');
    showAlert('Shift deleted successfully', 'success');
    closeDeleteModal();
    fetchShifts(); // Refresh the table
  })
  .catch(error => {
    console.error('Error deleting shift:', error);
    showAlert('Failed to delete shift', 'danger');
  })
  .finally(() => {
    confirmBtn.innerHTML = originalText;
    confirmBtn.disabled = false;
  });
}

// Alert system
function showAlert(message, type = 'info') {
  const alertContainer = document.getElementById('alert-container');
  const alertId = 'alert-' + Date.now();
  
  const alertHTML = `
    <div id="${alertId}" class="alert alert-${type}">
      ${message}
    </div>
  `;
  
  alertContainer.innerHTML = alertHTML;
  
  // Auto-dismiss after 5 seconds
  setTimeout(() => {
    const alertElement = document.getElementById(alertId);
    if (alertElement) {
      alertElement.remove();
    }
  }, 5000);
}
