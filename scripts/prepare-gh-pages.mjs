import fs from 'node:fs'
import path from 'node:path'

const distDir = path.resolve('dist')

if (!fs.existsSync(distDir)) {
  console.error('dist/ not found. Run vite build first.')
  process.exit(1)
}

fs.writeFileSync(path.join(distDir, '.nojekyll'), '')

const indexPath = path.join(distDir, 'index.html')
const indexHtml = fs.readFileSync(indexPath, 'utf8')
fs.writeFileSync(path.join(distDir, '404.html'), indexHtml)

console.log('Prepared dist/ for GitHub Pages (.nojekyll, 404.html)')
