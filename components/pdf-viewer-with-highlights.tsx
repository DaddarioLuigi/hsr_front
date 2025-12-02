"use client"

import { useState, useCallback, useEffect } from "react"
import { Document, Page, pdfjs } from "react-pdf"
import "react-pdf/dist/Page/AnnotationLayer.css"
import "react-pdf/dist/Page/TextLayer.css"

// Configura worker per pdfjs - usa il worker locale dalla versione 5.3.31
if (typeof window !== "undefined") {
  // Usa il worker locale dalla stessa origine per evitare problemi CORS
  pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.5.3.31.min.js'
}

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

interface PDFViewerWithHighlightsProps {
  pdfUrl: string
  entities: Entity[]
  selectedEntityId?: string | null
  onEntityClick?: (entityId: string) => void
  onPageChange?: (page: number) => void
}

export function PDFViewerWithHighlights({
  pdfUrl,
  entities,
  selectedEntityId,
  onEntityClick,
  onPageChange
}: PDFViewerWithHighlightsProps) {
  const [numPages, setNumPages] = useState<number | null>(null)
  const [pageNumber, setPageNumber] = useState(1)
  const [scale, setScale] = useState(1.5)
  const [pageWidth, setPageWidth] = useState<number>(0)
  const [pdfFile, setPdfFile] = useState<string | ArrayBuffer | null>(null)
  const [loadingPdf, setLoadingPdf] = useState(true)
  
  // Carica il PDF come blob per evitare problemi CORS
  useEffect(() => {
    if (!pdfUrl) return
    
    setLoadingPdf(true)
    fetch(pdfUrl, {
      credentials: "include",
      mode: "cors"
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        return response.blob()
      })
      .then(blob => {
        const blobUrl = URL.createObjectURL(blob)
        setPdfFile(blobUrl)
        setLoadingPdf(false)
      })
      .catch(error => {
        console.error("Errore caricamento PDF:", error)
        setLoadingPdf(false)
      })
    
    // Cleanup: revoca l'URL quando il componente viene smontato
    return () => {
      if (pdfFile && typeof pdfFile === 'string' && pdfFile.startsWith('blob:')) {
        URL.revokeObjectURL(pdfFile)
      }
    }
  }, [pdfUrl])
  
  // Usa selectedEntityId per cambiare pagina automaticamente
  useEffect(() => {
    if (selectedEntityId) {
      const selectedEntity = entities.find(e => e.id === selectedEntityId)
      if (selectedEntity?.position?.page && selectedEntity.position.page !== pageNumber) {
        setPageNumber(selectedEntity.position.page)
        onPageChange?.(selectedEntity.position.page)
      }
    }
  }, [selectedEntityId, entities, pageNumber, onPageChange])

  // Gestione navigazione con frecce della tastiera
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Ignora se l'utente sta digitando in un input
      if (
        (event.target as HTMLElement)?.tagName === 'INPUT' ||
        (event.target as HTMLElement)?.tagName === 'TEXTAREA'
      ) {
        return
      }

      if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
        event.preventDefault()
        if (pageNumber > 1) {
          const newPage = pageNumber - 1
          setPageNumber(newPage)
          onPageChange?.(newPage)
        }
      } else if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
        event.preventDefault()
        if (numPages && pageNumber < numPages) {
          const newPage = pageNumber + 1
          setPageNumber(newPage)
          onPageChange?.(newPage)
        }
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => {
      window.removeEventListener('keydown', handleKeyPress)
    }
  }, [pageNumber, numPages, onPageChange])

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages)
  }

  const [pageDimensions, setPageDimensions] = useState<{ width: number; height: number } | null>(null)

  const onPageLoadSuccess = useCallback((page: any) => {
    // Ottieni le dimensioni della pagina al scale corrente
    const viewport = page.getViewport({ scale })
    setPageDimensions({ width: viewport.width, height: viewport.height })
    setPageWidth(viewport.width)
  }, [scale])

  // Aggiorna dimensioni quando cambia lo scale
  const handleScaleChange = (newScale: number) => {
    setScale(newScale)
  }

  // Filtra entità per pagina corrente
  const entitiesOnCurrentPage = entities.filter(
    (entity) => entity.position?.page === pageNumber
  )

  // Calcola le proporzioni per convertire coordinate PDF -> coordinate render
  const getHighlightStyle = (position: Position, pageDims: { width: number; height: number } | null) => {
    if (!position || !pageDims) return { display: 'none' }

    // pdfplumber restituisce coordinate in punti (1 punto = 1/72 pollice)
    // Le coordinate sono assolute rispetto alla pagina
    // Devo convertire in percentuali rispetto alle dimensioni renderizzate
    
    // Calcola le proporzioni basandoci sulle dimensioni reali della pagina PDF
    // Assumiamo che le coordinate siano relative alla pagina originale
    // Usiamo le dimensioni standard A4 (595x842 punti) come riferimento
    const pdfWidth = 595  // Larghezza A4 in punti
    const pdfHeight = 842 // Altezza A4 in punti
    
    // Calcola le proporzioni
    const leftPercent = (position.x0 / pdfWidth) * 100
    const topPercent = (position.y0 / pdfHeight) * 100
    const widthPercent = ((position.x1 - position.x0) / pdfWidth) * 100
    const heightPercent = ((position.y1 - position.y0) / pdfHeight) * 100
    
    return {
      position: "absolute" as const,
      left: `${leftPercent}%`,
      top: `${topPercent}%`,
      width: `${widthPercent}%`,
      height: `${heightPercent}%`,
      backgroundColor: "rgba(255, 235, 59, 0.3)", // Giallo semi-trasparente
      border: "2px solid rgba(255, 193, 7, 0.8)",
      borderRadius: "2px",
      cursor: "pointer",
      zIndex: 10,
      transition: "all 0.2s ease"
    }
  }

  return (
    <div className="w-full flex flex-col space-y-4">
      {/* Controlli */}
      <div className="flex items-center justify-between px-4 py-3 bg-white rounded-lg border shadow-sm flex-shrink-0">
        <div className="flex items-center gap-4">
            <button
              onClick={() => {
                const newPage = Math.max(1, pageNumber - 1)
                setPageNumber(newPage)
                onPageChange?.(newPage)
              }}
              disabled={pageNumber <= 1}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ← Precedente
            </button>
            <span className="text-sm text-gray-600">
              Pagina {pageNumber} di {numPages || "?"}
              <span className="ml-2 text-xs text-gray-400">
                (Usa le frecce ←→ per navigare)
              </span>
            </span>
            <button
              onClick={() => {
                const newPage = Math.min(numPages || 1, pageNumber + 1)
                setPageNumber(newPage)
                onPageChange?.(newPage)
              }}
              disabled={pageNumber >= (numPages || 1)}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Successiva →
            </button>
        </div>
        <div className="flex items-center gap-4">
          <label className="text-sm text-gray-600">
            Zoom:
            <select
              value={scale}
              onChange={(e) => handleScaleChange(parseFloat(e.target.value))}
              className="ml-2 px-2 py-1 border rounded"
            >
              <option value="0.5">50%</option>
              <option value="0.75">75%</option>
              <option value="1">100%</option>
              <option value="1.25">125%</option>
              <option value="1.5">150%</option>
              <option value="2">200%</option>
            </select>
          </label>
        </div>
      </div>

      {/* Visualizzatore PDF */}
      <div 
        className="relative bg-gray-50 rounded-lg border shadow-sm p-4 overflow-x-auto overflow-y-visible flex justify-center items-start"
        tabIndex={0}
        onKeyDown={(e) => {
          // Gestione eventi per il focus sul container
          if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
            e.preventDefault()
            if (pageNumber > 1) {
              const newPage = pageNumber - 1
              setPageNumber(newPage)
              onPageChange?.(newPage)
            }
          } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
            e.preventDefault()
            if (numPages && pageNumber < numPages) {
              const newPage = pageNumber + 1
              setPageNumber(newPage)
              onPageChange?.(newPage)
            }
          }
        }}
      >
        {loadingPdf ? (
          <div className="text-center py-8">Caricamento PDF...</div>
        ) : !pdfFile ? (
          <div className="text-center py-8 text-red-600">
            <p>Errore nel caricamento del PDF</p>
            <p className="text-sm mt-2">URL: {pdfUrl}</p>
            <p className="text-xs mt-1 text-gray-500">Controlla la console del browser per dettagli</p>
          </div>
        ) : (
          <Document
            file={pdfFile}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={(error) => {
              console.error("Errore caricamento PDF:", error)
              console.error("PDF File:", pdfFile)
            }}
            loading={<div className="text-center py-8">Caricamento PDF...</div>}
            error={
              <div className="text-center py-8 text-red-600">
                <p>Errore nel caricamento del PDF</p>
                <p className="text-sm mt-2">URL: {pdfUrl}</p>
                <p className="text-xs mt-1 text-gray-500">Controlla la console del browser per dettagli</p>
              </div>
            }
          >
          <div className="relative inline-block">
            <Page
              pageNumber={pageNumber}
              scale={scale}
              onLoadSuccess={onPageLoadSuccess}
              className="shadow-lg"
              renderTextLayer={true}
              renderAnnotationLayer={true}
            >
              {/* Overlay per evidenziazioni */}
              <div className="absolute inset-0 pointer-events-none">
                {entitiesOnCurrentPage.map((entity) => {
                  if (!entity.position) return null
                  
                  const isSelected = selectedEntityId === entity.id
                  const baseStyle = getHighlightStyle(entity.position, pageDimensions)
                  
                  return (
                    <div
                      key={entity.id}
                      onClick={() => onEntityClick?.(entity.id)}
                      style={{
                        ...baseStyle,
                        backgroundColor: isSelected
                          ? "rgba(33, 150, 243, 0.4)" // Blu per entità selezionata
                          : "rgba(255, 235, 59, 0.3)", // Giallo per altre
                        borderColor: isSelected
                          ? "rgba(33, 150, 243, 1)"
                          : "rgba(255, 193, 7, 0.8)",
                        pointerEvents: "auto",
                        display: baseStyle.display || "block"
                      }}
                      title={`${entity.type}: ${entity.value}`}
                    />
                  )
                })}
              </div>
            </Page>
          </div>
        </Document>
        )}
      </div>

      {/* Legenda entità nella pagina corrente */}
      {entitiesOnCurrentPage.length > 0 && (
        <div className="bg-white rounded-lg border shadow-sm p-4">
          <div className="flex items-center gap-2 mb-3 pb-3 border-b">
            <h3 className="text-sm font-semibold text-gray-700">
              Entità trovate in questa pagina
            </h3>
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
              {entitiesOnCurrentPage.length}
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {entitiesOnCurrentPage.map((entity) => (
              <button
                key={entity.id}
                onClick={() => {
                  onEntityClick?.(entity.id)
                  // Scrolla all'entità evidenziata
                }}
                className={`text-left p-2.5 rounded-md text-xs border transition-all ${
                  selectedEntityId === entity.id
                    ? "bg-blue-50 border-blue-300 shadow-sm ring-1 ring-blue-200"
                    : "bg-gray-50 border-gray-200 hover:bg-gray-100 hover:border-gray-300"
                }`}
              >
                <div className="font-medium truncate text-gray-900">{entity.type}</div>
                <div className="text-gray-600 truncate mt-0.5">{entity.value}</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

