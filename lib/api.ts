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
