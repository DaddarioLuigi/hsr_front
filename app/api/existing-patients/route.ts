import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Mock data for demo - replace with actual database query
    const mockPatients = [
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
    ]

    return NextResponse.json(mockPatients)
  } catch (error) {
    console.error("Error fetching patients:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
