'use client'

import { Printer } from 'lucide-react'

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="flex items-center gap-2 bg-charcoal-900 hover:bg-charcoal-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
    >
      <Printer className="w-4 h-4" />
      Imprimir / Salvar PDF
    </button>
  )
}
