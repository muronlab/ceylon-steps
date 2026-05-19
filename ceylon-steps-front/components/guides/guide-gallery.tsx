"use client"

import React, { useState, useEffect } from "react"
import Image from "next/image"
import { motion, AnimatePresence } from "motion/react"
import { X, ChevronLeft, ChevronRight, Maximize2, Camera } from "lucide-react"

interface GalleryImage {
  src: string
  alt: string
  width?: number
  height?: number
}

interface GuideGalleryProps {
  images?: GalleryImage[]
  title?: string
}

const defaultImages: GalleryImage[] = [
  { src: "https://images.unsplash.com/photo-1546708973-b339540b5162?auto=format&fit=crop&q=80&w=1200", alt: "Sigiriya Rock" },
  { src: "https://images.unsplash.com/photo-1588598116712-2f06ff5a1c9f?auto=format&fit=crop&q=80&w=1200", alt: "Temple of the Tooth" },
  { src: "https://images.unsplash.com/photo-1544013919-4b4bea4bd53e?auto=format&fit=crop&q=80&w=1200", alt: "Tea Plantations" },
  { src: "https://images.unsplash.com/photo-1563182110-33069106e294?auto=format&fit=crop&q=80&w=1200", alt: "Sri Lankan Elephant" },
  { src: "https://images.unsplash.com/photo-1620619767323-b95a8998393c?auto=format&fit=crop&q=80&w=1200", alt: "Nine Arches Bridge" },
  { src: "https://images.unsplash.com/photo-1580541631971-8739a850162a?auto=format&fit=crop&q=80&w=1200", alt: "Galle Fort Lighthouse" },
]

export function GuideGallery({ images = defaultImages, title = "Memories & Milestones" }: GuideGalleryProps) {
  const [index, setIndex] = useState<number | null>(null)

  useEffect(() => {
    if (index !== null) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "auto"
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIndex(null)
      if (e.key === "ArrowRight") setIndex((prev) => (prev !== null && prev < images.length - 1 ? prev + 1 : prev))
      if (e.key === "ArrowLeft") setIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : prev))
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [index, images.length])
  return (
    <section id="gallery" className="mt-12 scroll-mt-24">
      <div className="flex items-center justify-between gap-4 px-1">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-zinc-950 sm:text-2xl">{title}</h2>
          <p className="mt-1 text-sm text-zinc-500">A glimpse into the experiences we share.</p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3 lg:gap-4">
        {images.slice(0, 5).map((image, i) => (
          <motion.div
            key={image.src + i}
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05 }}
            onClick={() => setIndex(i)}
            className={cn(
              "group relative overflow-hidden rounded-3xl bg-zinc-100 ring-1 ring-zinc-200/50 cursor-zoom-in",
              i === 0 ? "col-span-2 row-span-2 aspect-[4/5] sm:aspect-auto" : "aspect-square"
            )}
          >
            <Image
              src={image.src}
              alt={image.alt}
              fill
              className="object-cover transition duration-500 group-hover:scale-105"
              sizes={i === 0 ? "(max-width: 768px) 100vw, 50vw" : "(max-width: 768px) 50vw, 25vw"}
            />
            
            {/* Overlay for all images */}
            <div className="absolute inset-0 bg-black/0 transition duration-500 group-hover:bg-black/10 grid place-items-center">
              {i !== 4 && <Maximize2 className="size-8 text-white opacity-0 transition duration-500 group-hover:opacity-100 group-hover:scale-110" />}
            </div>

            {/* Special "See more" overlay for the 5th image (index 4) */}
            {i === 4 && (
              <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px] transition duration-500 group-hover:bg-black/40 flex items-center justify-center p-2">
                <div className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-zinc-950 shadow-lg flex items-center gap-2 transition hover:scale-105">
                  <Camera className="size-4" />
                  See more
                </div>
              </div>
            )}

            {/* Caption (except for the "See more" image) */}
            {i !== 4 && (
              <div className="absolute bottom-4 left-4 right-4 translate-y-2 opacity-0 transition duration-500 group-hover:translate-y-0 group-hover:opacity-100">
                <div className="rounded-full bg-black/20 px-3 py-1 text-[10px] font-medium text-white backdrop-blur-md ring-1 ring-white/20 inline-block">
                  {image.alt}
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {index !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 p-4 backdrop-blur-xl md:p-10"
            onClick={() => setIndex(null)}
          >
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute right-6 top-6 z-[210] flex size-12 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-xl transition hover:bg-white/20"
              onClick={(e) => {
                e.stopPropagation()
                setIndex(null)
              }}
            >
              <X className="size-6" />
            </motion.button>

            {index > 0 && (
              <button
                className="absolute left-6 z-[210] hidden size-14 items-center justify-center rounded-full bg-white/5 text-white backdrop-blur-xl transition hover:bg-white/10 md:flex"
                onClick={(e) => {
                  e.stopPropagation()
                  setIndex(index - 1)
                }}
              >
                <ChevronLeft className="size-8" />
              </button>
            )}

            {index < images.length - 1 && (
              <button
                className="absolute right-6 z-[210] hidden size-14 items-center justify-center rounded-full bg-white/5 text-white backdrop-blur-xl transition hover:bg-white/10 md:flex"
                onClick={(e) => {
                  e.stopPropagation()
                  setIndex(index + 1)
                }}
              >
                <ChevronRight className="size-8" />
              </button>
            )}

            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative aspect-[4/3] w-full max-w-5xl overflow-hidden rounded-4xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={images[index].src}
                alt={images[index].alt}
                fill
                className="object-contain"
                priority
              />
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-black/20 px-6 py-2 text-sm font-medium text-white backdrop-blur-2xl ring-1 ring-white/10">
                {images[index].alt}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(" ")
}
