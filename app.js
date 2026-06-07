// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------
// Currency / locale used for every formatted amount. Change these two values to
// localise the dashboard (e.g. 'en-AU' + 'AUD' for Australian data).
const LOCALE = 'en-US';
const CURRENCY = 'USD';

// Categories dropped entirely on load (treated as non-expenses / internal moves).
const EXCLUDED_CATEGORIES = ['TRANSFERS'];

// Sentinel "items per page" value meaning "show everything".
const ALL_ROWS = Number.MAX_SAFE_INTEGER;

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------
let transactions = [];

// Overview State
let overviewSortColumn = 'date';
let overviewSortDirection = 'desc';
let overviewCategoryFilter = null; // null = All (no filter), Set = selected categories
let overviewDescFilter = '';
let overviewCurrentPage = 1;
let overviewItemsPerPage = 50;

// Category Tab State
let catTabSortColumn = 'date';
let catTabSortDirection = 'desc';
let catTabDescFilter = '';
let catTabCurrentPage = 1;
let catTabItemsPerPage = 50;

// Chart instances (destroyed and recreated on each render)
let overviewCategoryChart = null;
let monthlyTrendChart = null;

// Colors for charts (Neo-Brutalist Palette)
const chartColors = [
  '#FFE600', '#00F0FF', '#FF2E93', '#24E524', '#A259FF',
  '#FF6B00', '#FF00FF', '#00E676', '#4D77FF', '#FFEA00'
];

