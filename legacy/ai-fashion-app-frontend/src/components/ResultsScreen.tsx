import { useEffect, useState } from 'react'
import { getMatches, generateLookbook, type Match } from '../lib/api'

// Simple i18n helper
const messages = {
  es: {
    appName: "Pair - Asesor de Moda AI",
    results: "Tus combinaciones",
    lookbook: "Lookbook generado por IA",
    back: "Volver a combinar"
  },
  en: {
    appName: "Pair - AI Fashion Advisor",
    results: "Your matches",
    lookbook: "AI-generated lookbook",
    back: "Back to mixing"
  }
}

const defaultLocale = 'es'
const locale = defaultLocale
const t = (key: string) => messages[locale]?.[key] || key

function ResultsScreen({ category, onDone }: { category: string; onDone: (image: string) => void }) {
  const [matches, setMatches] = useState<Match[] | null>(null)
  const [generating, setGenerating] = useState(false)

  // Mock data for testing
  const mockMatches: Match[] = [
    { id: 1, name: "Jeans Azules Compatibles", type: "bottom", image: "/assets/jeans.jpg" },
    { id: 2, name: "Zapatillas Blancas Compatibles", type: "shoes", image: "/assets/sneakers.jpg" },
    { id: 3, name: "Chaqueta de Cuero", type: "top", image: "/assets/jacket.jpg" }
  ]

  useEffect(() => {
    let alive = true
    getMatches(category).then((m) => {
      if (alive) setMatches(m)
    })
    return () => {
      alive = false
    }
  }, [category])

  const handleLookbook = async () => {
    const list = matches && matches.length > 0 ? matches : mockMatches
    if (generating) return
    setGenerating(true)
    try {
      const image = await generateLookbook(list[0], list[1] ?? list[0], 'casual')
      onDone(image)
    } finally {
      setGenerating(false)
    }
  }

  const shown = matches === null ? [] : matches.length > 0 ? matches : mockMatches

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6"><span className="text-oro">{t('appName')}</span></h1>

      <p className="mb-8 text-cian">{t('results')}</p>

      {matches === null && <p className="mb-8 text-cian">{t('results')}…</p>}

      <div className="grid grid-cols-2 gap-6">
        {shown.map((match) => (
          <div key={match.id} className="vidrio p-6">
            <img
              src={match.image}
              alt={match.name}
              className="w-full h-48 object-cover rounded-md mb-4"
            />
            <h3 className="text-xl font-medium">{t(match.name)}</h3>
            <p className="text-sm">{match.type}</p>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <button
          onClick={handleLookbook}
          disabled={generating || matches === null}
          className="btn btn-oro w-full px-4 py-2 text-lg">
          {t('lookbook')}
        </button>
      </div>
    </div>
  )
}

export default ResultsScreen