import { useState, useRef } from 'react'
import { Send, Smile, Paperclip, Mic, X, Image } from 'lucide-react'

interface Props {
  onSend: (content: string, attachment?: File) => void
  onTyping?: () => void
  disabled?: boolean
  placeholder?: string
}

const EMOJI_SHORTCUTS = ['😊', '😢', '😤', '😰', '🙏', '❤️', '👍', '🤗']

export default function MessageInput({ onSend, onTyping, disabled, placeholder = 'Type a message...' }: Props) {
  const [text, setText] = useState('')
  const [showEmoji, setShowEmoji] = useState(false)
  const [attachment, setAttachment] = useState<File | null>(null)
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim() && !attachment) return
    onSend(text.trim(), attachment || undefined)
    setText('')
    setAttachment(null)
    setAttachmentPreview(null)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
    onTyping?.()
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAttachment(file)
    if (file.type.startsWith('image/')) {
      setAttachmentPreview(URL.createObjectURL(file))
    } else {
      setAttachmentPreview(null)
    }
  }

  const removeAttachment = () => {
    setAttachment(null)
    setAttachmentPreview(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  const insertEmoji = (emoji: string) => {
    setText(prev => prev + emoji)
    setShowEmoji(false)
  }

  return (
    <div className="border-t border-white/10 bg-[#0d0d1a] p-4">
      {/* Attachment preview */}
      {attachment && (
        <div className="mb-3 flex items-center gap-2">
          {attachmentPreview ? (
            <div className="relative">
              <img src={attachmentPreview} alt="Preview" className="h-20 rounded-lg object-cover" />
              <button
                onClick={removeAttachment}
                className="absolute -top-2 -right-2 p-1 bg-red-500 rounded-full text-white hover:bg-red-600"
              >
                <X size={12} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-2 bg-white/10 rounded-lg">
              <Paperclip size={16} className="text-gray-400" />
              <span className="text-sm text-gray-300 truncate max-w-[200px]">{attachment.name}</span>
              <button onClick={removeAttachment} className="text-gray-400 hover:text-red-400">
                <X size={14} />
              </button>
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex items-end gap-2">
        {/* Attachment button */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="p-2.5 rounded-xl text-gray-400 hover:text-[#00BFFF] hover:bg-white/5 transition-colors"
            title="Attach file"
          >
            <Paperclip size={20} />
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*,.pdf,.doc,.docx"
            className="hidden"
            onChange={handleFileSelect}
          />

          {/* Image button */}
          <button
            type="button"
            onClick={() => { if (fileRef.current) { fileRef.current.accept = 'image/*'; fileRef.current.click() } }}
            className="p-2.5 rounded-xl text-gray-400 hover:text-[#00BFFF] hover:bg-white/5 transition-colors"
            title="Send image"
          >
            <Image size={20} />
          </button>
        </div>

        {/* Text input */}
        <div className="flex-1 relative">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-gray-500 resize-none focus:outline-none focus:border-[#00BFFF] transition-colors disabled:opacity-50"
            style={{ minHeight: '48px', maxHeight: '120px' }}
          />

          {/* Emoji button */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <button
              type="button"
              onClick={() => setShowEmoji(v => !v)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-yellow-400 transition-colors"
            >
              <Smile size={20} />
            </button>

            {showEmoji && (
              <div className="absolute bottom-full right-0 mb-2 flex items-center gap-1 bg-[#1a1a2e] border border-white/10 rounded-xl px-2 py-1.5 shadow-xl">
                {EMOJI_SHORTCUTS.map(emoji => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => insertEmoji(emoji)}
                    className="text-xl hover:scale-125 transition-transform p-1"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Voice message button */}
        <button
          type="button"
          className="p-2.5 rounded-xl text-gray-400 hover:text-[#00BFFF] hover:bg-white/5 transition-colors"
          title="Record audio"
        >
          <Mic size={20} />
        </button>

        {/* Send button */}
        <button
          type="submit"
          disabled={disabled || (!text.trim() && !attachment)}
          className="p-3 rounded-xl bg-gradient-to-r from-[#00BFFF] to-[#7C5CBF] text-white hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send size={20} />
        </button>
      </form>
    </div>
  )
}