const categoryIcons = {
  'FOOD-OUT': { icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4z"/></svg>', color: '#dc2626', bg: '#fef2f2' },
  'GROCERIES': { icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 18c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59L5.25 14H19v-2H7.42l.94-2H17l3-6H5.21L4.27 2H1zm16 16c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>', color: '#16a34a', bg: '#f0fdf4' },
  'SHOPPING': { icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18 6h-2c0-2.21-1.79-4-4-4S8 3.79 8 6H6c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-8 0c0-1.1.9-2 2-2s2 .9 2 2h-4zm2 10c-2.21 0-4-1.79-4-4h2c0 1.1.9 2 2 2s2-.9 2-2h2c0 2.21-1.79 4-4 4z"/></svg>', color: '#7c3aed', bg: '#f5f3ff' },
  'KIDS': { icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/></svg>', color: '#db2777', bg: '#fdf2f8' },
  'GYM': { icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.57 14.86L22 13.43 20.57 12 17 15.57 8.43 7 12 3.43 10.57 2 9.14 3.43 7.71 2 5.57 4.14 4.14 2.71 2.71 4.14l1.43 1.43L2 7.71l1.43 1.43L2 10.57 3.43 12 7 8.43 15.57 17 12 20.57 13.43 22l1.43-1.43L16.29 22l2.14-2.14 1.43 1.43 1.43-1.43-1.43-1.43L22 16.29z"/></svg>', color: '#d97706', bg: '#fffbeb' },
  'CAFE': { icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M2 21v-2h18v2H2zm2-4V7c0-1.1.9-2 2-2h12c1.1 0 2 .9 2 2v2c0 1.1-.9 2-2 2h-2v2c0 1.1-.9 2-2 2H6c-1.1 0-2-.9-2-2zm14-6V7h-2v4h2zm-4-4H6v6h8V7z"/></svg>', color: '#0d9488', bg: '#f0fdfa' },
  'TRANSFERS': { icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M16 3l-4 4h3v8h2V7h3l-4-4zM8 21l4-4H9V9H7v8H4l4 4z"/></svg>', color: '#4f46e5', bg: '#eef2ff' },
  'HEALTH': { icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>', color: '#e11d48', bg: '#fff1f2' },
  'UTILITIES': { icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M11 2l-9 12h6v8l9-12h-6V2z"/></svg>', color: '#f97316', bg: '#fff7ed' },
  'TRANSPORT': { icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2c-4 0-8 .5-8 4v9.5C4 17.43 5.57 19 7.5 19L6 20.5v.5h12v-.5L16.5 19c1.93 0 3.5-1.57 3.5-3.5V6c0-3.5-3.58-4-8-4zm0 14c-.83 0-1.5-.67-1.5-1.5S11.17 13 12 13s1.5.67 1.5 1.5S12.83 16 12 16zm6-6H6V7h12v3z"/></svg>', color: '#0891b2', bg: '#ecfeff' },
  'RENT': { icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>', color: '#475569', bg: '#f8fafc' },
  'MELLOW': { icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.5 6.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zm-11 0a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM12 8a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zm-4.5 5c-1.93 0-3.5 1.57-3.5 3.5 0 .96.39 1.84 1.03 2.47A7.004 7.004 0 0 0 12 21c2.24 0 4.24-1.04 5.47-2.64A3.47 3.47 0 0 0 18.5 16.5c0-1.93-1.57-3.5-3.5-3.5-1.2 0-2.26.6-2.88 1.5A3.482 3.482 0 0 0 7.5 13z"/></svg>', color: '#a855f7', bg: '#faf5ff' },
  'CAR': { icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/></svg>', color: '#f97316', bg: '#fff7ed' },
  'HOME-LOAN-EMI': { icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>', color: '#475569', bg: '#f8fafc' },
  'UBET-EATS': { icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 12c0 5 4 9 9 9s9-4 9-9H3z"/></svg>', color: '#ea580c', bg: '#fff7ed' },
  'HOME-EXPENSES': { icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3L2 12h3v8h6v-6h2v6h6v-8h3L12 3z"/></svg>', color: '#e11d48', bg: '#fff1f2' },
  'TECH-EXPENSES': { icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h6v2H8v2h8v-2h-2v-2h6c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H4V4h16v12z"/></svg>', color: '#0284c7', bg: '#f0f9ff' },
  'MOBILE': { icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17 1.01L7 1c-1.1 0-2 .9-2 2v18c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V3c0-1.1-.9-1.99-2-1.99zM17 19H7V5h10v14z"/></svg>', color: '#0891b2', bg: '#ecfeff' },
  'MEDICAL': { icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-1.99.9-1.99 2L3 19c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-1 11h-4v4h-4v-4H6v-4h4V6h4v4h4v4z"/></svg>', color: '#e11d48', bg: '#fff1f2' },
  'HOME-EXPENSES-MISC': { icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3L2 12h3v8h6v-6h2v6h6v-8h3L12 3zm1 14h-2v-2h2v2zm0-4h-2c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2z"/></svg>', color: '#e11d48', bg: '#fff1f2' },
  'LUNCH-AT-OFFICE': { icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M22 9h-4.79l-4.38-6.56c-.19-.28-.51-.44-.83-.44s-.64.16-.83.44L6.79 9H2c-1.1 0-2 .9-2 2v5c0 1.1.9 2 2 2h20c1.1 0 2-.9 2-2v-5c0-1.1-.9-2-2-2zM12 4.8L14.8 9H9.2l2.8-4.2zM22 16H2v-5h20v5z"/></svg>', color: '#0d9488', bg: '#f0fdfa' },
  'CHARGES': { icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18 17H6v-2h12v2zm0-4H6v-2h12v2zm0-4H6V7h12v2zM3 22l1.5-1.5L6 22l1.5-1.5L9 22l1.5-1.5L12 22l1.5-1.5L15 22l1.5-1.5L18 22l1.5-1.5L21 22V2l-1.5 1.5L18 2l-1.5 1.5L15 2l-1.5 1.5L12 2l-1.5 1.5L9 2l-1.5 1.5L6 2l-1.5 1.5L3 2v20z"/></svg>', color: '#4b5563', bg: '#f3f4f6' },
  '_default': { icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 18H6V4h12v16zM8 6h8v2H8V6zm0 4h8v2H8v-2zm0 4h8v2H8v-2z"/></svg>', color: '#6b7280', bg: '#f3f4f6' }
};

function getCategoryConfig(cat) {
  const key = (cat || '').toUpperCase();
  return categoryIcons[key] || categoryIcons['_default'];
}

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  if (typeof ChartDataLabels !== 'undefined') {
    Chart.register(ChartDataLabels);
  }
  fetchData();
});

// Navigation Logic
function initNavigation() {
  const navItems = document.querySelectorAll('.nav-item');

  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      // Update active nav
      navItems.forEach(nav => nav.classList.remove('active'));
      e.target.classList.add('active');

      // Show target view
      const targetId = e.target.getAttribute('data-target');
      document.querySelectorAll('.view').forEach(view => {
        view.classList.remove('active');
      });
      document.getElementById(targetId).classList.add('active');

      // Update page title
      document.getElementById('page-title').textContent = e.target.textContent;

      // Re-render specific view components if needed
      if (targetId === 'view-category') {
        const currentCat = document.getElementById('category-tab-filter').value;
        renderCategoryTabTransactions(currentCat);
        renderCategoryTabCharts(currentCat);
      }
    });
  });
}

// Database storage helpers using IndexedDB
const DB_NAME = "ExpensesDBStore";
const STORE_NAME = "database";

function getStoredDatabase() {
  return new Promise((resolve) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = (e) => {
      e.target.result.createObjectStore(STORE_NAME);
    };
    request.onsuccess = (e) => {
      const db = e.target.result;
      const transaction = db.transaction(STORE_NAME, "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const getReq = store.get("expenses.db");
      getReq.onsuccess = () => resolve(getReq.result);
      getReq.onerror = () => resolve(null);
    };
    request.onerror = () => resolve(null);
  });
}

function storeDatabase(arrayBuffer) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = (e) => {
      e.target.result.createObjectStore(STORE_NAME);
    };
    request.onsuccess = (e) => {
      const db = e.target.result;
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const putReq = store.put(arrayBuffer, "expenses.db");
      putReq.onsuccess = () => resolve();
      putReq.onerror = () => reject(putReq.error);
    };
    request.onerror = () => reject(request.error);
  });
}

// Show/Hide Upload screens
function showUploadScreen() {
  document.getElementById('dashboard-content').style.display = 'none';
  document.getElementById('db-upload-screen').style.display = 'flex';

  // Disable sidebar navigation items during upload
  document.querySelectorAll('.nav-item').forEach(item => {
    item.style.opacity = '0.5';
    item.style.pointerEvents = 'none';
  });
}

function hideUploadScreen() {
  document.getElementById('dashboard-content').style.display = 'block';
  document.getElementById('db-upload-screen').style.display = 'none';

  // Re-enable sidebar navigation items
  document.querySelectorAll('.nav-item').forEach(item => {
    item.style.opacity = '1';
    item.style.pointerEvents = 'auto';
  });
}

// Setup Event Listeners for file upload screen
function setupUploadScreenEvents() {
  const dropZone = document.getElementById('upload-drop-zone');
  const fileInput = document.getElementById('db-file-input');
  const browseBtn = document.getElementById('browse-db-btn');
  const sidebarReloadBtn = document.getElementById('sidebar-reload-btn');

  if (browseBtn && fileInput) {
    browseBtn.addEventListener('click', () => fileInput.click());
  }

  if (fileInput) {
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) handleSelectedFile(file);
    });
  }

  if (dropZone) {
    ['dragenter', 'dragover'].forEach(eventName => {
      dropZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
      }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
      dropZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
      }, false);
    });

    dropZone.addEventListener('drop', (e) => {
      const dt = e.dataTransfer;
      const file = dt.files[0];
      if (file) handleSelectedFile(file);
    });
  }

  if (sidebarReloadBtn) {
    sidebarReloadBtn.addEventListener('click', () => {
      showUploadScreen();
    });
  }
}

function handleSelectedFile(file) {
  const reader = new FileReader();
  reader.onload = async (e) => {
    const arrayBuffer = e.target.result;
    try {
      // Store arrayBuffer in IndexedDB so it persists across reloads
      await storeDatabase(arrayBuffer);
      // Load and parse database using sql.js
      await parseAndLoadDatabase(arrayBuffer);
    } catch (err) {
      console.error(err);
      alert("Error processing the selected SQLite file: " + err.message);
    }
  };
  reader.readAsArrayBuffer(file);
}

// Parse loaded database with WebAssembly sql.js
async function parseAndLoadDatabase(arrayBuffer) {
  try {
    // Show a loading text or indicator
    const browseBtn = document.getElementById('browse-db-btn');
    if (browseBtn) browseBtn.textContent = '⏳ Loading WebAssembly SQLite...';

    // Initialize sql.js WebAssembly
    const SQL = await initSqlJs({
      locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.11.0/${file}`
    });

    const db = new SQL.Database(new Uint8Array(arrayBuffer));

    // Fetch all transaction records
    const res = db.exec("SELECT * FROM expenses");
    db.close();

    if (res.length === 0) {
      throw new Error("The 'expenses' table has no records or does not exist.");
    }

    const columns = res[0].columns;
    const values = res[0].values;

    const rawTransactions = values.map(row => {
      const obj = {};
      columns.forEach((col, i) => {
        obj[col] = row[i];
      });
      return obj;
    });

    // Ensure numbers are floats and drop globally excluded categories.
    transactions = rawTransactions
      .filter(t => !EXCLUDED_CATEGORIES.includes((t.category || '').toUpperCase()))
      .map(t => {
        t.debit = parseFloat(t.debit) || 0;
        t.credit = parseFloat(t.credit) || 0;
        return t;
      });

    // Success! Restore button text, hide upload screen, and render views
    if (browseBtn) browseBtn.textContent = '📂 Browse File';
    hideUploadScreen();
    initApp();
  } catch (error) {
    console.error("Database parsing error:", error);
    let errorMsg = "Could not load database. Make sure it contains a valid 'expenses' table.\n\nError: " + error.message;
    if (error.message.includes("no such table") || !arrayBuffer || arrayBuffer.byteLength === 0) {
      errorMsg += "\n\n💡 HINT: The selected file may be empty (0 bytes) or not a SQLite database. Pick the actual expenses.db file that contains an 'expenses' table.";
    }
    alert(errorMsg);
    const browseBtn = document.getElementById('browse-db-btn');
    if (browseBtn) browseBtn.textContent = '📂 Browse File';
    showUploadScreen();
  }
}

// Fetch Data (called on initial load)
async function fetchData() {
  setupUploadScreenEvents();

  const storedData = await getStoredDatabase();
  if (storedData) {
    try {
      await parseAndLoadDatabase(storedData);
      return;
    } catch (e) {
      console.error("Failed to parse stored DB on launch:", e);
    }
  }

  // If no database is stored or parsing failed, prompt the upload screen
  showUploadScreen();
}

// Initialize Views
function initApp() {
  populateOverviewMonthFilter();
  setupOverviewSorting();
  setupDownloadButton();

  // Category Tab Setup
  populateCategoryTabFilter();
  setupCategoryTabEvents();

  // Chart.js handles responsiveness natively via ResizeObserver.
}

// Formatters
const formatCurrency = (amount) => {
  return new Intl.NumberFormat(LOCALE, { style: 'currency', currency: CURRENCY }).format(amount);
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  // Parse YYYY-MM-DD as a *local* date. `new Date('2018-09-01')` is parsed as
  // UTC midnight and then rendered in local time, which shifts the displayed
  // day backwards for users west of UTC. Building the date from parts avoids it.
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(dateString));
  const date = match
    ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
    : new Date(dateString);
  if (isNaN(date)) return String(dateString);
  return date.toLocaleDateString(LOCALE, { year: 'numeric', month: 'short', day: 'numeric' });
};

// Escape user-controlled DB values before inserting them into innerHTML, to
// prevent stored XSS from a crafted database file.
function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[ch]);
}

// Signed amount for a transaction: positive for credits, negative for debits.
function signedAmount(t) {
  return t.credit > 0 ? t.credit : -t.debit;
}

// --- Shared transaction helpers (used by both views) ---

function transactionSortValue(t, column) {
  switch (column) {
    case 'date': return t.date || '';
    case 'description': return (t.description || '').toLowerCase();
    case 'category': return (t.category || '').toLowerCase();
    case 'source': return (t.source || '').toLowerCase();
    case 'amount': return signedAmount(t);
    default: return '';
  }
}

// Returns a sorted COPY, never mutating the input array.
function sortTransactions(list, column, direction) {
  return [...list].sort((a, b) => {
    const valA = transactionSortValue(a, column);
    const valB = transactionSortValue(b, column);
    if (valA < valB) return direction === 'asc' ? -1 : 1;
    if (valA > valB) return direction === 'asc' ? 1 : -1;
    return 0;
  });
}

// Base set for the Overview view: month-scoped, minus excluded Bendigo rows.
function getOverviewBase(monthStr) {
  let f = transactions;
  if (monthStr) f = f.filter(t => t.date && t.date.startsWith(monthStr));
  return f.filter(t => !isExcludedBendigoTransaction(t));
}

// Applies the Overview table's category + description filters on top of a base.
function applyOverviewTableFilters(list) {
  let f = list;
  if (overviewCategoryFilter !== null && overviewCategoryFilter.size > 0) {
    f = f.filter(t => overviewCategoryFilter.has(t.category || 'Uncategorized'));
  }
  if (overviewDescFilter) {
    f = f.filter(t => (t.description || '').toLowerCase().includes(overviewDescFilter));
  }
  return f;
}

// Base set for the Category view: category-scoped, minus excluded Bendigo rows
// (the exclusion is now applied consistently with the Overview view).
function getCategoryBase(categoryStr) {
  let f = transactions.filter(t => !isExcludedBendigoTransaction(t));
  if (categoryStr) f = f.filter(t => (t.category || 'Uncategorized') === categoryStr);
  return f;
}

function applyCategoryTableFilters(list) {
  if (!catTabDescFilter) return list;
  return list.filter(t => (t.description || '').toLowerCase().includes(catTabDescFilter));
}

// Temporarily expand a scrollable table wrapper so html2canvas captures all rows.
function prepareWrapperForCapture(wrapper) {
  const originalStyles = {
    backgroundColor: wrapper.style.backgroundColor,
    maxHeight: wrapper.style.maxHeight,
    overflow: wrapper.style.overflow
  };
  wrapper.style.backgroundColor = '#ffffff';
  wrapper.style.maxHeight = 'none';
  wrapper.style.overflow = 'visible';
  return originalStyles;
}

function restoreWrapper(wrapper, styles) {
  wrapper.style.backgroundColor = styles.backgroundColor;
  wrapper.style.maxHeight = styles.maxHeight;
  wrapper.style.overflow = styles.overflow;
}

// Renders a "no results" row spanning the whole table body.
function renderEmptyRow(tbody, colspan, message) {
  const tr = document.createElement('tr');
  tr.className = 'empty-row';
  const td = document.createElement('td');
  td.colSpan = colspan;
  td.textContent = message;
  tr.appendChild(td);
  tbody.appendChild(tr);
}

// Builds a single transaction <tr>. All DB-derived text is escaped; the only
// raw markup is the category icon, which comes from our trusted icon map.
// Amounts carry an explicit +/- sign so meaning isn't conveyed by colour alone.
function buildTransactionRow(t, rowNumber) {
  const amount = signedAmount(t);
  const amountClass = amount >= 0 ? 'text-success' : 'text-danger';
  const sign = amount > 0 ? '+' : (amount < 0 ? '−' : '');
  const cat = t.category || 'Uncategorized';
  const cfg = getCategoryConfig(cat);
  const tr = document.createElement('tr');
  tr.innerHTML = `
            <td>${rowNumber}</td>
            <td>${escapeHtml(formatDate(t.date))}</td>
            <td class="wrap-text">${escapeHtml((t.description || '').toUpperCase())}</td>
            <td><span class="category-tile" style="background:${cfg.bg};color:${cfg.color}">${cfg.icon}<span>${escapeHtml(cat)}</span></span></td>
            <td>${escapeHtml(t.source || 'N/A')}</td>
            <td class="${amountClass}">${sign}${formatCurrency(Math.abs(amount))}</td>
        `;
  return tr;
}

// --- Overview View ---

function isExcludedBendigoTransaction(t) {
  const source = (t.source || '').toLowerCase();
  const desc = (t.description || '').toUpperCase();
  return source === 'bendigo' && (desc.includes('INTEREST') || desc.includes('MONTHLY SERVICE FEE'));
}



function populateOverviewMonthFilter() {
  // Get unique YYYY-MM months
  const months = [...new Set(transactions.filter(t => t.date).map(t => t.date.substring(0, 7)))].sort().reverse();
  const select = document.getElementById('overview-month-filter');
  select.innerHTML = '';

  months.forEach(m => {
    const opt = document.createElement('option');
    opt.value = m;
    // Format as Month Year (e.g., September 2018)
    const dateObj = new Date(m + '-01T00:00:00');
    opt.textContent = dateObj.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
    select.appendChild(opt);
  });

  select.addEventListener('change', (e) => {
    const selectedMonth = e.target.value;

    // Reset category filter when month changes
    overviewCategoryFilter = null;

    populateOverviewCategoryFilterMenu(selectedMonth);
    renderOverviewSummary(selectedMonth);
    renderRecentTransactions(selectedMonth);
    renderOverviewCharts(selectedMonth);
  });

  if (months.length > 0) {
    const firstMonth = months[0];
    populateOverviewCategoryFilterMenu(firstMonth);
    renderOverviewSummary(firstMonth);
    renderRecentTransactions(firstMonth);
    renderOverviewCharts(firstMonth);
  } else {
    populateOverviewCategoryFilterMenu();
    renderOverviewSummary();
    renderRecentTransactions();
    renderOverviewCharts();
  }
}

function setupOverviewSorting() {
  document.querySelectorAll('#recent-table th.sortable').forEach(th => {
    th.setAttribute('tabindex', '0');
    th.setAttribute('aria-sort', 'none');
    // Keyboard support: sort on Enter/Space, but ignore keys that originate from
    // the filter input / dropdown nested inside the header.
    th.addEventListener('keydown', (e) => {
      if (e.target !== th) return;
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); th.click(); }
    });
    th.addEventListener('click', () => {
      const column = th.dataset.sort;
      if (overviewSortColumn === column) {
        overviewSortDirection = overviewSortDirection === 'asc' ? 'desc' : 'asc';
      } else {
        overviewSortColumn = column;
        overviewSortDirection = 'asc';
      }

      // Reset page to 1 on sorting change
      overviewCurrentPage = 1;

      // Update sort icons + aria-sort, targeting only the icon spans
      document.querySelectorAll('#recent-table th.sortable').forEach(h => {
        h.querySelector('.sort-icon').textContent = '↕';
        h.setAttribute('aria-sort', 'none');
      });
      const iconSpan = th.querySelector('.sort-icon');
      if (iconSpan) {
        iconSpan.textContent = overviewSortDirection === 'asc' ? '↑' : '↓';
      }
      th.setAttribute('aria-sort', overviewSortDirection === 'asc' ? 'ascending' : 'descending');

      const currentMonth = document.getElementById('overview-month-filter').value;
      renderRecentTransactions(currentMonth);
    });
  });

  // Pagination buttons
  document.getElementById('overview-btn-prev').addEventListener('click', () => {
    if (overviewCurrentPage > 1) {
      overviewCurrentPage--;
      const currentMonth = document.getElementById('overview-month-filter').value;
      renderRecentTransactions(currentMonth);
    }
  });

  document.getElementById('overview-btn-next').addEventListener('click', () => {
    overviewCurrentPage++;
    const currentMonth = document.getElementById('overview-month-filter').value;
    renderRecentTransactions(currentMonth);
  });

  // Rows per page
  document.getElementById('overview-rows-per-page').addEventListener('change', (e) => {
    if (e.target.value === 'all') {
      overviewItemsPerPage = ALL_ROWS;
    } else {
      overviewItemsPerPage = parseInt(e.target.value, 10);
    }
    overviewCurrentPage = 1;
    const currentMonth = document.getElementById('overview-month-filter').value;
    renderRecentTransactions(currentMonth);
  });

  // Table Category Filter - Multi-select checkboxes
  document.getElementById('overview-table-category-filter-menu').addEventListener('change', (e) => {
    if (e.target.type !== 'checkbox') return;

    const checkbox = e.target;
    const catValue = checkbox.value;

    if (catValue === '__all__') {
      if (checkbox.checked) {
        overviewCategoryFilter = null; // all selected
      } else {
        overviewCategoryFilter = new Set(); // none selected
      }
    } else {
      if (overviewCategoryFilter === null) {
        overviewCategoryFilter = new Set();
        document.querySelectorAll('#overview-table-category-filter-menu input[type="checkbox"]:not([value="__all__"])')
          .forEach(cb => { if (cb.checked) overviewCategoryFilter.add(cb.value); });
      }
      if (checkbox.checked) {
        overviewCategoryFilter.add(catValue);
      } else {
        overviewCategoryFilter.delete(catValue);
      }
    }

    updateOverviewCategoryFilterUI();
    overviewCurrentPage = 1;
    const currentMonth = document.getElementById('overview-month-filter').value;
    renderRecentTransactions(currentMonth);
  });

  // Toggle multi-select dropdown open/close.
  // The menu lives inside a `.table-responsive` wrapper that has `overflow-x`
  // set, which clips any absolutely-positioned child. We anchor the menu to the
  // viewport with `position: fixed` so it can never be clipped by the wrapper.
  const filterTrigger = document.getElementById('overview-table-category-filter-trigger');
  const filterMenu = document.getElementById('overview-table-category-filter-menu');

  const closeFilterMenu = () => {
    filterMenu.classList.remove('open');
    filterTrigger.setAttribute('aria-expanded', 'false');
  };

  filterTrigger.addEventListener('click', (e) => {
    e.stopPropagation();
    const willOpen = !filterMenu.classList.contains('open');
    if (willOpen) {
      filterMenu.classList.add('open');
      filterTrigger.setAttribute('aria-expanded', 'true');
      positionMultiSelectMenu(filterTrigger, filterMenu);
    } else {
      closeFilterMenu();
    }
  });

  // Close when clicking outside, scrolling, resizing, or pressing Escape.
  document.addEventListener('click', closeFilterMenu);
  window.addEventListener('scroll', closeFilterMenu, true);
  window.addEventListener('resize', closeFilterMenu);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeFilterMenu();
  });

  // Description Text Filter
  document.getElementById('overview-desc-filter').addEventListener('input', (e) => {
    overviewDescFilter = e.target.value.toLowerCase();
    overviewCurrentPage = 1;
    const currentMonth = document.getElementById('overview-month-filter').value;
    renderRecentTransactions(currentMonth);
  });
}

function downloadAsExcel(data, filename) {
  const rows = data.map((t, i) => {
    const amount = t.credit > 0 ? t.credit : -t.debit;
    return {
      '#': i + 1,
      'Date': t.date || '',
      'Description': (t.description || '').toUpperCase(),
      'Category': t.category || 'Uncategorized',
      'Bank': t.source || 'N/A',
      'Amount': amount
    };
  });
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, 'Transactions');
  XLSX.writeFile(wb, filename);
}

function downloadStyledPDF({ title, subtitle, totalExpenses, totalCredits, netBalance, transactions, filename }) {
  const container = document.createElement('div');
  container.style.cssText = 'position:fixed;left:-9999px;top:0;width:1000px;background:#FAF6EE;padding:30px 40px;font-family:Arial,Helvetica,sans-serif;z-index:99999;';

  const netColor = netBalance >= 0 ? '#00a844' : '#cc0033';

  container.innerHTML = `
    <div style="border-bottom:4px solid #000000;padding-bottom:15px;margin-bottom:25px;">
      <h1 style="font-size:32px;font-weight:900;color:#000000;margin:0 0 5px 0;text-transform:uppercase;">${title}</h1>
      <p style="color:#3a3a3a;margin:0;font-size:15px;font-weight:700;">${subtitle}</p>
      <p style="color:#555555;margin:5px 0 0 0;font-size:12px;font-family:monospace;font-weight:bold;">Generated on ${new Date().toLocaleString()}</p>
    </div>
    <div style="display:flex;gap:20px;margin-bottom:30px;">
      <div style="flex:1;background:#FFD1D1;border-radius:4px;padding:18px;text-align:center;border:3px solid #000000;box-shadow:4px 4px 0px 0px #000000;">
        <div style="font-size:12px;color:#000000;font-weight:900;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:5px;">Total Expenses</div>
        <div style="font-size:24px;font-weight:900;color:#000000;font-family:monospace;">${formatCurrency(totalExpenses)}</div>
      </div>
      <div style="flex:1;background:#C1FFD7;border-radius:4px;padding:18px;text-align:center;border:3px solid #000000;box-shadow:4px 4px 0px 0px #000000;">
        <div style="font-size:12px;color:#000000;font-weight:900;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:5px;">Total Credits</div>
        <div style="font-size:24px;font-weight:900;color:#000000;font-family:monospace;">${formatCurrency(totalCredits)}</div>
      </div>
      <div style="flex:1;background:#E2D1FF;border-radius:4px;padding:18px;text-align:center;border:3px solid #000000;box-shadow:4px 4px 0px 0px #000000;">
        <div style="font-size:12px;color:#000000;font-weight:900;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:5px;">Net Balance</div>
        <div style="font-size:24px;font-weight:900;color:${netColor};font-family:monospace;">${formatCurrency(Math.abs(netBalance))}</div>
      </div>
    </div>
    <div style="margin-bottom:30px;">
      <h2 style="font-size:20px;font-weight:900;color:#000000;margin:0 0 12px 0;text-transform:uppercase;">Category Breakdown</h2>
      <table style="width:100%;border-collapse:collapse;font-size:13px;border:3px solid #000000;box-shadow:4px 4px 0px 0px #000000;">
        <thead>
          <tr style="background:#FFE600;border-bottom:3px solid #000000;">
            <th style="padding:10px 12px;text-align:left;border-right:2px solid #000000;color:#000000;font-weight:900;text-transform:uppercase;">Category</th>
            <th style="padding:10px 12px;text-align:right;color:#000000;font-weight:900;text-transform:uppercase;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${Object.entries(aggregateByCategory(transactions)).filter(([, data]) => data.debit > 0).sort((a, b) => b[1].debit - a[1].debit).map(([cat, data], i) => {
    const bgColor = i % 2 === 0 ? '#ffffff' : '#FAF6EE';
    return `
              <tr style="background:${bgColor};">
                <td style="padding:10px 12px;border-bottom:2px solid #000000;border-right:2px solid #000000;color:#000000;font-family:monospace;font-weight:bold;">${escapeHtml(cat)}</td>
                <td style="padding:10px 12px;border-bottom:2px solid #000000;color:#cc0033;text-align:right;font-family:monospace;font-weight:900;">${formatCurrency(data.debit)}</td>
              </tr>`;
  }).join('')}
        </tbody>
      </table>
    </div>
    <h2 style="font-size:20px;font-weight:900;color:#000000;margin:0 0 12px 0;text-transform:uppercase;">Transactions (${transactions.length})</h2>
    <table style="width:100%;table-layout:fixed;border-collapse:collapse;font-size:13px;border:3px solid #000000;box-shadow:4px 4px 0px 0px #000000;">
      <colgroup>
        <col style="width:45px;">
        <col style="width:110px;">
        <col>
        <col style="width:140px;">
        <col style="width:100px;">
        <col style="width:115px;">
      </colgroup>
      <thead>
        <tr style="background:#FFE600;border-bottom:3px solid #000000;">
          <th style="padding:10px 8px;text-align:left;border-bottom:2px solid #000000;border-right:2px solid #000000;color:#000000;font-weight:900;text-transform:uppercase;">#</th>
          <th style="padding:10px 8px;text-align:left;border-bottom:2px solid #000000;border-right:2px solid #000000;color:#000000;font-weight:900;text-transform:uppercase;">Date</th>
          <th style="padding:10px 8px;text-align:left;border-bottom:2px solid #000000;border-right:2px solid #000000;color:#000000;font-weight:900;text-transform:uppercase;">Description</th>
          <th style="padding:10px 8px;text-align:left;border-bottom:2px solid #000000;border-right:2px solid #000000;color:#000000;font-weight:900;text-transform:uppercase;">Category</th>
          <th style="padding:10px 8px;text-align:left;border-bottom:2px solid #000000;border-right:2px solid #000000;color:#000000;font-weight:900;text-transform:uppercase;">Bank</th>
          <th style="padding:10px 8px;text-align:right;border-bottom:2px solid #000000;color:#000000;font-weight:900;text-transform:uppercase;">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${transactions.map((t, i) => {
    const amount = t.credit > 0 ? t.credit : -t.debit;
    const amtColor = t.credit > 0 ? '#00a844' : '#cc0033';
    const bgColor = i % 2 === 0 ? '#ffffff' : '#FAF6EE';
    return `
            <tr style="background:${bgColor};">
              <td style="padding:8px;border-bottom:2px solid #000000;border-right:2px solid #000000;color:#000000;font-family:monospace;font-weight:bold;">${i + 1}</td>
              <td style="padding:8px;border-bottom:2px solid #000000;border-right:2px solid #000000;color:#000000;font-family:monospace;font-weight:bold;">${formatDate(t.date)}</td>
              <td style="padding:8px;border-bottom:2px solid #000000;border-right:2px solid #000000;color:#000000;word-break:break-word;font-weight:bold;font-size:12px;">${escapeHtml((t.description || '').toUpperCase())}</td>
              <td style="padding:8px;border-bottom:2px solid #000000;border-right:2px solid #000000;color:#000000;font-weight:bold;">${escapeHtml(t.category || 'Uncategorized')}</td>
              <td style="padding:8px;border-bottom:2px solid #000000;border-right:2px solid #000000;color:#000000;font-weight:bold;">${escapeHtml(t.source || 'N/A')}</td>
              <td style="padding:8px;border-bottom:2px solid #000000;color:${amtColor};text-align:right;font-family:monospace;font-weight:900;font-size:13px;">${formatCurrency(Math.abs(amount))}</td>
            </tr>`;
  }).join('')}
      </tbody>
    </table>
  `;

  document.body.appendChild(container);

  html2canvas(container, { scale: 2, backgroundColor: '#FAF6EE' }).then(canvas => {
    document.body.removeChild(container);
    const imgData = canvas.toDataURL('image/png');
    const { jsPDF } = window.jspdf;
    const pdfWidth = canvas.width / 2;
    const pdfHeight = canvas.height / 2;
    const pdf = new jsPDF('p', 'pt', [pdfWidth, pdfHeight]);
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(filename);
  }).catch(err => {
    document.body.removeChild(container);
    console.error('Error generating PDF:', err);
  });
}

function setupDownloadButton() {
  const pngBtn = document.getElementById('download-transactions-btn');
  const pdfBtn = document.getElementById('download-transactions-pdf-btn');
  const xlsBtn = document.getElementById('download-transactions-xls-btn');

  if (pngBtn) {
    pngBtn.addEventListener('click', () => {
      const wrapper = document.getElementById('overview-transactions-wrapper');
      const originalStyles = prepareWrapperForCapture(wrapper);
      const monthStr = document.getElementById('overview-month-filter').value;
      const namePart = monthStr || 'all';

      html2canvas(wrapper, { scale: 2, backgroundColor: '#ffffff' }).then(canvas => {
        restoreWrapper(wrapper, originalStyles);
        const link = document.createElement('a');
        link.download = `transactions-${namePart}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      }).catch(err => {
        console.error('Error generating image:', err);
        restoreWrapper(wrapper, originalStyles);
      });
    });
  }

  if (pdfBtn) {
    pdfBtn.addEventListener('click', () => {
      const monthStr = document.getElementById('overview-month-filter').value;
      const namePart = monthStr || 'all';
      const filtered = applyOverviewTableFilters(getOverviewBase(monthStr));

      const totalDebit = filtered.reduce((sum, t) => sum + t.debit, 0);
      const totalCredit = filtered.reduce((sum, t) => sum + t.credit, 0);
      const netBalance = totalCredit - totalDebit;
      const monthDate = monthStr ? new Date(monthStr + '-01T00:00:00') : null;
      const subtitle = monthDate
        ? monthDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
        : 'All Transactions';

      downloadStyledPDF({
        title: 'Transaction Details',
        subtitle,
        totalExpenses: totalDebit,
        totalCredits: totalCredit,
        netBalance,
        transactions: filtered,
        filename: `transactions-${namePart}.pdf`
      });
    });
  }

  if (xlsBtn) {
    xlsBtn.addEventListener('click', () => {
      const monthStr = document.getElementById('overview-month-filter').value;
      const namePart = monthStr || 'all';
      const filtered = applyOverviewTableFilters(getOverviewBase(monthStr));
      downloadAsExcel(filtered, `transactions-${namePart}.xlsx`);
    });
  }
}

function renderOverviewSummary(monthStr) {
  const filtered = getOverviewBase(monthStr);

  const totalDebit = filtered.reduce((sum, t) => sum + t.debit, 0);
  const totalCredit = filtered.reduce((sum, t) => sum + t.credit, 0);
  const netBalance = totalCredit - totalDebit;

  document.getElementById('overview-total-expenses').textContent = formatCurrency(totalDebit);
  document.getElementById('overview-total-credits').textContent = formatCurrency(totalCredit);

  const netEl = document.getElementById('overview-net-balance');
  netEl.textContent = formatCurrency(Math.abs(netBalance));
  netEl.style.color = netBalance >= 0 ? '#10b981' : '#ef4444';
}

function renderRecentTransactions(monthStr) {
  const tbody = document.querySelector('#recent-table tbody');
  tbody.innerHTML = '';

  // Sync category checkbox state without rebuilding the menu.
  updateOverviewCategoryFilterUI();

  const filtered = applyOverviewTableFilters(getOverviewBase(monthStr));
  const itemsToRender = sortTransactions(filtered, overviewSortColumn, overviewSortDirection);

  // Pagination
  const startIdx = (overviewCurrentPage - 1) * overviewItemsPerPage;
  const endIdx = startIdx + overviewItemsPerPage;
  const paginatedItems = itemsToRender.slice(startIdx, endIdx);

  if (paginatedItems.length === 0) {
    renderEmptyRow(tbody, 6, 'No transactions match your filters.');
  }

  paginatedItems.forEach((t, index) => {
    tbody.appendChild(buildTransactionRow(t, startIdx + index + 1));
  });

  // Update pagination info
  const maxPage = Math.ceil(itemsToRender.length / overviewItemsPerPage) || 1;
  if (overviewCurrentPage > maxPage && maxPage > 0) {
    overviewCurrentPage = maxPage;
    // re-render if we adjusted page
    return renderRecentTransactions(monthStr);
  }

  document.getElementById('overview-page-info').textContent = `Page ${overviewCurrentPage} of ${maxPage} (${itemsToRender.length} items)`;
  document.getElementById('overview-btn-prev').disabled = overviewCurrentPage <= 1;
  document.getElementById('overview-btn-next').disabled = overviewCurrentPage >= maxPage;

  // Update filtered total sum
  const total = itemsToRender.reduce((sum, t) => sum + t.debit, 0);
  const totalEl = document.getElementById('overview-filtered-total');
  if (totalEl) totalEl.textContent = `Total: ${formatCurrency(total)}`;
}

function updateOverviewCategoryFilterUI() {
  const menu = document.getElementById('overview-table-category-filter-menu');
  if (!menu) return;
  const allCheckbox = menu.querySelector('input[value="__all__"]');
  const catCheckboxes = menu.querySelectorAll('input[type="checkbox"]:not([value="__all__"])');
  const totalCats = catCheckboxes.length;
  let checkedCount = 0;

  if (overviewCategoryFilter === null) {
    allCheckbox.checked = true;
    catCheckboxes.forEach(cb => { cb.checked = true; });
    checkedCount = totalCats;
  } else {
    allCheckbox.checked = false;
    catCheckboxes.forEach(cb => {
      cb.checked = overviewCategoryFilter.has(cb.value);
      if (cb.checked) checkedCount++;
    });
  }

  const label = document.getElementById('overview-category-filter-label');
  if (overviewCategoryFilter === null) {
    label.textContent = 'All Categories';
  } else if (overviewCategoryFilter.size === 0) {
    label.textContent = 'None selected';
  } else if (checkedCount === totalCats) {
    label.textContent = 'All Categories';
  } else {
    label.textContent = `${checkedCount} category${checkedCount > 1 ? 's' : ''}`;
  }
}

// Anchor a multi-select menu to the viewport just below its trigger so it is
// never clipped by an ancestor with `overflow` set, and keep it on-screen.
function positionMultiSelectMenu(trigger, menu) {
  const rect = trigger.getBoundingClientRect();
  menu.style.position = 'fixed';
  menu.style.top = `${rect.bottom + 4}px`;
  menu.style.left = `${rect.left}px`;
  menu.style.minWidth = `${rect.width}px`;
  // After it has a width, nudge it back inside the viewport if it overflows.
  requestAnimationFrame(() => {
    const menuRect = menu.getBoundingClientRect();
    if (menuRect.right > window.innerWidth - 8) {
      menu.style.left = `${Math.max(8, window.innerWidth - menuRect.width - 8)}px`;
    }
  });
}

function populateOverviewCategoryFilterMenu(monthStr) {
  const available = getOverviewBase(monthStr);
  const categories = [...new Set(available.map(t => t.category || 'Uncategorized'))].sort();
  const menu = document.getElementById('overview-table-category-filter-menu');
  menu.innerHTML = '';

  // "All" option (static, trusted markup).
  const allLabel = document.createElement('label');
  allLabel.className = 'multi-select-option all-option';
  allLabel.innerHTML = '<input type="checkbox" value="__all__"> All';
  menu.appendChild(allLabel);

  // Per-category options, built from DOM nodes so category names can never
  // inject markup.
  categories.forEach(c => {
    const label = document.createElement('label');
    label.className = 'multi-select-option';
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.value = c;
    label.appendChild(cb);
    label.appendChild(document.createTextNode(' ' + c));
    menu.appendChild(label);
  });
  updateOverviewCategoryFilterUI();
}

function renderOverviewCharts(monthStr) {
  const filteredForCategory = getOverviewBase(monthStr);
  const categoryData = aggregateByCategory(filteredForCategory);

  const sortedCategories = Object.entries(categoryData)
    .filter(c => c[1].debit > 0)
    .sort((a, b) => b[1].debit - a[1].debit);

  if (overviewCategoryChart) {
    overviewCategoryChart.destroy();
  }

  const canvas = document.getElementById('overview-category-chart');
  const barCount = sortedCategories.length;
  const minWidth = 600;
  const widthPerBar = 80;
  const chartWidth = Math.max(minWidth, barCount * widthPerBar);

  canvas.style.width = chartWidth + 'px';
  canvas.style.height = '350px';
  canvas.width = chartWidth;
  canvas.height = 350;

  const ctx = canvas.getContext('2d');

  // Use solid vibrant colors for Neo-Brutalist styling
  const bgColors = sortedCategories.map((_, i) => chartColors[i % chartColors.length]);

  overviewCategoryChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: sortedCategories.map(c => c[0]),
      datasets: [{
        data: sortedCategories.map(c => c[1].debit),
        backgroundColor: bgColors,
        borderColor: '#000000',
        borderWidth: 2.5,
        borderRadius: 0, // Rectangular bars
        borderSkipped: false,
        barPercentage: 0.6,
        categoryPercentage: 0.8,
      }]
    },
    options: {
      responsive: false,
      maintainAspectRatio: false,
      layout: {
        padding: { top: 25, bottom: 10, left: 10, right: 10 }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#ffffff',
          titleColor: '#000000',
          bodyColor: '#000000',
          borderColor: '#000000',
          borderWidth: 2.5,
          cornerRadius: 4,
          titleFont: { family: "'Google Sans Code', Monaco, Consolas, monospace", size: 12, weight: 'bold' },
          bodyFont: { family: "'Google Sans Code', Monaco, Consolas, monospace", size: 13, weight: '900' },
          padding: 12,
          displayColors: false,
          callbacks: {
            label: (ctx) => formatCurrency(ctx.parsed.y)
          }
        },
        datalabels: {
          anchor: 'end',
          align: 'top',
          offset: 4,
          formatter: (v) => formatCurrency(v),
          font: { family: "'Google Sans Code', Monaco, Consolas, monospace", weight: '900', size: 11 },
          color: '#000000'
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: 'rgba(0, 0, 0, 0.15)',
            drawBorder: false,
            borderDash: [3, 3]
          },
          border: { display: false },
          ticks: {
            font: { family: "'Google Sans Code', Monaco, Consolas, monospace", size: 11, weight: 'bold' },
            color: '#000000',
            padding: 10,
            callback: (v) => formatCurrency(v)
          }
        },
        x: {
          grid: {
            display: false
          },
          border: { display: false },
          ticks: {
            font: { family: "'Google Sans Code', Monaco, Consolas, monospace", size: 11, weight: '800' },
            color: '#000000',
            maxRotation: 45,
            padding: 5
          }
        }
      }
    }
  });

  const tbody = document.querySelector('#overview-category-table tbody');
  tbody.innerHTML = '';

  const tableCategories = [...sortedCategories].sort((a, b) => a[0].localeCompare(b[0]));

  tableCategories.forEach(c => {
    const categoryName = c[0];
    const cfg = getCategoryConfig(categoryName);
    const tr = document.createElement('tr');

    tr.innerHTML = `
            <td><span class="category-tile" style="background:${cfg.bg};color:${cfg.color}">${cfg.icon}<span>${escapeHtml(categoryName)}</span></span></td>
            <td style="text-align: right;" class="text-danger">${formatCurrency(c[1].debit)}</td>
        `;

    tbody.appendChild(tr);
  });
}

