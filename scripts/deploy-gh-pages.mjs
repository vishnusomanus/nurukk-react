import { publish } from 'gh-pages'

publish(
  'dist',
  {
    dotfiles: true,
    message: 'Deploy to GitHub Pages',
  },
  (error) => {
    if (error) {
      console.error(error)
      process.exit(1)
    }
    console.log('Published to gh-pages branch')
  },
)
