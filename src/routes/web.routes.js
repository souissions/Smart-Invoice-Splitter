/**
 * ================================================================================
 * WEB ROUTES - FRONTEND INTERFACE ROUTING
 * ================================================================================
 * 
 * Routes for serving the web-based user interface of the invoice processing
 * system. Provides HTML pages for dashboard, batch management, validation
 * interfaces, and administrative functions.
 * 
 * 🎯 WEB INTERFACE ROUTES:
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 
 * 🏠 DASHBOARD ROUTES:
 * • GET /                                  - Main dashboard (batch overview)
 * • GET /dashboard                         - Alternative dashboard route
 * 
 * 🔄 PROCESSING INTERFACES:
 * • GET /batches/:batchId/validate-splits  - Split validation interface (UI 1)
 * • GET /batches/:batchId/validate-data    - Data validation interface (UI 2)
 * • GET /batches/:batchId/processing       - Processing status monitor
 * 
 * 🛠️ ADMINISTRATIVE INTERFACES:
 * • GET /admin                             - Administrative dashboard
 * • GET /settings                          - System configuration interface
 * • GET /debug                             - Debug and testing interface
 * 
 * 📱 USER INTERFACE ARCHITECTURE:
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 
 * 🏗️ **Frontend Structure:**
 * ```
 * src/public/
 * ├── html/              - Static HTML pages
 * │   ├── dashboard.html      - Main batch overview
 * │   ├── validate-splits.html - Split validation UI
 * │   ├── validate-data.html  - Data validation UI
 * │   └── processing.html     - Processing monitor
 * ├── css/               - Styling and themes
 * ├── js/                - Client-side JavaScript
 * └── assets/            - Images and resources
 * ```
 * 
 * 🎨 **UI Components:**
 * • Responsive design for desktop and tablet
 * • Real-time status updates via WebSocket/polling
 * • Interactive data validation forms
 * • PDF preview and split visualization
 * • Progress indicators and status monitoring
 * 
 * 🔄 USER WORKFLOW:
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 
 * 1. **Dashboard** (/)
 *    - View all document batches
 *    - Upload new PDF files
 *    - Monitor processing status
 *    - Access batch-specific functions
 * 
 * 2. **Split Validation** (/batches/:id/validate-splits)
 *    - Review AI-detected invoice boundaries
 *    - Adjust split points if needed
 *    - Approve or modify split proposals
 *    - Proceed to data extraction
 * 
 * 3. **Data Validation** (/batches/:id/validate-data)
 *    - Review extracted invoice data
 *    - Correct any extraction errors
 *    - Validate financial calculations
 *    - Submit final validated data
 * 
 * 4. **Processing Monitor** (/batches/:id/processing)
 *    - Real-time processing status
 *    - Error reporting and diagnostics
 *    - Processing logs and details
 * 
 * 📊 INTERFACE FEATURES:
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 
 * ✅ **Dashboard Features:**
 * • Batch listing with status indicators
 * • Drag-and-drop PDF upload
 * • Batch filtering and search
 * • Quick action buttons
 * • Processing statistics
 * 
 * ✅ **Validation Features:**
 * • Side-by-side PDF preview and form
 * • Field-by-field validation
 * • Error highlighting and suggestions
 * • Auto-save functionality
 * • Validation progress tracking
 * 
 * ✅ **Monitoring Features:**
 * • Real-time status updates
 * • Processing logs and diagnostics
 * • Error reporting with context
 * • Performance metrics
 * • Service health indicators
 * 
 * 🔧 STATIC FILE SERVING:
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 
 * All routes serve static HTML files from the public directory.
 * Client-side JavaScript handles:
 * • API communication with backend
 * • Dynamic content loading
 * • Form validation and submission
 * • Real-time updates and notifications
 * 
 * 📱 RESPONSIVE DESIGN:
 * • Mobile-friendly interfaces
 * • Tablet-optimized layouts
 * • Desktop full-feature experience
 * • Touch-friendly controls
 * • Accessible design patterns
 * 
 * 🔧 DEPENDENCIES:
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 
 * • Express Router      - Route handling
 * • Path Module         - File path resolution
 * • Static HTML Files   - User interface templates
 * 
 * 🚀 PERFORMANCE OPTIMIZATIONS:
 * • Static file caching
 * • Efficient route handling
 * • Minimal server-side processing
 * • Client-side state management
 * • Optimized asset loading
 * 
 * ================================================================================
 */

const express = require('express');
const path = require('path');
const router = express.Router();

// ============================================================================
// WEB INTERFACE ROUTES - STATIC HTML
// ============================================================================

// Helper to send HTML with no-cache headers so latest changes are always loaded
function sendHtmlNoCache(res, filePath) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.sendFile(path.resolve(__dirname, filePath));
}

// When SPLIT_ONLY is enabled, extraction UIs are archived and should not be served.
function sendArchivedNotice(res) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.sendFile(path.resolve(__dirname, '../public/html/archived-notice.html'));
}

/**
 * GET /
 * Dashboard - List all document batches
 */
router.get('/', (req, res) => {
  sendHtmlNoCache(res, '../public/html/dashboard.html');
});

/**
 * GET /dashboard
 * Alternative dashboard route
 */
router.get('/dashboard', (req, res) => {
  sendHtmlNoCache(res, '../public/html/dashboard.html');
});

/**
 * GET /batches/:batchId/validate-splits
 * UI 1: Splitting validation interface
 */
router.get('/batches/:batchId/validate-splits', (req, res) => {
  sendHtmlNoCache(res, '../public/html/validate-splits.html');
});

/**
 * GET /validate-splits/:batchId
 * Alternative URL pattern for splitting validation
 */
router.get('/validate-splits/:batchId', (req, res) => {
  sendHtmlNoCache(res, '../public/html/validate-splits.html');
});

/**
 * GET /batches/:batchId/validate-data
 * UI 2: Batch validation interface - List of invoices in batch
 */
router.get('/batches/:batchId/validate-data', (req, res) => {
  // This route lists invoices for batch validation. If SPLIT_ONLY is set, show archived notice.
  if (process.env.SPLIT_ONLY === '1' || process.env.SPLIT_ONLY === 'true') {
    return sendArchivedNotice(res);
  }
  sendHtmlNoCache(res, '../public/html/batch-validation.html');
});

/**
 * GET /batches/:batchId/invoices/:invoiceIndex/validate
 * UI 3: Individual invoice validation interface (with PDF preview and complete fields)
 */
router.get('/batches/:batchId/invoices/:invoiceIndex/validate', (req, res) => {
  if (process.env.SPLIT_ONLY === '1' || process.env.SPLIT_ONLY === 'true') {
    return sendArchivedNotice(res);
  }
  sendHtmlNoCache(res, '../public/html/validate-data.html');
});

/**
 * GET /extract-results
 * UI: Invoice extraction results viewer
 */
router.get('/extract-results', (req, res) => {
  sendHtmlNoCache(res, '../public/html/extract-results.html');
});

/**
 * GET /invoices/:batchId
 * UI: Invoice list interface for individual invoice extraction
 */
router.get('/invoices/:batchId', (req, res) => {
  sendHtmlNoCache(res, '../public/html/invoice-list.html');
});

// ============================================================================
// STATIC FILE SERVING
// ============================================================================

/**
 * Serve static files (CSS, JS, images)
 */
router.use('/static', express.static('src/public'));

/**
 * Serve split PDF files
 */
router.use('/static/split', express.static('storage/split'));

// ============================================================================
// ERROR HANDLING FOR WEB ROUTES
// ============================================================================
// Note: Error handling is done by the main app.js, no need for wildcard route here

module.exports = router;

