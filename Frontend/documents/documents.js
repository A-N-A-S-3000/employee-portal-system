const DOC_API = "http://127.0.0.1:8000/documents/";
const EMP_API = "http://127.0.0.1:8000/employees/";

let documentsData = [];
let employeeMap = {};
let employeesList = [];
let currentEditId = null;
let deleteDocumentId = null;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
  fetchEmployees();
  setupEventListeners();
  
  // Check for URL parameters and apply employee filter
  const urlParams = new URLSearchParams(window.location.search);
  const employeeFilter = urlParams.get('employee');
  if (employeeFilter) {
    // Set the filter field and apply filters after data is loaded
    setTimeout(() => {
      document.getElementById('filter-employee').value = employeeFilter;
      applyFilters();
      // Show a notification with back link
      showEmployeeFilterNotification(employeeFilter);
    }, 500); // Wait for data to load
  }
});

// Setup all event listeners
function setupEventListeners() {
  // Filter event listeners
  ["filter-employee", "filter-type", "filter-docid", "filter-issue", "filter-expiry", "filter-status"].forEach(id => {
    document.getElementById(id).addEventListener("input", applyFilters);
  });

  // Also add change event for select dropdown
  document.getElementById("filter-status").addEventListener("change", applyFilters);

  // Modal event listeners
  document.getElementById('documentModal').addEventListener('click', function(e) {
    if (e.target === this) closeModal();
  });

  document.getElementById('deleteModal').addEventListener('click', function(e) {
    if (e.target === this) closeDeleteModal();
  });

  // Form submission
  document.getElementById('documentForm').addEventListener('submit', function(e) {
    e.preventDefault();
    saveDocument();
  });
}

// Fetch employees and populate dropdowns
function fetchEmployees() {
  authenticatedFetch(EMP_API + "list/")
    .then(res => {
      if (!res.ok) throw new Error('Failed to fetch employees');
      return res.json();
    })
    .then(data => {
      employeesList = data;
      
      // Build employee map for quick lookup
      data.forEach(emp => {
        employeeMap[emp.id] = emp.full_name;
      });
      
      // Populate form dropdown
      populateFormEmployees();
      
      // Now fetch documents
      fetchDocuments();
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
  employeesList.forEach(emp => {
    const option = document.createElement("option");
    option.value = emp.id;
    option.textContent = emp.full_name;
    employeeSelect.appendChild(option);
  });
}

// Fetch documents from API
function fetchDocuments() {
  authenticatedFetch(DOC_API + "list/")
    .then(res => {
      if (!res.ok) throw new Error('Failed to fetch documents');
      return res.json();
    })
    .then(data => {
      documentsData = data;
      renderTable(documentsData);
    })
    .catch(error => {
      console.error('Error fetching documents:', error);
      showAlert('Failed to load documents', 'danger');
    });
}

// Get document status based on expiry date
function getDocumentStatus(expiryDate) {
  if (!expiryDate) return { status: 'No Expiry', class: 'text-secondary' };
  
  const today = new Date();
  const expiry = new Date(expiryDate);
  const diffTime = expiry - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) {
    return { status: 'Expired', class: 'alert-danger' };
  } else if (diffDays <= 30) {
    return { status: 'Expiring Soon', class: 'alert-warning' };
  } else {
    return { status: 'Valid', class: 'alert-success' };
  }
}

// Get document status key for filtering
function getDocumentStatusKey(expiryDate) {
  if (!expiryDate) return 'no-expiry';
  
  const today = new Date();
  const expiry = new Date(expiryDate);
  const diffTime = expiry - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) {
    return 'expired';
  } else if (diffDays <= 30) {
    return 'expiring';
  } else {
    return 'valid';
  }
}

