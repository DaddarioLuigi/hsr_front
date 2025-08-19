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

// Upload pacchetto (PDF unico) con OCR+estrazione — ASYNC
export async function uploadPacketOCR(file: File, patientId?: string) {
  const formData = new FormData();
  formData.append("file", file);
  if (patientId) formData.append("patient_id", patientId);

  const res = await fetch(`${BASE_URL}/api/upload-packet-ocr`, {
    method: "POST",
    body: formData,
    credentials: "include",
  });
  if (!res.ok) throw new Error((await res.text().catch(() => "")) || "Errore upload pacchetto OCR");
  return res.json() as Promise<{ status: "processing"; pending_id?: string; patient_id?: string }>;
}

// Upload pacchetto (PDF unico) con OCR+estrazione — SYNC (ritorna subito patient_id finale)
export async function ingestPacketOCRSync(file: File, patientId?: string) {
  const formData = new FormData();
  formData.append("file", file);
  if (patientId) formData.append("patient_id", patientId);

  const res = await fetch(`${BASE_URL}/api/ingest-packet-ocr-sync`, {
    method: "POST",
    body: formData,
    credentials: "include",
  });
  if (!res.ok) throw new Error((await res.text().catch(() => "")) || "Errore ingest OCR (sync)");
  return res.json() as Promise<{
    patient_id: string;
    sections_found: string[];
    documents_processed: string[];
    global_map: Record<string, any>;
  }>;
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

export async function fetchPacketStatus(pendingId: string) {
  const res = await fetch(`${BASE_URL}/api/packet-status/${encodeURIComponent(pendingId)}`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Errore lettura stato");
  return res.json() as Promise<{
    pending_id: string;
    stage: string;
    percent: number;
    message: string;
    final_patient_id?: string;
    sections_found?: string[];
    documents_processed?: string[];
  }>;
}
