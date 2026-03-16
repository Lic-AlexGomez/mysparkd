"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { X, Trophy, Heart, Zap } from "lucide-react"
import { cn } from "@/lib/utils"

const TRIVIA_QUESTIONS = [
  { q: "¿Cuál es el planeta más grande del sistema solar?", options: ["Saturno", "Júpiter", "Neptuno", "Urano"], answer: 1 },
  { q: "¿En qué año llegó el hombre a la Luna?", options: ["1965", "1967", "1969", "1971"], answer: 2 },
  { q: "¿Cuál es el océano más grande del mundo?", options: ["Atlántico", "Índico", "Ártico", "Pacífico"], answer: 3 },
  { q: "¿Cuántos colores tiene el arcoíris?", options: ["5", "6", "7", "8"], answer: 2 },
  { q: "¿Cuál es el animal más rápido del mundo?", options: ["León", "Guepardo", "Águila", "Caballo"], answer: 1 },
  { q: "¿Cuántos continentes hay en la Tierra?", options: ["5", "6", "7", "8"], answer: 2 },
  { q: "¿Cuál es el idioma más hablado del mundo?", options: ["Inglés", "Español", "Mandarín", "Hindi"], answer: 2 },
  { q: "¿Qué gas respiramos principalmente?", options: ["Oxígeno", "CO2", "Nitrógeno", "Hidrógeno"], answer: 2 },
]

const TRUTH_OR_DARE = [
  { type: "truth", text: "¿Cuál es tu mayor miedo?" },
  { type: "truth", text: "¿Qué es lo más vergonzoso que te ha pasado?" },
  { type: "truth", text: "¿Cuál es tu canción favorita en este momento?" },
  { type: "truth", text: "¿Qué cualidad buscas en una pareja?" },
  { type: "truth", text: "¿Cuál es tu lugar favorito en el mundo?" },
  { type: "truth", text: "¿Qué harías si tuvieras un día libre sin límites?" },
  { type: "dare", text: "Envía un emoji que describa cómo te sientes ahora mismo 😊" },
  { type: "dare", text: "Cuéntame algo que nadie sabe de ti" },
  { type: "dare", text: "Describe tu día ideal en 3 palabras" },
  { type: "dare", text: "Dime un talento oculto que tienes" },
  { type: "dare", text: "¿Cuál sería el título de tu autobiografía?" },
  { type: "dare", text: "Comparte tu canción favorita ahora mismo" },
]

interface GamePanelProps {
  onClose: () => void
  onSendMessage: (msg: string) => void
  myUsername: string
  otherUsername: string
}

