"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, FileText, Calendar, Download, Eye, Plus, Trash } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { motion } from "framer-motion"
import { fetchPatientDetail, deleteDocument } from "@/lib/api"
import { getDocumentId } from "@/lib/utils";

interface Document {
  id: string
  filename: string
  document_type: string
  upload_date: string
  entities_count: number
  status: "processed" | "processing" | "error"
}

interface PatientData {
  id: string
  name: string
  documents: Document[]
}

export default function PatientPage() {
  const params = useParams()
  const router = useRouter()
  const patientId = params.id as string

  const [patientData, setPatientData] = useState<PatientData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const loadPatient = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchPatientDetail(patientId)
      setPatientData(data)
    } catch (err: any) {
      setError(err.message || "Errore caricamento paziente")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (patientId) void loadPatient()
  }, [patientId])

  const getDocumentTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      lettera_dimissione: "Lettera di Dimissione",
      referto_laboratorio: "Referto di Laboratorio",
      visita_specialistica: "Visita Specialistica",
      radiologia: "Referto Radiologico",
      altro: "Altro",
    }
    return types[type] || type
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "processed":
        return <Badge className="bg-green-100 text-green-800">Elaborato</Badge>
      case "processing":
        return <Badge className="bg-yellow-100 text-yellow-800">In elaborazione</Badge>
      case "error":
        return <Badge className="bg-red-100 text-red-800">Errore</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const handleDelete = async (documentId: string) => {
    const confirmed = window.confirm("Sei sicuro di voler eliminare questo documento? L'azione è irreversibile.")
    if (!confirmed) return
    try {
      setDeletingId(documentId)
      const res = await deleteDocument(documentId)
      if (res.patient_deleted) {
        router.push("/")
      } else {
        await loadPatient()
      }
    } catch (e: any) {
      alert(e.message || "Errore durante l'eliminazione")
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-alfieri-gradient-light flex items-center justify-center">
        <span className="text-lg">Caricamento paziente...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-alfieri-gradient-light flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{error}</h2>
          <Link href="/">
            <Button>Torna alla Dashboard</Button>
          </Link>
        </div>
      </div>
    )
  }

  if (!patientData) {
    return (
      <div className="min-h-screen bg-alfieri-gradient-light flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Paziente non trovato</h2>
          <Link href="/">
            <Button>Torna alla Dashboard</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-alfieri-gradient-light">
      {/* Hospital Header */}
      <div className="bg-white/90 backdrop-blur-sm border-b border-primary-200 mb-8">
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
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="mb-8">
          <Link href="/" className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Torna alla Dashboard
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-alfieri-gradient bg-clip-text text-transparent mb-2">
                Cartella Clinica - {patientData.name}
              </h1>
              <p className="text-gray-600">
                ID Paziente: {patientData.id} • {patientData.documents.length} documenti
              </p>
            </div>
            <Link href={`/upload?patient_id=${patientData.id}`}>
              <Button className="bg-black text-white hover:bg-neutral-800">
                <Plus className="mr-2 h-4 w-4" />
                Aggiungi Documento
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Documents List */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="space-y-4"
        >
          {patientData.documents.map((document, index) => (
            <motion.div
              key={document.id}
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="p-3 bg-primary-100 rounded-lg">
                        <FileText className="h-6 w-6 text-primary-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">{document.filename}</h3>
                        <p className="text-gray-600 mb-2">{getDocumentTypeLabel(document.document_type)}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {new Date(document.upload_date).toLocaleDateString("it-IT")}
                          </div>
                          <div>{document.entities_count} entità estratte</div>
                          {getStatusBadge(document.status)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Link href={`/editor/${getDocumentId(patientData.id, document.document_type, document.filename)}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          Visualizza
                        </Button>
                      </Link>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(document.id)}
                        disabled={deletingId === document.id}
                        aria-disabled={deletingId === document.id}
                        title="Elimina documento"
                      >
                        <Trash className="h-4 w-4 mr-1" />
                        {deletingId === document.id ? "Eliminazione..." : "Elimina"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {patientData.documents.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nessun documento trovato</h3>
            <p className="text-gray-600 mb-4">Inizia caricando il primo documento per questo paziente</p>
            <Link href={`/upload?patient_id=${patientData.id}`}>
              <Button className="bg-alfieri-gradient hover:opacity-90">
                <Plus className="mr-2 h-4 w-4" />
                Carica Primo Documento
              </Button>
            </Link>
          </motion.div>
        )}
      </div>
    </div>
  )
}
