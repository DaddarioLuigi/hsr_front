"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Save, Download, Edit3, Plus, Trash2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { motion, AnimatePresence } from "framer-motion"
import { HospitalHeader } from "@/components/hospital-header"
import { fetchDocumentDetail, updateDocumentEntities } from "@/lib/api"

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
  pdf_path?: string
  pdfPath?: string
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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Compute PDF URL
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050"
  const docPath = documentData?.pdf_path ?? documentData?.pdfPath
  const pdfUrl = docPath ? `${API_BASE}${docPath}` : undefined

  // Load document data
  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await fetchDocumentDetail(documentId)
        setDocumentData(data)
        setEntities(data.entities)
      } catch (err: any) {
        setError(err.message || "Errore caricamento documento")
      } finally {
        setLoading(false)
      }
    }
    if (documentId) load()
  }, [documentId])

  // Handlers...
  const handleStartEdit = (e: Entity) =>
    setEditingEntity({ id: e.id, type: e.type, value: e.value })
  const handleCancelEdit = () => setEditingEntity(null)
  const handleConfirmEdit = () => {
    if (!editingEntity) return
    setEntities(prev =>
      prev.map(ent =>
        ent.id === editingEntity.id
          ? { ...ent, type: editingEntity.type, value: editingEntity.value }
          : ent
      )
    )
    setEditingEntity(null)
  }
  const handleAddEntity = () => {
    const newEnt: Entity = { id: Date.now().toString(), type: "Nuova Entità", value: "", confidence: 1.0 }
    setEntities(prev => [...prev, newEnt])
    handleStartEdit(newEnt)
  }
  const handleDeleteEntity = (id: string) => setEntities(prev => prev.filter(e => e.id !== id))

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      await updateDocumentEntities(documentId, entities)
      router.push("/")
    } catch (err: any) {
      setError(err.message || "Errore salvataggio entità")
    } finally {
      setSaving(false)
    }
  }

  const getConfidenceColor = (c: number) =>
    c >= 0.9
      ? "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300"
      : c >= 0.7
      ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300"
      : "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300"

  if (loading) {
    return (
      <div className="min-h-screen bg-secondary flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-secondary flex items-center justify-center">
        <span className="text-lg text-red-600">{error}</span>
      </div>
    )
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
            <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-2">
              <ArrowLeft className="h-4 w-4 mr-2" /> Torna alla Dashboard
            </Link>
            <h1 className="text-3xl font-bold">Editor Entità</h1>
            <p className="text-muted-foreground">{documentData.filename}</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Salva Modifiche
            </Button>
            {pdfUrl && (
              <Button asChild variant="outline" size="sm">
                <a href={pdfUrl} download>
                  <Download className="mr-2 h-4 w-4" />Scarica
                </a>
              </Button>
            )}
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <Edit3 className="h-5 w-5 mr-2" /> Entità Estratte
              </CardTitle>
              <Button onClick={handleAddEntity} variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-1" /> Aggiungi
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[65vh] overflow-y-auto pr-2">
              <AnimatePresence>
                {entities.map(ent => (
                  <motion.div
                    key={ent.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="p-3 border rounded-lg"
                  >
                    {editingEntity?.id === ent.id ? (
                      <>
                        <Input placeholder="Tipo entità" value={editingEntity.type} onChange={e => setEditingEntity({ ...editingEntity, type: e.target.value })} />
                        <Input placeholder="Valore" value={editingEntity.value} onChange={e => setEditingEntity({ ...editingEntity, value: e.target.value })} />
                        <div className="flex justify-end gap-2 pt-2">
                          <Button variant="ghost" size="sm" onClick={handleCancelEdit}>Annulla</Button>
                          <Button size="sm" onClick={handleConfirmEdit}>Conferma</Button>
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="font-medium">{ent.type}</Label>
                          <p className="text-muted-foreground">{ent.value || "N/A"}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Badge variant="secondary" className={getConfidenceColor(ent.confidence)}>{Math.round(ent.confidence * 100)}%</Badge>
                          <Button size="icon" variant="ghost" onClick={() => handleStartEdit(ent)}><Edit3 className="h-4 w-4" /></Button>
                          <Button size="icon" variant="ghost" className="text-destructive" onClick={() => handleDeleteEntity(ent.id)}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
