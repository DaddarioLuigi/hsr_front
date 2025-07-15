"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Save, Edit3, FileText, Check, X, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { motion } from "framer-motion"
import { Document, Page, pdfjs } from "react-pdf"
import "react-pdf/dist/Page/AnnotationLayer.css"
import "react-pdf/dist/Page/TextLayer.css"

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`

interface Entity {
  id: string
  type: string
  value: string
  confidence: number
  editable: boolean
}

interface DocumentData {
  id: string
  patient_id: string
  document_type: string
  filename: string
  pdf_path: string
  entities: Entity[]
}

export default function EditorPage() {
  const params = useParams()
  const router = useRouter()
  const documentId = params.id as string

  const [documentData, setDocumentData] = useState<DocumentData | null>(null)
  const [entities, setEntities] = useState<Entity[]>([])
  const [editingEntity, setEditingEntity] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [numPages, setNumPages] = useState<number>(0)
  const [pageNumber, setPageNumber] = useState(1)
  const [pdfScale, setPdfScale] = useState(1.0)

  useEffect(() => {
    fetchDocumentData()
  }, [documentId])

  const fetchDocumentData = async () => {
    try {
      // Mock data for demo - replace with actual API call
      const mockData: DocumentData = {
        id: documentId,
        patient_id: "001",
        document_type: "lettera_dimissione",
        filename: "dimissione_mario_rossi.pdf",
        pdf_path: "/placeholder.pdf",
        entities: [
          {
            id: "1",
            type: "Paziente",
            value: "Mario Rossi",
            confidence: 0.95,
            editable: true,
          },
          {
            id: "2",
            type: "Data Nascita",
            value: "15/03/1975",
            confidence: 0.88,
            editable: true,
          },
          {
            id: "3",
            type: "Diagnosi Principale",
            value: "Infarto miocardico acuto",
            confidence: 0.92,
            editable: true,
          },
          {
            id: "4",
            type: "Terapia",
            value: "Aspirina 100mg, Atorvastatina 20mg",
            confidence: 0.85,
            editable: true,
          },
          {
            id: "5",
            type: "Data Dimissione",
            value: "20/01/2024",
            confidence: 0.98,
            editable: true,
          },
        ],
      }

      setDocumentData(mockData)
      setEntities(mockData.entities)
    } catch (error) {
      console.error("Error fetching document data:", error)
    }
  }

  const handleEntityEdit = (entityId: string, newValue: string) => {
    setEntities((prev) => prev.map((entity) => (entity.id === entityId ? { ...entity, value: newValue } : entity)))
  }

  const handleAddEntity = () => {
    const newEntity: Entity = {
      id: Date.now().toString(),
      type: "Nuova Entità",
      value: "",
      confidence: 1.0,
      editable: true,
    }
    setEntities((prev) => [...prev, newEntity])
    setEditingEntity(newEntity.id)
  }

  const handleDeleteEntity = (entityId: string) => {
    setEntities((prev) => prev.filter((entity) => entity.id !== entityId))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch("/api/update-entities", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          document_id: documentId,
          entities: entities,
        }),
      })

      if (response.ok) {
        // Show success message
        setTimeout(() => {
          router.push("/")
        }, 1000)
      }
    } catch (error) {
      console.error("Save error:", error)
      alert("Errore durante il salvataggio")
    } finally {
      setSaving(false)
    }
  }

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages)
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return "bg-green-100 text-green-800"
    if (confidence >= 0.7) return "bg-yellow-100 text-yellow-800"
    return "bg-red-100 text-red-800"
  }

  if (!documentData) {
    return (
      <div className="min-h-screen bg-alfieri-gradient-light flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
          className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full"
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-alfieri-gradient-light">
      {/* Hospital Header */}
      <div className="bg-white/90 backdrop-blur-sm border-b border-primary-200 mb-6">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <img src="/fondazione-alfieri-logo.png" alt="Fondazione Alfieri" className="h-12 w-auto" />
            <div className="hidden sm:block">
              <h2 className="text-lg font-semibold text-gray-900">Sistema Gestione Documenti Clinici</h2>
              <p className="text-sm text-gray-600">Fondazione Alfieri</p>
            </div>
          </div>
        </div>
      </div>
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="mb-6">
          <Link href="/" className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Torna alla Dashboard
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold bg-alfieri-gradient bg-clip-text text-transparent mb-1">
                Editor Entità Cliniche
              </h1>
              <p className="text-gray-600">
                Paziente: {documentData.patient_id} • {documentData.filename}
              </p>
            </div>
            <Button onClick={handleSave} disabled={saving} className="bg-secondary-600 hover:bg-secondary-700">
              {saving ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                    className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full"
                  />
                  Salvataggio...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Salva Modifiche
                </>
              )}
            </Button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* PDF Viewer */}
          <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl h-fit">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-primary-600" />
                  Documento PDF
                </CardTitle>
                <CardDescription>{documentData.filename}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* PDF Controls */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPageNumber((prev) => Math.max(1, prev - 1))}
                        disabled={pageNumber <= 1}
                      >
                        ←
                      </Button>
                      <span className="text-sm">
                        Pagina {pageNumber} di {numPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPageNumber((prev) => Math.min(numPages, prev + 1))}
                        disabled={pageNumber >= numPages}
                      >
                        →
                      </Button>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPdfScale((prev) => Math.max(0.5, prev - 0.1))}
                      >
                        -
                      </Button>
                      <span className="text-sm">{Math.round(pdfScale * 100)}%</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPdfScale((prev) => Math.min(2, prev + 0.1))}
                      >
                        +
                      </Button>
                    </div>
                  </div>

                  {/* PDF Display */}
                  <div className="border rounded-lg overflow-hidden bg-white">
                    <Document
                      file="/placeholder.pdf"
                      onLoadSuccess={onDocumentLoadSuccess}
                      className="flex justify-center"
                    >
                      <Page pageNumber={pageNumber} scale={pdfScale} className="shadow-lg" />
                    </Document>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Entities Editor */}
          <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center">
                      <Edit3 className="h-5 w-5 mr-2 text-secondary-600" />
                      Entità Estratte
                    </CardTitle>
                    <CardDescription>Modifica le entità cliniche identificate</CardDescription>
                  </div>
                  <Button
                    onClick={handleAddEntity}
                    variant="outline"
                    size="sm"
                    className="bg-primary-50 hover:bg-primary-100"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Aggiungi
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-[600px] overflow-y-auto">
                  {entities.map((entity, index) => (
                    <motion.div
                      key={entity.id}
                      initial={{ y: 10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className="p-4 border rounded-lg bg-white/50 hover:bg-white/80 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Label className="font-medium text-gray-700">{entity.type}</Label>
                          <Badge variant="secondary" className={getConfidenceColor(entity.confidence)}>
                            {Math.round(entity.confidence * 100)}%
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-1">
                          {editingEntity === entity.id ? (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setEditingEntity(null)}
                                className="h-8 w-8 p-0 text-secondary-600 hover:text-green-700"
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setEditingEntity(null)}
                                className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setEditingEntity(entity.id)}
                                className="h-8 w-8 p-0 text-primary-600 hover:text-primary-700"
                              >
                                <Edit3 className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteEntity(entity.id)}
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>

                      {editingEntity === entity.id ? (
                        <div className="space-y-2">
                          <Input
                            value={entity.type}
                            onChange={(e) => handleEntityEdit(entity.id, entity.value)}
                            placeholder="Tipo entità"
                            className="text-sm"
                          />
                          <Input
                            value={entity.value}
                            onChange={(e) => handleEntityEdit(entity.id, e.target.value)}
                            placeholder="Valore"
                            className="font-medium"
                          />
                        </div>
                      ) : (
                        <p className="text-gray-900 font-medium">{entity.value || "Valore non specificato"}</p>
                      )}
                    </motion.div>
                  ))}
                </div>

                {entities.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Edit3 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>Nessuna entità trovata</p>
                    <Button onClick={handleAddEntity} variant="outline" className="mt-4 bg-transparent">
                      <Plus className="h-4 w-4 mr-2" />
                      Aggiungi Prima Entità
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
