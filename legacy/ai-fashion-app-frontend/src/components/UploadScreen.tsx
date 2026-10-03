import { useState } from 'react'
import voiceInput from '../services/voice-input.service'

// Simple i18n helper
const messages = {
  es: {
    appName: "Pair - Asesor de Moda AI",
    uploadImage: "Sube una foto de prenda de vestir",
    hintPlaceholder: "Pista opcional (ej: 'top negro con bordado')",
    analyzeButton: "Analizar prenda",
    uploadSuccess: "Prenda subida exitosamente",
    listen: "Escuchar",
    listening: "Escuchando..."
  },
  en: {
    appName: "Pair - AI Fashion Advisor",
    uploadImage: "Upload a clothing item photo",
    hintPlaceholder: "Optional hint (eg: 'black top with embroidery')",
    analyzeButton: "Analyze garment",
    uploadSuccess: "Garment uploaded successfully",
    listen: "Listen",
    listening: "Listening..."
  }
}

const defaultLocale = 'es'
const locale = defaultLocale
const t = (key: string) => messages[locale]?.[key] || key

type Step = 'upload' | 'analyze' | 'confirm' | 'results' | 'lookbook';

interface UploadScreenProps {
  onAnalyze: (formData: FormData) => Promise<void>
}

function UploadScreen({ onAnalyze }: UploadScreenProps) {
  const [image, setImage] = useState<string | null>(null)
  const [hint, setHint] = useState<string>('')
  const [isListening, setIsListening] = useState<boolean>(false)
  const [sending, setSending] = useState<boolean>(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (f) => setImage(f.target!.result as string)
      reader.readAsDataURL(file)
    }
  }

  const handleVoiceStart = () => {
    setIsListening(true)
    voiceInput.start(
      (transcript: string) => {
        setHint(transcript.trim())
        setIsListening(false)
      },
      (error: Error) => {
        console.error(error)
        setIsListening(false)
      }
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (sending) return
    setSending(true)
    try {
      const formData = new FormData()
      if (image) {
        formData.append('image', new Blob([image!.split(',')[1]], { type: 'image/jpeg' }), 'fashion.jpg')
      }
      if (hint.trim()) {
        formData.append('hint', hint)
      }
      await onAnalyze(formData)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6"><span className="text-oro">{t('appName')}</span></h1>

      <form onSubmit={handleSubmit} className="space-y-4 vidrio p-6">
        <div>
          <label className="block text-sm font-medium mb-2 text-cian">{t('uploadImage')}</label>
          <input 
            type="file" 
            accept="image/*" 
            onChange={handleFileChange}
            required
          />
          {isListening && (
            <p className="mt-2 text-sm text-gray-500">{t('listening')}</p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">{t('hintPlaceholder')}</label>
          <input
            value={hint}
            onChange={(e) => setHint(e.target.value)}
            placeholder={t('hintPlaceholder')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          />
        </div>
        
        <div className="flex space-x-2">
          <button
            type="button"
            onClick={handleVoiceStart}
            disabled={isListening}
            className="btn btn-vidrio flex-1 px-3 py-2 text-sm"
            title={isListening ? 'Detener escucha' : 'Presionar y hablar'}
          >
            {isListening ? t('listening') : t('listen')}
            <svg className="ml-1 h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M13 2L1 7h4l5-5L13 2z"/>
              <path d="M13 2v4l10 10"/>
            </svg>
          </button>
          <button
            type="submit"
            disabled={sending}
            className="btn btn-oro flex-1 px-3 py-2 text-sm"
          >
            {t('analyzeButton')}
          </button>
        </div>
      </form>
      
      {image && (
        <div className="mt-8">
          <img 
            src={image} 
            alt="Prenda subida" 
            className="mt-4 rounded w-full max-h-64 object-cover"
          />
        </div>
      )}
    </div>
  )
}

export default UploadScreen