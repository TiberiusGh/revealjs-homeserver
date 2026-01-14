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
    const presentations = files
      .filter((file) => file.endsWith('.html'))
      .map((file) => ({
        name: file.replace('.html', '').replace(/-/g, ' '),
        filename: file
      }))

    res.send(generateIndexPage(presentations))
  } catch (error) {
    console.error('Error reading slides directory:', error)
    res.status(500).send('Error loading presentations')
  }
})

function generateIndexPage(presentations) {
  const presentationItems =
    presentations.length > 0
      ? presentations
          .map((p) => {
            const capitalizedName = p.name
              .split(' ')
              .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ')
            return `
          <a href="/slides/${p.filename}" class="presentation-card">
            <span class="card-icon">◈</span>
            <span class="card-title">${capitalizedName}</span>
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
  <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@400;500&display=swap" rel="stylesheet">
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
      max-width: 720px;
      margin: 0 auto;
    }

    header {
      margin-bottom: 4rem;
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
      display: flex;
      flex-direction: column;
      gap: 1px;
      background: #1a1a1c;
      border-radius: 12px;
      overflow: hidden;
    }

    .presentation-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1.25rem 1.5rem;
      background: #0a0a0b;
      color: #e8e6e3;
      text-decoration: none;
      transition: background 0.2s ease, padding-left 0.2s ease;
    }

    .presentation-card:hover {
      background: #12121a;
      padding-left: 2rem;
    }

    .card-icon {
      color: #4a5568;
      font-size: 1.1rem;
    }

    .presentation-card:hover .card-icon {
      color: #7c8aff;
    }

    .card-title {
      flex: 1;
      font-size: 1.05rem;
    }

    .card-arrow {
      color: #3a3a3c;
      transition: transform 0.2s ease, color 0.2s ease;
    }

    .presentation-card:hover .card-arrow {
      transform: translateX(4px);
      color: #7c8aff;
    }

    .empty-state {
      padding: 3rem;
      text-align: center;
      color: #4a4a4c;
      font-style: italic;
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
