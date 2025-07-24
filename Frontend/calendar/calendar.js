const DOC_API = "http://127.0.0.1:8000/documents/";
const EMP_API = "http://127.0.0.1:8000/employees/";

let documentsData = [];
let filteredDocuments = [];
let employeeMap = {};
let employeesList = [];
let currentDate = new Date();
let currentMonth = currentDate.getMonth();
let currentYear = currentDate.getFullYear();

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
  fetchEmployees();
  setupEventListeners();
});

// Setup all event listeners
function setupEventListeners() {
  // Filter event listeners
  ["filter-employee", "filter-type", "filter-status", "filter-range"].forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      if (element.tagName === 'SELECT') {
        element.addEventListener("change", applyFilters);
      } else {
        element.addEventListener("input", applyFilters);
      }
    }
  });

  // Modal event listeners
  document.getElementById('documentModal').addEventListener('click', function(e) {
    if (e.target === this) closeModal();
  });
}

// Fetch employees and populate employee map
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
      
      // Populate filter dropdown
      populateEmployeeFilter();
      
      // Now fetch documents
      fetchDocuments();
    })
    .catch(error => {
      console.error('Error fetching employees:', error);
      showAlert('Failed to load employees', 'danger');
    });
}

// Populate employee filter dropdown
function populateEmployeeFilter() {
  const employeeSelect = document.getElementById("filter-employee");
  if (employeeSelect) {
    employeeSelect.innerHTML = '<option value="">All Employees</option>';
    employeesList.forEach(emp => {
      const option = document.createElement("option");
      option.value = emp.id;
      option.textContent = emp.full_name;
      employeeSelect.appendChild(option);
    });
  }
}

// Fetch documents from API
function fetchDocuments() {
  authenticatedFetch(DOC_API + "list/")
    .then(res => {
      if (!res.ok) throw new Error('Failed to fetch documents');
      return res.json();
    })
    .then(data => {
      documentsData = data.filter(doc => doc.expiry_date); // Only documents with expiry dates
      filteredDocuments = [...documentsData]; // Initialize filtered documents
      renderCalendar();
      updateSummary();
    })
    .catch(error => {
      console.error('Error fetching documents:', error);
      showAlert('Failed to load documents', 'danger');
    });
}

// Get document status based on expiry date
function getDocumentStatus(expiryDate) {
  if (!expiryDate) return { status: 'No Expiry', class: 'valid' };
  
  const today = new Date();
  const expiry = new Date(expiryDate);
  const diffTime = expiry - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) {
    return { status: 'Expired', class: 'expired' };
  } else if (diffDays <= 30) {
    return { status: 'Expiring Soon', class: 'expiring' };
  } else {
    return { status: 'Valid', class: 'valid' };
  }
}

// Get document status key for filtering
function getDocumentStatusKey(expiryDate) {
  if (!expiryDate) return 'valid';
  
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

// Apply filters to documents
function applyFilters() {
  const employee = document.getElementById("filter-employee").value;
  const type = document.getElementById("filter-type").value.toLowerCase();
  const status = document.getElementById("filter-status").value;
  const range = document.getElementById("filter-range").value;

  filteredDocuments = documentsData.filter(doc => {
    const empName = employeeMap[doc.employee] || "";
    const matchesEmployee = employee === "" || doc.employee.toString() === employee;
    const matchesType = type === "" || doc.doc_type.toLowerCase().includes(type);
    const matchesStatus = status === "" || getDocumentStatusKey(doc.expiry_date) === status;
    const matchesRange = matchesDateRange(doc.expiry_date, range);
    
    return matchesEmployee && matchesType && matchesStatus && matchesRange;
  });

  renderCalendar();
  updateSummary();
  
  // Show filter summary
  const totalFiltered = filteredDocuments.length;
  const totalDocs = documentsData.length;
  if (totalFiltered < totalDocs) {
    showAlert(`Showing ${totalFiltered} of ${totalDocs} documents`, 'info');
  }
}

// Check if document matches date range filter
function matchesDateRange(expiryDate, range) {
  if (!range || !expiryDate) return true;
  
  const today = new Date();
  const expiry = new Date(expiryDate);
  const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const currentMonthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  
  switch (range) {
    case 'this-month':
      return expiry >= currentMonthStart && expiry <= currentMonthEnd;
    case 'next-month':
      const nextMonthStart = new Date(today.getFullYear(), today.getMonth() + 1, 1);
      const nextMonthEnd = new Date(today.getFullYear(), today.getMonth() + 2, 0);
      return expiry >= nextMonthStart && expiry <= nextMonthEnd;
    case 'next-3-months':
      const threeMonthsFromNow = new Date(today);
      threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);
      return expiry >= today && expiry <= threeMonthsFromNow;
    case 'next-6-months':
      const sixMonthsFromNow = new Date(today);
      sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);
      return expiry >= today && expiry <= sixMonthsFromNow;
    default:
      return true;
  }
}

