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


// Lista pazienti
export async function fetchPatients() {
  const url = `${BASE_URL}/api/patients`;
  try {
    const res = await fetch(url, {
      credentials: "include",
    });
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error("[API ERROR] fetchPatients - Error response:", errorText);
      throw new Error("Errore nel caricamento pazienti");
    }
    
    const data = await res.json();
    return data;
  } catch (error) {
    console.error("[API ERROR] fetchPatients - Exception:", error);
    throw error;
  }
}

// Dettaglio paziente
export async function fetchPatientDetail(patientId: string) {
  const url = `${BASE_URL}/api/patient/${patientId}`;
  try {
    const res = await fetch(url, {
      credentials: "include",
    });
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error("[API ERROR] fetchPatientDetail - Error response:", errorText);
      throw new Error("Paziente non trovato");
    }
    
    const data = await res.json();
    return data;
  } catch (error) {
    console.error("[API ERROR] fetchPatientDetail - Exception:", error);
    throw error;
  }
}

// Upload documento PDF
export async function uploadDocument(file: File, patientId: string) {
  const url = `${BASE_URL}/api/upload-document`;
  const formData = new FormData();
  formData.append("file", file);
  formData.append("patient_id", patientId);

  try {
    const res = await fetch(url, {
      method: "POST",
      body: formData,
      credentials: "include",
    });
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error("[API ERROR] uploadDocument - Error response:", errorText);
      throw new Error("Errore upload documento");
    }
    
    const data = await res.json();
    return data;
  } catch (error) {
    console.error("[API ERROR] uploadDocument - Exception:", error);
    throw error;
  }
}

// Dettaglio documento
export async function fetchDocumentDetail(documentId: string) {
  const url = `${BASE_URL}/api/document/${documentId}`;
  try {
    const res = await fetch(url, {
      credentials: "include",
    });
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error("[API ERROR] fetchDocumentDetail - Error response:", errorText);
      throw new Error("Documento non trovato");
    }
    
    const data = await res.json();
    return data;
  } catch (error) {
    console.error("[API ERROR] fetchDocumentDetail - Exception:", error);
    throw error;
  }
}

// Aggiorna entità documento
export async function updateDocumentEntities(documentId: string, entities: any[]) {
  const url = `${BASE_URL}/api/document/${documentId}`;
  const body = JSON.stringify({ entities });
  
  try {
    const res = await fetch(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: body,
      credentials: "include",
    });
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error("[API ERROR] updateDocumentEntities - Error response:", errorText);
      throw new Error("Errore aggiornamento entità");
    }
    
    const data = await res.json();
    return data;
  } catch (error) {
    console.error("[API ERROR] updateDocumentEntities - Exception:", error);
    throw error;
  }
}

// Export Excel
export async function exportExcel() {
  const url = `${BASE_URL}/api/export-excel`;
  try {
    const res = await fetch(url, {
      credentials: "include",
    });
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error("[API ERROR] exportExcel - Error response:", errorText);
      throw new Error("Errore export Excel");
    }
    
    const blob = await res.blob();
    return blob;
  } catch (error) {
    console.error("[API ERROR] exportExcel - Exception:", error);
    throw error;
  }
}

// Elimina documento
export async function deleteDocument(documentId: string) {
  const url = `${BASE_URL}/api/document/${encodeURIComponent(documentId)}`;
  try {
    const r = await fetch(url, {
      method: "DELETE",
      credentials: "include",
    });
    
    const data = await r.json();
    
    if (!r.ok || !data.success) {
      console.error("[API ERROR] deleteDocument - Error:", data.error || "Delete failed");
      throw new Error(data.error || "Delete failed");
    }
    
    return data as { success: true; patient_deleted: boolean; document_type_deleted: boolean };
  } catch (error) {
    console.error("[API ERROR] deleteDocument - Exception:", error);
    throw error;
  }
}

// Upload documento come pacchetto (flusso unificato)
export async function uploadDocumentAsPacket(file: File, patientId?: string) {
  const url = `${BASE_URL}/api/upload-document`;
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
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error("[API ERROR] uploadDocumentAsPacket - Error response:", errorText);
      throw new Error("Errore upload documento come pacchetto");
    }
    
    const data = await res.json();
    return data;
  } catch (error) {
    console.error("[API ERROR] uploadDocumentAsPacket - Exception:", error);
    throw error;
  }
}

// Status del processing del pacchetto
export async function fetchDocumentPacketStatus(patientId: string) {
  const url = `${BASE_URL}/api/document-packet-status/${patientId}`;
  try {
    const res = await fetch(url, {
      credentials: "include",
    });
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error("[API ERROR] fetchDocumentPacketStatus - Error response:", errorText);
      throw new Error("Errore nel recupero status");
    }
    
    const data = await res.json();
    return data;
  } catch (error) {
    console.error("[API ERROR] fetchDocumentPacketStatus - Exception:", error);
    throw error;
  }
}

// Testo OCR del documento
export async function fetchDocumentOCRText(patientId: string) {
  const url = `${BASE_URL}/api/document-ocr-text/${patientId}`;
  try {
    const res = await fetch(url, {
      credentials: "include",
    });
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error("[API ERROR] fetchDocumentOCRText - Error response:", errorText);
      throw new Error("Errore nel recupero testo OCR");
    }
    
    const data = await res.json();
    return data;
  } catch (error) {
    console.error("[API ERROR] fetchDocumentOCRText - Exception:", error);
    throw error;
  }
}

// File salvati del pacchetto
export async function fetchDocumentPacketFiles(patientId: string) {
  const url = `${BASE_URL}/api/document-packet-files/${patientId}`;
  try {
    const res = await fetch(url, {
      credentials: "include",
    });
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error("[API ERROR] fetchDocumentPacketFiles - Error response:", errorText);
      throw new Error("Errore nel recupero file");
    }
    
    const data = await res.json();
    return data;
  } catch (error) {
    console.error("[API ERROR] fetchDocumentPacketFiles - Exception:", error);
    throw error;
  }
}

// Debug processing status
export async function debugProcessingStatus(patientId: string) {
  const url = `${BASE_URL}/api/debug-processing-status/${patientId}`;
  try {
    const res = await fetch(url, {
      credentials: "include",
    });
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error("[API ERROR] debugProcessingStatus - Error response:", errorText);
      throw new Error("Errore nel debug status");
    }
    
    const data = await res.json();
    return data;
  } catch (error) {
    console.error("[API ERROR] debugProcessingStatus - Exception:", error);
    throw error;
  }
}
