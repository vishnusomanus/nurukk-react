export function getCategoryNavIcon(name?: string, slug?: string) {
  const key = `${slug ?? ''} ${name ?? ''}`.toLowerCase()
  if (key.includes('leaf') || key.includes('green')) return 'eco'
  if (key.includes('root')) return 'agriculture'
  if (key.includes('cut') || key.includes('kit')) return 'content_cut'
  if (key.includes('organic')) return 'workspace_premium'
  if (key.includes('exotic')) return 'star'
  return 'potted_plant'
}
