"use client"

interface HospitalHeaderProps {
  title?: string
  subtitle?: string
  showUserInfo?: boolean
}

export function HospitalHeader({
  title = "Sistema Gestione Documenti Clinici",
  subtitle = "Fondazione Alfieri",
  showUserInfo = true,
}: HospitalHeaderProps) {
  return (
    <div className="bg-white/90 backdrop-blur-sm border-b border-primary-200 mb-8">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <img src="/fondazione-alfieri-logo.png" alt="Fondazione Alfieri" className="h-12 w-auto" />
            <div className="hidden sm:block">
              <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
              <p className="text-sm text-gray-600">{subtitle}</p>
            </div>
          </div>
          {showUserInfo && (
            <div className="text-right">
              <p className="text-sm text-gray-600">Benvenuto, Dr. Rossi</p>
              <p className="text-xs text-gray-500">{new Date().toLocaleDateString("it-IT")}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