// Render the documents table
function renderTable(data) {
  const tbody = document.querySelector("#documents-table tbody");
  tbody.innerHTML = "";
  
  if (data.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9" class="text-center">No documents found</td>
      </tr>
    `;
    return;
  }
  
  data.forEach(doc => {
    const empName = employeeMap[doc.employee] || "Unknown";
    const issueDate = doc.issue_date ? new Date(doc.issue_date).toLocaleDateString() : 'N/A';
    const expiryDate = doc.expiry_date ? new Date(doc.expiry_date).toLocaleDateString() : 'N/A';
    const statusInfo = getDocumentStatus(doc.expiry_date);
    const documentLink = doc.document_link ? 
      `<a href="${doc.document_link}" target="_blank" title="View Document" class="btn btn-sm btn-info">
        <i class="fas fa-external-link-alt"></i>
      </a>` : 'N/A';
    
    tbody.innerHTML += `
      <tr>
        <td>${doc.id}</td>
        <td>${empName}</td>
        <td>${doc.doc_type}</td>
        <td>${doc.document_id || 'N/A'}</td>
        <td>${issueDate}</td>
        <td>${expiryDate}</td>
        <td>${documentLink}</td>
        <td>
          <span class="alert ${statusInfo.class}" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;">
            ${statusInfo.status}
          </span>
        </td>
        <td>
          <div class="action-buttons">
            <button class="btn btn-sm btn-primary" onclick="editDocument(${doc.id})" title="Edit">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn btn-sm btn-danger" onclick="openDeleteModal(${doc.id})" title="Delete">
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
  const type = document.getElementById("filter-type").value.toLowerCase();
  const docId = document.getElementById("filter-docid").value.toLowerCase();
  const issueDate = document.getElementById("filter-issue").value;
  const expiryDate = document.getElementById("filter-expiry").value;
  const status = document.getElementById("filter-status").value;

  const filtered = documentsData.filter(doc => {
    const empName = employeeMap[doc.employee]?.toLowerCase() || "";
    const matchesEmployee = employee === "" || empName.includes(employee);
    const matchesType = type === "" || doc.doc_type.toLowerCase().includes(type);
    const matchesDocId = docId === "" || (doc.document_id || "").toLowerCase().includes(docId);
    const matchesIssueDate = issueDate === "" || doc.issue_date === issueDate;
    const matchesExpiryDate = expiryDate === "" || doc.expiry_date === expiryDate;
    const matchesStatus = status === "" || getDocumentStatusKey(doc.expiry_date) === status;
    
    return matchesEmployee && matchesType && matchesDocId && matchesIssueDate && matchesExpiryDate && matchesStatus;
  });

  renderTable(filtered);
}

// Clear all filters
function clearFilters() {
  document.getElementById("filter-employee").value = "";
  document.getElementById("filter-type").value = "";
  document.getElementById("filter-docid").value = "";
  document.getElementById("filter-issue").value = "";
  document.getElementById("filter-expiry").value = "";
  document.getElementById("filter-status").value = "";
  renderTable(documentsData);
  showAlert('Filters cleared', 'info');
}

// Show notification when filtering by employee from URL
function showEmployeeFilterNotification(employeeName) {
  const alertContainer = document.getElementById('alert-container');
  alertContainer.innerHTML = `
    <div class="alert alert-info">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span>
          <i class="fas fa-info-circle"></i> 
          Showing documents for: <strong>${employeeName}</strong>
        </span>
        <div>
          <button onclick="clearFilters()" class="btn btn-sm btn-outline btn-primary" style="margin-right: 0.5rem;">
            <i class="fas fa-times"></i> Clear Filter
          </button>
          <a href="../employees/employees.html" class="btn btn-sm btn-secondary">
            <i class="fas fa-arrow-left"></i> Back to Employees
          </a>
        </div>
      </div>
    </div>
  `;
}

// Modal functions
function openAddModal() {
  currentEditId = null;
  document.getElementById('modalTitle').textContent = 'Add Document';
  document.getElementById('saveBtn').innerHTML = '<i class="fas fa-save"></i> Save';
  resetForm();
  document.getElementById('documentModal').classList.add('show');
}

function editDocument(id) {
  const docData = documentsData.find(doc => doc.id === id);
  if (!docData) {
    showAlert('Document not found', 'danger');
    return;
  }
  
  currentEditId = id;
  document.getElementById('modalTitle').textContent = 'Edit Document';
  document.getElementById('saveBtn').innerHTML = '<i class="fas fa-save"></i> Update';
  
  // Populate form with document data
  document.getElementById('documentId').value = docData.id;
  document.getElementById('employee').value = docData.employee;
  document.getElementById('documentType').value = docData.doc_type;
  document.getElementById('documentIdField').value = docData.document_id || '';
  document.getElementById('issueDate').value = docData.issue_date || '';
  document.getElementById('expiryDate').value = docData.expiry_date || '';
  document.getElementById('documentLink').value = docData.document_link || '';
  
  document.getElementById('documentModal').classList.add('show');
}

function closeModal() {
  document.getElementById('documentModal').classList.remove('show');
  resetForm();
}

function resetForm() {
  document.getElementById('documentForm').reset();
  document.getElementById('documentId').value = '';
}

// Save document (create or update)
function saveDocument() {
  const formData = {
    employee: document.getElementById('employee').value,
    doc_type: document.getElementById('documentType').value.trim(),
    document_id: document.getElementById('documentIdField').value.trim() || null,
    issue_date: document.getElementById('issueDate').value || null,
    expiry_date: document.getElementById('expiryDate').value || null,
    document_link: document.getElementById('documentLink').value.trim() || null
  };

  // Validation
  if (!formData.employee || !formData.doc_type) {
    showAlert('Please fill in all required fields', 'danger');
    return;
  }

  const saveBtn = document.getElementById('saveBtn');
  const originalText = saveBtn.innerHTML;
  saveBtn.innerHTML = '<span class="spinner"></span> Saving...';
  saveBtn.disabled = true;

  const url = currentEditId ? `${DOC_API}update/${currentEditId}/` : `${DOC_API}create/`;
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
    const message = currentEditId ? 'Document updated successfully' : 'Document created successfully';
    showAlert(message, 'success');
    closeModal();
    fetchDocuments(); // Refresh the table
  })
  .catch(error => {
    console.error('Error saving document:', error);
    showAlert('Failed to save document', 'danger');
  })
  .finally(() => {
    saveBtn.innerHTML = originalText;
    saveBtn.disabled = false;
  });
}

