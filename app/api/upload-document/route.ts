import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const patientId = formData.get("patient_id") as string
    const documentType = formData.get("document_type") as string

    if (!file || !patientId || !documentType) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Here you would typically:
    // 1. Save the file to storage
    // 2. Call your Flask backend to process the document
    // 3. Return the document ID and extracted entities

    // Mock response for demo
    const mockResponse = {
      document_id: `doc_${Date.now()}`,
      patient_id: patientId,
      document_type: documentType,
      filename: file.name,
      entities: [
        {
          id: "1",
          type: "Paziente",
          value: "Mario Rossi",
          confidence: 0.95,
        },
        {
          id: "2",
          type: "Data Nascita",
          value: "15/03/1975",
          confidence: 0.88,
        },
      ],
      status: "processed",
    }

    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 2000))

    return NextResponse.json(mockResponse)
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
