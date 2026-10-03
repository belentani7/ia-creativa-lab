import { useState } from 'react'
import UploadScreen from './components/UploadScreen'
import ConfirmScreen from './components/ConfirmScreen'
import ResultsScreen from './components/ResultsScreen'
import LookbookScreen from './components/LookbookScreen'
import { analyzeImage, type Analysis } from './lib/api'

type Step = 'upload' | 'analyze' | 'confirm' | 'results' | 'lookbook';

function App() {
  const [step, setStep] = useState<Step>('upload')
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [lookbookImage, setLookbookImage] = useState('https://picsum.photos/seed/lookbook/800/600')

  const handleAnalyze = async (formData: FormData) => {
    const result = await analyzeImage(formData)
    setAnalysis(result)
    setStep('analyze')
  }

  const handleLookbookDone = (image: string) => {
    setLookbookImage(image)
    setStep('lookbook')
  }

  return (
    <div className="af-abyss">
      {step === 'upload' && <UploadScreen onAnalyze={handleAnalyze} />}
      {step === 'analyze' && <ConfirmScreen analysis={analysis} onConfirm={setStep} />}
      {step === 'results' && <ResultsScreen category={analysis?.category ?? 'top'} onDone={handleLookbookDone} />}
      {step === 'lookbook' && <LookbookScreen lookbookImage={lookbookImage} onBack={() => setStep('results')} />}
    </div>
  )
}

export default App