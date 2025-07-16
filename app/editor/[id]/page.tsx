"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Save, Edit3, FileText, Plus, Trash2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Document, Page, pdfjs } from "react-pdf"
import "react-pdf/dist/Page/AnnotationLayer.css"
import "react-pdf/dist/Page/TextLayer.css"
import { HospitalHeader } from "@/components/hospital-header"

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`

interface Entity {
  id: string
  type: string
  value: string
  confidence: number
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
  const [editingEntity, setEditingEntity] = useState<{ id: string; type: string; value: string } | null>(null)
  const [saving, setSaving] = useState(false)
  const [numPages, setNumPages] = useState<number>(0)

  useEffect(() => {
    const fetchDocumentData = async () => {
      // Mock data for demo
      const mockData: DocumentData = {
        id: documentId,
        patient_id: "001",
        document_type: "lettera_dimissione",
        filename: "dimissione_mario_rossi.pdf",
        pdf_path: "/placeholder.pdf",
        entities: [
          { id: "1", type: "Paziente", value: "Mario Rossi", confidence: 0.95 },
          { id: "2", type: "Data Nascita", value: "15/03/1975", confidence: 0.88 },
          { id: "3", type: "Diagnosi Principale", value: "Infarto miocardico acuto", confidence: 0.92 },
          { id: "4", type: "Terapia", value: "Aspirina 100mg, Atorvastatina 20mg", confidence: 0.85 },
          { id: "5", type: "Data Dimissione", value: "20/01/2024", confidence: 0.98 },
        ],
      }
      setDocumentData(mockData)
      setEntities(mockData.entities)
    }
    fetchDocumentData()
  }, [documentId])

  const handleStartEdit = (entity: Entity) => {
    setEditingEntity({ id: entity.id, type: entity.type, value: entity.value })
  }

  const handleCancelEdit = () => {
    setEditingEntity(null)
  }

  const handleConfirmEdit = () => {
    if (!editingEntity) return
    setEntities((prev) =>
      prev.map((entity) =>
        entity.id === editingEntity.id ? { ...entity, type: editingEntity.type, value: editingEntity.value } : entity,
      ),
    )
    setEditingEntity(null)
  }

  const handleAddEntity = () => {
    const newEntity: Entity = {
      id: Date.now().toString(),
      type: "Nuova Entità",
      value: "",
      confidence: 1.0,
    }
    setEntities((prev) => [...prev, newEntity])
    handleStartEdit(newEntity)
  }

  const handleDeleteEntity = (entityId: string) => {
    setEntities((prev) => prev.filter((entity) => entity.id !== entityId))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000)) // Simulate API call
      console.log("Saving data:", { document_id: documentId, entities })
      router.push("/")
    } catch (error) {
      console.error("Save error:", error)
    } finally {
      setSaving(false)
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300"
    if (confidence >= 0.7) return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300"
    return "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300"
  }

  if (!documentData) {
    return (
      <div className="min-h-screen bg-secondary flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
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
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link
              href="/"
              className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-2"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Torna alla Dashboard
            </Link>
            <h1 className="text-3xl font-bold">Editor Entità</h1>
            <p className="text-muted-foreground">{documentData.filename}</p>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Salva Modifiche
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Documento PDF
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-auto max-h-[70vh]">
                <Document file={documentData.pdf_path} onLoadSuccess={({ numPages }) => setNumPages(numPages)}>
                  {Array.from(new Array(numPages), (el, index) => (
                    <Page key={`page_${index + 1}`} pageNumber={index + 1} />
                  ))}
                </Document>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <Edit3 className="h-5 w-5 mr-2" />
                  Entità Estratte
                </CardTitle>
                <Button onClick={handleAddEntity} variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Aggiungi
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[65vh] overflow-y-auto pr-2">
                <AnimatePresence>
                  {entities.map((entity) => (
                    <motion.div
                      key={entity.id}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="p-3 border rounded-lg"
                    >
                      {editingEntity?.id === entity.id ? (
                        <div className="space-y-2">
                          <Input
                            placeholder="Tipo entità"
                            value={editingEntity.type}
                            onChange={(e) => setEditingEntity({ ...editingEntity, type: e.target.value })}
                          />
                          <Input
                            placeholder="Valore"
                            value={editingEntity.value}
                            onChange={(e) => setEditingEntity({ ...editingEntity, value: e.target.value })}
                          />
                          <div className="flex justify-end gap-2 pt-2">
                            <Button variant="ghost" size="sm" onClick={handleCancelEdit}>
                              Annulla
                            </Button>
                            <Button size="sm" onClick={handleConfirmEdit}>
                              Conferma
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div>
                            <Label className="font-medium">{entity.type}</Label>
                            <p className="text-muted-foreground">{entity.value || "N/A"}</p>
                          </div>
                          <div className="flex items-center gap-1">
                            <Badge variant="secondary" className={getConfidenceColor(entity.confidence)}>
                              {Math.round(entity.confidence * 100)}%
                            </Badge>
                            <Button size="icon" variant="ghost" onClick={() => handleStartEdit(entity)}>
                              <Edit3 className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="text-destructive"
                              onClick={() => handleDeleteEntity(entity.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </div>
  )
}
