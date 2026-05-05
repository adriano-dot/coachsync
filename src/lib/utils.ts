import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date) {
  return format(new Date(date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
}

export function formatDateShort(date: string | Date) {
  return format(new Date(date), 'dd/MM/yyyy', { locale: ptBR })
}

export function formatRelative(date: string | Date) {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: ptBR })
}

export function getInitials(name: string) {
  return name
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function taskStatusLabel(status: string) {
  const labels: Record<string, string> = {
    pending: 'Pendente',
    in_progress: 'Em andamento',
    done: 'Concluída',
  }
  return labels[status] ?? status
}

export function taskStatusColor(status: string) {
  const colors: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-800',
    in_progress: 'bg-blue-100 text-blue-800',
    done: 'bg-sage-100 text-sage-800',
  }
  return colors[status] ?? 'bg-gray-100 text-gray-800'
}

export function priorityLabel(priority: string) {
  const labels: Record<string, string> = {
    high: 'Alta',
    medium: 'Média',
    low: 'Baixa',
  }
  return labels[priority] ?? priority
}

export function priorityColor(priority: string) {
  const colors: Record<string, string> = {
    high: 'text-red-600',
    medium: 'text-amber-600',
    low: 'text-sage-600',
  }
  return colors[priority] ?? 'text-gray-600'
}

export function wheelOfLifeLabels() {
  return {
    career: 'Carreira',
    health: 'Saúde',
    relationships: 'Relacionamentos',
    finances: 'Finanças',
    personal_growth: 'Crescimento Pessoal',
    leisure: 'Lazer',
    spirituality: 'Espiritualidade',
    family: 'Família',
  }
}
