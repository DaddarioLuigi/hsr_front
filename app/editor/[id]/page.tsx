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
  type?: string
  value?: string
  confidence?: number
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
        console.log("Raw document data:", data)
        
        // Ensure data.entities exists and is an array
        if (!data || !data.entities) {
          console.warn("No entities found in document data")
          setDocumentData(data)
          setEntities([])
          return
        }
        
        if (!Array.isArray(data.entities)) {
          console.warn("entities is not an array:", data.entities)
          setDocumentData(data)
          setEntities([])
          return
        }
        
        console.log("Raw entities before normalization:", data.entities)
        const normalized = normalizeEntities(data.entities)
        console.log("Normalized entities:", normalized)
        setDocumentData(data)
        setEntities(normalized)
      } catch (err: any) {
        console.error("Error loading document:", err)
        setError(err.message || "Errore caricamento documento")
      } finally {
        setLoading(false)
      }
    }
    if (documentId) load()
  }, [documentId])

  // Handlers...
  const handleStartEdit = (e: Entity) =>
    setEditingEntity({ id: e.id, type: e.type || "", value: e.value || "" })
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
      // Ensure all entities have the required structure before saving
      const normalizedEntities = entities.map(ent => ({
        id: ent.id,
        type: ent.type || "Entità",
        value: ent.value || "",
        confidence: ent.confidence || 1.0
      }))
      await updateDocumentEntities(documentId, normalizedEntities)
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

  // Normalize entity data to ensure consistent structure
  const normalizeEntities = (entities: any[]): Entity[] => {
    console.log("normalizeEntities called with:", entities)
    
    if (!Array.isArray(entities)) {
      console.warn("entities is not an array:", entities)
      return []
    }
    
    return entities.map((entity, index) => {
      console.log(`Processing entity ${index}:`, entity)
      
      // Handle null/undefined entities
      if (!entity || typeof entity !== 'object') {
        console.warn(`Entity ${index} is invalid:`, entity)
        return {
          id: `entity-${index}`,
          type: "Entità Invalida",
          value: "Dato non valido",
          confidence: 0.0
        }
      }
      
      // If entity is already in the correct format, return as is
      if (entity.id && entity.type && entity.value !== undefined && entity.confidence !== undefined) {
        console.log(`Entity ${index} is already normalized`)
        return entity as Entity
      }
      
      // If entity is an object with altezza, bmi, bsa, peso keys, convert it
      if (entity.altezza !== undefined || entity.bmi !== undefined || entity.bsa !== undefined || entity.peso !== undefined) {
        console.log(`Entity ${index} has physical parameters, converting...`)
        const values = []
        if (entity.altezza !== undefined) values.push(`Altezza: ${entity.altezza}`)
        if (entity.bmi !== undefined) values.push(`BMI: ${entity.bmi}`)
        if (entity.bsa !== undefined) values.push(`BSA: ${entity.bsa}`)
        if (entity.peso !== undefined) values.push(`Peso: ${entity.peso}`)
        
        return {
          id: entity.id || `entity-${index}`,
          type: "Parametri Fisici",
          value: values.join(", "),
          confidence: entity.confidence || 1.0
        }
      }
      
      // Fallback for any other object structure
      console.log(`Entity ${index} using fallback conversion`)
      return {
        id: entity.id || `entity-${index}`,
        type: entity.type || "Entità",
        value: typeof entity.value === 'string' ? entity.value : JSON.stringify(entity.value),
        confidence: entity.confidence || 1.0
      }
    })
  }

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
              <Button 
                onClick={() => {
                  const testEntities = [
                    { altezza: "170", bmi: "25", bsa: "1.8", peso: "70" },
                    { id: "test1", type: "Test", value: "Test Value", confidence: 0.9 }
                  ]
                  console.log("Testing normalization with:", testEntities)
                  const normalized = normalizeEntities(testEntities)
                  console.log("Normalized result:", normalized)
                  setEntities(normalized)
                }} 
                variant="outline" 
                size="sm"
              >
                Test Normalization
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[65vh] overflow-y-auto pr-2">
              {console.log("Rendering entities:", entities)}
              <AnimatePresence>
                {(() => {
                  try {
                    // Ensure entities is an array
                    if (!Array.isArray(entities)) {
                      console.warn("entities is not an array in render:", entities)
                      return (
                        <div className="p-4 text-red-600 border border-red-200 rounded-lg">
                          Errore: le entità non sono in un formato valido
                        </div>
                      )
                    }
                    
                    return entities.filter(ent => ent && typeof ent === 'object' && ent.id).map(ent => {
                      console.log("Rendering entity:", ent)
                      return (
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
                              <Label className="font-medium">{ent.type || "Entità"}</Label>
                              <p className="text-muted-foreground">{ent.value || "N/A"}</p>
                            </div>
                            <div className="flex items-center gap-1">
                              <Badge variant="secondary" className={getConfidenceColor(ent.confidence || 1.0)}>{Math.round((ent.confidence || 1.0) * 100)}%</Badge>
                              <Button size="icon" variant="ghost" onClick={() => handleStartEdit(ent)}><Edit3 className="h-4 w-4" /></Button>
                              <Button size="icon" variant="ghost" className="text-destructive" onClick={() => handleDeleteEntity(ent.id)}><Trash2 className="h-4 w-4" /></Button>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )})
                  } catch (error) {
                    console.error("Error rendering entities:", error)
                    return (
                      <div className="p-4 text-red-600 border border-red-200 rounded-lg">
                        Errore nel rendering delle entità: {error instanceof Error ? error.message : String(error)}
                      </div>
                    )
                  }
                })()}
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
