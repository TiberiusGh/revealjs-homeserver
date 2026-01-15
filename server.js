const express = require('express')
const fs = require('fs').promises
const path = require('path')

const app = express()
const PORT = process.env.PORT || 8080
const SLIDES_DIR = path.join(__dirname, 'slides')

app.use('/slides', express.static(SLIDES_DIR))

app.get('/', async (req, res) => {
  try {
    const files = await fs.readdir(SLIDES_DIR)
    const htmlFiles = files.filter((file) => file.endsWith('.html'))

    const presentations = await Promise.all(
      htmlFiles.map(async (file) => {
        const filePath = path.join(SLIDES_DIR, file)
        const [stat, content] = await Promise.all([
          fs.stat(filePath),
          fs.readFile(filePath, 'utf-8')
        ])

        const titleMatch = content.match(/<title>([^<]+)<\/title>/i)
        const title = titleMatch ? titleMatch[1].trim() : null

        return {
          name: file.replace('.html', '').replace(/-/g, ' '),
          filename: file,
          mtime: stat.mtime,
          title
        }
      })
    )

    presentations.sort((a, b) => b.mtime - a.mtime)

    res.send(generateIndexPage(presentations))
  } catch (error) {
    console.error('Error reading slides directory:', error)
    res.status(500).send('Error loading presentations')
  }
})

const ACCENT_COLORS = [
  '#7c8aff',
  '#ff7c7c',
  '#7cffb5',
  '#ffcf7c',
  '#c77cff',
  '#7cddff'
]

function generateIndexPage(presentations) {
  const presentationItems =
    presentations.length > 0
      ? presentations
          .map((p, index) => {
            const fallbackName = p.name
              .split(' ')
              .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ')
            const displayTitle = p.title || fallbackName
            const accent = ACCENT_COLORS[index % ACCENT_COLORS.length]
            const initial = displayTitle.charAt(0).toUpperCase()
            const date = new Date(p.mtime).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            })

            return `
          <a href="/slides/${p.filename}" class="presentation-card">
            <div class="card-preview" style="background: ${accent}20; border-color: ${accent}">
              <span class="card-initial" style="color: ${accent}">${initial}</span>
            </div>
            <div class="card-content">
              <h2 class="card-title">${displayTitle}</h2>
              <span class="card-meta">${date}</span>
            </div>
            <span class="card-arrow">→</span>
          </a>`
          })
          .join('')
      : '<p class="empty-state">No presentations yet. Add .html files to the slides folder.</p>'

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Presentations</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'DM Sans', sans-serif;
      background: #0a0a0b;
      color: #e8e6e3;
      min-height: 100vh;
      padding: 4rem 2rem;
    }

    .container {
      max-width: 900px;
      margin: 0 auto;
    }

    header {
      margin-bottom: 3rem;
    }

    h1 {
      font-family: 'Instrument Serif', serif;
      font-weight: 400;
      font-size: 3.5rem;
      letter-spacing: -0.02em;
      margin-bottom: 0.5rem;
    }

    .subtitle {
      color: #6b6b6b;
      font-size: 0.95rem;
    }

    .presentations {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1.5rem;
    }

    .presentation-card {
      display: flex;
      flex-direction: column;
      background: #131315;
      border-radius: 16px;
      color: #e8e6e3;
      text-decoration: none;
      overflow: hidden;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    .presentation-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
    }

    .card-preview {
      height: 140px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-bottom: 3px solid;
    }

    .card-initial {
      font-family: 'Instrument Serif', serif;
      font-size: 4rem;
      font-weight: 400;
    }

    .card-content {
      padding: 1.25rem 1.5rem;
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .card-title {
      font-size: 1.1rem;
      font-weight: 600;
      line-height: 1.3;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .card-meta {
      font-size: 0.8rem;
      color: #6b6b6b;
      margin-top: auto;
    }

    .card-arrow {
      display: none;
    }

    .empty-state {
      grid-column: 1 / -1;
      padding: 4rem;
      text-align: center;
      color: #4a4a4c;
      font-style: italic;
      background: #131315;
      border-radius: 16px;
    }

    .count {
      margin-top: 2rem;
      text-align: right;
      font-size: 0.8rem;
      color: #3a3a3c;
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>Presentations</h1>
      <p class="subtitle">Select a presentation to begin</p>
    </header>
    <div class="presentations">
      ${presentationItems}
    </div>
    ${
      presentations.length > 0
        ? `<p class="count">${presentations.length} presentation${
            presentations.length !== 1 ? 's' : ''
          }</p>`
        : ''
    }
  </div>
</body>
</html>`
}

app.listen(PORT, () => {
  console.log(`Presentation server running at http://localhost:${PORT}`)
})
