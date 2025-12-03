// Base URL del backend - può essere configurata tramite variabile d'ambiente
// Assicuriamoci che sia sempre un URL completo con protocollo
function getBaseUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  
  // Se c'è una variabile d'ambiente, usala (ma assicurati che abbia il protocollo)
  if (envUrl) {
    let url = envUrl.trim();
    // Se non inizia con http:// o https://, aggiungi https://
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = `https://${url}`;
    }
    // Rimuovi slash finale se presente
    url = url.replace(/\/+$/, "");
    return url;
  }
  
  // Fallback: usa l'URL di produzione
  return "https://clinicalaiclinicalfolders-production.up.railway.app";
}

const BASE_URL = getBaseUrl();

// Debug: stampa la BASE_URL utilizzata
console.log("[API DEBUG] BASE_URL configurata:", BASE_URL);
console.log("[API DEBUG] NEXT_PUBLIC_API_URL env:", process.env.NEXT_PUBLIC_API_URL);
console.log("[API DEBUG] BASE_URL finale (dopo normalizzazione):", BASE_URL);

// Lista pazienti
export async function fetchPatients() {
  const url = `${BASE_URL}/api/patients`;
  console.log("[API DEBUG] fetchPatients - URL:", url);
  console.log("[API DEBUG] fetchPatients - Method: GET");
  console.log("[API DEBUG] fetchPatients - Credentials: include");
  
  try {
    const res = await fetch(url, {
      credentials: "include",
    });
    console.log("[API DEBUG] fetchPatients - Response status:", res.status, res.statusText);
    console.log("[API DEBUG] fetchPatients - Response ok:", res.ok);
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error("[API DEBUG ERROR] fetchPatients - Error response:", errorText);
      throw new Error("Errore nel caricamento pazienti");
    }
    
    const data = await res.json();
    console.log("[API DEBUG SUCCESS] fetchPatients - Success, data received:", data);
    return data;
  } catch (error) {
    console.error("[API DEBUG ERROR] fetchPatients - Exception:", error);
    throw error;
  }
}

// Dettaglio paziente
export async function fetchPatientDetail(patientId: string) {
  const url = `${BASE_URL}/api/patient/${patientId}`;
  console.log("[API DEBUG] fetchPatientDetail - URL:", url);
  console.log("[API DEBUG] fetchPatientDetail - Patient ID:", patientId);
  console.log("[API DEBUG] fetchPatientDetail - Method: GET");
  
  try {
    const res = await fetch(url, {
      credentials: "include",
    });
    console.log("[API DEBUG] fetchPatientDetail - Response status:", res.status, res.statusText);
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error("[API DEBUG ERROR] fetchPatientDetail - Error response:", errorText);
      throw new Error("Paziente non trovato");
    }
    
    const data = await res.json();
    console.log("[API DEBUG SUCCESS] fetchPatientDetail - Success");
    return data;
  } catch (error) {
    console.error("[API DEBUG ERROR] fetchPatientDetail - Exception:", error);
    throw error;
  }
}

// Upload documento PDF
export async function uploadDocument(file: File, patientId: string) {
  const url = `${BASE_URL}/api/upload-document`;
  console.log("[API DEBUG] uploadDocument - URL:", url);
  console.log("[API DEBUG] uploadDocument - Method: POST");
  console.log("[API DEBUG] uploadDocument - File name:", file.name);
  console.log("[API DEBUG] uploadDocument - File size:", file.size, "bytes");
  console.log("[API DEBUG] uploadDocument - Patient ID:", patientId);
  
  const formData = new FormData();
  formData.append("file", file);
  formData.append("patient_id", patientId);

  try {
    const res = await fetch(url, {
      method: "POST",
      body: formData,
      credentials: "include",
    });
    console.log("[API DEBUG] uploadDocument - Response status:", res.status, res.statusText);
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error("[API DEBUG ERROR] uploadDocument - Error response:", errorText);
      throw new Error("Errore upload documento");
    }
    
    const data = await res.json();
    console.log("[API DEBUG SUCCESS] uploadDocument - Success");
    return data;
  } catch (error) {
    console.error("[API DEBUG ERROR] uploadDocument - Exception:", error);
    throw error;
  }
}

