"use client"

import React, { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "motion/react"
import { MessageCircle, X, Send, Smile, Paperclip, MoreHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"

interface ChatPopupProps {
  recipientName?: string
  recipientRole?: string
  /**
   * Optional controlled open state. When provided, the parent owns the
   * open/close state (e.g. a "Message the host" CTA elsewhere on the page can
   * open it). Omit both to keep the popup self-managed as before.
   */
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function ChatPopup({
  recipientName = "Support",
  recipientRole = "Online",
  open,
  onOpenChange,
}: ChatPopupProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = open !== undefined
  const isOpen = isControlled ? open : internalOpen
  const setIsOpen = (next: boolean) => {
    if (!isControlled) setInternalOpen(next)
    onOpenChange?.(next)
  }
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState([
    { id: 1, text: "Hi there! How can I help you today?", sender: "them", time: "10:00 AM" },
  ])
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isOpen])

  const handleSend = () => {
    if (!message.trim()) return
    const newMessage = {
      id: messages.length + 1,
      text: message,
      sender: "me",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
    setMessages([...messages, newMessage])
    setMessage("")

    // Simulate response
    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: prev.length + 1,
        text: "Thanks for your message! Our team will get back to you shortly.",
        sender: "them",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }])
    }, 1000)
  }

  return (
    <div className="fixed bottom-6 right-6 z-[300]">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95, transformOrigin: "bottom right" }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="mb-4 flex h-[500px] w-[350px] flex-col overflow-hidden rounded-3xl bg-white shadow-[0_20px_50px_-20px_rgba(0,0,0,0.3)] ring-1 ring-zinc-200 sm:w-[400px]"
          >
            {/* Header */}
            <div className="flex items-center justify-between bg-[#075E54] p-4 text-white">
              <div className="flex items-center gap-3">
                <div className="relative size-10 rounded-full bg-white/20 ring-2 ring-white/10 overflow-hidden">
                  <div className="flex h-full w-full items-center justify-center text-sm font-bold">
                    {recipientName?.[0] || "C"}
                  </div>
                  <div className="absolute bottom-0 right-0 size-2.5 rounded-full border-2 border-[#075E54] bg-[#25D366]" />
                </div>
                <div>
                  <div className="text-[10px] text-white/70 font-medium uppercase tracking-wider leading-none mb-1">Live Chat with</div>
                  <div className="text-sm font-semibold leading-none">{recipientName}</div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button className="rounded-full p-2 transition hover:bg-white/10 text-white/70 hover:text-white">
                  <MoreHorizontal className="size-5" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="rounded-full p-2 transition hover:bg-white/10 text-white/70 hover:text-white"
                >
                  <X className="size-5" />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-auto bg-[#E5DDD5] p-4 space-y-4"
              style={{ backgroundImage: "url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')" }}
            >
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    "flex flex-col max-w-[85%]",
                    msg.sender === "me" ? "ml-auto items-end" : "mr-auto items-start"
                  )}
                >
                  <div
                    className={cn(
                      "rounded-xl px-3 py-2 text-sm shadow-sm transition-all duration-300 relative",
                      msg.sender === "me"
                        ? "bg-[#DCF8C6] text-zinc-900 rounded-tr-none"
                        : "bg-white text-zinc-900 rounded-tl-none"
                    )}
                  >
                    {msg.text}
                    <div className="mt-1 flex justify-end">
                      <span className="text-[9px] font-medium text-zinc-400 uppercase">
                        {msg.time}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Input Area */}
            <div className="p-3 bg-[#F0F2F5] border-t border-zinc-200">
              <div className="relative flex items-center gap-2">
                <button className="text-zinc-500 hover:text-zinc-700 transition">
                  <Paperclip className="size-5" />
                </button>
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Type a message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                    className="w-full rounded-full bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none shadow-sm"
                  />
                  <button className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600">
                    <Smile className="size-5" />
                  </button>
                </div>
                <button
                  onClick={handleSend}
                  disabled={!message.trim()}
                  className="flex size-11 items-center justify-center rounded-full bg-[#128C7E] text-white transition hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 shadow-md"
                >
                  <Send className="size-5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Trigger Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center justify-center bg-[#25D366] text-white shadow-xl  transition-all duration-500 relative overflow-hidden group",
          isOpen ? "size-14 rounded-full" : "h-14 px-6 rounded-full gap-3"
        )}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.3),transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity" />

        <div className="relative">
          <AnimatePresence mode="wait">
            {isOpen ? (
              <motion.div
                key="close"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
              >
                <X className="size-6" />
              </motion.div>
            ) : (
              <motion.div
                key="chat"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
                className="relative"
              >
                <MessageCircle className="size-7" fill="currentColor" fillOpacity={0.1} />
                <div className="absolute -right-1 -top-1 size-3 rounded-full border-2 border-[#25D366] bg-white animate-pulse" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {!isOpen && (
            <motion.span
              initial={{ opacity: 0, x: -10, width: 0 }}
              animate={{ opacity: 1, x: 0, width: "auto" }}
              exit={{ opacity: 0, x: -10, width: 0 }}
              className="whitespace-nowrap text-sm font-bold tracking-tight overflow-hidden"
            >
              Chat with {recipientName}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  )
}