// Clear all filters
function clearFilters() {
  document.getElementById("filter-employee").value = "";
  document.getElementById("filter-type").value = "";
  document.getElementById("filter-status").value = "";
  document.getElementById("filter-range").value = "";
  
  // Remove active state from summary items
  document.querySelectorAll('.summary-item').forEach(item => {
    item.classList.remove('active');
  });
  
  filteredDocuments = [...documentsData];
  renderCalendar();
  updateSummary();
  showAlert('Filters cleared', 'info');
}

// Update summary counts
function updateSummary() {
  const total = filteredDocuments.length;
  let expired = 0, expiring = 0, valid = 0;
  
  filteredDocuments.forEach(doc => {
    const statusKey = getDocumentStatusKey(doc.expiry_date);
    switch (statusKey) {
      case 'expired':
        expired++;
        break;
      case 'expiring':
        expiring++;
        break;
      case 'valid':
        valid++;
        break;
    }
  });
  
  document.getElementById('total-documents').textContent = total;
  document.getElementById('expired-count').textContent = expired;
  document.getElementById('expiring-count').textContent = expiring;
  document.getElementById('valid-count').textContent = valid;
}

// Filter by status from summary cards
function filterByStatus(status) {
  // Clear other filters first
  document.getElementById("filter-employee").value = "";
  document.getElementById("filter-type").value = "";
  document.getElementById("filter-range").value = "";
  
  // Set status filter
  const statusFilter = document.getElementById("filter-status");
  if (status === 'all') {
    statusFilter.value = "";
  } else {
    statusFilter.value = status;
  }
  
  // Apply filters
  applyFilters();
  
  // Update active state of summary items
  document.querySelectorAll('.summary-item').forEach(item => {
    item.classList.remove('active');
  });
  
  // Add active class to clicked item
  const clickedItem = event.target.closest('.summary-item');
  if (clickedItem) {
    clickedItem.classList.add('active');
  }
  
  // Show alert
  const statusName = status === 'all' ? 'all documents' : 
                    status === 'expired' ? 'expired documents' :
                    status === 'expiring' ? 'expiring documents' : 'valid documents';
  showAlert(`Filtered to show ${statusName}`, 'info');
}

// Render the calendar
function renderCalendar() {
  updateMonthDisplay();
  
  const calendarBody = document.getElementById('calendar-body');
  calendarBody.innerHTML = '';
  
  // Get first day of month and number of days
  const firstDay = new Date(currentYear, currentMonth, 1);
  const lastDay = new Date(currentYear, currentMonth + 1, 0);
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - firstDay.getDay()); // Start from Sunday
  
  // Create 6 weeks (42 days) to ensure full month display
  for (let i = 0; i < 42; i++) {
    const cellDate = new Date(startDate);
    cellDate.setDate(startDate.getDate() + i);
    
    const dayElement = createCalendarDay(cellDate);
    calendarBody.appendChild(dayElement);
  }
  
  // Ensure perfect alignment after rendering
  setTimeout(ensureCalendarAlignment, 10);
}

