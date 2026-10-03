import tts from '../services/tts.service'
import type { Analysis } from '../lib/api'

// Simple i18n helper
const messages = {
  es: {
    appName: "Pair - Asesor de Moda AI",
    confirm: "Confirmar análisis",
    reanalyze: "Re-analizar",
    speak: "Hablar descripción",
    category: "Categoría",
    style: "Estilo",
    palette: "Paleta de colores"
  },
  en: {
    appName: "Pair - AI Fashion Advisor",
    confirm: "Confirm analysis",
    reanalyze: "Re-analyze",
    speak: "Speak description",
    category: "Category",
    style: "Style",
    palette: "Color palette"
  }
}

const defaultLocale = 'es'
const locale = defaultLocale
const t = (key: string) => messages[locale]?.[key] || key

type Step = 'upload' | 'analyze' | 'confirm' | 'results' | 'lookbook';

interface ConfirmScreenProps {
  analysis: Analysis | null
  onConfirm: (step: Step) => void
}

function ConfirmScreen({ analysis, onConfirm }: ConfirmScreenProps) {
  const speakAnalysis = () => {
    if (!analysis) return
    const text = `Prenda categorizada como ${analysis.category} con estilo ${analysis.style}. Paleta de colores: ${analysis.palette}.`
    tts.speak(text, { lang: locale.startsWith('en') ? 'en-US' : 'es-ES', rate: 0.9, pitch: 1.0 })
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6"><span className="text-oro">{t('appName')}</span></h1>

      {analysis && (
        <div className="vidrio p-6 mb-8">
          <h2 className="text-xl font-medium mb-4 text-cian">{t('confirm')}</h2>
          <p className="mb-4">{t('category')}: {analysis.category}</p>
          <p className="mb-4">{t('style')}: {analysis.style}</p>
          <p>{t('palette')}: {analysis.palette}</p>

          <button
            onClick={speakAnalysis}
            className="btn btn-cian mt-2 px-3 py-1 text-sm"
            title={t('speak')}
          >
            {t('speak')}
          </button>
        </div>
      )}
      
      <div className="space-y-4">
        <button
          onClick={() => onConfirm('results')}
          className="btn btn-oro w-full px-4 py-2 text-lg">
          {t('confirm')}
        </button>
        <button
          onClick={() => onConfirm('analyze')}
          className="btn btn-vidrio w-full px-4 py-2 text-lg">
          {t('reanalyze')}
        </button>
      </div>
    </div>
  )
}

export default ConfirmScreen