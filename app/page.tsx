"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Plus, User, FileText, Upload, Users, FileStack, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { HospitalHeader } from "@/components/hospital-header"
import { fetchPatients } from "@/lib/api"
import { exportExcel } from "@/lib/api"

interface Patient {
  id: string
  name: string
  last_document_date: string
  document_count: number
}

export default function DashboardPage() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const handleExport = async () => {
    try {
      const blob = await exportExcel()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "dati_clinici.xlsx"
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (err: any) {
      console.error(err)
      alert(err.message || "Errore durante l'esportazione Excel")
    }
  }  

  useEffect(() => {
    const loadPatients = async () => {
      try {
        const data = await fetchPatients()
        setPatients(data)
      } catch (err: any) {
        setError(err.message || "Errore caricamento pazienti")
      } finally {
        setLoading(false)
      }
    }
    loadPatients()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black">
        <span className="text-lg">Caricamento pazienti...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black">
        <span className="text-lg text-red-600">{error}</span>
      </div>
    )
  }

  const filteredPatients = patients.filter((patient) => patient.name.toLowerCase().includes(searchTerm.toLowerCase()))

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  }

  const totalPatients = patients.length
  const totalDocuments = patients.reduce((acc, patient) => acc + patient.document_count, 0)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      <HospitalHeader />
      <main className="container mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold">Dashboard Pazienti</h1>
              <p className="text-muted-foreground">Visualizza e gestisci i documenti clinici.</p>
            </div>
            <Link href="/upload">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Carica Documento
              </Button>
            </Link>
            <Button onClick={handleExport}>
              <FileStack className="h-4 w-4 mr-2" />
              Esporta Excel
            </Button>
          </div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
          >
            <motion.div variants={itemVariants}>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pazienti Totali</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalPatients}</div>
                  <p className="text-xs text-muted-foreground">Pazienti registrati nel sistema</p>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div variants={itemVariants}>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Documenti Totali</CardTitle>
                  <FileStack className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalDocuments}</div>
                  <p className="text-xs text-muted-foreground">Documenti archiviati in totale</p>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div variants={itemVariants}>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Aggiunti di Recente</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">+3</div>
                  <p className="text-xs text-muted-foreground">Documenti caricati questa settimana</p>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>

          <div className="mb-8">
            <Input
              placeholder="Cerca paziente per nome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {filteredPatients.map((patient) => (
            <motion.div key={patient.id} variants={itemVariants}>
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <User className="h-6 w-6" />
                    <span>{patient.name}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground space-y-2">
                    <p>ID Paziente: {patient.id}</p>
                    <p>Documenti totali: {patient.document_count}</p>
                    <p>Ultimo caricamento: {new Date(patient.last_document_date).toLocaleDateString()}</p>
                  </div>
                  <div className="flex gap-3 pt-4 mt-4 border-t">
                    <Link href={`/patient/${patient.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full bg-transparent">
                        <FileText className="h-4 w-4 mr-2" />
                        Visualizza
                      </Button>
                    </Link>
                    <Link href={`/upload?patient_id=${patient.id}`} className="flex-1">
                      <Button variant="default" size="sm" className="w-full">
                        <Upload className="h-4 w-4 mr-2" />
                        Aggiungi
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </main>
    </div>
  )
}