// --- Data Aggregation Helpers ---

function aggregateByMonth(data) {
  const acc = {};
  data.forEach(t => {
    if (!t.date) return;
    const month = t.date.substring(0, 7); // YYYY-MM
    if (!acc[month]) acc[month] = { credit: 0, debit: 0, count: 0 };
    acc[month].credit += t.credit;
    acc[month].debit += t.debit;
    acc[month].count += 1;
  });
  return acc;
}

function aggregateByCategory(data) {
  const acc = {};
  data.forEach(t => {
    const cat = t.category || 'Uncategorized';
    if (!acc[cat]) acc[cat] = { credit: 0, debit: 0, count: 0 };
    acc[cat].credit += t.credit;
    acc[cat].debit += t.debit;
    acc[cat].count += 1;
  });
  return acc;
}

// --- Views Rendering ---




// --- Category Tab View ---

function populateCategoryTabFilter() {
  const categories = [...new Set(transactions.map(t => t.category || 'Uncategorized'))].sort();
  const select = document.getElementById('category-tab-filter');
  select.innerHTML = '';

  const allOpt = document.createElement('option');
  allOpt.value = '';
  allOpt.textContent = 'All';
  select.appendChild(allOpt);

  categories.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c;
    opt.textContent = c;
    select.appendChild(opt);
  });

  select.addEventListener('change', (e) => {
    const selectedCategory = e.target.value;
    catTabCurrentPage = 1;
    renderCategoryTabTransactions(selectedCategory);
    renderCategoryTabCharts(selectedCategory);
  });

  if (categories.length > 0) {
    renderCategoryTabTransactions('');
    renderCategoryTabCharts('');
  }
}

