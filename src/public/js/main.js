/**
 * Invoice Processing System - Main JavaScript
 */

// Global utilities and helpers
const InvoiceProcessingSystem = {
    // Configuration
    config: {
        apiBaseUrl: '/api',
        pollInterval: 8000, // 8 seconds (faster refresh)
        maxPollAttempts: 45,  // 6 minutes max (longer timeout)
        autoRefreshInterval: 25000, // 25 seconds
        autoRefreshEnabled: true, // Global auto-refresh toggle
        statusTransitionDelay: 2000 // Delay before auto-redirect
    },

    // Utility functions
    utils: {
        /**
         * Format file size in human readable format
         */
        formatFileSize(bytes) {
            if (bytes === 0) return '0 Bytes';
            const k = 1024;
            const sizes = ['Bytes', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        },

        /**
         * Format date in locale string
         */
        formatDate(dateString) {
            const date = new Date(dateString);
            return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
        },

        /**
         * Debounce function calls
         */
        debounce(func, wait) {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func(...args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        },

        /**
         * Generate UUID
         */
        generateUUID() {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                const r = Math.random() * 16 | 0;
                const v = c == 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        },

        /**
         * Validate email format
         */
        isValidEmail(email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return emailRegex.test(email);
        },

        /**
         * Sanitize HTML content
         */
        sanitizeHtml(str) {
            const temp = document.createElement('div');
            temp.textContent = str;
            return temp.innerHTML;
        }
    },

    // API helper functions
    api: {
        /**
         * Make API request with error handling
         */
        async request(endpoint, options = {}) {
            const url = InvoiceProcessingSystem.config.apiBaseUrl + endpoint;
            
            const defaultOptions = {
                headers: {
                    'Content-Type': 'application/json'
                }
            };

            const finalOptions = { ...defaultOptions, ...options };
            
            try {
                const response = await fetch(url, finalOptions);
                const data = await response.json();
                
                if (!response.ok) {
                    throw new Error(data.error || `HTTP error! status: ${response.status}`);
                }
                
                return data;
            } catch (error) {
                console.error('API request failed:', error);
                throw error;
            }
        },

        /**
         * Upload file with progress tracking
         */
        async uploadFile(file, onProgress = null) {
            return new Promise((resolve, reject) => {
                const formData = new FormData();
                formData.append('pdf', file);
                
                const xhr = new XMLHttpRequest();
                
                if (onProgress) {
                    xhr.upload.addEventListener('progress', (e) => {
                        if (e.lengthComputable) {
                            const percentComplete = (e.loaded / e.total) * 100;
                            onProgress(percentComplete);
                        }
                    });
                }
                
                xhr.addEventListener('load', () => {
                    if (xhr.status === 200) {
                        try {
                            const response = JSON.parse(xhr.responseText);
                            resolve(response);
                        } catch (error) {
                            reject(new Error('Invalid JSON response'));
                        }
                    } else {
                        reject(new Error(`Upload failed with status: ${xhr.status}`));
                    }
                });
                
                xhr.addEventListener('error', () => {
                    reject(new Error('Upload failed'));
                });
                
                xhr.open('POST', '/api/upload');
                xhr.send(formData);
            });
        }
    },

    // UI helper functions
    ui: {
        /**
         * Show alert message
         */
        showAlert(type, message, container = 'alertContainer', autoDismiss = true) {
            const alertContainer = document.getElementById(container);
            if (!alertContainer) return;
            
            const alertClass = {
                'success': 'alert-success',
                'error': 'alert-danger',
                'warning': 'alert-warning',
                'info': 'alert-info'
            }[type] || 'alert-info';
            
            const iconClass = {
                'success': 'bi-check-circle',
                'error': 'bi-exclamation-triangle',
                'warning': 'bi-exclamation-triangle',
                'info': 'bi-info-circle'
            }[type] || 'bi-info-circle';
            
            const alertId = 'alert-' + Date.now();
            const alertHtml = `
                <div id="${alertId}" class="alert ${alertClass} alert-dismissible fade show" role="alert">
                    <i class="bi ${iconClass} me-2"></i>
                    ${InvoiceProcessingSystem.utils.sanitizeHtml(message)}
                    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                </div>
            `;
            
            alertContainer.insertAdjacentHTML('beforeend', alertHtml);
            
            // Auto-dismiss after 5 seconds
            if (autoDismiss) {
                setTimeout(() => {
                    const alert = document.getElementById(alertId);
                    if (alert) {
                        const bsAlert = new bootstrap.Alert(alert);
                        bsAlert.close();
                    }
                }, 5000);
            }
        },

        /**
         * Show loading modal
         */
        showLoadingModal(title = 'Loading...', message = 'Please wait...') {
            const modalId = 'loadingModal-' + Date.now();
            const modalHtml = `
                <div class="modal fade" id="${modalId}" tabindex="-1" data-bs-backdrop="static" data-bs-keyboard="false">
                    <div class="modal-dialog modal-dialog-centered">
                        <div class="modal-content">
                            <div class="modal-body text-center py-4">
                                <div class="spinner-border text-primary mb-3" role="status">
                                    <span class="visually-hidden">Loading...</span>
                                </div>
                                <h5>${InvoiceProcessingSystem.utils.sanitizeHtml(title)}</h5>
                                <p class="text-muted mb-0">${InvoiceProcessingSystem.utils.sanitizeHtml(message)}</p>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.insertAdjacentHTML('beforeend', modalHtml);
            const modal = new bootstrap.Modal(document.getElementById(modalId));
            modal.show();
            
            return {
                modal,
                hide: () => {
                    modal.hide();
                    setTimeout(() => {
                        document.getElementById(modalId).remove();
                    }, 300);
                }
            };
        },

        /**
         * Show auto-refresh status indicator
         */
        showAutoRefreshIndicator(batchId, status) {
            // Add to top of page if not already present
            let indicator = document.getElementById('autoRefreshIndicator');
            if (!indicator) {
                const indicatorHtml = `
                    <div id="autoRefreshIndicator" class="alert alert-info auto-refresh-notification m-0 rounded-0 text-center" role="alert">
                        <i class="bi bi-arrow-clockwise auto-refresh-icon me-2"></i>
                        <span id="autoRefreshText">Monitoring batch processing...</span>
                        <button type="button" class="btn-close btn-close-sm ms-3" onclick="InvoiceProcessingSystem.ui.hideAutoRefreshIndicator()"></button>
                    </div>
                `;
                
                document.body.insertAdjacentHTML('afterbegin', indicatorHtml);
                indicator = document.getElementById('autoRefreshIndicator');
            }
            
            // Update indicator text
            const textElement = document.getElementById('autoRefreshText');
            if (textElement) {
                textElement.textContent = `Monitoring batch ${batchId.substring(0, 8)}... (${status})`;
            }
        },

        /**
         * Hide auto-refresh status indicator
         */
        hideAutoRefreshIndicator() {
            const indicator = document.getElementById('autoRefreshIndicator');
            if (indicator) {
                indicator.style.transition = 'all 0.3s ease-out';
                indicator.style.transform = 'translateY(-100%)';
                setTimeout(() => {
                    indicator.remove();
                }, 300);
            }
        },
        showConfirmDialog(title, message, onConfirm, onCancel = null) {
            const modalId = 'confirmModal-' + Date.now();
            const modalHtml = `
                <div class="modal fade" id="${modalId}" tabindex="-1">
                    <div class="modal-dialog modal-dialog-centered">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title">${InvoiceProcessingSystem.utils.sanitizeHtml(title)}</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                            </div>
                            <div class="modal-body">
                                <p>${InvoiceProcessingSystem.utils.sanitizeHtml(message)}</p>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                                <button type="button" class="btn btn-primary" id="confirmBtn-${modalId}">Confirm</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.insertAdjacentHTML('beforeend', modalHtml);
            const modal = new bootstrap.Modal(document.getElementById(modalId));
            
            // Handle confirm button
            document.getElementById(`confirmBtn-${modalId}`).addEventListener('click', () => {
                modal.hide();
                if (onConfirm) onConfirm();
            });
            
            // Handle modal close
            document.getElementById(modalId).addEventListener('hidden.bs.modal', () => {
                document.getElementById(modalId).remove();
                if (onCancel) onCancel();
            });
            
            modal.show();
        },

        /**
         * Update progress bar
         */
        updateProgressBar(selector, percentage, animated = true) {
            const progressBar = document.querySelector(selector);
            if (progressBar) {
                progressBar.style.width = percentage + '%';
                progressBar.setAttribute('aria-valuenow', percentage);
                
                if (animated) {
                    progressBar.classList.add('progress-bar-animated');
                } else {
                    progressBar.classList.remove('progress-bar-animated');
                }
            }
        },

        /**
         * Enable/disable form elements
         */
        toggleFormElements(formSelector, disabled = true) {
            const form = document.querySelector(formSelector);
            if (form) {
                const elements = form.querySelectorAll('input, select, textarea, button');
                elements.forEach(element => {
                    element.disabled = disabled;
                });
            }
        }
    },

    // Form validation helpers
    validation: {
        /**
         * Validate required fields
         */
        validateRequired(formSelector) {
            const form = document.querySelector(formSelector);
            if (!form) return false;
            
            const requiredFields = form.querySelectorAll('[required]');
            let isValid = true;
            
            requiredFields.forEach(field => {
                if (!field.value.trim()) {
                    field.classList.add('is-invalid');
                    isValid = false;
                } else {
                    field.classList.remove('is-invalid');
                }
            });
            
            return isValid;
        },

        /**
         * Validate email fields
         */
        validateEmails(formSelector) {
            const form = document.querySelector(formSelector);
            if (!form) return true;
            
            const emailFields = form.querySelectorAll('input[type="email"]');
            let isValid = true;
            
            emailFields.forEach(field => {
                if (field.value && !InvoiceProcessingSystem.utils.isValidEmail(field.value)) {
                    field.classList.add('is-invalid');
                    isValid = false;
                } else {
                    field.classList.remove('is-invalid');
                }
            });
            
            return isValid;
        },

        /**
         * Validate numeric fields
         */
        validateNumbers(formSelector) {
            const form = document.querySelector(formSelector);
            if (!form) return true;
            
            const numberFields = form.querySelectorAll('input[type="number"]');
            let isValid = true;
            
            numberFields.forEach(field => {
                if (field.value && (isNaN(field.value) || field.value < 0)) {
                    field.classList.add('is-invalid');
                    isValid = false;
                } else {
                    field.classList.remove('is-invalid');
                }
            });
            
            return isValid;
        }
    },

    // Status polling functionality
    polling: {
        activePolls: new Map(),

        /**
         * Start polling for batch status with auto-refresh
         */
        startBatchStatusPolling(batchId, onStatusChange, maxAttempts = null) {
            if (!InvoiceProcessingSystem.config.autoRefreshEnabled) {
                console.log('Auto-refresh is disabled');
                return;
            }
            
            const pollId = 'batch-' + batchId;
            
            // Stop existing poll if any
            this.stopPolling(pollId);
            
            let attempts = 0;
            const maxPollAttempts = maxAttempts || InvoiceProcessingSystem.config.maxPollAttempts;
            
            // Show auto-refresh indicator
            InvoiceProcessingSystem.ui.showAutoRefreshIndicator(batchId, 'MONITORING');
            
            const poll = async () => {
                try {
                    const response = await InvoiceProcessingSystem.api.request(`/batches/${batchId}/status`);
                    
                    if (response.success) {
                        const status = response.data.status;
                        const previousStatus = this.activePolls.get(pollId + '_lastStatus');
                        
                        // Store current status for comparison
                        this.activePolls.set(pollId + '_lastStatus', status);
                        
                        // Update auto-refresh indicator
                        InvoiceProcessingSystem.ui.showAutoRefreshIndicator(batchId, status);
                        
                        if (onStatusChange) {
                            onStatusChange(status, response.data);
                        }
                        
                        // Auto-redirect logic based on status transitions
                        this.handleStatusTransition(previousStatus, status, batchId, response.data);
                        
                        // Stop polling if status is final
                        if (['COMPLETED', 'ERROR', 'SPLIT_PROPOSED', 'DATA_VALIDATION_PENDING'].includes(status)) {
                            this.stopPolling(pollId);
                            // Hide indicator after a delay for final statuses
                            setTimeout(() => {
                                InvoiceProcessingSystem.ui.hideAutoRefreshIndicator();
                            }, 5000);
                            return;
                        }
                        
                        // Continue polling if not exceeded max attempts
                        if (attempts < maxPollAttempts) {
                            attempts++;
                            const timeoutId = setTimeout(poll, InvoiceProcessingSystem.config.pollInterval);
                            this.activePolls.set(pollId, timeoutId);
                        } else {
                            this.stopPolling(pollId);
                            InvoiceProcessingSystem.ui.hideAutoRefreshIndicator();
                            if (onStatusChange) {
                                onStatusChange('TIMEOUT', { error: 'Polling timeout exceeded' });
                            }
                        }
                    }
                } catch (error) {
                    console.error('Status polling error:', error);
                    this.stopPolling(pollId);
                    InvoiceProcessingSystem.ui.hideAutoRefreshIndicator();
                    if (onStatusChange) {
                        onStatusChange('ERROR', { error: error.message });
                    }
                }
            };
            
            // Start polling after initial delay
            const timeoutId = setTimeout(poll, 2000);
            this.activePolls.set(pollId, timeoutId);
        },

        /**
         * Handle automatic redirects based on status transitions
         */
        handleStatusTransition(previousStatus, currentStatus, batchId, batchData) {
            // Only trigger on actual status changes
            if (previousStatus === currentStatus) return;
            
            console.log(`Status transition: ${previousStatus} -> ${currentStatus}`);
            
            const redirectDelay = InvoiceProcessingSystem.config.statusTransitionDelay;
            
            switch (currentStatus) {
                case 'SPLIT_PROPOSED':
                    // Splitting completed - auto-redirect to validation
                    if (previousStatus && ['PROCESSING', 'SPLITTING', 'PROCESSING_SPLIT'].includes(previousStatus)) {
                        InvoiceProcessingSystem.ui.showAlert('success', 
                            'Document splitting completed! Redirecting to validation...', 
                            'alertContainer', false);
                        
                        setTimeout(() => {
                            window.location.href = `/validate-splits/${batchId}`;
                        }, redirectDelay);
                    }
                    break;
                    
                case 'DATA_VALIDATION_PENDING':
                    // Data extraction completed - auto-redirect to data validation
                    if (previousStatus === 'SPLIT_VALIDATED' || previousStatus === 'EXTRACTING_DATA') {
                        InvoiceProcessingSystem.ui.showAlert('success', 
                            'Data extraction completed! Redirecting to data validation...', 
                            'alertContainer', false);
                        
                        setTimeout(() => {
                            window.location.href = `/batches/${batchId}/validate-data`;
                        }, redirectDelay);
                    }
                    break;
                    
                case 'COMPLETED':
                    // All processing completed - auto-redirect to dashboard
                    if (previousStatus && previousStatus !== 'COMPLETED') {
                        InvoiceProcessingSystem.ui.showAlert('success', 
                            'Processing completed successfully! Redirecting to dashboard...', 
                            'alertContainer', false);
                        
                        setTimeout(() => {
                            window.location.href = '/dashboard';
                        }, redirectDelay + 1000); // Slightly longer delay for completion
                    }
                    break;
                    
                case 'ERROR':
                    // Error occurred - show error message
                    InvoiceProcessingSystem.ui.showAlert('error', 
                        `Processing failed: ${batchData.error || 'Unknown error'}`, 
                        'alertContainer', false);
                    break;
            }
        },

        /**
         * Start auto-refresh polling for current page
         */
        startAutoRefresh(batchId, currentPage = 'dashboard') {
            // Custom polling logic based on current page
            const onStatusChange = (status, data) => {
                console.log(`Auto-refresh: Batch ${batchId} status: ${status}`);
                
                // Update UI based on current page and status
                if (currentPage === 'dashboard') {
                    // Refresh batch list when on dashboard
                    if (window.loadBatches && typeof window.loadBatches === 'function') {
                        window.loadBatches();
                    }
                } else if (currentPage === 'validate-splits') {
                    // Reload split data when on validation page
                    if (window.loadBatchData && typeof window.loadBatchData === 'function') {
                        window.loadBatchData();
                    }
                } else if (currentPage === 'validate-data') {
                    // Reload data when on data validation page
                    if (window.loadCurrentInvoice && typeof window.loadCurrentInvoice === 'function') {
                        window.loadCurrentInvoice();
                    }
                }
            };
            
            this.startBatchStatusPolling(batchId, onStatusChange);
        },

        /**
         * Stop polling
         */
        stopPolling(pollId) {
            if (this.activePolls.has(pollId)) {
                clearTimeout(this.activePolls.get(pollId));
                this.activePolls.delete(pollId);
            }
        },

        /**
         * Stop all active polls
         */
        stopAllPolling() {
            this.activePolls.forEach((timeoutId) => {
                clearTimeout(timeoutId);
            });
            this.activePolls.clear();
        }
    },

    // Local storage helpers
    storage: {
        /**
         * Set item in localStorage with error handling
         */
        setItem(key, value) {
            try {
                localStorage.setItem(key, JSON.stringify(value));
                return true;
            } catch (error) {
                console.error('localStorage setItem error:', error);
                return false;
            }
        },

        /**
         * Get item from localStorage with error handling
         */
        getItem(key, defaultValue = null) {
            try {
                const item = localStorage.getItem(key);
                return item ? JSON.parse(item) : defaultValue;
            } catch (error) {
                console.error('localStorage getItem error:', error);
                return defaultValue;
            }
        },

        /**
         * Remove item from localStorage
         */
        removeItem(key) {
            try {
                localStorage.removeItem(key);
                return true;
            } catch (error) {
                console.error('localStorage removeItem error:', error);
                return false;
            }
        }
    },

    // Initialize the application
    init() {
        console.log('Invoice Processing System initialized');
        
        // Add global error handler
        window.addEventListener('error', (event) => {
            console.error('Global error:', event.error);
        });
        
        // Add unhandled promise rejection handler
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
        });
        
        // Initialize tooltips
        const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltipTriggerList.map(function (tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl);
        });
        
        // Initialize popovers
        const popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
        popoverTriggerList.map(function (popoverTriggerEl) {
            return new bootstrap.Popover(popoverTriggerEl);
        });
        
        // Add form validation classes
        document.addEventListener('input', (event) => {
            if (event.target.matches('input, select, textarea')) {
                event.target.classList.remove('is-invalid');
                
                // Real-time email validation
                if (event.target.type === 'email' && event.target.value) {
                    if (!InvoiceProcessingSystem.utils.isValidEmail(event.target.value)) {
                        event.target.classList.add('is-invalid');
                    }
                }
            }
        });
        
        // Add keyboard shortcuts
        document.addEventListener('keydown', (event) => {
            // Ctrl+/ or Cmd+/ for help
            if ((event.ctrlKey || event.metaKey) && event.key === '/') {
                event.preventDefault();
                // Show help modal or navigate to help page
                console.log('Help shortcut triggered');
            }
            
            // Escape to close modals
            if (event.key === 'Escape') {
                const openModals = document.querySelectorAll('.modal.show');
                openModals.forEach(modal => {
                    const bsModal = bootstrap.Modal.getInstance(modal);
                    if (bsModal) {
                        bsModal.hide();
                    }
                });
            }
        });
    }
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    InvoiceProcessingSystem.init();
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    InvoiceProcessingSystem.polling.stopAllPolling();
});

// Export for global access
window.InvoiceProcessingSystem = InvoiceProcessingSystem;

