"use client"

import { useState, useEffect } from "react"
import { Plus, FileText, Calendar, User, Search, Upload, Activity, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { motion } from "framer-motion"

interface Patient {
  id: string
  name: string
  documents_count: number
  last_document_date: string
}

export default function Dashboard() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    fetchPatients()
  }, [])

  const fetchPatients = async () => {
    try {
      const response = await fetch("/api/existing-patients")
      if (response.ok) {
        const data = await response.json()
        setPatients(data)
      }
    } catch (error) {
      console.error("Error fetching patients:", error)
      // Mock data for demo
      setPatients([
        {
          id: "001",
          name: "Mario Rossi",
          documents_count: 3,
          last_document_date: "2024-01-15",
        },
        {
          id: "002",
          name: "Anna Verdi",
          documents_count: 1,
          last_document_date: "2024-01-10",
        },
        {
          id: "003",
          name: "Giuseppe Bianchi",
          documents_count: 5,
          last_document_date: "2024-01-20",
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const filteredPatients = patients.filter(
    (patient) => patient.name.toLowerCase().includes(searchTerm.toLowerCase()) || patient.id.includes(searchTerm),
  )

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  }

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 12,
      },
    },
  }

  const cardHoverVariants = {
    hover: {
      scale: 1.02,
      y: -5,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 20,
      },
    },
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-alfieri-gradient-soft flex items-center justify-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <div className="spinner-alfieri mx-auto mb-4" />
          <p className="text-alfieri-purple font-medium">Caricamento dashboard...</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-alfieri-gradient-soft">
      {/* Hospital Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="glass border-b border-gray-200 mb-8 sticky top-0 z-50"
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <motion.img
                src="/fondazione-alfieri-logo.png"
                alt="Fondazione Alfieri"
                className="h-12 w-auto"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300 }}
              />
              <div className="hidden sm:block">
                <h2 className="text-lg font-bold text-gray-900">Sistema Gestione Documenti Clinici</h2>
                <p className="text-sm text-alfieri-purple font-medium">Fondazione Alfieri</p>
              </div>
            </div>
            <motion.div
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-right"
            >
              <p className="text-sm text-gray-700 font-medium">Benvenuto, Dr. Rossi</p>
              <p className="text-xs text-alfieri-indigo">{new Date().toLocaleDateString("it-IT")}</p>
            </motion.div>
          </div>
        </div>
      </motion.div>

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="mb-12 text-center"
        >
          <h1 className="text-5xl font-bold text-alfieri-gradient mb-4 animate-gradient-x bg-[length:200%_auto]">
            Dashboard Clinica
          </h1>
          <p className="text-xl text-gray-700 max-w-2xl mx-auto">
            Gestisci e analizza i documenti clinici dei tuoi pazienti con intelligenza artificiale
          </p>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12"
        >
          <motion.div variants={itemVariants} whileHover={cardHoverVariants.hover}>
            <Card className="card-alfieri border-gray-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-semibold text-gray-700">Pazienti Totali</CardTitle>
                <div className="p-2 bg-pink-100 rounded-lg">
                  <User className="h-5 w-5 text-alfieri-pink" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-alfieri-pink mb-1">{patients.length}</div>
                <p className="text-xs text-gray-600 flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                  +12% dal mese scorso
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants} whileHover={cardHoverVariants.hover}>
            <Card className="card-alfieri border-gray-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-semibold text-gray-700">Documenti Totali</CardTitle>
                <div className="p-2 bg-purple-100 rounded-lg">
                  <FileText className="h-5 w-5 text-alfieri-purple" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-alfieri-purple mb-1">
                  {patients.reduce((sum, p) => sum + p.documents_count, 0)}
                </div>
                <p className="text-xs text-gray-600 flex items-center">
                  <Activity className="h-3 w-3 mr-1 text-alfieri-purple" />
                  Tutti elaborati
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants} whileHover={cardHoverVariants.hover}>
            <Card className="card-alfieri border-gray-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-semibold text-gray-700">Ultimo Caricamento</CardTitle>
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Calendar className="h-5 w-5 text-alfieri-indigo" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-alfieri-indigo mb-1">Oggi</div>
                <p className="text-xs text-gray-600">Alle 14:30</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants} whileHover={cardHoverVariants.hover}>
            <Card className="card-alfieri border-gray-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-semibold text-gray-700">Entità Estratte</CardTitle>
                <div className="p-2 bg-green-100 rounded-lg">
                  <Activity className="h-5 w-5 text-green-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600 mb-1">247</div>
                <p className="text-xs text-gray-600">Questa settimana</p>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="flex flex-col sm:flex-row gap-6 mb-12"
        >
          <Link href="/upload" className="flex-1">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button className="w-full btn-alfieri text-lg py-6 hover-glow">
                <Upload className="mr-3 h-6 w-6" />
                Carica Nuovo Documento
              </Button>
            </motion.div>
          </Link>

          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              placeholder="Cerca paziente per nome o ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 py-6 text-lg glass border-gray-200 focus:border-alfieri-purple focus:ring-alfieri-purple"
            />
          </div>
        </motion.div>

        {/* Patients List */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {filteredPatients.map((patient, index) => (
            <motion.div key={patient.id} variants={itemVariants} whileHover={cardHoverVariants.hover} className="group">
              <Card className="card-alfieri border-gray-200 overflow-hidden">
                <div className="h-2 bg-alfieri-gradient"></div>
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl group-hover:text-alfieri-pink transition-colors duration-200">
                      {patient.name}
                    </CardTitle>
                    <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">ID: {patient.id}</Badge>
                  </div>
                  <CardDescription className="text-gray-600">Cartella clinica #{patient.id}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center text-alfieri-purple">
                      <FileText className="h-4 w-4 mr-2" />
                      <span className="font-medium">{patient.documents_count} documenti</span>
                    </div>
                    <div className="flex items-center text-alfieri-indigo">
                      <Calendar className="h-4 w-4 mr-2" />
                      <span>{new Date(patient.last_document_date).toLocaleDateString("it-IT")}</span>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Link href={`/patient/${patient.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full btn-alfieri-outline bg-transparent">
                        <FileText className="h-4 w-4 mr-2" />
                        Visualizza
                      </Button>
                    </Link>
                    <Link href={`/upload?patient_id=${patient.id}`} className="flex-1">
                      <Button size="sm" className="w-full bg-alfieri-gradient hover:opacity-90 hover-lift">
                        <Plus className="h-4 w-4 mr-2" />
                        Aggiungi
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {filteredPatients.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center py-16"
          >
            <div className="max-w-md mx-auto">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <FileText className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Nessun paziente trovato</h3>
              <p className="text-gray-600 mb-8">
                {searchTerm ? "Prova a modificare i criteri di ricerca" : "Inizia caricando il primo documento"}
              </p>
              <Link href="/upload">
                <Button className="btn-alfieri hover-glow">
                  <Upload className="mr-2 h-5 w-5" />
                  Carica Primo Documento
                </Button>
              </Link>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
