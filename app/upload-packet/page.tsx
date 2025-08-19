"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ingestPacketOCRSync, fetchPatients } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload } from "lucide-react";

export default function UploadPacketPage() {
  const router = useRouter();
  const search = useSearchParams();
  const prefillPatientId = search.get("patient_id") ?? "";

  const [patientId, setPatientId] = useState(prefillPatientId);
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // opzionale: mostra qualche ID paziente esistente come hint
  const [patients, setPatients] = useState<{ id: string; name: string }[]>([]);
  useEffect(() => {
    fetchPatients()
      .then((list: any[]) => setPatients(list.map((p) => ({ id: p.id, name: p.name }))))
      .catch(() => {});
  }, []);

  async function handleSubmit() {
    setError(null);
    if (!file) return setError("Seleziona un PDF unico della cartella clinica");
    if (!file.name.toLowerCase().endsWith(".pdf")) return setError("Il file deve essere un PDF");

    setSubmitting(true);
    try {
      // patientId è opzionale: se vuoto verrà ricavato da n_cartella della lettera di dimissione
      const summary = await ingestPacketOCRSync(file, patientId || undefined);
      router.push(`/patient/${summary.patient_id}?msg=estrazione_completata`);
    } catch (e: any) {
      setError(e.message || "Errore durante l’upload/estrazione");
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
            />
            {patients.length > 0 && (
              <div className="text-xs text-muted-foreground">
                Esempi: {patients.slice(0, 3).map((p) => p.id).join(", ")}…
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
            <Button disabled={submitting} onClick={handleSubmit}>
              <Upload className="h-4 w-4 mr-2" />
              Avvia OCR & Estrazione
            </Button>
            <Button variant="outline" onClick={() => router.back()} disabled={submitting}>
              Annulla
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
