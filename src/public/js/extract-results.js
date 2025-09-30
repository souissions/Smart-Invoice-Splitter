class ExtractionResultsUI {
    constructor() {
        this.layoutData = null;
        this.uploadedFile = null;
        this.fileType = null;
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');
        const extractBtn = document.getElementById('extractBtn');

        // File upload handling
        uploadArea.addEventListener('click', () => fileInput.click());
        uploadArea.addEventListener('dragover', this.handleDragOver.bind(this));
        uploadArea.addEventListener('dragleave', this.handleDragLeave.bind(this));
        uploadArea.addEventListener('drop', this.handleDrop.bind(this));
        
        fileInput.addEventListener('change', this.handleFileSelect.bind(this));
        extractBtn.addEventListener('click', this.performExtraction.bind(this));
    }

    handleDragOver(e) {
        e.preventDefault();
        document.getElementById('uploadArea').classList.add('dragover');
    }

    handleDragLeave(e) {
        e.preventDefault();
        document.getElementById('uploadArea').classList.remove('dragover');
    }

    handleDrop(e) {
        e.preventDefault();
        document.getElementById('uploadArea').classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            this.processFile(files[0]);
        }
    }

    handleFileSelect(e) {
        const files = e.target.files;
        if (files.length > 0) {
            this.processFile(files[0]);
        }
    }

    async processFile(file) {
        if (file.name.endsWith('.json')) {
            // Handle JSON file
            try {
                const text = await file.text();
                this.layoutData = JSON.parse(text);
                this.fileType = 'json';
                this.uploadedFile = null;
                document.getElementById('extractBtn').disabled = false;
                this.showSuccess(`JSON file loaded: ${file.name}`);
            } catch (error) {
                this.showError(`Invalid JSON file: ${error.message}`);
            }
        } else if (file.name.endsWith('.pdf')) {
            // Handle PDF file
            this.uploadedFile = file;
            this.fileType = 'pdf';
            this.layoutData = null;
            document.getElementById('extractBtn').disabled = false;
            this.showSuccess(`PDF file loaded: ${file.name}`);
        } else {
            this.showError('Please select a PDF or JSON file');
        }
    }

    async performExtraction() {
        if (!this.layoutData && !this.uploadedFile) {
            this.showError('Please upload a PDF or Layout JSON file first');
            return;
        }

        this.setLoading(true);
        this.hideError();

        try {
            let response;
            
            if (this.fileType === 'json') {
                // Extract from JSON layout
                response = await fetch('/api/extract', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(this.layoutData)
                });
            } else if (this.fileType === 'pdf') {
                // Extract from PDF file
                const formData = new FormData();
                formData.append('pdf', this.uploadedFile);
                
                response = await fetch('/api/extract-pdf', {
                    method: 'POST',
                    body: formData
                });
            }

            const result = await response.json();

            if (result.success) {
                this.displayResults(result.data);
            } else {
                this.showError(result.error || 'Extraction failed');
            }
        } catch (error) {
            this.showError(`Network error: ${error.message}`);
        } finally {
            this.setLoading(false);
        }
    }

    displayResults(data) {
        const { extract, diagnostics } = data;
        
        // Show results section
        document.getElementById('resultsSection').style.display = 'block';
        
        // Display each section
        this.displayBasicInformation(extract.basicInformation || []);
        this.displayLineItems(extract.lineItems || []);
        this.displayTotals(extract.totalsAndSubtotals || []);
        this.displayImporter(extract.importer || []);
        this.displayExporter(extract.exporter || []);
        this.displayDiagnostics(diagnostics || {});
        this.displayRawJSON(extract);

        // Scroll to results
        document.getElementById('resultsSection').scrollIntoView({ behavior: 'smooth' });
    }

    displayBasicInformation(basicInfo) {
        const section = document.getElementById('basicInfoSection');
        if (basicInfo.length === 0) {
            section.innerHTML = '<p class="text-muted">No basic information extracted</p>';
            return;
        }

        const info = basicInfo[0]; // Usually just one item
        const fields = [
            { label: 'Internal Reference', value: info.internalReference },
            { label: 'Document Type', value: info.documentType },
            { label: 'Document Number', value: info.documentNumber },
            { label: 'Document Date', value: info.documentDate },
            { label: 'Dispatch Country', value: info.dispatchCountry },
            { label: 'Final Destination', value: info.finalDestination },
            { label: 'Origin Countries', value: info.originCountries },
            { label: 'Incoterms', value: info.incoterms },
            { label: 'Incoterms City', value: info.incotermsCity },
            { label: 'Commodity Code', value: info.commodityCode },
            { label: 'Total Packages', value: info.totalPackages },
            { label: 'Parcel Type', value: info.parcelType }
        ].filter(field => field.value); // Only show fields with values

        section.innerHTML = `
            <div class="table-responsive">
                <table class="table table-striped table-hover">
                    <thead class="table-dark">
                        <tr>
                            <th style="width: 40%;">Field</th>
                            <th style="width: 60%;">Value</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${fields.map(field => `
                            <tr>
                                <td class="fw-medium">${field.label}</td>
                                <td>${this.formatValue(field.value)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    displayLineItems(lineItems) {
        const section = document.getElementById('lineItemsSection');
        if (lineItems.length === 0) {
            section.innerHTML = '<p class="text-muted">No line items extracted</p>';
            return;
        }

        section.innerHTML = `
            <div class="table-responsive">
                <table class="table table-striped table-hover">
                    <thead class="table-dark">
                        <tr>
                            <th style="width: 5%;">#</th>
                            <th style="width: 10%;">Type</th>
                            <th style="width: 10%;">Product Code</th>
                            <th style="width: 25%;">Description</th>
                            <th style="width: 8%;">HS Code</th>
                            <th style="width: 8%;">Quantity</th>
                            <th style="width: 6%;">UOM</th>
                            <th style="width: 10%;">Total Amount</th>
                            <th style="width: 8%;">Currency</th>
                            <th style="width: 10%;">Origin Country</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${lineItems.map((item, index) => {
                            const icon = this.getTypeIcon(item.type);
                            return `
                                <tr>
                                    <td class="text-center fw-bold">${index + 1}</td>
                                    <td>
                                        <i class="${icon} me-1 text-primary"></i>
                                        <span class="badge bg-light text-dark">${item.type || '-'}</span>
                                    </td>
                                    <td><code class="small">${item.productCode || '-'}</code></td>
                                    <td class="text-truncate" style="max-width: 200px;" title="${item.description || '-'}">
                                        ${item.description || '-'}
                                    </td>
                                    <td><code class="small">${item.hsCode || '-'}</code></td>
                                    <td class="text-end">${this.formatNumber(item.quantity) || '-'}</td>
                                    <td><span class="badge bg-secondary">${item.UOM || '-'}</span></td>
                                    <td class="text-end fw-medium">${this.formatCurrency(item.totalAmount) || '-'}</td>
                                    <td><span class="badge bg-info">${item.currency || '-'}</span></td>
                                    <td>${item.originCountry || '-'}</td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    displayTotals(totals) {
        const section = document.getElementById('totalsSection');
        if (totals.length === 0) {
            section.innerHTML = '<p class="text-muted">No totals extracted</p>';
            return;
        }

        const total = totals[0]; // Usually just one item
        const fields = [
            { label: 'Air Fee', value: total.airFee, type: 'currency' },
            { label: 'Other Fee 1', value: total.otherFee1, type: 'currency' },
            { label: 'Insurance Fee', value: total.insuranceFee, type: 'currency' },
            { label: 'Rebate', value: total.rebate, type: 'currency' },
            { label: 'Amount Due', value: total.amountDue, type: 'currency' },
            { label: 'Currency', value: total.currency, type: 'text' },
            { label: 'Total Net Weight', value: total.totalNetWeight, type: 'weight' },
            { label: 'Total Gross Weight', value: total.totalGrossWeight, type: 'weight' },
            { label: 'Total Quantity', value: total.totalQuantity, type: 'number' },
            { label: 'Total Volume', value: total.totalVolume, type: 'number' }
        ].filter(field => field.value); // Only show fields with values

        section.innerHTML = `
            <div class="table-responsive">
                <table class="table table-striped table-hover">
                    <thead class="table-dark">
                        <tr>
                            <th style="width: 40%;">Field</th>
                            <th style="width: 60%;">Value</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${fields.map(field => `
                            <tr>
                                <td class="fw-medium">${field.label}</td>
                                <td class="text-end">${this.formatValueByType(field.value, field.type)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    displayImporter(importer) {
        const section = document.getElementById('importerSection');
        if (importer.length === 0) {
            section.innerHTML = '<p class="text-muted">No importer information extracted</p>';
            return;
        }

        const imp = importer[0]; // Usually just one item
        const fields = [
            { label: 'Name', value: imp.name },
            { label: 'EORI Number', value: imp.eoriNumber },
            { label: 'VAT Number', value: imp.vatNumber },
            { label: 'Address', value: imp.address },
            { label: 'City', value: imp.city },
            { label: 'Zip Code', value: imp.zipCode },
            { label: 'Country', value: imp.country }
        ].filter(field => field.value);

        section.innerHTML = `
            <div class="table-responsive">
                <table class="table table-striped table-hover">
                    <thead class="table-dark">
                        <tr>
                            <th style="width: 30%;">Field</th>
                            <th style="width: 70%;">Value</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${fields.map(field => `
                            <tr>
                                <td class="fw-medium">${field.label}</td>
                                <td>${this.formatValue(field.value)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    displayExporter(exporter) {
        const section = document.getElementById('exporterSection');
        if (exporter.length === 0) {
            section.innerHTML = '<p class="text-muted">No exporter information extracted</p>';
            return;
        }

        const exp = exporter[0]; // Usually just one item
        const fields = [
            { label: 'Name', value: exp.name },
            { label: 'EORI Number', value: exp.eoriNumber },
            { label: 'VAT Number', value: exp.vatNumber },
            { label: 'REX Number', value: exp.rexNumber },
            { label: 'Address', value: exp.address },
            { label: 'City', value: exp.city },
            { label: 'Zip Code', value: exp.zipCode },
            { label: 'Country', value: exp.country }
        ].filter(field => field.value);

        section.innerHTML = `
            <div class="table-responsive">
                <table class="table table-striped table-hover">
                    <thead class="table-dark">
                        <tr>
                            <th style="width: 30%;">Field</th>
                            <th style="width: 70%;">Value</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${fields.map(field => `
                            <tr>
                                <td class="fw-medium">${field.label}</td>
                                <td>${this.formatValue(field.value)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    displayDiagnostics(diagnostics) {
        const section = document.getElementById('diagnosticsSection');
        const computed = diagnostics.computed || {};
        
        if (Object.keys(computed).length === 0) {
            section.innerHTML = '<p class="text-muted">No computed fields</p>';
            return;
        }

        const computedFields = Object.entries(computed)
            .filter(([key, value]) => value === true)
            .map(([key]) => `<span class="badge bg-info me-1">${key}</span>`)
            .join('');

        section.innerHTML = `
            <div class="field-group">
                <h6>Computed Fields:</h6>
                <p>${computedFields || '<span class="text-muted">None</span>'}</p>
            </div>
        `;
    }

    displayRawJSON(extract) {
        const section = document.getElementById('rawJsonOutput');
        section.textContent = JSON.stringify(extract, null, 2);
    }

    getTypeIcon(type) {
        const icons = {
            'product': 'fas fa-box',
            'shipping': 'fas fa-shipping-fast',
            'tax': 'fas fa-receipt',
            'fee': 'fas fa-dollar-sign',
            'discount': 'fas fa-percentage',
            'other': 'fas fa-file-alt'
        };
        return icons[type] || 'fas fa-circle';
    }

    getTypeLabel(type) {
        const labels = {
            'product': 'Product',
            'shipping': 'Shipping',
            'tax': 'Tax',
            'fee': 'Fee',
            'discount': 'Discount',
            'other': 'Other'
        };
        return labels[type] || 'Item';
    }

    renderField(label, value, type = 'text') {
        if (value === undefined || value === null || value === '') {
            return `<div class="mb-2"><strong>${label}:</strong> <span class="text-muted">Not extracted</span></div>`;
        }

        let displayValue = value;
        if (type === 'currency' && typeof value === 'number') {
            displayValue = value.toFixed(2);
        } else if (type === 'weight' && typeof value === 'number') {
            displayValue = `${value} g`;
        } else if (type === 'percentage' && typeof value === 'number') {
            displayValue = `${value}%`;
        }

        return `<div class="mb-2"><strong>${label}:</strong> ${displayValue}</div>`;
    }

    setLoading(loading) {
        const btn = document.getElementById('extractBtn');
        const loadingSpan = btn.querySelector('.loading');
        const notLoadingSpan = btn.querySelector('.not-loading');
        
        if (loading) {
            loadingSpan.style.display = 'inline';
            notLoadingSpan.style.display = 'none';
            btn.disabled = true;
        } else {
            loadingSpan.style.display = 'none';
            notLoadingSpan.style.display = 'inline';
            btn.disabled = false;
        }
    }

    showError(message) {
        const errorSection = document.getElementById('errorSection');
        const errorMessage = document.getElementById('errorMessage');
        errorMessage.textContent = message;
        errorSection.style.display = 'block';
        errorSection.scrollIntoView({ behavior: 'smooth' });
    }

    hideError() {
        document.getElementById('errorSection').style.display = 'none';
    }

    showSuccess(message) {
        // You could add a success notification here
        console.log('Success:', message);
    }

    // Helper methods for formatting values
    formatValue(value) {
        if (value === null || value === undefined || value === '') return '-';
        return String(value);
    }

    formatValueByType(value, type) {
        if (value === null || value === undefined || value === '') return '-';
        
        switch (type) {
            case 'currency':
                return this.formatCurrency(value);
            case 'weight':
                return this.formatWeight(value);
            case 'number':
                return this.formatNumber(value);
            case 'percentage':
                return this.formatPercentage(value);
            default:
                return String(value);
        }
    }

    formatCurrency(value) {
        if (!value) return '-';
        const num = parseFloat(value);
        return isNaN(num) ? value : `$${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }

    formatNumber(value) {
        if (!value) return '-';
        const num = parseFloat(value);
        return isNaN(num) ? value : num.toLocaleString('en-US');
    }

    formatWeight(value) {
        if (!value) return '-';
        const num = parseFloat(value);
        return isNaN(num) ? value : `${num.toLocaleString('en-US')} kg`;
    }

    formatPercentage(value) {
        if (!value) return '-';
        const num = parseFloat(value);
        return isNaN(num) ? value : `${num}%`;
    }
}

// Initialize the UI when the page loads
document.addEventListener('DOMContentLoaded', () => {
    // Check if we're loading specific extraction results
    const urlParams = new URLSearchParams(window.location.search);
    const batchId = urlParams.get('batchId');
    const invoiceIndex = urlParams.get('invoiceIndex');
    
    if (batchId && invoiceIndex !== null) {
        loadSpecificExtractionResults(batchId, parseInt(invoiceIndex));
    } else {
        new ExtractionResultsUI();
    }
});

async function loadSpecificExtractionResults(batchId, invoiceIndex) {
    try {
        // Show loading state
        document.getElementById('resultsSection').style.display = 'none';
        document.getElementById('errorSection').style.display = 'none';
        
        // Update page title and hide upload section
        const uploadSection = document.querySelector('.row.mb-4');
        if (uploadSection) {
            uploadSection.style.display = 'none';
        }
        
        // Add loading indicator
        const container = document.querySelector('.container-fluid');
        const loadingHtml = `
            <div id="loadingIndicator" class="text-center py-5">
                <div class="spinner-border text-primary mb-3" style="width: 3rem; height: 3rem;"></div>
                <h5>Loading extraction results...</h5>
                <p class="text-muted">Please wait while we retrieve the invoice data</p>
            </div>
        `;
        container.insertAdjacentHTML('afterbegin', loadingHtml);
        
        // First get the batch data to get invoice info
        const batchResponse = await fetch(`/api/batches/${batchId}`);
        const batchResult = await batchResponse.json();
        
        if (!batchResult.success) {
            throw new Error(batchResult.error);
        }
        
        const invoice = batchResult.data.validatedSplits[invoiceIndex];
        if (!invoice) {
            throw new Error('Invoice not found');
        }
        
        // Update page title
        document.title = `Extraction Results - ${invoice.invoiceNumber || `Invoice ${invoiceIndex + 1}`}`;
        
        // Add invoice header
        const headerHtml = `
            <div class="row mb-4">
                <div class="col-12">
                    <div class="card bg-primary text-white">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-center">
                                <div>
                                    <h4 class="mb-1">
                                        <i class="fas fa-file-invoice me-2"></i>
                                        ${invoice.invoiceNumber || `Invoice ${invoiceIndex + 1}`}
                                    </h4>
                                    <p class="mb-0 opacity-75">
                                        Pages ${invoice.startPage}-${invoice.endPage} • 
                                        Batch: ${batchResult.data.originalFilename}
                                    </p>
                                </div>
                                <div class="text-end">
                                    <button class="btn btn-light" onclick="window.close()">
                                        <i class="fas fa-times me-2"></i>Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Try to get existing extraction results first
        let extractionData = null;
        
        // Check if extraction already exists
        if (batchResult.data.extractedData && batchResult.data.extractedData[invoiceIndex]) {
            extractionData = batchResult.data.extractedData[invoiceIndex];
        } else {
            // Trigger extraction
            const extractResponse = await fetch(`/api/batches/${batchId}/extract-invoice/${invoiceIndex}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            
            const extractResult = await extractResponse.json();
            if (!extractResult.success) {
                throw new Error(extractResult.error);
            }
            
            extractionData = extractResult.data;
        }
        
        // Remove loading indicator
        document.getElementById('loadingIndicator').remove();
        
        // Add header
        container.insertAdjacentHTML('afterbegin', headerHtml);
        
        // Create UI instance and display results
        const ui = new ExtractionResultsUI();
        ui.displayResults({
            extract: extractionData.extractedData,
            diagnostics: extractionData.diagnostics
        });
        
    } catch (error) {
        console.error('Error loading extraction results:', error);
        
        // Remove loading indicator
        const loadingIndicator = document.getElementById('loadingIndicator');
        if (loadingIndicator) {
            loadingIndicator.remove();
        }
        
        // Show error
        const errorSection = document.getElementById('errorSection');
        const errorMessage = document.getElementById('errorMessage');
        errorMessage.textContent = 'Failed to load extraction results: ' + error.message;
        errorSection.style.display = 'block';
    }
}
