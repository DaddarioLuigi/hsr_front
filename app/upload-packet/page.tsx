"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { uploadPacketOCR, fetchPatientDetail, fetchPatients } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Upload, FileText } from "lucide-react";

export default function UploadPacketPage() {
  const router = useRouter();
  const search = useSearchParams();
  const prefillPatientId = search.get("patient_id") ?? "";

  const [patientId, setPatientId] = useState(prefillPatientId);
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [pollPct, setPollPct] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const baselineDocCount = useRef<number | null>(null);
  const pollTimer = useRef<any>(null);

  // opzionale: lista pazienti per aiutare l’inserimento
  const [patients, setPatients] = useState<{ id: string; name: string }[]>([]);
  useEffect(() => {
    fetchPatients().then((list: any[]) => {
      setPatients(list.map(p => ({ id: p.id, name: p.name })));
    }).catch(() => {});
  }, []);

  async function readDocCount(pid: string) {
    const detail = await fetchPatientDetail(pid);
    const docs = (detail?.documents ?? []) as Array<{ upload_date: string }>;
    return docs.length;
  }

  async function handleSubmit() {
    setError(null);
    if (!patientId) return setError("Inserisci un ID paziente");
    if (!file) return setError("Seleziona un PDF unico della cartella clinica");
    if (!file.name.toLowerCase().endsWith(".pdf")) return setError("Il file deve essere un PDF");

    setSubmitting(true);
    try {
      // 1) baseline documenti
      baselineDocCount.current = await readDocCount(patientId);

      // 2) avvia OCR+estrazione
      const resp = await uploadPacketOCR(file, patientId); // { status: "processing" }
      setProcessing(true);

      // 3) polling semplice: controlla quando compaiono nuovi documenti
      let ticks = 0;
      pollTimer.current = setInterval(async () => {
        try {
          ticks += 1;
          // animazione/progress finto ma informativo
          setPollPct(p => Math.min(95, p + 2));

          const curr = await readDocCount(patientId);
          if (baselineDocCount.current != null && curr > baselineDocCount.current) {
            clearInterval(pollTimer.current);
            setPollPct(100);
            router.push(`/patient/${patientId}?msg=estrazione_completata`);
          }
          // opzionale: timeout polling dopo ~2 min
          if (ticks > 60) {
            clearInterval(pollTimer.current);
            router.push(`/patient/${patientId}?msg=estrazione_avviata`);
          }
        } catch {
          // ignora errori transitori
        }
      }, 2000);
    } catch (e: any) {
      setError(e.message || "Errore durante l’upload OCR");
    } finally {
      setSubmitting(false);
    }
  }

  useEffect(() => () => pollTimer.current && clearInterval(pollTimer.current), []);

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
            <Label htmlFor="patientId">ID Paziente</Label>
            <Input
              id="patientId"
              placeholder="Es. 2025-0001"
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
            />
            {/* Se vuoi: pick rapido */}
            {patients.length > 0 && (
              <div className="text-xs text-muted-foreground">
                Esempi: {patients.slice(0,3).map(p => p.id).join(", ")}…
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="file">PDF della cartella (unico file)</Label>
            <Input
              id="file"
              type="file"
              accept="application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </div>

          {error && <div className="text-sm text-red-600">{error}</div>}

          <div className="flex gap-3">
            <Button disabled={submitting || processing} onClick={handleSubmit}>
              <Upload className="h-4 w-4 mr-2" />
              Avvia OCR & Estrazione
            </Button>
            <Button variant="outline" onClick={() => router.back()}>
              Annulla
            </Button>
          </div>

          {processing && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileText className="h-4 w-4" />
                Estrazione in corso… aggiorno appena compaiono i nuovi documenti.
              </div>
              <Progress value={pollPct} />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
