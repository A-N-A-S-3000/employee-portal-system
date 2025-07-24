const SWAP_API = "http://127.0.0.1:8000/swap-requests/";
const EMP_API = "http://127.0.0.1:8000/employees/";
const SHIFT_API = "http://127.0.0.1:8000/shifts/";

let swapData = [];
let employeesData = [];
let shiftsData = [];
let empMap = {};
let shiftMap = {};
let currentEditId = null;
let deleteSwapId = null;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
  fetchInitialData();
  setupEventListeners();
});

// Setup all event listeners
function setupEventListeners() {
  // Filter event listeners
  ["filter-from", "filter-to", "filter-shift", "filter-reason"].forEach(id => {
    document.getElementById(id).addEventListener("input", applyFilters);
  });

  // Modal event listeners
  document.getElementById('swapModal').addEventListener('click', function(e) {
    if (e.target === this) closeModal();
  });

  document.getElementById('deleteModal').addEventListener('click', function(e) {
    if (e.target === this) closeDeleteModal();
  });

  // Form submission
  document.getElementById('swapForm').addEventListener('submit', function(e) {
    e.preventDefault();
    saveSwap();
  });
}

// Fetch initial data
function fetchInitialData() {
  Promise.all([
    authenticatedFetch(EMP_API + "list/").then(res => {
      if (!res.ok) throw new Error('Failed to fetch employees');
      return res.json();
    }),
    authenticatedFetch(SHIFT_API + "list/").then(res => {
      if (!res.ok) throw new Error('Failed to fetch shifts');
      return res.json();
    })
  ])
  .then(([employees, shifts]) => {
    employeesData = employees;
    shiftsData = shifts;
    
    // Build maps for quick lookup
    employees.forEach(emp => empMap[emp.id] = emp.full_name);
    shifts.forEach(shift => {
      const empName = empMap[shift.employee] || 'Unknown';
      const dateRange = `${new Date(shift.start_date).toLocaleDateString()} - ${new Date(shift.end_date).toLocaleDateString()}`;
      shiftMap[shift.id] = `${empName} (${dateRange}) - ${shift.location}`;
    });
    
    // Populate form dropdowns
    populateFormDropdowns();
    
    // Fetch swap requests
    fetchSwaps();
  })
  .catch(error => {
    console.error('Error fetching initial data:', error);
    showAlert('Failed to load initial data', 'danger');
  });
}

// Populate form dropdowns
function populateFormDropdowns() {
  // Populate employee dropdowns
  const fromEmployeeSelect = document.getElementById("fromEmployee");
  const toEmployeeSelect = document.getElementById("toEmployee");
  
  [fromEmployeeSelect, toEmployeeSelect].forEach(select => {
    select.innerHTML = '<option value="">Select Employee</option>';
    employeesData.forEach(emp => {
      const option = document.createElement("option");
      option.value = emp.id;
      option.textContent = emp.full_name;
      select.appendChild(option);
    });
  });
  
  // Populate shift dropdown
  const shiftSelect = document.getElementById("shift");
  shiftSelect.innerHTML = '<option value="">Select Shift</option>';
  shiftsData.forEach(shift => {
    const option = document.createElement("option");
    option.value = shift.id;
    option.textContent = shiftMap[shift.id];
    shiftSelect.appendChild(option);
  });
}

// Fetch swap requests from API
function fetchSwaps() {
  authenticatedFetch(SWAP_API + "list/")
    .then(res => {
      if (!res.ok) throw new Error('Failed to fetch swap requests');
      return res.json();
    })
    .then(data => {
      swapData = data;
      renderTable(swapData);
    })
    .catch(error => {
      console.error('Error fetching swap requests:', error);
      showAlert('Failed to load swap requests', 'danger');
    });
}

