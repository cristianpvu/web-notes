
export function cn(...inputs) {
  return inputs.filter(Boolean).join(' ')
}


export function formatDate(date) {
  if (!date) return ''
  return new Date(date).toLocaleDateString('ro-RO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}


export function formatDateTime(date) {
  if (!date) return ''
  return new Date(date).toLocaleString('ro-RO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
