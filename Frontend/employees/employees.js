const EMP_API = "http://127.0.0.1:8000/employees/";
const DEP_API = "http://127.0.0.1:8000/departments/";

let employeesData = [];
let departmentMap = {};
let departmentsList = [];
let currentEditId = null;
let deleteEmployeeId = null;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
  fetchDepartments();
  setupEventListeners();
});

// Setup all event listeners
function setupEventListeners() {
  // Filter event listeners
  ["filter-name", "filter-position", "filter-gin", "filter-phone", "filter-department"].forEach(id => {
    document.getElementById(id).addEventListener("input", applyFilters);
  });

  // Modal event listeners
  document.getElementById('employeeModal').addEventListener('click', function(e) {
    if (e.target === this) closeModal();
  });

  document.getElementById('deleteModal').addEventListener('click', function(e) {
    if (e.target === this) closeDeleteModal();
  });

  // Form submission
  document.getElementById('employeeForm').addEventListener('submit', function(e) {
    e.preventDefault();
    saveEmployee();
  });
}

// Fetch departments and populate dropdowns
function fetchDepartments() {
  authenticatedFetch(DEP_API + "list/")
    .then(res => {
      if (!res.ok) throw new Error('Failed to fetch departments');
      return res.json();
    })
    .then(departments => {
      departmentsList = departments;
      
      // Build department map for quick lookup
      departments.forEach(dep => {
        departmentMap[dep.id] = dep.name;
      });
      
      // Populate filter dropdown
      const filterSelect = document.getElementById("filter-department");
      filterSelect.innerHTML = '<option value="">All Departments</option>';
      departments.forEach(dep => {
        const option = document.createElement("option");
        option.value = dep.name.toLowerCase();
        option.textContent = dep.name;
        filterSelect.appendChild(option);
      });
      
      // Populate form dropdown
      populateFormDepartments();
      
      // Now fetch employees
      fetchEmployees();
    })
    .catch(error => {
      console.error('Error fetching departments:', error);
      showAlert('Failed to load departments', 'danger');
    });
}

// Populate department dropdown in form
function populateFormDepartments() {
  const departmentSelect = document.getElementById("department");
  departmentSelect.innerHTML = '<option value="">Select Department</option>';
  departmentsList.forEach(dep => {
    const option = document.createElement("option");
    option.value = dep.id;
    option.textContent = dep.name;
    departmentSelect.appendChild(option);
  });
}

// Fetch employees from API
function fetchEmployees() {
  authenticatedFetch(EMP_API + "list/")
    .then(res => {
      if (!res.ok) throw new Error('Failed to fetch employees');
      return res.json();
    })
    .then(data => {
      employeesData = data;
      renderTable(employeesData);
    })
    .catch(error => {
      console.error('Error fetching employees:', error);
      showAlert('Failed to load employees', 'danger');
    });
}