// Render the swap requests table
function renderTable(data) {
  const tbody = document.querySelector("#swap_requests-table tbody");
  tbody.innerHTML = "";
  
  if (data.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center">No swap requests found</td>
      </tr>
    `;
    return;
  }
  
  data.forEach(swap => {
    const fromEmp = empMap[swap.from_employee] || "Unknown";
    const toEmp = empMap[swap.to_employee] || "Unknown";
    const shiftInfo = shiftMap[swap.shift] || `Shift #${swap.shift}`;
    const createdAt = new Date(swap.created_at).toLocaleDateString();
    
    tbody.innerHTML += `
      <tr>
        <td>${swap.id}</td>
        <td>${fromEmp}</td>
        <td>${toEmp}</td>
        <td>${shiftInfo}</td>
        <td>${swap.reason.length > 50 ? swap.reason.substring(0, 50) + '...' : swap.reason}</td>
        <td>${createdAt}</td>
        <td>
          <div class="action-buttons">
            <button class="btn btn-sm btn-primary" onclick="editSwap(${swap.id})" title="Edit">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn btn-sm btn-danger" onclick="openDeleteModal(${swap.id})" title="Delete">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  });
}

function applyFilters() {
  const fromFilter = document.getElementById("filter-from").value.toLowerCase();
  const toFilter = document.getElementById("filter-to").value.toLowerCase();
  const shiftFilter = document.getElementById("filter-shift").value.toLowerCase();
  const reasonFilter = document.getElementById("filter-reason").value.toLowerCase();

  const filtered = swapData.filter(swap => {
    const fromEmp = (empMap[swap.from_employee] || "").toLowerCase();
    const toEmp = (empMap[swap.to_employee] || "").toLowerCase();
    const shiftInfo = (shiftMap[swap.shift] || "").toLowerCase();
    
    return (
      fromEmp.includes(fromFilter) &&
      toEmp.includes(toFilter) &&
      shiftInfo.includes(shiftFilter) &&
      swap.reason.toLowerCase().includes(reasonFilter)
    );
  });

  renderTable(filtered);
}

// Modal functions
function openAddModal() {
  currentEditId = null;
  document.getElementById('modalTitle').textContent = 'Add Swap Request';
  document.getElementById('saveBtn').innerHTML = '<i class="fas fa-save"></i> Save';
  resetForm();
  document.getElementById('swapModal').classList.add('show');
}

function editSwap(id) {
  const swap = swapData.find(s => s.id === id);
  if (!swap) {
    showAlert('Swap request not found', 'danger');
    return;
  }
  
  currentEditId = id;
  document.getElementById('modalTitle').textContent = 'Edit Swap Request';
  document.getElementById('saveBtn').innerHTML = '<i class="fas fa-save"></i> Update';
  
  // Populate form with swap data
  document.getElementById('swapId').value = swap.id;
  document.getElementById('fromEmployee').value = swap.from_employee;
  document.getElementById('toEmployee').value = swap.to_employee;
  document.getElementById('shift').value = swap.shift;
  document.getElementById('reason').value = swap.reason;
  
  document.getElementById('swapModal').classList.add('show');
}

function closeModal() {
  document.getElementById('swapModal').classList.remove('show');
  resetForm();
}

function resetForm() {
  document.getElementById('swapForm').reset();
  document.getElementById('swapId').value = '';
}

// Save swap request (create or update)
function saveSwap() {
  const formData = {
    from_employee: document.getElementById('fromEmployee').value,
    to_employee: document.getElementById('toEmployee').value,
    shift: document.getElementById('shift').value,
    reason: document.getElementById('reason').value.trim()
  };

  // Validation
  if (!formData.from_employee || !formData.to_employee || !formData.shift || !formData.reason) {
    showAlert('Please fill in all required fields', 'danger');
    return;
  }

  // Validate that from and to employees are different
  if (formData.from_employee === formData.to_employee) {
    showAlert('From and To employees must be different', 'danger');
    return;
  }

  const saveBtn = document.getElementById('saveBtn');
  const originalText = saveBtn.innerHTML;
  saveBtn.innerHTML = '<span class="spinner"></span> Saving...';
  saveBtn.disabled = true;

  const url = currentEditId ? `${SWAP_API}update/${currentEditId}/` : `${SWAP_API}create/`;
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
    const message = currentEditId ? 'Swap request updated successfully' : 'Swap request created successfully';
    showAlert(message, 'success');
    closeModal();
    fetchSwaps(); // Refresh the table
  })
  .catch(error => {
    console.error('Error saving swap request:', error);
    showAlert('Failed to save swap request', 'danger');
  })
  .finally(() => {
    saveBtn.innerHTML = originalText;
    saveBtn.disabled = false;
  });
}

// Delete modal functions
function openDeleteModal(id) {
  const swap = swapData.find(s => s.id === id);
  if (!swap) {
    showAlert('Swap request not found', 'danger');
    return;
  }
  
  deleteSwapId = id;
  document.getElementById('deleteSwapInfo').innerHTML = `
    <p><strong>From:</strong> ${empMap[swap.from_employee] || 'Unknown'}</p>
    <p><strong>To:</strong> ${empMap[swap.to_employee] || 'Unknown'}</p>
    <p><strong>Shift:</strong> ${shiftMap[swap.shift] || `Shift #${swap.shift}`}</p>
    <p><strong>Reason:</strong> ${swap.reason}</p>
  `;
  
  document.getElementById('deleteModal').classList.add('show');
}

function closeDeleteModal() {
  document.getElementById('deleteModal').classList.remove('show');
  deleteSwapId = null;
}

function confirmDelete() {
  if (!deleteSwapId) return;
  
  const confirmBtn = document.getElementById('confirmDeleteBtn');
  const originalText = confirmBtn.innerHTML;
  confirmBtn.innerHTML = '<span class="spinner"></span> Deleting...';
  confirmBtn.disabled = true;

  authenticatedFetch(`${SWAP_API}delete/${deleteSwapId}/`, {
    method: 'DELETE'
  })
  .then(res => {
    if (!res.ok) throw new Error('Failed to delete swap request');
    showAlert('Swap request deleted successfully', 'success');
    closeDeleteModal();
    fetchSwaps(); // Refresh the table
  })
  .catch(error => {
    console.error('Error deleting swap request:', error);
    showAlert('Failed to delete swap request', 'danger');
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
