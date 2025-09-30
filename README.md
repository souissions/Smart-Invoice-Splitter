# 🔄 Smart Invoice Processing System

This is a prototype of an AI-powered PDF splitting system that automatically identifies invoice boundaries within multi-page documents, generates separate invoice files, and extracts structured data.

## 🎬 Demo Video (part_1 smart split)

> **Demo**: [Watch the Smart Invoice Splitter in action](./demo/SMART%20INVOICE%20SPLITTER.mp4)

See how the system processes multi-page PDFs, detects invoice boundaries using AI, and creates individual invoice files with an intuitive validation interface.

## 🎯 Key Features

- **AI Boundary Detection**: Automatically identifies individual invoices within multi-page PDFs
- **Smart Text Analysis**: Uses Azure Document Intelligence for layout and text extraction  
- **LLM Processing**: Leverages Azure OpenAI to understand document structure and boundaries
- **Hybrid Interface**: Both web dashboard and direct API access for integration flexibility
- **Batch Processing**: Handle multiple PDF files with progress tracking
- **Direct Extraction API**: Process individual PDFs directly without batch workflow
- **Configurable Modes**: Support for split-only mode or full extraction pipeline

## 🏗️ System Architecture & Flow


```

┌─────────────────┐
│   PDF Upload    │ ◄─── User Interface
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│  Create Batch   │ ◄─── Processing Engine
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│Azure Document   │ ◄─── Azure Services
│  Intelligence   │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│Text & Layout    │ ◄─── Processing Engine
│   Extraction    │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│Azure OpenAI     │ ◄─── Azure Services
│     GPT-4       │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│   Boundary      │ ◄─── Processing Engine
│   Detection     │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│Split Proposals  │ ◄─── Processing Engine
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ User Validation │ ◄─── User Interface
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ PDF Splitting   │ ◄─── Processing Engine
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│Individual PDFs  │ ◄─── Processing Engine
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│Download/Preview │ ◄─── User Interface
└─────────────────┘
```

### Processing Pipeline

#### Batch Processing Workflow
1. **PDF Upload** → File stored and batch created
2. **Text Extraction** → Azure Document Intelligence extracts content and layout
3. **Boundary Detection** → Azure OpenAI analyzes text to find invoice separators
4. **Split Validation** → Review and approve AI-detected splits via web interface
5. **PDF Splitting** → Create individual invoice files using pdf-lib
6. **Data Extraction** → Extract structured invoice data (optional, configurable)
7. **File Delivery** → Download individual PDFs

#### Direct Extraction Workflow
1. **PDF Upload** → Direct API call with PDF file
2. **Layout Analysis** → Azure Document Intelligence processes document
3. **Data Extraction** → Extract structured invoice data using LLM
4. **Normalized Output** → Return standardized invoice data with validation

> **Configuration**: Set `SPLIT_ONLY=true` to disable data extraction features and focus only on PDF splitting functionality.

## 📚 Azure Services Documentation

### Azure Document Intelligence
> **Note**: Form Recognizer is the previous name for Azure Document Intelligence. Both names refer to the same service.

- **Official Documentation**: https://docs.microsoft.com/en-us/azure/applied-ai-services/form-recognizer/
- **REST API Reference**: https://docs.microsoft.com/en-us/rest/api/aiservices/document-models
- **SDK Documentation**: https://docs.microsoft.com/en-us/javascript/api/@azure/ai-form-recognizer/

### Azure OpenAI Service

- **Official Documentation**: https://docs.microsoft.com/en-us/azure/cognitive-services/openai/
- **API Reference**: https://docs.microsoft.com/en-us/azure/cognitive-services/openai/reference
- **GPT-4 Model Documentation**: https://docs.microsoft.com/en-us/azure/cognitive-services/openai/concepts/models#gpt-4
- **Best Practices**: https://docs.microsoft.com/en-us/azure/cognitive-services/openai/concepts/prompt-engineering


### Additional Resources
- **Azure Portal**: https://portal.azure.com/
- **Azure CLI Documentation**: https://docs.microsoft.com/en-us/cli/azure/
- **Azure SDK for JavaScript**: https://docs.microsoft.com/en-us/azure/developer/javascript/

## 🚀 Setup & Installation

### Prerequisites
- **Node.js**: 18.0.0 or higher
- **Azure Subscription** with Document Intelligence and OpenAI services


### 1. Environment Setup

```bash
# Clone the repository
git clone <repository-url>
cd smart-invoice-splitter

# Install dependencies
npm install

# Validate environment
npm run validate-env
```

### 2. Azure Services Configuration

Create your Azure resources:

1. **Azure Document Intelligence**:
   - Go to [Azure Portal](https://portal.azure.com/)
   - Create a new "Form Recognizer" resource (this is the service name in Azure Portal)
   - Copy the endpoint and key

2. **Azure OpenAI**:
   - Create an "OpenAI" resource in Azure Portal
   - Deploy a GPT-4 model
   - Copy the endpoint, key, and deployment name

### 3. Environment Configuration

Create `.env` file from template:

```bash
cp .env.example .env
```

Configure your `.env` file:

```env
# Azure Document Intelligence (REQUIRED)
AZURE_FORM_RECOGNIZER_ENDPOINT=https://your-resource.cognitiveservices.azure.com/
AZURE_FORM_RECOGNIZER_KEY=your-form-recognizer-key

# Azure OpenAI (REQUIRED)
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_KEY=your-openai-key
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4o  # Can use other models

# Application Settings
NODE_ENV=development
PORT=3000

# Processing Configuration
MAX_FILE_SIZE=50000000
MAX_PAGES_PER_BATCH=200
CONFIDENCE_THRESHOLD=0.85

# Feature Configuration
SPLIT_ONLY=false                    # Set to 'true' to disable data extraction features
ENABLE_LAYOUT_EXTRACT=true          # Enable/disable layout extraction
STRICT_VALIDATION=false             # Enable strict schema validation
```

### 4. Start Application

```bash
# Development mode
npm run dev

# Production mode
npm start

# Verify health
npm run health-check
```

### 5. Access Application

- **Web Dashboard**: http://localhost:3000 (optional UI)
- **API Base**: http://localhost:3000/api (primary interface)
- **Health Check**: http://localhost:3000/ping
- **API Documentation**: See endpoints section below

## 🔍 API Endpoints

### Core Batch Operations
- `POST /api/upload` - Upload PDF file and create batch
- `GET /api/batches` - List processing batches
- `GET /api/batches/:id` - Get batch information
- `POST /api/batches/:id/process` - Start AI boundary detection
- `POST /api/batches/:id/validate-splits` - Apply splits and create individual PDFs
- `GET /api/batches/:id/status` - Processing status
- `DELETE /api/batches/:id` - Delete batch and files

### Direct Extraction APIs
- `POST /api/extract` - Extract data from Azure Document Intelligence layout JSON
- `POST /api/extract-pdf` - Upload PDF and extract invoice data directly
- `POST /api/batches/:id/extract-data` - Extract structured data from split invoices

### File Operations
- `GET /api/files/:batchId/pdf` - Serve original PDF for preview
- `GET /static/split/:batchId/:filename` - Download split PDF files
- `GET /api/storage/stats` - Get storage statistics

### System Health
- `GET /api/health` - Check Azure services connectivity
- `GET /ping` - Basic health check

## 📁 Project Structure

```
smart-invoice-splitter/
├── src/
│   ├── app.js                    # Application entry point
│   ├── controllers/              # Request handlers
│   │   ├── upload.controller.js  # File upload & batch management
│   │   └── processing.controller.js # AI processing & splitting
│   ├── services/                 # Core business logic
│   │   ├── azure-document.service.js # Document Intelligence integration
│   │   ├── azure-openai.service.js   # OpenAI GPT-4 integration
│   │   └── pdf-splitter.service.js   # PDF manipulation
│   ├── models/                   # Data models
│   │   └── document-batch.model.js
│   ├── routes/                   # API & web routes
│   ├── config/                   # Configuration & validation
│   ├── utils/                    # Utilities & logging
│   └── public/                   # Static web assets
├── storage/                      # File storage (uploads, splits)
├── __tests__/                    # Test files
├── .env.example                  # Environment template
└── README.md                     # This file
```

## 🛠️ Technical Stack

### Backend Dependencies
- **Express.js** - Web framework and API server
- **pdf-lib** - PDF manipulation and splitting
- **@azure/ai-form-recognizer** - Document Intelligence SDK
- **@azure/openai** - Azure OpenAI SDK
- **sqlite3** - Lightweight database
- **multer** - File upload handling
- **helmet** - Security middleware
- **cors** - Cross-origin resource sharing

### Frontend (Optional Web Interface)
- **Bootstrap 5** - UI framework for web dashboard
- **Vanilla JavaScript** - Client-side functionality
- **Bootstrap Icons** - Icon library
- **Responsive Design** - Works on desktop and tablet devices

## 🔧 Customization & Optimization

### LLM Model Configuration
The system uses Azure OpenAI for intelligent boundary detection. You can optimize performance by:

- **Upgrading Models**: You can deploy a more powerful model for better accuracy
- **Custom Prompts**: Modify prompts in `src/services/azure-openai.service.js` for your document types

### Prompt Engineering
Key areas for customization in `azure-openai.service.js`:
- `getSystemPrompt()` - Main boundary detection instructions
- `createBoundaryDetectionPrompt()` - Document analysis formatting
- Temperature and token limits for optimal performance

## 🚀 New Extraction Features

### Direct PDF Extraction API
The system now supports direct PDF-to-data extraction without the full batch workflow:

```bash
# Extract data directly from a PDF file
curl -X POST http://localhost:3000/api/extract-pdf \
  -F "pdf=@invoice.pdf" \
  -H "Content-Type: multipart/form-data"
```

### Layout-Based Extraction
Process Azure Document Intelligence layout JSON directly:

```bash
# Extract from pre-processed layout data
curl -X POST http://localhost:3000/api/extract \
  -H "Content-Type: application/json" \
  -d @layout.json
```

### Enhanced Data Processing
- **Normalized Output**: Automatic currency, date, and country code standardization
- **Schema Validation**: Strict invoice data structure validation using Zod
- **Error Recovery**: Enhanced error handling with retry mechanisms and token limit management
- **Confidence Scoring**: Quality assessment for extracted data