// Delete modal functions
function openDeleteModal(id) {
  const docData = documentsData.find(doc => doc.id === id);
  if (!docData) {
    showAlert('Document not found', 'danger');
    return;
  }
  
  deleteDocumentId = id;
  document.getElementById('deleteDocumentInfo').innerHTML = `
    <p><strong>Employee:</strong> ${employeeMap[docData.employee] || 'Unknown'}</p>
    <p><strong>Document Type:</strong> ${docData.doc_type}</p>
    <p><strong>Document ID:</strong> ${docData.document_id || 'N/A'}</p>
  `;
  
  document.getElementById('deleteModal').classList.add('show');
}

function closeDeleteModal() {
  document.getElementById('deleteModal').classList.remove('show');
  deleteDocumentId = null;
}

function confirmDelete() {
  if (!deleteDocumentId) return;
  
  const confirmBtn = document.getElementById('confirmDeleteBtn');
  const originalText = confirmBtn.innerHTML;
  confirmBtn.innerHTML = '<span class="spinner"></span> Deleting...';
  confirmBtn.disabled = true;

  authenticatedFetch(`${DOC_API}delete/${deleteDocumentId}/`, {
    method: 'DELETE'
  })
  .then(res => {
    if (!res.ok) throw new Error('Failed to delete document');
    showAlert('Document deleted successfully', 'success');
    closeDeleteModal();
    fetchDocuments(); // Refresh the table
  })
  .catch(error => {
    console.error('Error deleting document:', error);
    showAlert('Failed to delete document', 'danger');
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