// Dettaglio documento
export async function fetchDocumentDetail(documentId: string) {
  const url = `${BASE_URL}/api/document/${documentId}`;
  console.log("[API DEBUG] fetchDocumentDetail - URL:", url);
  console.log("[API DEBUG] fetchDocumentDetail - Document ID:", documentId);
  console.log("[API DEBUG] fetchDocumentDetail - Method: GET");
  
  try {
    const res = await fetch(url, {
      credentials: "include",
    });
    console.log("[API DEBUG] fetchDocumentDetail - Response status:", res.status, res.statusText);
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error("[API DEBUG ERROR] fetchDocumentDetail - Error response:", errorText);
      throw new Error("Documento non trovato");
    }
    
    const data = await res.json();
    console.log("[API DEBUG SUCCESS] fetchDocumentDetail - Success");
    return data;
  } catch (error) {
    console.error("[API DEBUG ERROR] fetchDocumentDetail - Exception:", error);
    throw error;
  }
}

// Aggiorna entità documento
export async function updateDocumentEntities(documentId: string, entities: any[]) {
  const url = `${BASE_URL}/api/document/${documentId}`;
  console.log("[API DEBUG] updateDocumentEntities - URL:", url);
  console.log("[API DEBUG] updateDocumentEntities - Method: PUT");
  console.log("[API DEBUG] updateDocumentEntities - Document ID:", documentId);
  console.log("[API DEBUG] updateDocumentEntities - Entities count:", entities.length);
  
  const body = JSON.stringify({ entities });
  console.log("[API DEBUG] updateDocumentEntities - Request body:", body);
  
  try {
    const res = await fetch(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: body,
      credentials: "include",
    });
    console.log("[API DEBUG] updateDocumentEntities - Response status:", res.status, res.statusText);
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error("[API DEBUG ERROR] updateDocumentEntities - Error response:", errorText);
      throw new Error("Errore aggiornamento entità");
    }
    
    const data = await res.json();
    console.log("[API DEBUG SUCCESS] updateDocumentEntities - Success");
    return data;
  } catch (error) {
    console.error("[API DEBUG ERROR] updateDocumentEntities - Exception:", error);
    throw error;
  }
}

// Export Excel
export async function exportExcel() {
  const url = `${BASE_URL}/api/export-excel`;
  console.log("[API DEBUG] exportExcel - URL:", url);
  console.log("[API DEBUG] exportExcel - Method: GET");
  
  try {
    const res = await fetch(url, {
      credentials: "include",
    });
    console.log("[API DEBUG] exportExcel - Response status:", res.status, res.statusText);
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error("[API DEBUG ERROR] exportExcel - Error response:", errorText);
      throw new Error("Errore export Excel");
    }
    
    const blob = await res.blob();
    console.log("[API DEBUG SUCCESS] exportExcel - Success, blob size:", blob.size, "bytes");
    return blob;
  } catch (error) {
    console.error("[API DEBUG ERROR] exportExcel - Exception:", error);
    throw error;
  }
}

// Elimina documento
export async function deleteDocument(documentId: string) {
  const url = `${BASE_URL}/api/document/${encodeURIComponent(documentId)}`;
  console.log("[API DEBUG] deleteDocument - URL:", url);
  console.log("[API DEBUG] deleteDocument - Method: DELETE");
  console.log("[API DEBUG] deleteDocument - Document ID:", documentId);
  
  try {
    const r = await fetch(url, {
      method: "DELETE",
      credentials: "include",
    });
    console.log("[API DEBUG] deleteDocument - Response status:", r.status, r.statusText);
    
    const data = await r.json();
    console.log("[API DEBUG] deleteDocument - Response data:", data);
    
    if (!r.ok || !data.success) {
      console.error("[API DEBUG ERROR] deleteDocument - Error:", data.error || "Delete failed");
      throw new Error(data.error || "Delete failed");
    }
    
    console.log("[API DEBUG SUCCESS] deleteDocument - Success");
    return data as { success: true; patient_deleted: boolean; document_type_deleted: boolean };
  } catch (error) {
    console.error("[API DEBUG ERROR] deleteDocument - Exception:", error);
    throw error;
  }
}

// Upload documento come pacchetto (flusso unificato)
export async function uploadDocumentAsPacket(file: File, patientId?: string) {
  const url = `${BASE_URL}/api/upload-document`;
  console.log("[API DEBUG] uploadDocumentAsPacket - URL:", url);
  console.log("[API DEBUG] uploadDocumentAsPacket - Method: POST");
  console.log("[API DEBUG] uploadDocumentAsPacket - File name:", file.name);
  console.log("[API DEBUG] uploadDocumentAsPacket - File size:", file.size, "bytes");
  console.log("[API DEBUG] uploadDocumentAsPacket - Patient ID:", patientId || "undefined");
  
  const formData = new FormData();
  formData.append("file", file);
  if (patientId) {
    formData.append("patient_id", patientId);
  }
  formData.append("process_as_packet", "true");

  try {
    const res = await fetch(url, {
      method: "POST",
      body: formData,
      credentials: "include",
    });
    console.log("[API DEBUG] uploadDocumentAsPacket - Response status:", res.status, res.statusText);
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error("[API DEBUG ERROR] uploadDocumentAsPacket - Error response:", errorText);
      throw new Error("Errore upload documento come pacchetto");
    }
    
    const data = await res.json();
    console.log("[API DEBUG SUCCESS] uploadDocumentAsPacket - Success, response:", data);
    return data;
  } catch (error) {
    console.error("[API DEBUG ERROR] uploadDocumentAsPacket - Exception:", error);
    throw error;
  }
}

