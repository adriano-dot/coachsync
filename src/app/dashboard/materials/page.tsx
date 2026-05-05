'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useDropzone } from 'react-dropzone'
import toast from 'react-hot-toast'
import { FolderOpen, Upload, FileText, Trash2, X } from 'lucide-react'
import type { Material } from '@/types'

const CATEGORIES = [
  { value: 'tool', label: 'Ferramenta' },
  { value: 'methodology', label: 'Metodologia' },
  { value: 'exercise', label: 'Exercício' },
  { value: 'template', label: 'Template' },
  { value: 'reference', label: 'Referência' },
] as const

export default function MaterialsPage() {
  const supabase = createClient()
  const [materials, setMaterials] = useState<Material[]>([])
  const [uploading, setUploading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [form, setForm] = useState({ title: '', description: '', category: 'reference' })

  useEffect(() => { load() }, [])

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('materials').select('*').eq('coach_id', user.id).order('created_at', { ascending: false })
    setMaterials(data ?? [])
  }

  const onDrop = useCallback((files: File[]) => {
    setFile(files[0])
    setShowForm(true)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, maxFiles: 1 })

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault()
    if (!file) return
    setUploading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const path = `${user.id}/materials/${Date.now()}_${file.name}`
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('materials')
      .upload(path, file)

    if (uploadError) { toast.error('Erro no upload'); setUploading(false); return }

    const fileUrl = supabase.storage.from('materials').getPublicUrl(uploadData.path).data.publicUrl

    const { error } = await supabase.from('materials').insert({
      coach_id: user.id,
      title: form.title || file.name,
      description: form.description,
      file_url: fileUrl,
      file_type: file.type,
      category: form.category,
    })

    if (error) { toast.error('Erro ao salvar'); setUploading(false); return }

    toast.success('Material enviado!')
    setFile(null)
    setShowForm(false)
    setForm({ title: '', description: '', category: 'reference' })
    load()
    setUploading(false)
  }

  async function deleteMaterial(id: string) {
    await supabase.from('materials').delete().eq('id', id)
    setMaterials(prev => prev.filter(m => m.id !== id))
    toast.success('Material removido')
  }

  return (
    <div className="p-8 animate-in">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-semibold text-charcoal-800">Materiais & Metodologias</h1>
        <p className="text-charcoal-500 text-sm mt-1">
          Faça upload dos seus materiais para alimentar a base de conhecimento da IA
        </p>
      </div>

      {/* Dropzone */}
      {!showForm && (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-colors mb-8 ${
            isDragActive ? 'border-sage-400 bg-sage-50' : 'border-cream-300 hover:border-sage-300 hover:bg-cream-50'
          }`}
        >
          <input {...getInputProps()} />
          <Upload className="w-10 h-10 text-charcoal-300 mx-auto mb-3" />
          <p className="text-charcoal-600 font-medium">
            {isDragActive ? 'Solte o arquivo aqui' : 'Arraste ou clique para enviar material'}
          </p>
          <p className="text-charcoal-400 text-sm mt-1">PDF, DOCX, TXT, imagens</p>
        </div>
      )}

      {/* Upload form */}
      {showForm && file && (
        <div className="card mb-8 border-sage-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-sage-600" />
              <p className="font-medium text-charcoal-800">{file.name}</p>
            </div>
            <button onClick={() => { setFile(null); setShowForm(false) }} className="text-charcoal-400 hover:text-charcoal-600">
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleUpload} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Título</label>
                <input type="text" className="input" value={form.title} placeholder={file.name}
                  onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
              </div>
              <div>
                <label className="label">Categoria</label>
                <select className="input" value={form.category}
                  onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
                  {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="label">Descrição</label>
              <textarea className="input resize-none" rows={2} value={form.description}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                placeholder="Sobre o que é este material?" />
            </div>
            <button type="submit" disabled={uploading} className="btn-primary">
              {uploading ? 'Enviando...' : 'Salvar material'}
            </button>
          </form>
        </div>
      )}

      {/* Materials list */}
      {materials.length > 0 ? (
        <div className="space-y-3">
          {materials.map(material => (
            <div key={material.id} className="card flex items-center gap-4">
              <div className="w-10 h-10 bg-cream-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <FolderOpen className="w-5 h-5 text-charcoal-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-charcoal-800 truncate">{material.title}</p>
                {material.description && (
                  <p className="text-xs text-charcoal-500 truncate">{material.description}</p>
                )}
              </div>
              <span className="badge bg-cream-100 text-charcoal-600 text-xs">
                {CATEGORIES.find(c => c.value === material.category)?.label ?? material.category}
              </span>
              <a href={material.file_url} target="_blank" rel="noopener noreferrer"
                className="text-sage-600 text-xs hover:text-sage-700 font-medium">
                Ver
              </a>
              <button onClick={() => deleteMaterial(material.id)} className="text-charcoal-400 hover:text-red-500 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        !showForm && (
          <div className="card text-center py-12">
            <FolderOpen className="w-10 h-10 text-charcoal-300 mx-auto mb-3" />
            <p className="text-charcoal-500 text-sm">Nenhum material enviado ainda</p>
          </div>
        )
      )}
    </div>
  )
}