// Create a calendar day element
function createCalendarDay(date) {
  const day = document.createElement('div');
  day.className = 'calendar-day';
  
  const isCurrentMonth = date.getMonth() === currentMonth;
  const isToday = isDateToday(date);
  
  if (!isCurrentMonth) {
    day.classList.add('other-month');
  }
  
  if (isToday) {
    day.classList.add('today');
  }
  
  // Add day number
  const dayNumber = document.createElement('div');
  dayNumber.className = 'day-number';
  dayNumber.textContent = date.getDate();
  day.appendChild(dayNumber);
  
  // Add document indicators
  const indicators = document.createElement('div');
  indicators.className = 'document-indicators';
  
  const dateString = formatDateForComparison(date);
  const documentsForDay = filteredDocuments.filter(doc => 
    formatDateForComparison(new Date(doc.expiry_date)) === dateString
  );
  
  if (documentsForDay.length > 0) {
    // Show up to 3 document indicators
    const maxVisible = 3;
    documentsForDay.slice(0, maxVisible).forEach(doc => {
      const indicator = document.createElement('div');
      indicator.className = `document-indicator ${getDocumentStatus(doc.expiry_date).class}`;
      indicator.textContent = `${employeeMap[doc.employee] || 'Unknown'}: ${doc.doc_type}`;
      indicator.title = `Click to view in documents page - ${employeeMap[doc.employee] || 'Unknown'} - ${doc.doc_type}`;
      
      // Add click handler to navigate to documents page with employee filter
      indicator.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent day click
        const employeeName = employeeMap[doc.employee] || 'Unknown';
        const documentsUrl = `../documents/documents.html?employee=${encodeURIComponent(employeeName)}`;
        window.location.href = documentsUrl;
      });
      
      indicators.appendChild(indicator);
    });
    
    // Show count if more than maxVisible
    if (documentsForDay.length > maxVisible) {
      const countIndicator = document.createElement('div');
      countIndicator.className = 'document-count';
      countIndicator.textContent = `+${documentsForDay.length - maxVisible} more`;
      countIndicator.addEventListener('click', (e) => {
        e.stopPropagation();
        showDocumentsModal(date, documentsForDay);
      });
      indicators.appendChild(countIndicator);
    }
    
    // Add click handler to show modal for the entire day
    day.addEventListener('click', () => showDocumentsModal(date, documentsForDay));
    day.style.cursor = 'pointer';
  }
  
  day.appendChild(indicators);
  return day;
}

// Check if date is today
function isDateToday(date) {
  const today = new Date();
  return date.getDate() === today.getDate() &&
         date.getMonth() === today.getMonth() &&
         date.getFullYear() === today.getFullYear();
}

// Format date for comparison (YYYY-MM-DD)
function formatDateForComparison(date) {
  return date.getFullYear() + '-' + 
         String(date.getMonth() + 1).padStart(2, '0') + '-' + 
         String(date.getDate()).padStart(2, '0');
}

// Update month display
function updateMonthDisplay() {
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  document.getElementById('currentMonth').textContent = 
    `${monthNames[currentMonth]} ${currentYear}`;
}

// Navigation functions
function previousMonth() {
  currentMonth--;
  if (currentMonth < 0) {
    currentMonth = 11;
    currentYear--;
  }
  renderCalendar();
}

function nextMonth() {
  currentMonth++;
  if (currentMonth > 11) {
    currentMonth = 0;
    currentYear++;
  }
  renderCalendar();
}

function goToToday() {
  const today = new Date();
  currentMonth = today.getMonth();
  currentYear = today.getFullYear();
  renderCalendar();
}

// Show documents modal
function showDocumentsModal(date, documents) {
  const modal = document.getElementById('documentModal');
  const modalTitle = document.getElementById('modalTitle');
  const documentsList = document.getElementById('documentsList');
  
  // Format date for display
  const dateStr = date.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  modalTitle.textContent = `Documents Expiring on ${dateStr}`;
  
  // Clear previous content
  documentsList.innerHTML = '';
  
  if (documents.length === 0) {
    documentsList.innerHTML = '<p class="text-center text-muted">No documents expiring on this date.</p>';
  } else {
    documents.forEach(doc => {
      const statusInfo = getDocumentStatus(doc.expiry_date);
      const documentElement = document.createElement('div');
      documentElement.className = 'document-item';
      
      documentElement.innerHTML = `
        <div class="document-header">
          <div class="document-title">${doc.doc_type}</div>
          <span class="document-status ${statusInfo.class}">${statusInfo.status}</span>
        </div>
        <div class="document-details">
          <div><strong>Employee:</strong> ${employeeMap[doc.employee] || 'Unknown'}</div>
          <div><strong>Document ID:</strong> ${doc.document_id || 'N/A'}</div>
          <div><strong>Issue Date:</strong> ${doc.issue_date ? new Date(doc.issue_date).toLocaleDateString() : 'N/A'}</div>
          <div><strong>Expiry Date:</strong> ${new Date(doc.expiry_date).toLocaleDateString()}</div>
          ${doc.document_link ? `<div><strong>Link:</strong> <a href="${doc.document_link}" target="_blank" class="btn btn-sm btn-info"><i class="fas fa-external-link-alt"></i> View Document</a></div>` : ''}
        </div>
        <div class="document-actions mt-1">
          <a href="../documents/documents.html?employee=${encodeURIComponent(employeeMap[doc.employee] || '')}" class="btn btn-sm btn-primary">
            <i class="fas fa-list"></i> View in Documents Page
          </a>
        </div>
      `;
      
      documentsList.appendChild(documentElement);
    });
  }
  
  modal.classList.add('show');
}

