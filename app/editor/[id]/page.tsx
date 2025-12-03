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
import { PDFViewerWithHighlights } from "@/components/pdf-viewer-with-highlights"

interface Position {
  page: number
  x0: number
  y0: number
  x1: number
  y1: number
  width: number
  height: number
}

interface Entity {
  id: string
  type?: string
  value?: string
  confidence?: number
  position?: Position | null
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
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null)
  const [pdfPage, setPdfPage] = useState(1)

  // Compute PDF URL
  // Normalizza API_BASE per assicurarsi che abbia sempre il protocollo
  const getApiBase = () => {
    const envUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"
    let url = envUrl.trim()
    // Se non inizia con http:// o https://, aggiungi https://
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = `https://${url}`
    }
    // Rimuovi slash finale se presente
    url = url.replace(/\/+$/, "")
    return url
  }
  const API_BASE = getApiBase()
  // Usa pdf_path se disponibile, altrimenti costruisci il percorso
  // Se pdf_path è già un URL completo (inizia con http:// o https://), usalo direttamente
  // Se pdf_path contiene un dominio (es. clinicalaiclinicalfolders-production.up.railway.app), aggiungi https://
  const pdfUrl = documentData?.pdf_path 
      ? (() => {
        const path = documentData.pdf_path.trim()
        console.log("[PDF URL] pdf_path originale ricevuto:", path)
        // Se è già un URL completo, usalo direttamente
        if (path.startsWith('http://') || path.startsWith('https://')) {
          console.log("[PDF URL] Usando URL completo:", path)
          return path
        }
        // Se contiene un dominio (contiene punti e non inizia con /), aggiungi https://
        // Estrai il primo segmento (prima del primo /) per verificare se è un dominio
        const firstSegment = path.split('/')[0]
        console.log("[PDF URL] Primo segmento estratto:", firstSegment)
        
        // Verifica se sembra un dominio: deve contenere almeno un punto e avere un TLD valido
        // Pattern migliorato: supporta domini con sottodomini multipli
        // Esempi: example.com, sub.example.com, clinicalaiclinicalfolders-production.up.railway.app
        // Il pattern verifica che ci sia almeno un punto seguito da un TLD valido (almeno 2 caratteri)
        const domainPattern = /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/
        const looksLikeDomain = domainPattern.test(firstSegment)
        console.log("[PDF URL] Pattern match dominio?", looksLikeDomain)
        
        // Controllo aggiuntivo: se contiene almeno due punti (suggerisce un dominio con sottodomini)
        // o se contiene "railway.app", "vercel.app", "netlify.app" etc (domini noti di hosting)
        const hasMultipleDots = (firstSegment.match(/\./g) || []).length >= 2
        const hasKnownHostingDomain = /\.(railway|vercel|netlify|heroku|aws|azure|gcp)\./.test(firstSegment)
        const definitelyDomain = looksLikeDomain || (hasMultipleDots && firstSegment.includes('.')) || hasKnownHostingDomain
        
        console.log("[PDF URL] Controlli aggiuntivi - Punti multipli:", hasMultipleDots, "Hosting noto:", hasKnownHostingDomain, "Definitivamente dominio:", definitelyDomain)
        
        if (definitelyDomain) {
          // È un dominio, crea URL assoluto con https://
          const absoluteUrl = `https://${path}`
          console.log("[PDF URL] Rilevato dominio, creando URL assoluto:", absoluteUrl)
          return absoluteUrl
        }
        // Altrimenti è un percorso relativo, aggiungi API_BASE
        // Assicurati che il percorso inizi con / se non c'è già
        const normalizedPath = path.startsWith('/') ? path : `/${path}`
        const relativeUrl = `${API_BASE}${normalizedPath}`
        console.log("[PDF URL] Percorso relativo, usando API_BASE:", relativeUrl)
        console.log("[PDF URL] API_BASE utilizzato:", API_BASE)
        // Verifica che l'URL sia assoluto
        if (!relativeUrl.startsWith('http://') && !relativeUrl.startsWith('https://')) {
          console.error("[PDF URL] ERRORE: URL costruito non è assoluto:", relativeUrl)
          // Forza https:// se manca
          return `https://${relativeUrl}`
        }
        return relativeUrl
      })()
    : documentData 
    ? (() => {
        const constructedUrl = `${API_BASE}/uploads/${documentData.patient_id}/${documentData.document_type}/${documentData.filename.replace(/\.[^/.]+$/, "")}.pdf`
        console.log(" [PDF URL] Costruito da dati documento:", constructedUrl)
        return constructedUrl
      })()
    : undefined

  // Load document data
  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await fetchDocumentDetail(documentId)
        console.log("Raw document data:", data)
        
        // Ensure data exists
        if (!data) {
          console.warn("No document data found")
          setDocumentData(null)
          setEntities([])
          return
        }
        
        // Normalize entities - normalizeEntities can handle both arrays and objects
        // If data.entities is an object (not an array), normalizeEntities will convert it
        const entitiesToNormalize = data.entities !== undefined ? data.entities : []
        console.log("Raw entities before normalization:", entitiesToNormalize)
        // normalizeEntities handles the case where input is not an array
        const normalized = normalizeEntities(entitiesToNormalize)
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
  const normalizeEntities = (entities: any): Entity[] => {
    console.log("normalizeEntities called with:", entities)
    
    if (!Array.isArray(entities)) {
      console.warn("entities is not an array:", entities)
      // Se entities non è un array, potrebbe essere un oggetto con molte chiavi
      // Convertiamolo in un array di entità
      if (entities && typeof entities === 'object' && entities !== null) {
        const keys = Object.keys(entities)
        if (keys.length > 0) {
          // Crea un'entità per ogni chiave
          return keys.map((key, index) => ({
            id: `entity-${index}`,
            type: key,
            value: typeof entities[key] === 'string' ? entities[key] : String(entities[key]),
            confidence: 1.0
          }))
        }
      }
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
      
      // Se entity.value è un oggetto, convertilo in stringa
      if (entity.value && typeof entity.value === 'object' && !Array.isArray(entity.value)) {
        console.log(`Entity ${index} has object value, converting...`)
        const valueKeys = Object.keys(entity.value)
        if (valueKeys.length > 0) {
          const valueStrings = valueKeys.map(key => {
            const val = entity.value[key]
            return `${key}: ${val !== null && val !== undefined ? String(val) : 'N/A'}`
          })
          return {
            id: entity.id || `entity-${index}`,
            type: entity.type || "Parametri Medici",
            value: valueStrings.join(", "),
            confidence: entity.confidence || 1.0,
            position: entity.position || null
          }
        }
      }
      
      // If entity is already in the correct format, ensure value is a string
      if (entity.id && entity.type !== undefined) {
        console.log(`Entity ${index} is already normalized`)
        return {
          ...entity,
          value: typeof entity.value === 'string' 
            ? entity.value 
            : entity.value !== null && entity.value !== undefined 
              ? String(entity.value) 
              : "N/A",
          confidence: entity.confidence || 1.0
        } as Entity
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
          confidence: entity.confidence || 1.0,
          position: entity.position || null
        }
      }
      
      // If entity is an object with cardiac parameters, convert it
      if (entity.AVA !== undefined || entity.AVAi !== undefined || entity.PVL !== undefined || 
          entity.bicuspide !== undefined || entity.gradiente_max !== undefined || 
          entity.gradiente_med !== undefined || entity.insufficienza !== undefined || 
          entity.stenosi !== undefined) {
        console.log(`Entity ${index} has cardiac parameters, converting...`)
        const values = []
        if (entity.AVA !== undefined) values.push(`AVA: ${entity.AVA}`)
        if (entity.AVAi !== undefined) values.push(`AVAi: ${entity.AVAi}`)
        if (entity.PVL !== undefined) values.push(`PVL: ${entity.PVL}`)
        if (entity.bicuspide !== undefined) values.push(`Bicuspide: ${entity.bicuspide}`)
        if (entity.gradiente_max !== undefined) values.push(`Gradiente Max: ${entity.gradiente_max}`)
        if (entity.gradiente_med !== undefined) values.push(`Gradiente Med: ${entity.gradiente_med}`)
        if (entity.insufficienza !== undefined) values.push(`Insufficienza: ${entity.insufficienza}`)
        if (entity.stenosi !== undefined) values.push(`Stenosi: ${entity.stenosi}`)
        
        return {
          id: entity.id || `entity-${index}`,
          type: "Parametri Cardiaci",
          value: values.join(", "),
          confidence: entity.confidence || 1.0,
          position: entity.position || null
        }
      }
      
      // Fallback for any other object structure
      console.log(`Entity ${index} using fallback conversion`)
      console.log(`Entity ${index} keys:`, Object.keys(entity))
      
      // If it's an object with multiple keys, convert all keys to readable format
      if (typeof entity === 'object' && entity !== null && !Array.isArray(entity)) {
        const keys = Object.keys(entity)
        // Escludi chiavi speciali che non sono valori
        const excludedKeys = ['id', 'type', 'confidence', 'position', 'value']
        const valueKeys = keys.filter(key => !excludedKeys.includes(key))
        
        if (valueKeys.length > 0) {
          const values = valueKeys.map(key => {
            const value = entity[key]
            // Convert camelCase to readable format
            const readableKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
            return `${readableKey}: ${value !== null && value !== undefined ? String(value) : 'N/A'}`
          })
          
          return {
            id: entity.id || `entity-${index}`,
            type: entity.type || "Parametri Medici",
            value: values.join(", "),
            confidence: entity.confidence || 1.0,
            position: entity.position || null
          }
        }
      }
      
      return {
        id: entity.id || `entity-${index}`,
        type: entity.type || "Entità",
        value: typeof entity.value === 'string' 
          ? entity.value 
          : entity.value !== null && entity.value !== undefined 
            ? String(entity.value) 
            : "N/A",
        confidence: entity.confidence || 1.0,
        position: entity.position || null
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
        className="w-full max-w-[95vw] mx-auto px-6 py-8"
      >
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-2">
              <ArrowLeft className="h-4 w-4 mr-2" /> Torna alla Dashboard
            </Link>
            <h1 className="text-3xl font-bold">Editor Entità</h1>
            <p className="text-muted-foreground">{documentData.filename}</p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
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

        {/* Layout a due colonne: PDF a sinistra, Entità a destra */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_0.9fr] xl:grid-cols-[1.5fr_1fr] gap-8 min-h-[calc(100vh-250px)]">
          {/* Colonna sinistra: PDF Viewer */}
          <div className="order-2 lg:order-1 self-start">
            {pdfUrl ? (
              <Card className="w-full">
                <CardHeader className="pb-3">
                  <CardTitle>Visualizzazione PDF</CardTitle>
                </CardHeader>
                <CardContent className="px-0 pb-4">
                  <PDFViewerWithHighlights
                    pdfUrl={pdfUrl}
                    entities={entities}
                    selectedEntityId={selectedEntityId}
                    onEntityClick={(entityId) => {
                      const entity = entities.find(e => e.id === entityId)
                      setSelectedEntityId(entityId === selectedEntityId ? null : entityId)
                      
                      // Se l'entità ha una posizione, cambia pagina
                      if (entity?.position?.page) {
                        setPdfPage(entity.position.page)
                      }
                      
                      // Scrolla all'entità nella lista
                      setTimeout(() => {
                        const element = document.getElementById(`entity-${entityId}`)
                        if (element) {
                          element.scrollIntoView({ behavior: "smooth", block: "center" })
                        }
                      }, 100)
                    }}
                    onPageChange={(page) => setPdfPage(page)}
                  />
                </CardContent>
              </Card>
            ) : (
              <Card className="h-full">
                <CardContent className="flex items-center justify-center h-full min-h-[400px]">
                  <p className="text-muted-foreground">PDF non disponibile</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Colonna destra: Entità Estratte */}
          <div className="order-1 lg:order-2">
            <Card className="h-full flex flex-col">
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
              <CardContent className="flex-1 overflow-hidden min-h-[600px]">
                <div className="space-y-3 h-full overflow-y-auto pr-3">
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
                      return (
                      <motion.div
                        id={`entity-${ent.id}`}
                        key={ent.id}
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className={`p-3 border rounded-lg transition-all ${
                          selectedEntityId === ent.id ? "ring-2 ring-blue-500 bg-blue-50" : ""
                        }`}
                        onClick={() => {
                          if (ent.position) {
                            setSelectedEntityId(ent.id === selectedEntityId ? null : ent.id)
                            // Se l'entità ha una posizione, cambia pagina se necessario
                            if (ent.position.page && ent.position.page !== pdfPage) {
                              setPdfPage(ent.position.page)
                            }
                          }
                        }}
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
                              <p className="text-muted-foreground">
                                {typeof ent.value === 'string' 
                                  ? ent.value 
                                  : ent.value !== null && ent.value !== undefined 
                                    ? String(ent.value) 
                                    : "N/A"}
                              </p>
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
          </div>
        </div>
      </motion.div>
    </div>
  )
}
