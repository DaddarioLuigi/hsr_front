"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  uploadPacketOCR, 
  uploadDocumentAsPacket,
  fetchPatients, 
  fetchPacketStatus,
  fetchDocumentPacketStatus,
  fetchDocumentOCRText
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Upload, FileText, AlertCircle, Eye, Info, CheckCircle, XCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

interface DocumentCreated {
  document_id: string;
  document_type: string;
  filename: string;
  status: "processed";
  entities_count: number;
}

interface ProcessingStatus {
  patient_id: string;
  status: "ocr_start" | "segmenting" | "processing_sections" | "completed" | "completed_with_errors" | "failed";
  message: string;
  progress: number;
  filename: string;
  sections_found: string[];
  sections_missing: string[];
  documents_created: DocumentCreated[];
  errors: string[];
  final_patient_id?: string;
  original_patient_id?: string;
}

export default function UploadPacketPage() {
  const router = useRouter();
  const search = useSearchParams();
  const prefillPatientId = search.get("patient_id") ?? "";

  // Form state
  const [patientId, setPatientId] = useState(prefillPatientId);
  const [file, setFile] = useState<File | null>(null);
  const [useUnifiedFlow, setUseUnifiedFlow] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Processing state
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus | null>(null);
  const [showOCRText, setShowOCRText] = useState(false);
  const [ocrText, setOcrText] = useState<string>("");
  
  const pollTimer = useRef<NodeJS.Timeout | null>(null);

  // Patients list
  const [patients, setPatients] = useState<{ id: string; name: string }[]>([]);

  // Load patients on mount
  useEffect(() => {
    fetchPatients().then((list: any[]) => {
      setPatients(list.map((p: any) => ({ id: p.id, name: p.name })));
    }).catch(() => {
      // Ignore errors loading patients
    });
  }, []);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (pollTimer.current) {
        clearInterval(pollTimer.current);
      }
    };
  }, []);

  // Helper function to get stage label
  function getStageLabel(status: string): string {
    switch (status) {
      case "upload_ok": return "Upload completato";
      case "ocr_start": return "OCR in esecuzione";
      case "ocr_done": return "OCR completato";
      case "segmenting": return "Segmentazione documenti";
      case "segmented": return "Sezioni individuate";
      case "extracting": return "Estrazione entità";
      case "processing_sections": return "Elaborazione sezioni";
      case "consolidating": return "Consolidamento dati";
      case "completed": return "Completato";
      case "completed_with_errors": return "Completato con errori";
      case "failed": return "Errore";
      default: return "In attesa…";
    }
  }

  // Polling for original flow
  async function startPollingOriginal(id: string) {
    if (pollTimer.current) clearInterval(pollTimer.current);
    
    pollTimer.current = setInterval(async () => {
      try {
        const status = await fetchPacketStatus(id);
        
        if (status.stage === "completed") {
          clearInterval(pollTimer.current!);
          const finalId = status.final_patient_id || patientId || id;
          router.push(`/patient/${finalId}?msg=estrazione_completata`);
        } else if (status.stage === "failed") {
          clearInterval(pollTimer.current!);
          setError(status.message || "Elaborazione fallita");
        }
      } catch {
        // Ignore temporary errors
      }
    }, 1500);
  }

  // Polling for unified flow
  async function startPollingUnified(patientId: string) {
    if (pollTimer.current) clearInterval(pollTimer.current);
    
    pollTimer.current = setInterval(async () => {
      try {
        const status = await fetchDocumentPacketStatus(patientId);
        setProcessingStatus(status);
        
        // Handle patient_id change during processing
        if (status.final_patient_id && status.final_patient_id !== patientId) {
          setPendingId(status.final_patient_id);
          clearInterval(pollTimer.current!);
          startPollingUnified(status.final_patient_id);
          return;
        }
        
        if (status.status === "completed" || status.status === "completed_with_errors") {
          clearInterval(pollTimer.current!);
          const finalId = status.final_patient_id || status.patient_id || patientId;
          setPendingId(finalId);
        } else if (status.status === "failed") {
          clearInterval(pollTimer.current!);
          setError(status.message || "Elaborazione fallita");
        }
      } catch {
        // Ignore temporary errors
      }
    }, 2000);
  }

  // Handle form submission
  async function handleSubmit() {
    setError(null);
    
    if (!file) {
      setError("Seleziona un PDF della cartella clinica");
      return;
    }
    
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setError("Il file deve essere un PDF");
      return;
    }

    setSubmitting(true);
    
    try {
      if (useUnifiedFlow) {
        // New unified flow
        const response = await uploadDocumentAsPacket(file, patientId || undefined);
        const id = response.patient_id;
        setPendingId(id);
        
        // Initialize processing status
        setProcessingStatus({
          patient_id: id,
          status: "ocr_start",
          message: "File caricato, elaborazione avviata…",
          progress: 5,
          filename: response.filename,
          sections_found: [],
          sections_missing: [],
          documents_created: [],
          errors: []
        });
        
        await startPollingUnified(id);
      } else {
        // Original flow
        const response = await uploadPacketOCR(file, patientId || undefined);
        const id = response.pending_id || patientId || "_unknown";
        setPendingId(id);
        await startPollingOriginal(id);
      }
    } catch (e: any) {
      setError(e.message || "Errore durante l'upload");
    } finally {
      setSubmitting(false);
    }
  }

  // Handle viewing OCR text
  async function handleViewOCRText() {
    if (!pendingId) return;
    
    try {
      const ocrData = await fetchDocumentOCRText(pendingId);
      setOcrText(ocrData.ocr_text);
      setShowOCRText(true);
    } catch (e: any) {
      setError("Errore nel recupero del testo OCR");
    }
  }

  // Handle navigation to dashboard
  function handleGoToDashboard() {
    const finalId = pendingId || patientId;
    if (finalId) {
      router.push(`/patient/${finalId}`);
    }
  }

  // Get current patient name
  const currentPatient = patients.find(p => p.id === (processingStatus?.patient_id || patientId));

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Carica Cartella Clinica
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Flow Selection */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="unifiedFlow"
                checked={useUnifiedFlow}
                onCheckedChange={(checked) => setUseUnifiedFlow(checked as boolean)}
                disabled={!!pendingId}
              />
              <Label htmlFor="unifiedFlow" className="text-sm font-medium">
                Tratta come pacchetto clinico completo (nuovo flusso)
              </Label>
            </div>
            
            {useUnifiedFlow && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Ogni sezione identificata verrà gestita come documento indipendente nella dashboard.
                  Il sistema estrae automaticamente il numero di cartella dal documento.
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Patient ID Input */}
          <div className="space-y-2">
            <Label htmlFor="patientId">ID Paziente (opzionale)</Label>
            <Input
              id="patientId"
              placeholder="Es. 2025-0001 (oppure lascia vuoto per estrazione automatica)"
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              disabled={!!pendingId}
            />
            {currentPatient && (
              <div className="text-sm text-green-600">
                Paziente identificato: {currentPatient.name}
              </div>
            )}
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <Label htmlFor="file">PDF della cartella clinica</Label>
            <Input
              id="file"
              type="file"
              accept="application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              disabled={!!pendingId}
            />
            {file && (
              <div className="text-sm text-gray-600">
                File selezionato: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </div>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button 
              disabled={submitting || !!pendingId} 
              onClick={handleSubmit}
              className="flex-1"
            >
              <Upload className="h-4 w-4 mr-2" />
              {useUnifiedFlow ? "Avvia Elaborazione Unificata" : "Avvia OCR & Estrazione"}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => router.back()} 
              disabled={submitting}
            >
              Annulla
            </Button>
          </div>

          {/* Processing Status */}
          {processingStatus && (
            <div className="space-y-4 border rounded-lg p-4 bg-gray-50">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Stato Elaborazione</h3>
                <Badge variant={processingStatus.status === "completed" ? "default" : 
                               processingStatus.status === "failed" ? "destructive" : "secondary"}>
                  {getStageLabel(processingStatus.status)}
                </Badge>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  {processingStatus.message}
                </div>
                <Progress value={processingStatus.progress} className="w-full" />
                <div className="text-xs text-muted-foreground text-center">
                  {processingStatus.progress}%
                </div>
              </div>

              {/* Sections Found */}
              {processingStatus.sections_found.length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm font-medium flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Sezioni trovate ({processingStatus.sections_found.length})
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {processingStatus.sections_found.map((section, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {section}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Sections Missing */}
              {processingStatus.sections_missing.length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm font-medium flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-orange-600" />
                    Sezioni mancanti ({processingStatus.sections_missing.length})
                  </div>
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <span className="font-medium">Sezioni non trovate:</span> {processingStatus.sections_missing.join(", ")}
                    </AlertDescription>
                  </Alert>
                </div>
              )}

              {/* Documents Created */}
              {processingStatus.documents_created.length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm font-medium">
                    Documenti creati ({processingStatus.documents_created.length})
                  </div>
                  <div className="space-y-1">
                    {processingStatus.documents_created.map((doc, idx) => (
                      <div key={idx} className="text-xs bg-white p-2 rounded border">
                        <div className="font-medium">{doc.document_type}</div>
                        <div className="text-muted-foreground">{doc.filename}</div>
                        <div className="text-green-600">{doc.entities_count} entità estratte</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons for Completed Processing */}
              {(processingStatus.status === "completed" || processingStatus.status === "completed_with_errors") && (
                <div className="flex gap-2 pt-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleViewOCRText}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Visualizza Testo OCR
                  </Button>
                  <Button 
                    size="sm"
                    onClick={handleGoToDashboard}
                    className="flex-1"
                  >
                    Vai alla Dashboard
                  </Button>
                </div>
              )}

              {/* Errors Display */}
              {processingStatus.errors.length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm font-medium text-red-600">Errori riscontrati:</div>
                  <div className="space-y-1">
                    {processingStatus.errors.map((error, idx) => (
                      <div key={idx} className="text-xs text-red-600 bg-red-50 p-2 rounded">
                        {error}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* OCR Text Modal */}
      {showOCRText && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Testo OCR Estratto</h3>
              <Button variant="outline" size="sm" onClick={() => setShowOCRText(false)}>
                Chiudi
              </Button>
            </div>
            <div className="flex-1 overflow-auto">
              <pre className="text-sm whitespace-pre-wrap bg-gray-50 p-4 rounded">
                {ocrText}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}