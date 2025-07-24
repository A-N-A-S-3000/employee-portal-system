const LEV_API = "http://127.0.0.1:8000/leaves/";
const EMP_API = "http://127.0.0.1:8000/employees/";

let leavesData = [];
let employeesData = [];
let employeeMap = {};
let currentEditId = null;
let deleteLeaveId = null;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
  fetchEmployees();
  setupEventListeners();
});

// Setup all event listeners
function setupEventListeners() {
  // Filter event listeners
  ["filter-employee", "filter-type", "filter-start", "filter-end"].forEach(id => {
    document.getElementById(id).addEventListener("input", applyFilters);
  });

  // Modal event listeners
  document.getElementById('leaveModal').addEventListener('click', function(e) {
    if (e.target === this) closeModal();
  });

  document.getElementById('deleteModal').addEventListener('click', function(e) {
    if (e.target === this) closeDeleteModal();
  });

  // Form submission
  document.getElementById('leaveForm').addEventListener('submit', function(e) {
    e.preventDefault();
    saveLeave();
  });
}

// Fetch employees and populate dropdown
function fetchEmployees() {
  authenticatedFetch(EMP_API + "list/")
    .then(res => {
      if (!res.ok) throw new Error('Failed to fetch employees');
      return res.json();
    })
    .then(data => {
      employeesData = data;
      
      // Build employee map for quick lookup
      data.forEach(emp => {
        employeeMap[emp.id] = emp.full_name;
      });
      
      // Populate form dropdown
      populateFormEmployees();
      
      // Fetch leave requests
      fetchLeaves();
    })
    .catch(error => {
      console.error('Error fetching employees:', error);
      showAlert('Failed to load employees', 'danger');
    });
}

// Populate employee dropdown in form
function populateFormEmployees() {
  const employeeSelect = document.getElementById("employee");
  employeeSelect.innerHTML = '<option value="">Select Employee</option>';
  employeesData.forEach(emp => {
    const option = document.createElement("option");
    option.value = emp.id;
    option.textContent = emp.full_name;
    employeeSelect.appendChild(option);
  });
}

// Fetch leave requests from API
function fetchLeaves() {
  authenticatedFetch(LEV_API + "list/")
    .then(res => {
      if (!res.ok) throw new Error('Failed to fetch leave requests');
      return res.json();
    })
    .then(data => {
      leavesData = data;
      renderTable(leavesData);
    })
    .catch(error => {
      console.error('Error fetching leave requests:', error);
      showAlert('Failed to load leave requests', 'danger');
    });
}

// Calculate leave duration
function calculateDuration(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end dates
  return diffDays;
}

// Format leave type display
function formatLeaveType(type) {
  const types = {
    'sick': 'Sick Leave',
    'annual': 'Annual Leave',
    'emergency': 'Emergency Leave',
    'other': 'Other'
  };
  return types[type] || type;
}