// Status del processing del pacchetto
export async function fetchDocumentPacketStatus(patientId: string) {
  const url = `${BASE_URL}/api/document-packet-status/${patientId}`;
  console.log("[API DEBUG] fetchDocumentPacketStatus - URL:", url);
  console.log("[API DEBUG] fetchDocumentPacketStatus - Patient ID:", patientId);
  console.log("[API DEBUG] fetchDocumentPacketStatus - Method: GET");
  
  try {
    const res = await fetch(url, {
      credentials: "include",
    });
    console.log("[API DEBUG] fetchDocumentPacketStatus - Response status:", res.status, res.statusText);
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error("[API DEBUG ERROR] fetchDocumentPacketStatus - Error response:", errorText);
      throw new Error("Errore nel recupero status");
    }
    
    const data = await res.json();
    console.log("[API DEBUG SUCCESS] fetchDocumentPacketStatus - Success, status:", data);
    return data;
  } catch (error) {
    console.error("[API DEBUG ERROR] fetchDocumentPacketStatus - Exception:", error);
    throw error;
  }
}

// Testo OCR del documento
export async function fetchDocumentOCRText(patientId: string) {
  const url = `${BASE_URL}/api/document-ocr-text/${patientId}`;
  console.log("[API DEBUG] fetchDocumentOCRText - URL:", url);
  console.log("[API DEBUG] fetchDocumentOCRText - Patient ID:", patientId);
  console.log("[API DEBUG] fetchDocumentOCRText - Method: GET");
  
  try {
    const res = await fetch(url, {
      credentials: "include",
    });
    console.log("[API DEBUG] fetchDocumentOCRText - Response status:", res.status, res.statusText);
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error("[API DEBUG ERROR] fetchDocumentOCRText - Error response:", errorText);
      throw new Error("Errore nel recupero testo OCR");
    }
    
    const data = await res.json();
    console.log("[API DEBUG SUCCESS] fetchDocumentOCRText - Success");
    return data;
  } catch (error) {
    console.error("[API DEBUG ERROR] fetchDocumentOCRText - Exception:", error);
    throw error;
  }
}

// File salvati del pacchetto
export async function fetchDocumentPacketFiles(patientId: string) {
  const url = `${BASE_URL}/api/document-packet-files/${patientId}`;
  console.log("[API DEBUG] fetchDocumentPacketFiles - URL:", url);
  console.log("[API DEBUG] fetchDocumentPacketFiles - Patient ID:", patientId);
  console.log("[API DEBUG] fetchDocumentPacketFiles - Method: GET");
  
  try {
    const res = await fetch(url, {
      credentials: "include",
    });
    console.log("[API DEBUG] fetchDocumentPacketFiles - Response status:", res.status, res.statusText);
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error("[API DEBUG ERROR] fetchDocumentPacketFiles - Error response:", errorText);
      throw new Error("Errore nel recupero file");
    }
    
    const data = await res.json();
    console.log("[API DEBUG SUCCESS] fetchDocumentPacketFiles - Success");
    return data;
  } catch (error) {
    console.error("[API DEBUG ERROR] fetchDocumentPacketFiles - Exception:", error);
    throw error;
  }
}

// Debug processing status
export async function debugProcessingStatus(patientId: string) {
  const url = `${BASE_URL}/api/debug-processing-status/${patientId}`;
  console.log("[API DEBUG] debugProcessingStatus - URL:", url);
  console.log("[API DEBUG] debugProcessingStatus - Patient ID:", patientId);
  console.log("[API DEBUG] debugProcessingStatus - Method: GET");
  
  try {
    const res = await fetch(url, {
      credentials: "include",
    });
    console.log("[API DEBUG] debugProcessingStatus - Response status:", res.status, res.statusText);
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error("[API DEBUG ERROR] debugProcessingStatus - Error response:", errorText);
      throw new Error("Errore nel debug status");
    }
    
    const data = await res.json();
    console.log("[API DEBUG SUCCESS] debugProcessingStatus - Success");
    return data;
  } catch (error) {
    console.error("[API DEBUG ERROR] debugProcessingStatus - Exception:", error);
    throw error;
  }
}
