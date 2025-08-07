import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Costruisce il document_id secondo le regole del backend.
 * @param patientId string
 * @param documentType string
 * @param filename string (es: Eco_pre.pdf)
 * @returns string (es: doc_2025003002_eco_preoperatorio_Eco_pre)
 */
export function getDocumentId(patientId: string, documentType: string, filename: string): string {
  const filenameNoExt = filename.replace(/\.pdf$/i, "");
  return `doc_${patientId}_${documentType}_${filenameNoExt}`;
}
