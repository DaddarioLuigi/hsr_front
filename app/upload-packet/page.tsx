"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  uploadDocumentAsPacket, 
  fetchDocumentPacketStatus, 
  fetchDocumentOCRText, 
  fetchDocumentPacketFiles,
  fetchPatients,
  debugProcessingStatus
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { 
  Upload, 
  FileText, 
  AlertCircle, 
  CheckCircle, 
  XCircle, 
  Info,
  Eye,
  FolderOpen,
  ArrowRight,
  Clock,
  User,
  File,
  HardDrive,
  Database,
  Settings,
  Search,
  Download,
  Trash2,
  Edit,
  Plus,
  Minus,
  AlertTriangle,
  HelpCircle
} from "lucide-react";

// Interfacce TypeScript
interface DocumentCreated {
  document_id: string;
  document_type: string;
  filename: string;
  status: string;
  entities_count: number;
}

interface ProcessingStatus {
  patient_id: string;
  status: string;
  message: string;
  progress: number;
  filename?: string;
  sections_found: string[];
  sections_missing: string[];
  documents_created: DocumentCreated[];
  errors: string[];
  original_patient_id?: string;
  final_patient_id?: string;
  current_section?: string;
}

interface FileInfo {
  name: string;
  path: string;
  size: number;
  type: string;
}

interface FolderInfo {
  path: string;
  files: FileInfo[];
}

interface FilesInfo {
  patient_id: string;
  patient_path: string;
  folders: Record<string, FolderInfo>;
  ocr_text?: {
    folder: string;
    files: string[];
  };
  processing_status?: any;
}

