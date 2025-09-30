/**
 * ================================================================================
 * API ROUTES - INVOICE PROCESSING REST API
 * ================================================================================
 * 
 * RESTful API endpoints for the invoice processing system. Provides complete
 * functionality for PDF upload, batch processing, data extraction, validation,
 * and debugging through well-structured HTTP endpoints.
 * 
 * 🎯 API STRUCTURE:
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 
 * 📤 UPLOAD ENDPOINTS:
 * • POST   /api/upload                     - Upload PDF and create document batch
 * • GET    /api/batches                    - List all document batches
 * • GET    /api/batches/:batchId           - Get specific batch information
 * • DELETE /api/batches/:batchId           - Delete batch and associated files
 * 
 * 🔄 PROCESSING ENDPOINTS:
 * • POST   /api/batches/:batchId/process   - Start batch processing (text extraction + AI)
 * • POST   /api/batches/:batchId/splits    - Apply splits and extract invoice data
 * • POST   /api/batches/:batchId/reprocess - Reprocess failed or updated batch
 * • GET    /api/batches/:batchId/health    - Check Azure services health status
 * 
 * ✅ VALIDATION ENDPOINTS:
 * • POST   /api/batches/:batchId/validate/:invoiceIndex - Submit validated invoice data
 * • GET    /api/batches/:batchId/data      - Get extracted data for validation
 * 
 * 🐛 DEBUG & TESTING ENDPOINTS:
 * • POST   /api/debug/extract              - Debug invoice extraction (single file)
 * • POST   /api/debug/mapping              - Test mapping agent on uploaded file
 * • GET    /api/debug/services             - Check service configuration status
 * • POST   /api/debug/llm-direct           - Direct LLM extraction testing
 * 
 * 📁 FILE SERVING ENDPOINTS:
 * • GET    /api/files/split/:batchId/:filename - Serve split PDF files
 * • GET    /api/files/original/:filename   - Serve original uploaded files
 * 
 * 🔧 MIDDLEWARE CONFIGURATION:
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 
 * • **JSON Parser** - 10MB limit for large extraction payloads
 * • **Multer Upload** - File upload handling with PDF validation
 * • **Error Handling** - Comprehensive error capture and response formatting
 * • **CORS Support** - Cross-origin request handling for frontend integration
 * 
 * 📊 REQUEST/RESPONSE PATTERNS:
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 
 * 🟢 **Success Response Format:**
 * ```json
 * {
 *   "success": true,
 *   "data": { ... },
 *   "message": "Operation completed successfully"
 * }
 * ```
 * 
 * 🔴 **Error Response Format:**
 * ```json
 * {
 *   "success": false,
 *   "error": "Error description",
 *   "details": { ... }
 * }
 * ```
 * 
 * 📋 **Batch Information Response:**
 * ```json
 * {
 *   "id": "uuid",
 *   "filename": "invoice.pdf",
 *   "status": "COMPLETED",
 *   "pageCount": 15,
 *   "splits": [...],
 *   "extractedData": [...],
 *   "createdAt": "2025-09-02T10:30:00Z"
 * }
 * ```
 * 
 * 🔄 PROCESSING WORKFLOW:
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 
 * 1. **Upload** → POST /api/upload
 *    - Upload PDF file
 *    - Create document batch
 *    - Return batch ID and initial info
 * 
 * 2. **Process** → POST /api/batches/:id/process  
 *    - Extract text from PDF
 *    - Detect invoice boundaries using AI
 *    - Generate split proposals
 * 
 * 3. **Apply Splits** → POST /api/batches/:id/splits
 *    - Apply approved splits
 *    - Extract data from individual invoices
 *    - Generate structured data
 * 
 * 4. **Validate** → POST /api/batches/:id/validate/:index
 *    - Submit user-validated data
 *    - Update validation status
 *    - Complete processing when all validated
 * 
 * 🐛 DEBUG FEATURES:
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 
 * • **Single File Testing** - Test extraction on individual files
 * • **Service Health Checks** - Verify Azure service connectivity
 * • **LLM Direct Testing** - Test AI extraction capabilities
 * • **Mapping Agent Testing** - Validate schema mapping functionality
 * • **Configuration Validation** - Check service setup and credentials
 * 
 * 🔧 DEPENDENCIES:
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 
 * • Upload Controller       - File upload and batch management
 * • Processing Controller   - Invoice processing and data extraction
 * • Validation Controller   - Data validation and quality assurance
 * • Azure Document Service  - PDF analysis and extraction
 * • Data Mapper Service     - Schema validation and utilities
 * • DocumentBatch Model     - Database operations
 * 
 * 🚀 PERFORMANCE FEATURES:
 * • Streaming file uploads for large PDFs
 * • Asynchronous processing with status tracking
 * • Efficient error handling and recovery
 * • Comprehensive logging and debugging support
 * • RESTful design for easy integration
 * 
 * ================================================================================
 */