export function GamePanel({ onClose, onSendMessage, myUsername, otherUsername }: GamePanelProps) {
  const [game, setGame] = useState<'menu' | 'trivia' | 'truth'>('menu')
  const [triviaIndex, setTriviaIndex] = useState(0)
  const [triviaScore, setTriviaScore] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [currentCard, setCurrentCard] = useState<typeof TRUTH_OR_DARE[0] | null>(null)
  const [usedCards, setUsedCards] = useState<number[]>([])

  const startTrivia = () => {
    const shuffled = [...TRIVIA_QUESTIONS].sort(() => Math.random() - 0.5)
    setGame('trivia')
    setTriviaIndex(0)
    setTriviaScore(0)
    setSelected(null)
    setShowResult(false)
    onSendMessage(`🎮 ¡${myUsername} inició una partida de Trivia! Responde las preguntas y compara puntajes.`)
  }

  const startTruth = () => {
    setGame('truth')
    setUsedCards([])
    setCurrentCard(null)
    onSendMessage(`💬 ¡${myUsername} inició Verdad o Reto! Toca "Siguiente" para obtener una pregunta.`)
  }

  const handleTriviaAnswer = (idx: number) => {
    if (selected !== null) return
    setSelected(idx)
    const q = TRIVIA_QUESTIONS[triviaIndex]
    const correct = idx === q.answer
    if (correct) setTriviaScore(s => s + 1)
    setShowResult(true)
    const msg = correct
      ? `✅ Pregunta ${triviaIndex + 1}: "${q.q}" → ¡Correcto! (+1 punto)`
      : `❌ Pregunta ${triviaIndex + 1}: "${q.q}" → Incorrecto. La respuesta era: ${q.options[q.answer]}`
    setTimeout(() => onSendMessage(msg), 500)
  }

  const nextTrivia = () => {
    if (triviaIndex + 1 >= TRIVIA_QUESTIONS.length) {
      onSendMessage(`🏆 ¡Trivia terminada! ${myUsername} obtuvo ${triviaScore}/${TRIVIA_QUESTIONS.length} puntos`)
      setGame('menu')
      return
    }
    setTriviaIndex(i => i + 1)
    setSelected(null)
    setShowResult(false)
  }

  const nextCard = () => {
    const available = TRUTH_OR_DARE.map((_, i) => i).filter(i => !usedCards.includes(i))
    if (available.length === 0) {
      onSendMessage("🎉 ¡Completaron todas las preguntas de Verdad o Reto!")
      setGame('menu')
      return
    }
    const idx = available[Math.floor(Math.random() * available.length)]
    const card = TRUTH_OR_DARE[idx]
    setCurrentCard(card)
    setUsedCards(u => [...u, idx])
    onSendMessage(`${card.type === 'truth' ? '💭 Verdad' : '⚡ Reto'}: ${card.text}`)
  }

  const q = TRIVIA_QUESTIONS[triviaIndex]

  return (
    <div className="border-b border-primary/20 bg-background/95 px-3 py-2">
      {game === 'menu' && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-foreground">🎮 Citas Virtuales</span>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={startTrivia} className="flex items-center gap-2 p-2.5 rounded-xl bg-primary/10 border border-primary/30 hover:border-primary/60 transition-all">
              <span className="text-lg">🧠</span>
              <div className="text-left">
                <p className="text-xs font-semibold text-foreground">Trivia</p>
                <p className="text-[10px] text-muted-foreground">Preguntas y puntos</p>
              </div>
            </button>
            <button onClick={startTruth} className="flex items-center gap-2 p-2.5 rounded-xl bg-secondary/10 border border-secondary/30 hover:border-secondary/60 transition-all">
              <span className="text-lg">💬</span>
              <div className="text-left">
                <p className="text-xs font-semibold text-foreground">Verdad o Reto</p>
                <p className="text-[10px] text-muted-foreground">Conócense mejor</p>
              </div>
            </button>
          </div>
        </div>
      )}

      {game === 'trivia' && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-primary">🧠 {triviaIndex + 1}/{TRIVIA_QUESTIONS.length} · <Trophy className="h-3 w-3 text-yellow-500 inline" /> {triviaScore}</span>
            <button onClick={() => setGame('menu')} className="text-muted-foreground hover:text-foreground"><X className="h-3.5 w-3.5" /></button>
          </div>
          <p className="text-xs font-medium text-foreground mb-2">{q.q}</p>
          <div className="grid grid-cols-2 gap-1.5 mb-2">
            {q.options.map((opt, i) => (
              <button
                key={i}
                onClick={() => handleTriviaAnswer(i)}
                disabled={selected !== null}
                className={cn(
                  "text-xs p-1.5 rounded-lg border transition-all text-left",
                  selected === null && "border-border hover:border-primary/50 hover:bg-primary/5",
                  selected !== null && i === q.answer && "bg-green-500/20 border-green-500 text-green-400",
                  selected === i && i !== q.answer && "bg-red-500/20 border-red-500 text-red-400",
                  selected !== null && i !== q.answer && i !== selected && "opacity-40"
                )}
              >{opt}</button>
            ))}
          </div>
          {showResult && <Button size="sm" onClick={nextTrivia} className="w-full h-7 text-xs bg-primary text-black">{triviaIndex + 1 >= TRIVIA_QUESTIONS.length ? "Ver resultado" : "Siguiente →"}</Button>}
        </div>
      )}

      {game === 'truth' && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-secondary">💬 Verdad o Reto · {usedCards.length}/{TRUTH_OR_DARE.length}</span>
            <button onClick={() => setGame('menu')} className="text-muted-foreground hover:text-foreground"><X className="h-3.5 w-3.5" /></button>
          </div>
          {currentCard ? (
            <div className={cn(
              "p-2.5 rounded-xl mb-2 border",
              currentCard.type === 'truth' ? "bg-blue-500/10 border-blue-500/30" : "bg-orange-500/10 border-orange-500/30"
            )}>
              <span className="text-[10px] font-bold mb-0.5 block">{currentCard.type === 'truth' ? '💭 Verdad' : '⚡ Reto'}</span>
              <p className="text-xs text-foreground">{currentCard.text}</p>
            </div>
          ) : (
            <div className="p-2.5 rounded-xl mb-2 border border-dashed border-border text-center text-muted-foreground text-xs">Toca "Empezar" para la primera pregunta</div>
          )}
          <Button size="sm" onClick={nextCard} className="w-full h-7 text-xs bg-gradient-to-r from-primary to-secondary text-black">
            {currentCard ? "Siguiente →" : "¡Empezar!"}
          </Button>
        </div>
      )}
    </div>
  )
}
