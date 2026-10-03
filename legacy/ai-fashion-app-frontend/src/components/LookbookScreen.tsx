interface LookbookScreenProps {
  lookbookImage?: string
  onBack?: () => void
}

const FALLBACK_LOOKBOOK = 'https://picsum.photos/seed/lookbook/800/600';

function LookbookScreen({ lookbookImage = FALLBACK_LOOKBOOK, onBack }: LookbookScreenProps) {
  const messages = {
    es: {
      appName: "Pair - Asesor de Moda AI",
      lookbook: "Lookbook generado por IA",
      back: "Volver a combinar"
    },
    en: {
      appName: "Pair - AI Fashion Advisor",
      lookbook: "AI-generated lookbook",
      back: "Back to mixing"
    }
  }

  const defaultLocale = 'es'
  const locale = defaultLocale
  const t = (key: string) => messages[locale]?.[key] || key

  return (
    <div className="af-abyss">
      <h1 className="text-3xl font-bold p-6"><span className="text-oro">{t('appName')}</span></h1>

      <div className="p-8 max-w-2xl mx-auto vidrio">
        <img
          src={lookbookImage}
          alt="Lookbook generado por IA"
          className="w-full rounded-lg mb-8"
        />

        <p className="text-lg text-cian">
          {t('lookbook')}
        </p>

        <button
          onClick={() => (onBack ? onBack() : window.history.back())}
          className="btn btn-oro mt-6 px-4 py-2 text-lg">
          {t('back')}
        </button>
      </div>
    </div>
  )
}

export default LookbookScreen