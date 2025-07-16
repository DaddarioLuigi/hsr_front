import Image from "next/image"

export function HospitalHeader() {
  return (
    <header className="border-b">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center space-x-4">
          <Image
            src="/fondazione-alfieri-logo.png"
            alt="Fondazione Alfieri"
            width={40}
            height={40}
            className="h-10 w-auto"
          />
          <div>
            <h2 className="font-semibold text-foreground">Sistema Gestione Documenti Clinici</h2>
            <p className="text-sm text-muted-foreground">Fondazione Alfieri</p>
          </div>
        </div>
      </div>
    </header>
  )
}