// Show single document modal
function showSingleDocumentModal(document) {
  const modal = document.getElementById('documentModal');
  const modalTitle = document.getElementById('modalTitle');
  const documentsList = document.getElementById('documentsList');
  
  modalTitle.textContent = `Document Details`;
  
  // Clear previous content
  documentsList.innerHTML = '';
  
  const statusInfo = getDocumentStatus(document.expiry_date);
  const documentElement = document.createElement('div');
  documentElement.className = 'document-item single-document';
  
  documentElement.innerHTML = `
    <div class="document-header">
      <div class="document-title">${document.doc_type}</div>
      <span class="document-status ${statusInfo.class}">${statusInfo.status}</span>
    </div>
    <div class="document-details">
      <div><strong>Employee:</strong> ${employeeMap[document.employee] || 'Unknown'}</div>
      <div><strong>Document ID:</strong> ${document.document_id || 'N/A'}</div>
      <div><strong>Issue Date:</strong> ${document.issue_date ? new Date(document.issue_date).toLocaleDateString() : 'N/A'}</div>
      <div><strong>Expiry Date:</strong> ${new Date(document.expiry_date).toLocaleDateString()}</div>
      ${document.document_link ? `<div><strong>Link:</strong> <a href="${document.document_link}" target="_blank" class="btn btn-sm btn-info"><i class="fas fa-external-link-alt"></i> View Document</a></div>` : ''}
    </div>
    <div class="document-actions mt-2">
      <a href="../documents/documents.html?employee=${encodeURIComponent(employeeMap[document.employee] || '')}" class="btn btn-sm btn-primary">
        <i class="fas fa-list"></i> View All Documents for ${employeeMap[document.employee] || 'Employee'}
      </a>
    </div>
  `;
  
  documentsList.appendChild(documentElement);
  modal.classList.add('show');
}

// Close modal
function closeModal() {
  document.getElementById('documentModal').classList.remove('show');
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

// Ensure perfect calendar alignment
function ensureCalendarAlignment() {
  const calendarWrapper = document.querySelector('.calendar-wrapper');
  const calendarHeader = document.querySelector('.calendar-header');
  const calendarBody = document.querySelector('.calendar-body');
  
  if (!calendarWrapper || !calendarHeader || !calendarBody) return;
  
  // Get computed styles to check for alignment issues
  const headerRect = calendarHeader.getBoundingClientRect();
  const bodyRect = calendarBody.getBoundingClientRect();
  
  // If there's a width mismatch, apply table layout as fallback
  if (Math.abs(headerRect.width - bodyRect.width) > 1) {
    console.log('Calendar alignment issue detected, applying table layout fallback');
    
    calendarWrapper.classList.add('force-table');
    calendarHeader.classList.add('force-table');
    calendarBody.classList.add('force-table');
    
    // Add table layout to day headers and calendar days
    const dayHeaders = calendarHeader.querySelectorAll('.day-header');
    const calendarDays = calendarBody.querySelectorAll('.calendar-day');
    
    dayHeaders.forEach(header => header.classList.add('force-table'));
    calendarDays.forEach(day => day.classList.add('force-table'));
  }
}

// Listen for resize events to re-check alignment
window.addEventListener('resize', () => {
  setTimeout(ensureCalendarAlignment, 100);
});