export default function UploadPacketPage() {
  const router = useRouter();
  const search = useSearchParams();
  const prefillPatientId = search.get("patient_id") ?? "";
  
  // Stati principali
  const [patientId, setPatientId] = useState(prefillPatientId);
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Stati per il flusso unificato
  const [useUnifiedFlow, setUseUnifiedFlow] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus | null>(null);
  
  // Stati per visualizzazione
  const [showOCRText, setShowOCRText] = useState(false);
  const [ocrText, setOcrText] = useState<string>("");
  const [showFilesInfo, setShowFilesInfo] = useState(false);
  const [filesInfo, setFilesInfo] = useState<FilesInfo | null>(null);
  
  // Stati per polling
  const pollTimer = useRef<NodeJS.Timeout | null>(null);
  const [patients, setPatients] = useState<{ id: string; name: string }[]>([]);

  // Carica lista pazienti
  useEffect(() => {
    fetchPatients().then((list: any[]) => {
      setPatients(list.map((p: any) => ({ id: p.id, name: p.name })));
    }).catch(() => {});
  }, []);

  // Cleanup polling
  useEffect(() => {
    return () => {
      if (pollTimer.current) clearInterval(pollTimer.current);
    };
  }, []);

  // Funzioni helper
  function getStageLabel(status: string): string {
    switch (status) {
      case "ocr_start": return "OCR in esecuzione";
      case "ocr_done": return "OCR completato";
      case "segmenting": return "Segmentazione documenti";
      case "segmented": return "Segmentazione completata";
      case "processing_sections": return "Elaborazione sezioni";
      case "completed": return "Completato";
      case "completed_with_errors": return "Completato con errori";
      case "failed": return "Errore";
      default: return "In attesa...";
    }
  }

  function getStageIcon(status: string) {
    switch (status) {
      case "completed": return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "failed": return <XCircle className="h-4 w-4 text-red-600" />;
      default: return <Clock className="h-4 w-4 text-blue-600" />;
    }
  }

  // Polling per flusso originale
  async function startPollingOriginal(id: string) {
    if (pollTimer.current) clearInterval(pollTimer.current);
    
    pollTimer.current = setInterval(async () => {
      try {
        const s = await fetchDocumentPacketStatus(id);
        setPercent(s.percent ?? 0);
        setStage(s.stage ?? "unknown");
        setMessage(s.message ?? "");
        
        if (s.stage === "completed") {
          clearInterval(pollTimer.current!);
          const pid = s.final_patient_id || patientId || id;
          setPercent(100);
          router.push(`/patient/${pid}?msg=estrazione_completata`);
        } else if (s.stage === "failed") {
          clearInterval(pollTimer.current!);
          setError(s.message || "Elaborazione fallita");
        }
      } catch {
        // Ignora errori temporanei
      }
    }, 1500);
  }

  // Polling per flusso unificato
  async function startPollingUnified(patientId: string) {
    if (pollTimer.current) clearInterval(pollTimer.current);
    
    pollTimer.current = setInterval(async () => {
      try {
        const status = await fetchDocumentPacketStatus(patientId);
        setProcessingStatus(status);
        
        // Gestisce cambio di patient_id durante il processing
        if (status.final_patient_id && status.final_patient_id !== patientId) {
          console.log(`Patient ID cambiato da ${patientId} a ${status.final_patient_id}`);
          setPendingId(status.final_patient_id);
          clearInterval(pollTimer.current!);
          startPollingUnified(status.final_patient_id);
          return;
        }
        
        if (status.status === "completed" || status.status === "completed_with_errors") {
          clearInterval(pollTimer.current!);
          const finalId = status.final_patient_id || status.patient_id || patientId;
          setPendingId(finalId);
          
          if (status.final_patient_id && status.final_patient_id !== patientId) {
            console.log(`Elaborazione completata. ID paziente finale: ${status.final_patient_id}`);
          }
        } else if (status.status === "failed") {
          clearInterval(pollTimer.current!);
          setError(status.message || "Elaborazione fallita");
        }
      } catch {
        // Ignora errori temporanei
      }
    }, 2000);
  }

  // Gestione submit
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
        // Flusso unificato
        const resp = await uploadDocumentAsPacket(file, patientId || undefined);
        const id = resp.patient_id || patientId || "_unknown";
        setPendingId(id);
        setProcessingStatus({
          patient_id: id,
          status: "ocr_start",
          message: "Avvio elaborazione pacchetto clinico...",
          progress: 5,
          sections_found: [],
          sections_missing: [],
          documents_created: [],
          errors: []
        });
        await startPollingUnified(id);
      } else {
        // Flusso originale (per compatibilità)
        const resp = await uploadDocumentAsPacket(file, patientId || undefined);
        const id = resp.patient_id || patientId || "_unknown";
        setPendingId(id);
        setStage("upload_ok");
        setMessage("File caricato, elaborazione avviata...");
        setPercent(5);
        await startPollingOriginal(id);
      }
    } catch (e: any) {
      setError(e.message || "Errore durante l'upload");
    } finally {
      setSubmitting(false);
    }
  }

  // Visualizza testo OCR
  const handleViewOCRText = async () => {
    if (!pendingId) return;
    
    try {
      const response = await fetchDocumentOCRText(pendingId);
      setOcrText(response.ocr_text || "Testo OCR non disponibile");
      setShowOCRText(true);
    } catch (error) {
      console.error("Errore nel recupero testo OCR:", error);
      setError("Errore nel recupero testo OCR");
    }
  };

  // Visualizza file salvati
  const handleViewFiles = async () => {
    if (!pendingId) return;
    
    try {
      const files = await fetchDocumentPacketFiles(pendingId);
      setFilesInfo(files);
      setShowFilesInfo(true);
    } catch (error) {
      console.error("Errore nel recupero informazioni file:", error);
      setError("Errore nel recupero informazioni file");
    }
  };

  // Debug processing status
  const handleDebugStatus = async () => {
    if (!pendingId) return;
    
    try {
      const debugInfo = await debugProcessingStatus(pendingId);
      console.log("Debug Processing Status:", debugInfo);
      alert(`Debug info salvata in console. Patient ID: ${pendingId}`);
    } catch (error) {
      console.error("Errore nel debug status:", error);
      setError("Errore nel debug status");
    }
  };

  // Ottieni nome paziente corrente
  const currentPatient = patients.find(p => p.id === patientId);
  const currentPatientName = currentPatient?.name;

  // Stati per flusso originale (per compatibilità)
  const [percent, setPercent] = useState<number>(0);
  const [stage, setStage] = useState<string>("idle");
  const [message, setMessage] = useState<string>("");

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
          {/* Selezione flusso */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="unified-flow"
              checked={useUnifiedFlow}
              onCheckedChange={(checked) => setUseUnifiedFlow(checked as boolean)}
              disabled={!!pendingId}
            />
            <Label htmlFor="unified-flow" className="text-sm font-medium">
              Tratta come pacchetto clinico completo (flusso unificato)
            </Label>
          </div>

          {/* Form di upload */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="patientId">ID Paziente (opzionale)</Label>
              <Input
                id="patientId"
                placeholder="Es. 2025-0001 (oppure lascia vuoto per estrazione automatica)"
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                disabled={!!pendingId}
              />
              {currentPatientName && (
                <p className="text-sm text-green-600 flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Paziente identificato: {currentPatientName}
                </p>
              )}
            </div>

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
                <div className="text-sm text-gray-600 space-y-1">
                  <p className="flex items-center gap-2">
                    <File className="h-4 w-4" />
                    {file.name}
                  </p>
                  <p className="flex items-center gap-2">
                    <HardDrive className="h-4 w-4" />
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Messaggi di errore */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Pulsanti di azione */}
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

          {/* Progress per flusso originale */}
          {!useUnifiedFlow && !!pendingId && (
            <div className="space-y-3 border rounded-lg p-4 bg-gray-50">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileText className="h-4 w-4" />
                {getStageLabel(stage)} — {message}
              </div>
              <Progress value={percent} />
              <div className="text-xs text-muted-foreground text-center">
                {percent}%
              </div>
            </div>
          )}

          {/* Progress per flusso unificato */}
          {useUnifiedFlow && processingStatus && (
            <div className="space-y-4 border rounded-lg p-4 bg-gray-50">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Stato Elaborazione</h3>
                <Badge variant={
                  processingStatus.status === "completed" ? "default" : 
                  processingStatus.status === "failed" ? "destructive" : "secondary"
                }>
                  {getStageIcon(processingStatus.status)}
                  <span className="ml-1">{getStageLabel(processingStatus.status)}</span>
                </Badge>
              </div>
              
              {/* Informazioni cambio patient_id */}
              {processingStatus.final_patient_id && 
               processingStatus.final_patient_id !== processingStatus.patient_id && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    <strong>ID Paziente estratto:</strong> {processingStatus.final_patient_id}
                    {processingStatus.original_patient_id && (
                      <span> (iniziale: {processingStatus.original_patient_id})</span>
                    )}
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  {processingStatus.message}
                </div>
                {processingStatus.current_section && (
                  <div className="flex items-center gap-2 text-sm text-blue-600">
                    <Clock className="h-4 w-4" />
                    Sezione corrente: <Badge variant="outline">{processingStatus.current_section}</Badge>
                  </div>
                )}
                <Progress value={processingStatus.progress} className="w-full" />
                <div className="text-xs text-muted-foreground text-center">
                  {processingStatus.progress}%
                </div>
              </div>

              {/* Sezioni trovate */}
              {processingStatus.sections_found.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Sezioni Trovate:</h4>
                  <div className="flex flex-wrap gap-2">
                    {processingStatus.sections_found.map((section) => (
                      <div key={section} className="flex items-center gap-1">
                        <CheckCircle className="h-3 w-3 text-green-600" />
                        <Badge variant="outline" className="text-xs">
                          {section}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sezioni mancanti */}
              {processingStatus.sections_missing.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Sezioni Mancanti:</h4>
                  <Alert variant="destructive">
                    <XCircle className="h-4 w-4" />
                    <AlertDescription>
                      {processingStatus.sections_missing.join(", ")}
                    </AlertDescription>
                  </Alert>
                </div>
              )}

              {/* Documenti creati */}
              {processingStatus.documents_created.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Documenti Creati:</h4>
                  <div className="space-y-1">
                    {processingStatus.documents_created.map((doc) => (
                      <div key={doc.document_id} className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2">
                          <FileText className="h-3 w-3" />
                          {doc.document_type}
                        </span>
                        <span className="text-muted-foreground">
                          {doc.filename} ({doc.entities_count} entità)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Errori */}
              {processingStatus.errors.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-red-600">Errori:</h4>
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <ul className="list-disc list-inside space-y-1">
                        {processingStatus.errors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                </div>
              )}

              {/* Pulsanti azioni finali */}
              {(processingStatus.status === "completed" || processingStatus.status === "completed_with_errors") && (
                <div className="flex gap-2 pt-2">
                  <Button onClick={handleViewOCRText} variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-2" />
                    Testo OCR
                  </Button>
                  <Button onClick={handleViewFiles} variant="outline" size="sm">
                    <FolderOpen className="h-4 w-4 mr-2" />
                    File Salvati
                  </Button>
                  <Button 
                    onClick={() => router.push(`/patient/${processingStatus.final_patient_id || pendingId || patientId}`)} 
                    variant="default" 
                    size="sm"
                    className="flex-1"
                  >
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Vai alla Dashboard
                  </Button>
                </div>
              )}

              {/* Pulsante debug sempre visibile */}
              <div className="flex gap-2 pt-2">
                <Button onClick={handleDebugStatus} variant="outline" size="sm">
                  <Info className="h-4 w-4 mr-2" />
                  Debug Status
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal per testo OCR */}
      {showOCRText && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Testo OCR Estratto</h3>
              <Button onClick={() => setShowOCRText(false)} variant="outline" size="sm">
                Chiudi
              </Button>
            </div>
            <div className="bg-gray-100 p-4 rounded text-sm font-mono whitespace-pre-wrap overflow-auto max-h-96">
              {ocrText}
            </div>
          </div>
        </div>
      )}

      {/* Modal per file salvati */}
      {showFilesInfo && filesInfo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">File Salvati</h3>
              <Button onClick={() => setShowFilesInfo(false)} variant="outline" size="sm">
                Chiudi
              </Button>
            </div>
            
            <div className="space-y-4">
              <div className="bg-blue-50 p-3 rounded">
                <p><strong>Paziente:</strong> {filesInfo.patient_id}</p>
                <p><strong>Percorso:</strong> {filesInfo.patient_path}</p>
              </div>
              
              {filesInfo.ocr_text && (
                <div className="border rounded p-3">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Testo OCR
                  </h4>
                  <p><strong>Cartella:</strong> {filesInfo.ocr_text.folder}</p>
                  <p><strong>File:</strong> {filesInfo.ocr_text.files.join(", ")}</p>
                </div>
              )}
              
              {Object.keys(filesInfo.folders).length > 0 && (
                <div className="border rounded p-3">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <FolderOpen className="h-4 w-4" />
                    Documenti Processati
                  </h4>
                  <div className="space-y-2">
                    {Object.entries(filesInfo.folders).map(([docType, folderInfo]: [string, FolderInfo]) => (
                      <div key={docType} className="border-l-2 border-blue-200 pl-3">
                        <p className="font-medium text-blue-800">{docType}</p>
                        <p className="text-sm text-gray-600">{folderInfo.path}</p>
                        <div className="mt-1">
                          {folderInfo.files.map((file: FileInfo) => (
                            <div key={file.name} className="text-sm flex justify-between">
                              <span>{file.name}</span>
                              <span className="text-gray-500">
                                {file.size > 0 ? `${(file.size / 1024).toFixed(1)} KB` : '0 KB'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div> 
                </div>
              )}
              
              {filesInfo.processing_status && (
                <div className="border rounded p-3">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Stato Processing
                  </h4>
                  <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
                    {JSON.stringify(filesInfo.processing_status, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 