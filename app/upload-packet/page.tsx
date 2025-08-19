"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { uploadPacketOCR, fetchPatients, fetchPacketStatus } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Upload, FileText, AlertCircle } from "lucide-react";

export default function UploadPacketPage() {
  const router = useRouter();
  const search = useSearchParams();
  const prefillPatientId = search.get("patient_id") ?? "";

  const [patientId, setPatientId] = useState(prefillPatientId);
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [pendingId, setPendingId] = useState<string | null>(null);
  const [percent, setPercent] = useState<number>(0);
  const [stage, setStage] = useState<string>("idle");
  const [message, setMessage] = useState<string>("");
  const pollTimer = useRef<any>(null);

  const [patients, setPatients] = useState<{ id: string; name: string }[]>([]);
  useEffect(() => {
    fetchPatients().then((list: any[]) => {
      setPatients(list.map((p: any) => ({ id: p.id, name: p.name })));
    }).catch(() => {});
  }, []);

  function stageLabel(s: string) {
    switch (s) {
      case "upload_ok": return "Upload completato";
      case "ocr_start": return "OCR in esecuzione";
      case "ocr_done": return "OCR completato";
      case "segmenting": return "Segmentazione documenti";
      case "segmented": return "Sezioni individuate";
      case "extracting": return "Estrazione entità";
      case "consolidating": return "Consolidamento dati";
      case "completed": return "Completato";
      case "failed": return "Errore";
      default: return "In attesa…";
    }
  }

  async function startPolling(id: string) {
    if (pollTimer.current) clearInterval(pollTimer.current);
    pollTimer.current = setInterval(async () => {
      try {
        const s = await fetchPacketStatus(id);
        setPercent(s.percent ?? 0);
        setStage(s.stage ?? "unknown");
        setMessage(s.message ?? "");
        if (s.stage === "completed") {
          clearInterval(pollTimer.current);
          const pid = s.final_patient_id || patientId || id;
          setPercent(100);
          router.push(`/patient/${pid}?msg=estrazione_completata`);
        } else if (s.stage === "failed") {
          clearInterval(pollTimer.current);
          setError(s.message || "Elaborazione fallita");
        }
      } catch {
        // ignora errori temporanei
      }
    }, 1500);
  }

  useEffect(() => () => pollTimer.current && clearInterval(pollTimer.current), []);

  async function handleSubmit() {
    setError(null);
    if (!file) return setError("Seleziona un PDF unico della cartella clinica");
    if (!file.name.toLowerCase().endsWith(".pdf")) return setError("Il file deve essere un PDF");

    setSubmitting(true);
    try {
      const resp = await uploadPacketOCR(file, patientId || undefined);
      const id = resp.pending_id || patientId || "_unknown";
      setPendingId(id);
      setStage("upload_ok");
      setMessage("File caricato, elaborazione avviata…");
      setPercent(5);
      await startPolling(id);
    } catch (e: any) {
      setError(e.message || "Errore durante l’upload OCR");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Carica Cartella Clinica (OCR)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="patientId">ID Paziente (opzionale)</Label>
            <Input
              id="patientId"
              placeholder="Es. 2025-0001 (oppure lascia vuoto)"
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              disabled={!!pendingId}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="file">PDF della cartella (unico file)</Label>
            <Input
              id="file"
              type="file"
              accept="application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              disabled={!!pendingId}
            />
          </div>

          {error && (
            <div className="text-sm text-red-600 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" /> {error}
            </div>
          )}

          <div className="flex gap-3">
            <Button disabled={submitting || !!pendingId} onClick={handleSubmit}>
              <Upload className="h-4 w-4 mr-2" />
              Avvia OCR & Estrazione
            </Button>
            <Button variant="outline" onClick={() => router.back()} disabled={submitting}>
              Annulla
            </Button>
          </div>

          {!!pendingId && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileText className="h-4 w-4" />
                {stageLabel(stage)} — {message}
              </div>
              <Progress value={percent} />
              <div className="text-xs text-muted-foreground">{percent}%</div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
