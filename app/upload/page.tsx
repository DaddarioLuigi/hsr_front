"use client"

import type React from "react"
import { useState, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Upload, FileText, ArrowLeft, Loader2, CheckCircle, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { HospitalHeader } from "@/components/hospital-header"
import { uploadDocument } from "@/lib/api"
import { getDocumentId } from "@/lib/utils";

export default function UploadPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [patientId, setPatientId] = useState(searchParams.get("patient_id") || "")
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [dragActive, setDragActive] = useState(false)
  const [uploadComplete, setUploadComplete] = useState(false)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newFiles = Array.from(e.dataTransfer.files).filter((file) => file.type === "application/pdf")
      setSelectedFiles((prevFiles) => [...prevFiles, ...newFiles])
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files).filter((file) => file.type === "application/pdf")
      setSelectedFiles((prevFiles) => [...prevFiles, ...newFiles])
    }
  }

  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prevFiles) => prevFiles.filter((_, i) => i !== index))
  }

  const handleUpload = async () => {
    if (!patientId || selectedFiles.length === 0) {
      alert("Per favore inserisci l'ID paziente e seleziona almeno un file.")
      return
    }

    setUploading(true)
    setUploadProgress(0)
    setUploadComplete(false)

    const totalFiles = selectedFiles.length
    for (let i = 0; i < totalFiles; i++) {
      const file = selectedFiles[i]
      try {
        await uploadDocument(file, patientId)
        setUploadProgress(((i + 1) / totalFiles) * 100)
      } catch (error) {
        console.error("Upload error:", error)
        alert(`Errore durante il caricamento di ${file.name}. Riprova.`)
        setUploading(false)
        return
      }
    }

    setUploadComplete(true)
    setTimeout(() => {
      router.push(`/patient/${patientId}`)
    }, 1500)
  }

  return (
    <div className="min-h-screen bg-secondary">
      <HospitalHeader />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="container mx-auto px-4 py-8"
      >
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Torna alla Dashboard
          </Link>
        </div>

        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Carica Nuovi Documenti</CardTitle>
              <CardDescription>Compila i dettagli e carica i file PDF da analizzare.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="patient-id">ID Paziente / Cartella Clinica</Label>
                <Input
                  id="patient-id"
                  placeholder="es. 001, 002, 003..."
                  value={patientId}
                  onChange={(e) => setPatientId(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>File PDF</Label>
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    dragActive ? "border-primary bg-secondary" : "border-border hover:border-primary/50"
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <div className="space-y-2">
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                    <p className="font-medium">Trascina i file PDF qui</p>
                    <p className="text-sm text-muted-foreground">oppure</p>
                    <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                      <FileText className="mr-2 h-4 w-4" />
                      Seleziona File
                    </Button>
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                  multiple
                />
              </div>

              <AnimatePresence>
                {selectedFiles.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-2"
                  >
                    <Label>File selezionati</Label>
                    <div className="space-y-2 max-h-48 overflow-y-auto p-1">
                      {selectedFiles.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 border rounded-lg bg-background"
                        >
                          <div className="flex items-center gap-3 overflow-hidden">
                            <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                            <span className="text-sm font-medium truncate" title={file.name}>
                              {file.name}
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="flex-shrink-0"
                            onClick={() => handleRemoveFile(index)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {uploading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-2"
                  >
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {uploadComplete ? (
                          <span className="flex items-center text-green-600">
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Caricamento completato!
                          </span>
                        ) : (
                          `Caricamento in corso... (${Math.round(
                            (uploadProgress / 100) * selectedFiles.length,
                          )}/${selectedFiles.length})`
                        )}
                      </span>
                      <span>{Math.round(uploadProgress)}%</span>
                    </div>
                    <Progress value={uploadProgress} />
                  </motion.div>
                )}
              </AnimatePresence>

              <Button
                onClick={handleUpload}
                disabled={!patientId || selectedFiles.length === 0 || uploading}
                className="w-full"
                size="lg"
              >
                {uploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    <span>Elaborazione...</span>
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Carica e Analizza ({selectedFiles.length})
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </div>
  )
}