// Render the leave requests table
function renderTable(data) {
  const tbody = document.querySelector("#leave-table tbody");
  tbody.innerHTML = "";
  
  if (data.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="text-center">No leave requests found</td>
      </tr>
    `;
    return;
  }
  
  data.forEach(leave => {
    const empName = employeeMap[leave.employee] || "Unknown";
    const startDate = new Date(leave.start_date).toLocaleDateString();
    const endDate = new Date(leave.end_date).toLocaleDateString();
    const duration = calculateDuration(leave.start_date, leave.end_date);
    const leaveType = formatLeaveType(leave.leave_type);
    
    tbody.innerHTML += `
      <tr>
        <td>${leave.id}</td>
        <td>${empName}</td>
        <td>
          <span class="alert alert-${getLeaveTypeColor(leave.leave_type)}" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;">
            ${leaveType}
          </span>
        </td>
        <td>${startDate}</td>
        <td>${endDate}</td>
        <td>${duration} day${duration !== 1 ? 's' : ''}</td>
        <td>${leave.reason ? (leave.reason.length > 30 ? leave.reason.substring(0, 30) + '...' : leave.reason) : 'No reason provided'}</td>
        <td>
          <div class="action-buttons">
            <button class="btn btn-sm btn-primary" onclick="editLeave(${leave.id})" title="Edit">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn btn-sm btn-danger" onclick="openDeleteModal(${leave.id})" title="Delete">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  });
}

// Get color for leave type badge
function getLeaveTypeColor(type) {
  const colors = {
    'sick': 'warning',
    'annual': 'success',
    'emergency': 'danger',
    'other': 'secondary'
  };
  return colors[type] || 'secondary';
}

// Apply filters to the table
function applyFilters() {
  const employee = document.getElementById("filter-employee").value.toLowerCase();
  const type = document.getElementById("filter-type").value;
  const startDate = document.getElementById("filter-start").value;
  const endDate = document.getElementById("filter-end").value;

  const filtered = leavesData.filter(leave => {
    const empName = employeeMap[leave.employee]?.toLowerCase() || "";
    
    const matchesEmployee = empName.includes(employee);
    const matchesType = !type || leave.leave_type === type;
    const matchesStartDate = !startDate || leave.start_date >= startDate;
    const matchesEndDate = !endDate || leave.end_date <= endDate;
    
    return matchesEmployee && matchesType && matchesStartDate && matchesEndDate;
  });

  renderTable(filtered);
}

// Modal functions
function openAddModal() {
  currentEditId = null;
  document.getElementById('modalTitle').textContent = 'Add Leave Request';
  document.getElementById('saveBtn').innerHTML = '<i class="fas fa-save"></i> Save';
  resetForm();
  document.getElementById('leaveModal').classList.add('show');
}

function editLeave(id) {
  const leave = leavesData.find(l => l.id === id);
  if (!leave) {
    showAlert('Leave request not found', 'danger');
    return;
  }
  
  currentEditId = id;
  document.getElementById('modalTitle').textContent = 'Edit Leave Request';
  document.getElementById('saveBtn').innerHTML = '<i class="fas fa-save"></i> Update';
  
  // Populate form with leave data
  document.getElementById('leaveId').value = leave.id;
  document.getElementById('employee').value = leave.employee;
  document.getElementById('leaveType').value = leave.leave_type;
  document.getElementById('startDate').value = leave.start_date;
  document.getElementById('endDate').value = leave.end_date;
  document.getElementById('reason').value = leave.reason || '';
  
  document.getElementById('leaveModal').classList.add('show');
}

function closeModal() {
  document.getElementById('leaveModal').classList.remove('show');
  resetForm();
}

function resetForm() {
  document.getElementById('leaveForm').reset();
  document.getElementById('leaveId').value = '';
}

// Save leave request (create or update)
function saveLeave() {
  const formData = {
    employee: document.getElementById('employee').value,
    leave_type: document.getElementById('leaveType').value,
    start_date: document.getElementById('startDate').value,
    end_date: document.getElementById('endDate').value,
    reason: document.getElementById('reason').value.trim() || null
  };

  // Validation
  if (!formData.employee || !formData.leave_type || !formData.start_date || !formData.end_date) {
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

  const url = currentEditId ? `${LEV_API}update/${currentEditId}/` : `${LEV_API}create/`;
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
    const message = currentEditId ? 'Leave request updated successfully' : 'Leave request created successfully';
    showAlert(message, 'success');
    closeModal();
    fetchLeaves(); // Refresh the table
  })
  .catch(error => {
    console.error('Error saving leave request:', error);
    showAlert('Failed to save leave request', 'danger');
  })
  .finally(() => {
    saveBtn.innerHTML = originalText;
    saveBtn.disabled = false;
  });
}

// Delete modal functions
function openDeleteModal(id) {
  const leave = leavesData.find(l => l.id === id);
  if (!leave) {
    showAlert('Leave request not found', 'danger');
    return;
  }
  
  deleteLeaveId = id;
  document.getElementById('deleteLeaveInfo').innerHTML = `
    <p><strong>Employee:</strong> ${employeeMap[leave.employee] || 'Unknown'}</p>
    <p><strong>Leave Type:</strong> ${formatLeaveType(leave.leave_type)}</p>
    <p><strong>Period:</strong> ${new Date(leave.start_date).toLocaleDateString()} - ${new Date(leave.end_date).toLocaleDateString()}</p>
    <p><strong>Duration:</strong> ${calculateDuration(leave.start_date, leave.end_date)} days</p>
  `;
  
  document.getElementById('deleteModal').classList.add('show');
}

function closeDeleteModal() {
  document.getElementById('deleteModal').classList.remove('show');
  deleteLeaveId = null;
}

function confirmDelete() {
  if (!deleteLeaveId) return;
  
  const confirmBtn = document.getElementById('confirmDeleteBtn');
  const originalText = confirmBtn.innerHTML;
  confirmBtn.innerHTML = '<span class="spinner"></span> Deleting...';
  confirmBtn.disabled = true;

  authenticatedFetch(`${LEV_API}delete/${deleteLeaveId}/`, {
    method: 'DELETE'
  })
  .then(res => {
    if (!res.ok) throw new Error('Failed to delete leave request');
    showAlert('Leave request deleted successfully', 'success');
    closeDeleteModal();
    fetchLeaves(); // Refresh the table
  })
  .catch(error => {
    console.error('Error deleting leave request:', error);
    showAlert('Failed to delete leave request', 'danger');
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
