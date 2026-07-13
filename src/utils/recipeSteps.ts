export type RecipeStep = {
  heading: string
  content: string
}

/** Parse numbered instructions into heading + content steps. */
export function instructionsToRecipeSteps(instructions?: string | null): RecipeStep[] {
  const raw = String(instructions ?? '').trim()
  if (!raw) return [{ heading: '', content: '' }]

  const parts = raw.split(/(?=^\s*\d+[\).\s:-]+)/m).map((part) => part.trim()).filter(Boolean)

  const steps = parts.map((part) => {
    const withoutNumber = part.replace(/^\s*\d+[\).\s:-]+\s*/, '').trim()
    const lines = withoutNumber.split(/\n/).map((line) => line.trim()).filter(Boolean)
    if (lines.length === 0) return { heading: '', content: '' }
    if (lines.length === 1) return { heading: lines[0], content: '' }
    return {
      heading: lines[0],
      content: lines.slice(1).join('\n'),
    }
  })

  return steps.length > 0 ? steps : [{ heading: '', content: '' }]
}

export function recipeStepsToInstructions(steps: RecipeStep[]): string {
  return steps
    .map((step) => {
      const heading = step.heading.trim()
      const content = step.content.trim()
      if (!heading && !content) return ''
      if (heading && content) return `${heading}\n${content}`
      return heading || content
    })
    .filter(Boolean)
    .map((block, index) => `${index + 1}. ${block}`)
    .join('\n\n')
}

export function recipeStepsHaveContent(steps: RecipeStep[]) {
  return steps.some((step) => step.heading.trim() || step.content.trim())
}