function setupCategoryTabEvents() {
  document.querySelectorAll('#category-tab-recent-table th.sortable').forEach(th => {
    th.setAttribute('tabindex', '0');
    th.setAttribute('aria-sort', 'none');
    th.addEventListener('keydown', (e) => {
      if (e.target !== th) return;
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); th.click(); }
    });
    th.addEventListener('click', () => {
      const column = th.dataset.sort;
      if (catTabSortColumn === column) {
        catTabSortDirection = catTabSortDirection === 'asc' ? 'desc' : 'asc';
      } else {
        catTabSortColumn = column;
        catTabSortDirection = 'asc';
      }

      // Reset page to 1 on sorting change
      catTabCurrentPage = 1;

      // Update sort icons + aria-sort, targeting only the icon spans
      document.querySelectorAll('#category-tab-recent-table th.sortable').forEach(h => {
        h.querySelector('.sort-icon').textContent = '↕';
        h.setAttribute('aria-sort', 'none');
      });
      const iconSpan = th.querySelector('.sort-icon');
      if (iconSpan) {
        iconSpan.textContent = catTabSortDirection === 'asc' ? '↑' : '↓';
      }
      th.setAttribute('aria-sort', catTabSortDirection === 'asc' ? 'ascending' : 'descending');

      const currentCat = document.getElementById('category-tab-filter').value;
      renderCategoryTabTransactions(currentCat);
    });
  });

  // Pagination buttons
  document.getElementById('category-btn-prev').addEventListener('click', () => {
    if (catTabCurrentPage > 1) {
      catTabCurrentPage--;
      const currentCat = document.getElementById('category-tab-filter').value;
      renderCategoryTabTransactions(currentCat);
    }
  });

  document.getElementById('category-btn-next').addEventListener('click', () => {
    catTabCurrentPage++;
    const currentCat = document.getElementById('category-tab-filter').value;
    renderCategoryTabTransactions(currentCat);
  });

  // Rows per page
  document.getElementById('category-tab-rows-per-page').addEventListener('change', (e) => {
    if (e.target.value === 'all') {
      catTabItemsPerPage = ALL_ROWS;
    } else {
      catTabItemsPerPage = parseInt(e.target.value, 10);
    }
    catTabCurrentPage = 1;
    const currentCat = document.getElementById('category-tab-filter').value;
    renderCategoryTabTransactions(currentCat);
  });

  // Description Text Filter
  document.getElementById('category-desc-filter').addEventListener('input', (e) => {
    catTabDescFilter = e.target.value.toLowerCase();
    catTabCurrentPage = 1;
    const currentCat = document.getElementById('category-tab-filter').value;
    renderCategoryTabTransactions(currentCat);
  });

  // Download Buttons
  const pngBtn = document.getElementById('category-download-png-btn');
  const pdfBtn = document.getElementById('category-download-pdf-btn');
  const xlsBtn = document.getElementById('category-download-xls-btn');

  if (pngBtn) {
    pngBtn.addEventListener('click', () => {
      const wrapper = document.getElementById('category-transactions-wrapper');
      const originalStyles = prepareWrapperForCapture(wrapper);
      const categoryStr = document.getElementById('category-tab-filter').value;
      const namePart = categoryStr ? categoryStr.replace(/[^a-zA-Z0-9]/g, '-') : 'all';

      html2canvas(wrapper, { scale: 2, backgroundColor: '#ffffff' }).then(canvas => {
        restoreWrapper(wrapper, originalStyles);
        const link = document.createElement('a');
        link.download = `transactions-${namePart}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      }).catch(err => {
        console.error('Error generating image:', err);
        restoreWrapper(wrapper, originalStyles);
      });
    });
  }

  if (pdfBtn) {
    pdfBtn.addEventListener('click', () => {
      const categoryStr = document.getElementById('category-tab-filter').value;
      const namePart = categoryStr ? categoryStr.replace(/[^a-zA-Z0-9]/g, '-') : 'all';
      const filtered = applyCategoryTableFilters(getCategoryBase(categoryStr));

      const totalDebit = filtered.reduce((sum, t) => sum + t.debit, 0);
      const totalCredit = filtered.reduce((sum, t) => sum + t.credit, 0);
      const netBalance = totalCredit - totalDebit;
      const subtitle = categoryStr || 'All Categories';

      downloadStyledPDF({
        title: 'Category Transactions',
        subtitle,
        totalExpenses: totalDebit,
        totalCredits: totalCredit,
        netBalance,
        transactions: filtered,
        filename: `transactions-${namePart}.pdf`
      });
    });
  }

  if (xlsBtn) {
    xlsBtn.addEventListener('click', () => {
      const categoryStr = document.getElementById('category-tab-filter').value;
      const namePart = categoryStr ? categoryStr.replace(/[^a-zA-Z0-9]/g, '-') : 'all';
      const filtered = applyCategoryTableFilters(getCategoryBase(categoryStr));
      downloadAsExcel(filtered, `transactions-${namePart}.xlsx`);
    });
  }
}

function renderCategoryTabTransactions(categoryStr) {
  const tbody = document.querySelector('#category-tab-recent-table tbody');
  tbody.innerHTML = '';

  const filtered = applyCategoryTableFilters(getCategoryBase(categoryStr));

  const totalAmount = filtered.reduce((sum, t) => sum + signedAmount(t), 0);

  const totalEl = document.getElementById('category-total-amount');
  totalEl.textContent = formatCurrency(Math.abs(totalAmount));
  totalEl.style.color = totalAmount >= 0 ? '#10b981' : '#ef4444';

  const itemsToRender = sortTransactions(filtered, catTabSortColumn, catTabSortDirection);

  // Pagination
  const startIdx = (catTabCurrentPage - 1) * catTabItemsPerPage;
  const endIdx = startIdx + catTabItemsPerPage;
  const paginatedItems = itemsToRender.slice(startIdx, endIdx);

  if (paginatedItems.length === 0) {
    renderEmptyRow(tbody, 6, 'No transactions match your filters.');
  }

  paginatedItems.forEach((t, index) => {
    tbody.appendChild(buildTransactionRow(t, startIdx + index + 1));
  });

  // Update pagination info
  const maxPage = Math.ceil(itemsToRender.length / catTabItemsPerPage) || 1;
  if (catTabCurrentPage > maxPage && maxPage > 0) {
    catTabCurrentPage = maxPage;
    return renderCategoryTabTransactions(categoryStr);
  }

  document.getElementById('category-page-info').textContent = `Page ${catTabCurrentPage} of ${maxPage} (${itemsToRender.length} items)`;
  document.getElementById('category-btn-prev').disabled = catTabCurrentPage <= 1;
  document.getElementById('category-btn-next').disabled = catTabCurrentPage >= maxPage;
}

function renderCategoryTabCharts(categoryStr) {
  const filteredForChart = getCategoryBase(categoryStr);
  const monthlyData = aggregateByMonth(filteredForChart);
  const sortedMonths = Object.entries(monthlyData).sort((a, b) => a[0].localeCompare(b[0]));

  if (monthlyTrendChart) {
    monthlyTrendChart.destroy();
  }

  const canvas = document.getElementById('category-tab-chart');
  const barCount = sortedMonths.length;
  const minWidth = 600;
  const widthPerBar = 100;
  const chartWidth = Math.max(minWidth, barCount * widthPerBar);
  canvas.style.width = chartWidth + 'px';
  canvas.style.height = '350px';
  canvas.width = chartWidth;
  canvas.height = 350;

  const ctx = canvas.getContext('2d');

  // Use solid vibrant colors for Neo-Brutalist styling
  const bgColors = sortedMonths.map((_, i) => chartColors[i % chartColors.length]);

  monthlyTrendChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: sortedMonths.map(m => m[0]),
      datasets: [{
        data: sortedMonths.map(m => m[1].debit),
        backgroundColor: bgColors,
        borderColor: '#000000',
        borderWidth: 2.5,
        borderRadius: 0, // Rectangular bars
        borderSkipped: false,
        barPercentage: 0.6,
        categoryPercentage: 0.8,
      }]
    },
    options: {
      responsive: false,
      maintainAspectRatio: false,
      layout: {
        padding: { top: 25, bottom: 10, left: 10, right: 10 }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#ffffff',
          titleColor: '#000000',
          bodyColor: '#000000',
          borderColor: '#000000',
          borderWidth: 2.5,
          cornerRadius: 4,
          titleFont: { family: "'Google Sans Code', Monaco, Consolas, monospace", size: 12, weight: 'bold' },
          bodyFont: { family: "'Google Sans Code', Monaco, Consolas, monospace", size: 13, weight: '900' },
          padding: 12,
          displayColors: false,
          callbacks: {
            label: (ctx) => formatCurrency(ctx.parsed.y)
          }
        },
        datalabels: {
          anchor: 'end',
          align: 'top',
          offset: 4,
          formatter: (v) => formatCurrency(v),
          font: { family: "'Google Sans Code', Monaco, Consolas, monospace", weight: '900', size: 11 },
          color: '#000000'
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: 'rgba(0, 0, 0, 0.15)',
            drawBorder: false,
            borderDash: [3, 3]
          },
          border: { display: false },
          ticks: {
            font: { family: "'Google Sans Code', Monaco, Consolas, monospace", size: 11, weight: 'bold' },
            color: '#000000',
            padding: 10,
            callback: (v) => formatCurrency(v)
          }
        },
        x: {
          grid: {
            display: false
          },
          border: { display: false },
          ticks: {
            font: { family: "'Google Sans Code', Monaco, Consolas, monospace", size: 11, weight: '800' },
            color: '#000000',
            maxRotation: 45,
            padding: 5
          }
        }
      }
    }
  });
}
