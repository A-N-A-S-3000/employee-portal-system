const DEP_API = "http://127.0.0.1:8000/departments/";
const EMP_API = "http://127.0.0.1:8000/employees/";

let departmentsData = [];
let employeesData = [];
let currentEditId = null;
let deleteDepartmentId = null;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
  fetchEmployees();
  fetchDepartments();
  setupEventListeners();
});

// Setup all event listeners
function setupEventListeners() {
  // Filter event listener
  document.getElementById("filter-name").addEventListener("input", applyFilter);

  // Modal event listeners
  document.getElementById('departmentModal').addEventListener('click', function(e) {
    if (e.target === this) closeModal();
  });

  document.getElementById('deleteModal').addEventListener('click', function(e) {
    if (e.target === this) closeDeleteModal();
  });

  // Form submission
  document.getElementById('departmentForm').addEventListener('submit', function(e) {
    e.preventDefault();
    saveDepartment();
  });
}

// Fetch employees for counting
function fetchEmployees() {
  authenticatedFetch(EMP_API + "list/")
    .then(res => {
      if (!res.ok) throw new Error('Failed to fetch employees');
      return res.json();
    })
    .then(data => {
      employeesData = data;
    })
    .catch(error => {
      console.error('Error fetching employees:', error);
    });
}

// Fetch departments from API
function fetchDepartments() {
  authenticatedFetch(DEP_API + "list/")
    .then(res => {
      if (!res.ok) throw new Error('Failed to fetch departments');
      return res.json();
    })
    .then(data => {
      departmentsData = data;
      renderTable(departmentsData);
    })
    .catch(error => {
      console.error('Error fetching departments:', error);
      showAlert('Failed to load departments', 'danger');
    });
}

// Count employees in each department
function countEmployeesInDepartment(departmentId) {
  return employeesData.filter(emp => emp.department === departmentId).length;
}

// Render the departments table
function renderTable(data) {
  const tbody = document.querySelector("#departments-table tbody");
  tbody.innerHTML = "";
  
  if (data.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="4" class="text-center">No departments found</td>
      </tr>
    `;
    return;
  }
  
  data.forEach(dep => {
    const employeeCount = countEmployeesInDepartment(dep.id);
    tbody.innerHTML += `
      <tr>
        <td>${dep.id}</td>
        <td>${dep.name}</td>
        <td>${employeeCount} employee${employeeCount !== 1 ? 's' : ''}</td>
        <td>
          <div class="action-buttons">
            <button class="btn btn-sm btn-primary" onclick="editDepartment(${dep.id})" title="Edit">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn btn-sm btn-danger" onclick="openDeleteModal(${dep.id})" title="Delete">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  });
}

// Apply filter to the table
function applyFilter() {
  const name = document.getElementById("filter-name").value.toLowerCase();
  
  const filtered = departmentsData.filter(dep => {
    return dep.name.toLowerCase().includes(name);
  });

  renderTable(filtered);
}

// Modal functions
function openAddModal() {
  currentEditId = null;
  document.getElementById('modalTitle').textContent = 'Add Department';
  document.getElementById('saveBtn').innerHTML = '<i class="fas fa-save"></i> Save';
  resetForm();
  document.getElementById('departmentModal').classList.add('show');
}

function editDepartment(id) {
  const department = departmentsData.find(dep => dep.id === id);
  if (!department) {
    showAlert('Department not found', 'danger');
    return;
  }
  
  currentEditId = id;
  document.getElementById('modalTitle').textContent = 'Edit Department';
  document.getElementById('saveBtn').innerHTML = '<i class="fas fa-save"></i> Update';
  
  // Populate form with department data
  document.getElementById('departmentId').value = department.id;
  document.getElementById('departmentName').value = department.name;
  
  document.getElementById('departmentModal').classList.add('show');
}

function closeModal() {
  document.getElementById('departmentModal').classList.remove('show');
  resetForm();
}

function resetForm() {
  document.getElementById('departmentForm').reset();
  document.getElementById('departmentId').value = '';
}

// Save department (create or update)
function saveDepartment() {
  const formData = {
    name: document.getElementById('departmentName').value.trim()
  };

  // Validation
  if (!formData.name) {
    showAlert('Please enter a department name', 'danger');
    return;
  }

  const saveBtn = document.getElementById('saveBtn');
  const originalText = saveBtn.innerHTML;
  saveBtn.innerHTML = '<span class="spinner"></span> Saving...';
  saveBtn.disabled = true;

  const url = currentEditId ? `${DEP_API}update/${currentEditId}/` : `${DEP_API}create/`;
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
    const message = currentEditId ? 'Department updated successfully' : 'Department created successfully';
    showAlert(message, 'success');
    closeModal();
    fetchDepartments(); // Refresh the table
  })
  .catch(error => {
    console.error('Error saving department:', error);
    let errorMessage = 'Failed to save department';
    if (error.name && error.name[0]) {
      errorMessage = error.name[0];
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
  const department = departmentsData.find(dep => dep.id === id);
  if (!department) {
    showAlert('Department not found', 'danger');
    return;
  }
  
  const employeeCount = countEmployeesInDepartment(id);
  
  deleteDepartmentId = id;
  document.getElementById('deleteDepartmentInfo').innerHTML = `
    <p><strong>Department:</strong> ${department.name}</p>
    <p><strong>Employee Count:</strong> ${employeeCount}</p>
  `;
  
  document.getElementById('deleteModal').classList.add('show');
}

function closeDeleteModal() {
  document.getElementById('deleteModal').classList.remove('show');
  deleteDepartmentId = null;
}

function confirmDelete() {
  if (!deleteDepartmentId) return;
  
  const confirmBtn = document.getElementById('confirmDeleteBtn');
  const originalText = confirmBtn.innerHTML;
  confirmBtn.innerHTML = '<span class="spinner"></span> Deleting...';
  confirmBtn.disabled = true;

  authenticatedFetch(`${DEP_API}delete/${deleteDepartmentId}/`, {
    method: 'DELETE'
  })
  .then(res => {
    if (!res.ok) throw new Error('Failed to delete department');
    showAlert('Department deleted successfully', 'success');
    closeDeleteModal();
    fetchDepartments(); // Refresh the table
  })
  .catch(error => {
    console.error('Error deleting department:', error);
    showAlert('Failed to delete department. It may have associated employees.', 'danger');
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
