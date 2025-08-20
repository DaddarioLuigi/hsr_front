const BASE_URL = "https://clinicalaiclinicalfolders-production.up.railway.app";

// Lista pazienti
export async function fetchPatients() {
  const res = await fetch(`${BASE_URL}/api/patients`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Errore nel caricamento pazienti");
  return res.json();
}

// Dettaglio paziente
export async function fetchPatientDetail(patientId: string) {
  const res = await fetch(`${BASE_URL}/api/patient/${patientId}`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Paziente non trovato");
  return res.json();
}

// Upload documento PDF
export async function uploadDocument(file: File, patientId: string) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("patient_id", patientId);

  const res = await fetch(`${BASE_URL}/api/upload-document`, {
    method: "POST",
    body: formData,
    credentials: "include",
  });
  if (!res.ok) throw new Error("Errore upload documento");
  return res.json();
}

// Dettaglio documento
export async function fetchDocumentDetail(documentId: string) {
  const res = await fetch(`${BASE_URL}/api/document/${documentId}`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Documento non trovato");
  return res.json();
}

// Aggiorna entità documento
export async function updateDocumentEntities(documentId: string, entities: any[]) {
  const res = await fetch(`${BASE_URL}/api/document/${documentId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ entities }),
    credentials: "include",
  });
  if (!res.ok) throw new Error("Errore aggiornamento entità");
  return res.json();
}

// Export Excel
export async function exportExcel() {
  const res = await fetch(`${BASE_URL}/api/export-excel`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Errore export Excel");
  return res.blob();
}

// Elimina documento
export async function deleteDocument(documentId: string) {
  const r = await fetch(`${BASE_URL}/api/document/${encodeURIComponent(documentId)}`, {
    method: "DELETE",
    credentials: "include",
  });
  const data = await r.json();
  if (!r.ok || !data.success) throw new Error(data.error || "Delete failed");
  return data as { success: true; patient_deleted: boolean; document_type_deleted: boolean };
}




// Utility: conta documenti correnti del paziente
export async function getPatientDocumentCount(patientId: string): Promise<number> {
  const detail = await fetchPatientDetail(patientId);
  const docs = (detail?.documents ?? []) as Array<unknown>;
  return docs.length;
}

// Utility: polling fino a quando compaiono nuovi documenti
export async function pollPatientForNewDocs(
  patientId: string,
  baselineCount: number,
  opts: { intervalMs?: number; timeoutMs?: number } = {},
): Promise<boolean> {
  const { intervalMs = 2000, timeoutMs = 120000 } = opts;
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const n = await getPatientDocumentCount(patientId);
      if (n > baselineCount) return true;
    } catch {
      // ignora errori transitori
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  return false;
}

// Nuove funzioni API per il flusso unificato

// Upload documento con flusso unificato (process_as_packet)
export async function uploadDocumentAsPacket(file: File, patientId?: string) {
  const formData = new FormData();
  formData.append("file", file);
  if (patientId) formData.append("patient_id", patientId);
  formData.append("process_as_packet", "true");

  const res = await fetch(`${BASE_URL}/api/upload-document`, {
    method: "POST",
    body: formData,
    credentials: "include",
  });
  if (!res.ok) throw new Error("Errore upload documento come pacchetto");
  return res.json() as Promise<{
    filename: string;
    patient_id: string;
    status: "processing_as_packet";
    message: string;
  }>;
}

// Stato processing del pacchetto unificato
export async function fetchDocumentPacketStatus(patientId: string) {
  const res = await fetch(`${BASE_URL}/api/document-packet-status/${encodeURIComponent(patientId)}`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Errore lettura stato pacchetto");
  return res.json() as Promise<{
    patient_id: string;
    status: "ocr_start" | "segmenting" | "processing_sections" | "completed" | "completed_with_errors" | "failed";
    message: string;
    progress: number;
    filename: string;
    sections_found: string[];
    sections_missing: string[];
    documents_created: Array<{
      document_id: string;
      document_type: string;
      filename: string;
      status: "processed";
      entities_count: number;
    }>;
    errors: string[];
  }>;
}

// Testo OCR estratto
export async function fetchDocumentOCRText(patientId: string) {
  const res = await fetch(`${BASE_URL}/api/document-ocr-text/${encodeURIComponent(patientId)}`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Errore lettura testo OCR");
  return res.json() as Promise<{
    patient_id: string;
    filename: string;
    ocr_text: string;
    metadata: {
      original_filename: string;
      upload_date: string;
      content_type: string;
    };
  }>;
}