// Render the employees table
function renderTable(data) {
  const tbody = document.querySelector("#employees-table tbody");
  tbody.innerHTML = "";
  
  if (data.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9" class="text-center">No employees found</td>
      </tr>
    `;
    return;
  }
  
  data.forEach(emp => {
    const departmentName = departmentMap[emp.department] || "Unknown";
    const startDate = emp.start_date ? new Date(emp.start_date).toLocaleDateString() : 'N/A';
    const endDate = emp.end_date ? new Date(emp.end_date).toLocaleDateString() : 'N/A';
    
    tbody.innerHTML += `
      <tr>
        <td>${emp.employee_id}</td>
        <td>
          <a href="../documents/documents.html?employee=${encodeURIComponent(emp.full_name)}" 
             class="employee-name-link" 
             title="View ${emp.full_name}'s documents">
            ${emp.full_name}
          </a>
        </td>
        <td>${emp.position}</td>
        <td>${emp.GIN || 'N/A'}</td>
        <td>${emp.phone_number || 'N/A'}</td>
        <td>${departmentName}</td>
        <td>${startDate}</td>
        <td>${endDate}</td>
        <td>
          <div class="action-buttons">
            <button class="btn btn-sm btn-primary" onclick="editEmployee(${emp.id})" title="Edit">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn btn-sm btn-danger" onclick="openDeleteModal(${emp.id})" title="Delete">
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
  const name = document.getElementById("filter-name").value.toLowerCase();
  const position = document.getElementById("filter-position").value.toLowerCase();
  const gin = document.getElementById("filter-gin").value.toLowerCase();
  const phone = document.getElementById("filter-phone").value.toLowerCase();
  const department = document.getElementById("filter-department").value.toLowerCase();

  const filtered = employeesData.filter(emp => {
    const depName = departmentMap[emp.department]?.toLowerCase() || "";
    return (
      emp.full_name.toLowerCase().includes(name) &&
      emp.position.toLowerCase().includes(position) &&
      (emp.GIN || "").toLowerCase().includes(gin) &&
      (emp.phone_number || "").toLowerCase().includes(phone) &&
      (department === "" || depName === department)
    );
  });

  renderTable(filtered);
}

// Modal functions
function openAddModal() {
  currentEditId = null;
  document.getElementById('modalTitle').textContent = 'Add Employee';
  document.getElementById('saveBtn').innerHTML = '<i class="fas fa-save"></i> Save';
  resetForm();
  document.getElementById('employeeModal').classList.add('show');
}

function editEmployee(id) {
  const employee = employeesData.find(emp => emp.id === id);
  if (!employee) {
    showAlert('Employee not found', 'danger');
    return;
  }
  
  currentEditId = id;
  document.getElementById('modalTitle').textContent = 'Edit Employee';
  document.getElementById('saveBtn').innerHTML = '<i class="fas fa-save"></i> Update';
  
  // Populate form with employee data
  document.getElementById('employeeId').value = employee.id;
  document.getElementById('fullName').value = employee.full_name;
  document.getElementById('position').value = employee.position;
  document.getElementById('department').value = employee.department;
  document.getElementById('gin').value = employee.GIN || '';
  document.getElementById('phoneNumber').value = employee.phone_number || '';
  document.getElementById('startDate').value = employee.start_date || '';
  document.getElementById('endDate').value = employee.end_date || '';
  
  document.getElementById('employeeModal').classList.add('show');
}

function closeModal() {
  document.getElementById('employeeModal').classList.remove('show');
  resetForm();
}

function resetForm() {
  document.getElementById('employeeForm').reset();
  document.getElementById('employeeId').value = '';
}

// Save employee (create or update)
function saveEmployee() {
  const formData = {
    full_name: document.getElementById('fullName').value.trim(),
    position: document.getElementById('position').value.trim(),
    department: document.getElementById('department').value,
    GIN: document.getElementById('gin').value.trim() || null,
    phone_number: document.getElementById('phoneNumber').value.trim() || null,
    start_date: document.getElementById('startDate').value || null,
    end_date: document.getElementById('endDate').value || null
  };

  // Validation
  if (!formData.full_name || !formData.position || !formData.department) {
    showAlert('Please fill in all required fields', 'danger');
    return;
  }

  const saveBtn = document.getElementById('saveBtn');
  const originalText = saveBtn.innerHTML;
  saveBtn.innerHTML = '<span class="spinner"></span> Saving...';
  saveBtn.disabled = true;

  const url = currentEditId ? `${EMP_API}update/${currentEditId}/` : `${EMP_API}create/`;
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
    const message = currentEditId ? 'Employee updated successfully' : 'Employee created successfully';
    showAlert(message, 'success');
    closeModal();
    fetchEmployees(); // Refresh the table
  })
  .catch(error => {
    console.error('Error saving employee:', error);
    let errorMessage = 'Failed to save employee';
    if (error.GIN && error.GIN[0]) {
      errorMessage = error.GIN[0];
    } else if (error.employee_id && error.employee_id[0]) {
      errorMessage = error.employee_id[0];
    }
    showAlert(errorMessage, 'danger');
  })
  .finally(() => {
    saveBtn.innerHTML = originalText;
    saveBtn.disabled = false;
  });
}

// Delete modal functions
function openDeleteModal(id) {
  const employee = employeesData.find(emp => emp.id === id);
  if (!employee) {
    showAlert('Employee not found', 'danger');
    return;
  }
  
  deleteEmployeeId = id;
  document.getElementById('deleteEmployeeInfo').innerHTML = `
    <p><strong>Employee:</strong> ${employee.full_name}</p>
    <p><strong>Position:</strong> ${employee.position}</p>
    <p><strong>Department:</strong> ${departmentMap[employee.department] || 'Unknown'}</p>
  `;
  
  document.getElementById('deleteModal').classList.add('show');
}

function closeDeleteModal() {
  document.getElementById('deleteModal').classList.remove('show');
  deleteEmployeeId = null;
}

function confirmDelete() {
  if (!deleteEmployeeId) return;
  
  const confirmBtn = document.getElementById('confirmDeleteBtn');
  const originalText = confirmBtn.innerHTML;
  confirmBtn.innerHTML = '<span class="spinner"></span> Deleting...';
  confirmBtn.disabled = true;

  authenticatedFetch(`${EMP_API}delete/${deleteEmployeeId}/`, {
    method: 'DELETE'
  })
  .then(res => {
    if (!res.ok) throw new Error('Failed to delete employee');
    showAlert('Employee deleted successfully', 'success');
    closeDeleteModal();
    fetchEmployees(); // Refresh the table
  })
  .catch(error => {
    console.error('Error deleting employee:', error);
    showAlert('Failed to delete employee', 'danger');
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
