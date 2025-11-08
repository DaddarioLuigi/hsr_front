# Clinical AI - Fondazione Alfieri

**Clinical Folders Data Extraction System**

A modern web application for managing and extracting structured data from clinical documents using AI-powered OCR and entity extraction.

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/luigis-projects-ad2a0fd7/v0-vercel-frontend-development)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.dev-black?style=for-the-badge)](https://v0.dev/chat/projects/FGuuFP3qliE)

---

## Table of Contents

- [Overview](#overview)
- [System Architecture](#system-architecture)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Key Features](#key-features)
- [How It Works](#how-it-works)
- [API Communication](#api-communication)
- [Data Flow](#data-flow)
- [Getting Started](#getting-started)
- [Development](#development)

---

## Overview

This application is a comprehensive clinical document management system designed for **Fondazione Alfieri**. It enables healthcare professionals to:

- Upload and process clinical documents (PDFs)
- Automatically extract structured medical data using AI/OCR
- Manage patient records and clinical folders
- Edit and validate extracted entities
- Export data to Excel for analysis
- Process complete clinical folders as unified packets

The system consists of a **Next.js frontend** that communicates with a **Flask backend API** hosted on Railway, providing a seamless interface for clinical data extraction and management.

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    User Interface (Browser)                  │
│                    Next.js Frontend Application              │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           │ HTTP/HTTPS (REST API)
                           │
┌──────────────────────────▼──────────────────────────────────┐
│              Flask Backend API (Railway)                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   OCR        │  │  AI/ML       │  │  Database    │     │
│  │  Processing  │  │  Extraction  │  │  Storage    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

### Component Breakdown

#### **Frontend (Next.js)**
- **Framework**: Next.js 14.2.16 with App Router
- **UI Library**: React 18 with TypeScript
- **Styling**: Tailwind CSS with custom components
- **State Management**: React Hooks (useState, useEffect)
- **Animations**: Framer Motion
- **Form Handling**: React Hook Form with Zod validation
- **PDF Viewing**: react-pdf (PDF.js)

#### **Backend API (Flask)**
- **Base URL**: `https://clinicalaiclinicalfolders-production.up.railway.app`
- **Architecture**: RESTful API
- **Processing**: OCR, document segmentation, entity extraction
- **Storage**: File system and database for documents and metadata

---

## Technology Stack

### Frontend Dependencies

**Core:**
- `next`: 14.2.16 - React framework with SSR/SSG
- `react`: ^18 - UI library
- `typescript`: ^5 - Type safety

**UI Components:**
- `@radix-ui/*` - Accessible component primitives
- `tailwindcss`: ^3.4.17 - Utility-first CSS framework
- `framer-motion` - Animation library
- `lucide-react` - Icon library

**Forms & Validation:**
- `react-hook-form` - Form state management
- `@hookform/resolvers` - Form validation resolvers
- `zod`: ^3.24.1 - Schema validation

**PDF Processing:**
- `react-pdf` - PDF rendering
- `pdfjs-dist`: ^5.3.93 - PDF.js library

**Utilities:**
- `date-fns`: 4.1.0 - Date manipulation
- `clsx` & `tailwind-merge` - CSS class utilities

---

## Project Structure

```
hsr_front/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes (Next.js API handlers)
│   │   ├── existing-patients/
│   │   │   └── route.ts         # Mock patient list endpoint
│   │   ├── update-entities/
│   │   │   └── route.ts         # Entity update handler
│   │   └── upload-document/
│   │       └── route.ts         # Document upload handler
│   ├── editor/
│   │   └── [id]/
│   │       └── page.tsx         # Entity editor page
│   ├── patient/
│   │   └── [id]/
│   │       └── page.tsx         # Patient detail page
│   ├── upload/
│   │   ├── loading.tsx          # Loading state
│   │   └── page.tsx             # Single document upload
│   ├── upload-packet/
│   │   └── page.tsx             # Clinical folder packet upload
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                # Dashboard (home page)
│   ├── loading.tsx             # Global loading component
│   └── globals.css              # Global styles
│
├── components/                   # React components
│   ├── ui/                      # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   └── ...                  # 40+ UI components
│   ├── hospital-header.tsx      # Header component
│   └── theme-provider.tsx       # Theme context
│
├── lib/                         # Utility libraries
│   ├── api.ts                   # Backend API client functions
│   └── utils.ts                 # Helper functions
│
├── hooks/                       # Custom React hooks
│   ├── use-mobile.tsx
│   └── use-toast.ts
│
├── public/                      # Static assets
│   ├── fondazione-alfieri-logo.png
│   └── pdf.worker.min.js       # PDF.js worker
│
├── styles/                      # Additional styles
│   └── globals.css
│
├── next.config.mjs             # Next.js configuration
├── tailwind.config.ts          # Tailwind configuration
├── tsconfig.json               # TypeScript configuration
└── package.json                # Dependencies
```

---

## Key Features

### 1. **Patient Dashboard**
- View all patients with document counts
- Search and filter patients
- Display statistics (total patients, documents, recent uploads)
- Quick access to patient details and uploads

### 2. **Document Upload**
- **Single Document Upload**: Upload individual PDF documents for a specific patient
- **Packet Upload**: Upload complete clinical folders that are automatically segmented
- Drag-and-drop interface
- Progress tracking and status updates

### 3. **Clinical Folder Processing (Packet Mode)**
- Automatic document segmentation
- OCR text extraction
- Multi-document processing pipeline
- Real-time status updates with polling
- Section detection and classification
- Error handling and reporting

### 4. **Entity Extraction & Editing**
- View extracted medical entities (patient info, dates, parameters, etc.)
- Edit entity types and values
- Add custom entities
- Delete incorrect extractions
- Confidence scores for each entity
- PDF preview integration

### 5. **Patient Management**
- View patient clinical folders
- Browse all documents per patient
- Document type classification
- Document status tracking (processed, processing, error)
- Delete documents and patients

### 6. **Data Export**
- Export all patient data to Excel format
- Structured data for analysis

---

## How It Works

### Document Processing Workflow

#### **Single Document Upload Flow:**

```
1. User selects PDF file and patient ID
   ↓
2. Frontend sends FormData to /api/upload-document
   ↓
3. Backend receives file and patient_id
   ↓
4. Backend processes document:
   - OCR extraction
   - Document type detection
   - Entity extraction (AI/ML)
   ↓
5. Backend stores:
   - PDF file in storage
   - Extracted entities in database
   - Document metadata
   ↓
6. Frontend receives response with:
   - document_id
   - document_type
   - extracted entities
   - status
   ↓
7. User redirected to patient page or editor
```

#### **Packet Upload Flow (Clinical Folder):**

```
1. User uploads complete clinical folder PDF
   ↓
2. Frontend sends file with process_as_packet flag
   ↓
3. Backend initiates packet processing:
   a. OCR Phase:
      - Extract all text from PDF
      - Store OCR text
   
   b. Segmentation Phase:
      - Detect document sections
      - Split into individual documents
      - Classify document types
   
   c. Processing Phase:
      - Process each section independently
      - Extract entities per document
      - Create document records
   
   d. Completion:
      - Aggregate all documents
      - Link to patient record
      - Return processing status
   ↓
4. Frontend polls status endpoint every 2 seconds
   ↓
5. Real-time updates show:
   - Current processing stage
   - Sections found/missing
   - Documents created
   - Progress percentage
   - Errors (if any)
   ↓
6. On completion, user can:
   - View all extracted documents
   - Access OCR text
   - View saved files
   - Navigate to patient dashboard
```

### Entity Extraction Process

1. **OCR Text Extraction**: PDF is processed to extract raw text
2. **Document Classification**: AI determines document type (discharge letter, lab report, specialist visit, radiology, etc.)
3. **Entity Recognition**: Named Entity Recognition (NER) extracts:
   - Patient information (name, birth date, ID)
   - Dates (admission, discharge, exam dates)
   - Medical parameters (height, weight, BMI, BSA)
   - Cardiac parameters (AVA, AVAi, PVL, gradients, etc.)
   - Diagnoses and procedures
   - Medications and dosages
4. **Confidence Scoring**: Each entity receives a confidence score (0-1)
5. **Storage**: Entities stored with document metadata

### Entity Normalization

The system handles various entity formats:
- **Standard entities**: `{id, type, value, confidence}`
- **Physical parameters**: `{altezza, peso, bmi, bsa}` → Normalized to readable format
- **Cardiac parameters**: `{AVA, AVAi, PVL, gradiente_max, ...}` → Grouped as "Parametri Cardiaci"
- **Complex objects**: Automatically converted to readable key-value pairs

---

## API Communication

### Backend API Endpoints

All API calls are made to: `https://clinicalaiclinicalfolders-production.up.railway.app`

#### **Patient Management:**
- `GET /api/patients` - List all patients
- `GET /api/patient/{patientId}` - Get patient details with documents

#### **Document Management:**
- `POST /api/upload-document` - Upload single document
  - Body: `FormData` with `file` and `patient_id`
  - Optional: `process_as_packet=true` for packet mode
- `GET /api/document/{documentId}` - Get document details with entities
- `PUT /api/document/{documentId}` - Update document entities
- `DELETE /api/document/{documentId}` - Delete document

#### **Packet Processing:**
- `GET /api/document-packet-status/{patientId}` - Get processing status
- `GET /api/document-ocr-text/{patientId}` - Get extracted OCR text
- `GET /api/document-packet-files/{patientId}` - Get saved file structure
- `GET /api/debug-processing-status/{patientId}` - Debug processing info

#### **Export:**
- `GET /api/export-excel` - Export all data to Excel

### API Client (`lib/api.ts`)

The frontend uses a centralized API client with functions:
- `fetchPatients()` - Get patient list
- `fetchPatientDetail(patientId)` - Get patient with documents
- `uploadDocument(file, patientId)` - Upload single document
- `uploadDocumentAsPacket(file, patientId?)` - Upload as packet
- `fetchDocumentDetail(documentId)` - Get document with entities
- `updateDocumentEntities(documentId, entities)` - Update entities
- `deleteDocument(documentId)` - Delete document
- `exportExcel()` - Download Excel export
- `fetchDocumentPacketStatus(patientId)` - Poll processing status
- `fetchDocumentOCRText(patientId)` - Get OCR text
- `fetchDocumentPacketFiles(patientId)` - Get file structure

### Request/Response Format

**Upload Request:**
```typescript
FormData {
  file: File,
  patient_id: string,
  process_as_packet?: "true"
}
```

**Document Response:**
```typescript
{
  document_id: string,
  patient_id: string,
  document_type: string,
  filename: string,
  entities: Entity[],
  status: "processed" | "processing" | "error",
  pdf_path?: string
}
```

**Entity Format:**
```typescript
{
  id: string,
  type: string,
  value: string,
  confidence: number
}
```

**Processing Status:**
```typescript
{
  patient_id: string,
  status: "ocr_start" | "ocr_done" | "segmenting" | "segmented" | 
          "processing_sections" | "completed" | "completed_with_errors" | "failed",
  message: string,
  progress: number,
  sections_found: string[],
  sections_missing: string[],
  documents_created: DocumentCreated[],
  errors: string[],
  current_section?: string
}
```

---

## Data Flow

### State Management

The application uses **React Hooks** for state management:

1. **Component State**: `useState` for local component state
2. **Side Effects**: `useEffect` for data fetching and cleanup
3. **Navigation**: Next.js `useRouter` and `useParams`
4. **URL State**: `useSearchParams` for query parameters

### Data Fetching Pattern

```typescript
// Typical data fetching pattern
useEffect(() => {
  const loadData = async () => {
    setLoading(true)
    try {
      const data = await fetchPatients()
      setPatients(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }
  loadData()
}, [])
```

### Polling Pattern (Packet Processing)

```typescript
// Polling for processing status
useEffect(() => {
  const pollTimer = setInterval(async () => {
    const status = await fetchDocumentPacketStatus(patientId)
    setProcessingStatus(status)
    
    if (status.status === "completed") {
      clearInterval(pollTimer)
      router.push(`/patient/${patientId}`)
    }
  }, 2000) // Poll every 2 seconds
  
  return () => clearInterval(pollTimer)
}, [patientId])
```

---

## Getting Started

### Prerequisites

- **Node.js**: 18+ 
- **Package Manager**: pnpm (or npm/yarn)
- **Backend API**: Running and accessible at Railway URL

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd hsr_front
   ```

2. **Install dependencies:**
   ```bash
   pnpm install
   # or
   npm install
   ```

3. **Configure environment variables:**
   Create a `.env.local` file (optional, defaults are used):
   ```env
   NEXT_PUBLIC_API_URL=https://clinicalaiclinicalfolders-production.up.railway.app
   ```

4. **Run development server:**
   ```bash
   pnpm dev
   # or
   npm run dev
   ```

5. **Open browser:**
   Navigate to `http://localhost:3000`

### Build for Production

```bash
pnpm build
pnpm start
```

---

## Development

### Project Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint

### Code Structure Guidelines

1. **Pages**: Located in `app/` directory using Next.js App Router
2. **Components**: Reusable components in `components/`
3. **API Client**: Centralized in `lib/api.ts`
4. **Utilities**: Helper functions in `lib/utils.ts`
5. **Types**: TypeScript interfaces defined inline or in component files

### Key Design Patterns

- **Server Components**: Default in Next.js App Router
- **Client Components**: Marked with `"use client"` directive
- **API Routes**: Next.js API routes in `app/api/` (currently mock implementations)
- **Error Handling**: Try-catch blocks with user-friendly error messages
- **Loading States**: Loading components and skeleton screens
- **Optimistic Updates**: Immediate UI feedback before API confirmation

### Styling Approach

- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: Pre-built accessible components
- **Custom Styles**: Global styles in `app/globals.css`
- **Responsive Design**: Mobile-first approach with Tailwind breakpoints
- **Dark Mode**: Supported via `next-themes` (configured but not fully implemented)

### Testing Considerations

- TypeScript provides compile-time type checking
- Error boundaries for runtime error handling
- Form validation with Zod schemas
- API error handling with user feedback

---

## Deployment

The application is deployed on **Vercel** and automatically syncs with v0.dev deployments. The backend API is hosted on **Railway**.

### Deployment Flow

1. Code changes pushed to repository
2. Vercel automatically builds and deploys
3. Frontend connects to Railway backend API
4. CORS and credentials handled via `credentials: "include"`

---

## Future Enhancements

Potential improvements:
- Authentication and user management
- Real-time updates via WebSockets
- Advanced search and filtering
- Batch operations
- Document versioning
- Audit logs
- Advanced analytics dashboard
- Multi-language support

---

## License

Private project for Fondazione Alfieri.

---

## Support

For issues or questions, contact the development team or refer to the backend API documentation.
