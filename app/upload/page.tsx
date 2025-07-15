"use client"

import type React from "react"
import { useState, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Upload, FileText, ArrowLeft, Loader2, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"

const documentTypes = [
  { value: "lettera_dimissione", label: "Lettera di Dimissione", icon: "📋" },
  { value: "referto_laboratorio", label: "Referto di Laboratorio", icon: "🧪" },
  { value: "visita_specialistica", label: "Visita Specialistica", icon: "👨‍⚕️" },
  { value: "radiologia", label: "Referto Radiologico", icon: "🩻" },
  { value: "altro", label: "Altro", icon: "📄" },
]

export default function UploadPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [patientId, setPatientId] = useState(searchParams.get("patient_id") || "")
  const [documentType, setDocumentType] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
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

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      if (file.type === "application/pdf") {
        setSelectedFile(file)
      } else {
        alert("Per favore seleziona solo file PDF")
      }
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      if (file.type === "application/pdf") {
        setSelectedFile(file)
      } else {
        alert("Per favore seleziona solo file PDF")
      }
    }
  }

  const handleUpload = async () => {
    if (!patientId || !documentType || !selectedFile) {
      alert("Per favore compila tutti i campi")
      return
    }

    setUploading(true)
    setUploadProgress(0)

    try {
      const formData = new FormData()
      formData.append("file", selectedFile)
      formData.append("patient_id", patientId)
      formData.append("document_type", documentType)

      // Simulate progress with more realistic steps
      const progressSteps = [10, 25, 45, 65, 80, 95, 100]
      for (let i = 0; i < progressSteps.length; i++) {
        await new Promise((resolve) => setTimeout(resolve, 300))
        setUploadProgress(progressSteps[i])
      }

      const response = await fetch("/api/upload-document", {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        const result = await response.json()
        setUploadComplete(true)
        setTimeout(() => {
          router.push(`/editor/${result.document_id}`)
        }, 1500)
      } else {
        throw new Error("Upload failed")
      }
    } catch (error) {
      console.error("Upload error:", error)
      alert("Errore durante il caricamento. Riprova.")
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const selectedDocType = documentTypes.find((type) => type.value === documentType)

  return (
    <div className="min-h-screen bg-alfieri-gradient-soft">
      {/* Hospital Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="glass border-b border-gray-200 mb-8 sticky top-0 z-50"
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <motion.img
              src="/fondazione-alfieri-logo.png"
              alt="Fondazione Alfieri"
              className="h-12 w-auto"
              whileHover={{ scale: 1.05 }}
            />
            <div className="hidden sm:block">
              <h2 className="text-lg font-bold text-gray-900">Sistema Gestione Documenti Clinici</h2>
              <p className="text-sm text-alfieri-purple font-medium">Fondazione Alfieri</p>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <Link href="/" className="inline-flex items-center text-alfieri-pink hover:text-pink-700 mb-6 hover-lift">
            <ArrowLeft className="h-5 w-5 mr-2" />
            <span className="font-medium">Torna alla Dashboard</span>
          </Link>
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-alfieri-gradient mb-4">Carica Nuovo Documento</h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Carica un documento PDF per estrarre automaticamente le entità cliniche con AI
            </p>
          </div>
        </motion.div>

        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <Card className="card-alfieri border-gray-200">
              <CardHeader className="text-center pb-6">
                <div className="w-16 h-16 bg-alfieri-gradient rounded-full flex items-center justify-center mx-auto mb-4">
                  <Upload className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-2xl text-alfieri-gradient">Informazioni Documento</CardTitle>
                <CardDescription className="text-lg">Compila i dettagli del documento da analizzare</CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                {/* Patient ID */}
                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="space-y-3"
                >
                  <Label htmlFor="patient-id" className="text-lg font-semibold text-gray-700">
                    ID Paziente / Cartella Clinica
                  </Label>
                  <Input
                    id="patient-id"
                    placeholder="es. 001, 002, 003..."
                    value={patientId}
                    onChange={(e) => setPatientId(e.target.value)}
                    className="glass border-gray-200 focus:border-alfieri-purple text-lg py-3"
                  />
                </motion.div>

                {/* Document Type */}
                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="space-y-3"
                >
                  <Label htmlFor="document-type" className="text-lg font-semibold text-gray-700">
                    Tipo Documento
                  </Label>
                  <Select value={documentType} onValueChange={setDocumentType}>
                    <SelectTrigger className="glass border-gray-200 focus:border-alfieri-purple text-lg py-3">
                      <SelectValue placeholder="Seleziona il tipo di documento" />
                    </SelectTrigger>
                    <SelectContent>
                      {documentTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value} className="text-lg py-3">
                          <div className="flex items-center space-x-3">
                            <span className="text-xl">{type.icon}</span>
                            <span>{type.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedDocType && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center space-x-2 text-alfieri-purple"
                    >
                      <span className="text-lg">{selectedDocType.icon}</span>
                      <span className="font-medium">{selectedDocType.label} selezionato</span>
                    </motion.div>
                  )}
                </motion.div>

                {/* File Upload */}
                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="space-y-3"
                >
                  <Label className="text-lg font-semibold text-gray-700">File PDF</Label>
                  <div
                    className={`border-3 border-dashed rounded-xl p-12 text-center transition-all duration-300 ${
                      dragActive
                        ? "border-black bg-gray-100 scale-105"
                        : selectedFile
                          ? "border-black bg-gray-100"
                          : "border-gray-300 glass hover:border-black hover:bg-gray-100"
                    }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                  >
                    <AnimatePresence mode="wait">
                      {selectedFile ? (
                        <motion.div
                          key="file-selected"
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.8, opacity: 0 }}
                          className="space-y-4"
                        >
                          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                            <CheckCircle className="h-10 w-10 text-green-600" />
                          </div>
                          <div>
                            <p className="text-xl font-bold text-green-700 mb-2">{selectedFile.name}</p>
                            <p className="text-lg text-gray-600 mb-4">
                              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                            <Button
                              variant="outline"
                              onClick={() => setSelectedFile(null)}
                              className="btn-alfieri-outline"
                            >
                              Rimuovi File
                            </Button>
                          </div>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="file-upload"
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.8, opacity: 0 }}
                          className="space-y-6"
                        >
                          <div className="w-20 h-20 bg-alfieri-gradient rounded-full flex items-center justify-center mx-auto animate-float">
                            <Upload className="h-10 w-10 text-white" />
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-gray-700 mb-2">Trascina il file PDF qui</p>
                            <p className="text-lg text-gray-500 mb-6">oppure clicca per selezionare</p>
                            <Button
                              variant="outline"
                              onClick={() => fileInputRef.current?.click()}
                              className="btn-alfieri-outline text-lg px-8 py-3"
                            >
                              <FileText className="mr-2 h-5 w-5" />
                              Seleziona File
                            </Button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  <input ref={fileInputRef} type="file" accept=".pdf" onChange={handleFileSelect} className="hidden" />
                </motion.div>

                {/* Upload Progress */}
                <AnimatePresence>
                  {uploading && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="space-y-4 p-6 bg-gray-50 rounded-xl"
                    >
                      <div className="flex items-center justify-between text-lg font-medium">
                        <span className="text-gray-700">
                          {uploadComplete ? "Caricamento completato!" : "Caricamento in corso..."}
                        </span>
                        <span className="text-alfieri-pink">{uploadProgress}%</span>
                      </div>
                      <Progress value={uploadProgress} className="h-3" />
                      {uploadComplete && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="flex items-center justify-center text-green-600"
                        >
                          <CheckCircle className="h-6 w-6 mr-2" />
                          <span className="font-medium">Reindirizzamento all'editor...</span>
                        </motion.div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Upload Button */}
                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.6 }}>
                  <Button
                    onClick={handleUpload}
                    disabled={!patientId || !documentType || !selectedFile || uploading}
                    className="w-full btn-alfieri text-xl py-6 disabled:opacity-50 hover-glow"
                    size="lg"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                        Elaborazione AI in corso...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-3 h-6 w-6" />
                        Carica e Analizza con AI
                      </>
                    )}
                  </Button>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
