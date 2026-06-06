import { useRef, useState, useEffect, KeyboardEvent, ClipboardEvent } from 'react'

interface OTPInputProps {
  length?: number
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  error?: boolean
}

export default function OTPInput({ 
  length = 6, 
  value, 
  onChange, 
  disabled = false,
  error = false 
}: OTPInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null)

  // Split value into array of digits
  const digits = value.split('').concat(Array(length).fill('')).slice(0, length)

  useEffect(() => {
    // Focus first input on mount
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus()
    }
  }, [])

  const focusInput = (index: number) => {
    if (index >= 0 && index < length && inputRefs.current[index]) {
      inputRefs.current[index]?.focus()
    }
  }

  const handleChange = (index: number, digit: string) => {
    if (!/^\d*$/.test(digit)) return // Only allow digits

    const newDigits = [...digits]
    newDigits[index] = digit.slice(-1) // Take only last character
    const newValue = newDigits.join('').slice(0, length)
    onChange(newValue)

    // Auto-advance to next input
    if (digit && index < length - 1) {
      focusInput(index + 1)
    }
  }

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      e.preventDefault()
      const newDigits = [...digits]
      
      if (digits[index]) {
        // Clear current digit
        newDigits[index] = ''
        onChange(newDigits.join(''))
      } else if (index > 0) {
        // Move to previous input and clear it
        newDigits[index - 1] = ''
        onChange(newDigits.join(''))
        focusInput(index - 1)
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault()
      focusInput(index - 1)
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      e.preventDefault()
      focusInput(index + 1)
    }
  }

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length)
    if (pastedData) {
      onChange(pastedData)
      // Focus the input after the last pasted digit
      focusInput(Math.min(pastedData.length, length - 1))
    }
  }

  return (
    <div className="flex justify-center gap-2 sm:gap-3">
      {Array.from({ length }).map((_, index) => (
        <input
          key={index}
          ref={(el) => { inputRefs.current[index] = el }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digits[index]}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          onFocus={() => setFocusedIndex(index)}
          onBlur={() => setFocusedIndex(null)}
          disabled={disabled}
          className={`
            w-10 h-12 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-bold
            rounded-xl border-2 bg-white/5 outline-none
            transition-all duration-200
            ${error 
              ? 'border-red-500 text-red-400 animate-shake' 
              : focusedIndex === index
                ? 'border-cyan-500 ring-2 ring-cyan-500/30 text-white'
                : digits[index]
                  ? 'border-green-500/50 text-white'
                  : 'border-white/20 text-white'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-white/40'}
            focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/30
          `}
          aria-label={`Digit ${index + 1}`}
        />
      ))}
    </div>
  )
}