const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs').promises;
const { extractFromLayout } = require('../services/extractor/extractFromLayout');

// Import controllers
const uploadController = require('../controllers/upload.controller');
const processingController = require('../controllers/processing.controller');

// Import services for debugging (split-only minimal services)
const azureDocumentService = require('../services/azure-document.service');

// Import model for database access
const DocumentBatch = require('../models/document-batch.model');

// Middleware for JSON parsing
router.use(express.json({ limit: '10mb' }));

// When SPLIT_ONLY is enabled, extraction APIs are archived and should not be used.
function sendArchivedApi(res, feature = 'extraction') {
  return res.status(410).json({
    success: false,
    error: 'archived_feature',
    message: `The requested ${feature} feature has been archived and is not available in the SPLIT_ONLY delivery. Contact the project owner to access the archived extraction package.`
  });
}

// ============================================================================
// UPLOAD ROUTES
// ============================================================================

/**
 * POST /api/upload
 * Upload a PDF file and create a document batch
 */
router.post('/upload', 
  uploadController.upload.single('pdf'),
  uploadController.uploadPDF.bind(uploadController),
  uploadController.handleUploadError.bind(uploadController)
);

/**
 * GET /api/batches
 * List all document batches
 */
router.get('/batches', uploadController.listBatches.bind(uploadController));

/**
 * GET /api/batches/:batchId
 * Get information about a specific batch
 */
router.get('/batches/:batchId', uploadController.getBatchInfo.bind(uploadController));

/**
 * DELETE /api/batches/:batchId
 * Delete a document batch and associated files
 */
router.delete('/batches/:batchId', uploadController.deleteBatch.bind(uploadController));

/**
 * GET /api/storage/stats
 * Get storage statistics
 */
router.get('/storage/stats', uploadController.getStorageStats.bind(uploadController));

/**
 * GET /api/files/:batchId/pdf
 * Serve PDF file for preview
 */
router.get('/files/:batchId/pdf', uploadController.servePDF.bind(uploadController));

// ============================================================================
// PROCESSING ROUTES
// ============================================================================

/**
 * POST /api/batches/:batchId/process
 * Start processing a document batch (text extraction + boundary detection)
 */
router.post('/batches/:batchId/process', processingController.startProcessing.bind(processingController));

/**
 * GET /api/batches/:batchId/status
 * Get processing status for a batch
 */
router.get('/batches/:batchId/status', processingController.getProcessingStatus.bind(processingController));

/**
 * POST /api/batches/:batchId/validate-splits
 * Validate and confirm splits, create individual PDF files
 */
router.post('/batches/:batchId/validate-splits', processingController.validateSplits.bind(processingController));

/**
 * PUT /api/batches/:batchId/splits
 * Update splits manually for a batch
 */
router.put('/batches/:batchId/splits', processingController.updateSplits.bind(processingController));

/**
 * POST /api/batches/:batchId/extract-data
 * Extract structured data from individual invoice PDFs
 */
router.post('/batches/:batchId/extract-data', (req, res, next) => {
  if (process.env.SPLIT_ONLY === '1' || process.env.SPLIT_ONLY === 'true') {
    return sendArchivedApi(res, 'data extraction');
  }
  return processingController.extractInvoiceData(req, res, next);
});

