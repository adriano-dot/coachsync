import { createClient } from '@/lib/supabase/server'
import { BookOpen, Film, FileText, Headphones, Dumbbell, ExternalLink } from 'lucide-react'

const TYPE_CONFIG = {
  book: { label: 'Livros', icon: BookOpen, color: 'text-amber-600 bg-amber-50' },
  movie: { label: 'Filmes', icon: Film, color: 'text-blue-600 bg-blue-50' },
  article: { label: 'Artigos', icon: FileText, color: 'text-sage-600 bg-sage-50' },
  podcast: { label: 'Podcasts', icon: Headphones, color: 'text-violet-600 bg-violet-50' },
  exercise: { label: 'Exercícios', icon: Dumbbell, color: 'text-red-600 bg-red-50' },
  other: { label: 'Outros', icon: BookOpen, color: 'text-charcoal-600 bg-cream-100' },
}

export default async function CoacheeLibraryPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase.from('profiles').select('coach_id').eq('id', user.id).single()

  const { data: items } = await supabase
    .from('library_items')
    .select('*')
    .eq('coach_id', profile?.coach_id)
    .or(`coachee_id.eq.${user.id},coachee_id.is.null`)
    .order('created_at', { ascending: false })

  const grouped = Object.entries(TYPE_CONFIG).reduce((acc, [type]) => {
    const filtered = items?.filter(i => i.type === type) ?? []
    if (filtered.length > 0) acc[type] = filtered
    return acc
  }, {} as Record<string, typeof items>)

  return (
    <div className="p-8 animate-in">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-semibold text-charcoal-800">Biblioteca</h1>
        <p className="text-charcoal-500 text-sm mt-1">Recursos selecionados pelo seu coach para sua jornada</p>
      </div>

      {Object.keys(grouped).length > 0 ? (
        <div className="space-y-8">
          {Object.entries(grouped).map(([type, typeItems]) => {
            const config = TYPE_CONFIG[type as keyof typeof TYPE_CONFIG]
            const Icon = config.icon
            return (
              <div key={type}>
                <h2 className="font-display text-lg font-semibold text-charcoal-700 mb-4 flex items-center gap-2">
                  <span className={`w-7 h-7 rounded-lg flex items-center justify-center ${config.color}`}>
                    <Icon className="w-3.5 h-3.5" />
                  </span>
                  {config.label}
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  {typeItems?.map(item => (
                    <div key={item.id} className="card">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-charcoal-800 truncate">{item.title}</p>
                          {item.author && (
                            <p className="text-xs text-charcoal-400 mt-0.5">{item.author}</p>
                          )}
                          {item.description && (
                            <p className="text-xs text-charcoal-500 mt-2 leading-relaxed line-clamp-2">
                              {item.description}
                            </p>
                          )}
                        </div>
                        {item.url && (
                          <a href={item.url} target="_blank" rel="noopener noreferrer"
                            className="text-sage-500 hover:text-sage-600 flex-shrink-0 mt-0.5">
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                      {item.tags?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {item.tags.map((tag: string) => (
                            <span key={tag} className="badge bg-cream-100 text-charcoal-500 text-xs">{tag}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="card text-center py-16">
          <BookOpen className="w-10 h-10 text-charcoal-300 mx-auto mb-4" />
          <p className="font-display text-lg font-semibold text-charcoal-600 mb-2">Biblioteca vazia</p>
          <p className="text-charcoal-400 text-sm">Seu coach adicionará recursos personalizados para você em breve</p>
        </div>
      )}
    </div>
  )
}