/**
 * GET /api/batches/:batchId/extracted-data
 * Get extracted invoice data for validation
 */
router.get('/batches/:batchId/extracted-data', (req, res, next) => {
  if (process.env.SPLIT_ONLY === '1' || process.env.SPLIT_ONLY === 'true') {
    return sendArchivedApi(res, 'extracted data retrieval');
  }
  return processingController.getExtractedData(req, res, next);
});

/**
 * POST /api/batches/:batchId/extract-invoice/:invoiceIndex
 * Extract data from a single invoice using stored layout data
 */
router.post('/batches/:batchId/extract-invoice/:invoiceIndex', processingController.extractSingleInvoice.bind(processingController));

/**
 * GET /api/health
 * Check Azure services health
 */
router.get('/health', processingController.checkServiceHealth.bind(processingController));

// ============================================================================
// EXTRACTION ROUTES (Second Layer: Extraction & Mapping)
// ============================================================================

/**
 * POST /api/extract
 * Accepts Azure Document Intelligence Layout v4 JSON and returns a strict InvoiceExtract
 */
router.post('/extract', async (req, res) => {
  try {
    const layout = req.body;
    if (!layout || typeof layout !== 'object') {
      return res.status(400).json({ success: false, error: 'Invalid layout payload' });
    }

    const { extract, diagnostics } = await extractFromLayout(layout);
    return res.json({ success: true, data: { extract, diagnostics }, message: 'Extraction completed' });
  } catch (error) {
    console.error('Extraction error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/extract-pdf
 * Accepts PDF file, processes through Azure DI, then extracts invoice data
 */
router.post('/extract-pdf', uploadController.upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No PDF file provided' });
    }

    // Get Layout JSON from PDF
    const layoutResult = await azureDocumentService.getLayoutFromPDF(req.file.path);
    if (!layoutResult.success) {
      return res.status(500).json({ success: false, error: `Layout extraction failed: ${layoutResult.error}` });
    }

    // Extract invoice data from Layout
    const { extract, diagnostics } = await extractFromLayout(layoutResult.layout);
    
    // Clean up uploaded file
    try { require('fs').unlinkSync(req.file.path); } catch {}

    return res.json({ 
      success: true, 
      data: { extract, diagnostics }, 
      message: 'PDF extraction completed' 
    });
  } catch (error) {
    console.error('PDF extraction error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// VALIDATION ROUTES
// ============================================================================

/**
 * POST /api/batches/:batchId/validate-data
 * Submit validated invoice data (ARCHIVED)
 */
router.post('/batches/:batchId/validate-data', (req, res) => {
  return sendArchivedApi(res, 'data validation');
});

/**
 * GET /api/batches/:batchId/validation-summary
 * Get validation summary for a batch (ARCHIVED)
 */
router.get('/batches/:batchId/validation-summary', (req, res) => {
  return sendArchivedApi(res, 'validation summary');
});

/**
 * GET /api/batches/:batchId/export
 * Export final validated data (ARCHIVED)
 */
router.get('/batches/:batchId/export', (req, res) => {
  return sendArchivedApi(res, 'data export');
});

// ============================================================================
// ERROR HANDLING MIDDLEWARE
// ============================================================================

/**
 * Global error handler for API routes
 */
router.use((error, req, res, next) => {
  console.error('API Error:', error);
  
  // Handle specific error types
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: 'Validation error',
      details: error.message
    });
  }
  
  if (error.name === 'CastError') {
    return res.status(400).json({
      success: false,
      error: 'Invalid ID format'
    });
  }
  
  // Default error response
  res.status(error.status || 500).json({
    success: false,
    error: error.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

/**
 * 404 handler for API routes
 */
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'API endpoint not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Test endpoint to re-extract a single invoice (ARCHIVED - split-only delivery)
router.post('/test-extract/:batchId/:invoiceIndex', (req, res) => {
  return sendArchivedApi(res, 'test extraction');
});

module.exports = router;

