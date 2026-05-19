"use client"

import { useEffect, useState } from "react"
import { EditorContent, useEditor, type Editor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Placeholder from "@tiptap/extension-placeholder"
import Underline from "@tiptap/extension-underline"
import Link from "@tiptap/extension-link"
import {
  Bold,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Quote,
  Redo2,
  RemoveFormatting,
  Underline as UnderlineIcon,
  Undo2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { GuideProfile } from "@/services/guide-profile.service"

const SAMPLE_TEMPLATE = `
<h1>Welcome to Sri Lanka with [your name] – Your Expert Local Guide</h1>
<blockquote><em>“Add a memorable quote about your tours here.”</em></blockquote>
<p>I'm <strong>[your name]</strong>, a licensed guide based in <strong>[your city]</strong>. For the last <strong>[number]</strong> years I've shown travelers from all over the world the very best of Sri Lanka.</p>
<h2>Why travel with me?</h2>
<p>When you book with me, you're not just getting a guide — you're getting a friend who knows the country inside out. I specialise in:</p>
<ul>
  <li><strong>Cultural &amp; Heritage Tours</strong> (Sigiriya, Kandy, ancient capitals)</li>
  <li><strong>Nature &amp; Wildlife</strong> (safaris, birdwatching, eco-tours)</li>
  <li>Scenic train rides through the hill country</li>
  <li>Beach &amp; relaxation experiences</li>
  <li><strong>Adventure</strong> (cycling, hiking, marine tours)</li>
</ul>
<h2>My commitment to you</h2>
<ul>
  <li><strong>Hassle-free travel</strong> — I handle every logistic so you can enjoy the journey.</li>
  <li><strong>Comfortable transport</strong> — modern, insured vehicles for any group size.</li>
  <li><strong>Local insights</strong> — hidden gems beyond the guidebooks.</li>
</ul>
<h2>About me</h2>
<p>I hold a <strong>B.A. in Travel &amp; Tourism</strong> and am certified by the Sri Lanka Tourist Board. My mission is simple: to make you fall in love with Sri Lanka as much as I do.</p>
`.trim()

/** Escape user-supplied strings before inserting into HTML. */
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

/** First comma-separated chunk of the address (typically the city/area). */
function cityFromAddress(address: string | null | undefined): string {
  if (!address) return ""
  const first = address.split(",")[0]?.trim()
  return first ?? ""
}

/** Build the sample HTML with placeholders filled in from the profile. */
function buildTemplate(profile: GuideProfile): string {
  const name = profile.displayName?.trim() || profile.fullName?.trim() || ""
  const city = cityFromAddress(profile.address)
  const years =
    profile.yearsOfExperience !== null && profile.yearsOfExperience !== undefined
      ? String(profile.yearsOfExperience)
      : ""

  const replacements: Record<string, string> = {
    "[your name]": name ? escapeHtml(name) : "[your name]",
    "[your city]": city ? escapeHtml(city) : "[your city]",
    "[number]": years ? escapeHtml(years) : "[number]",
  }

  return Object.entries(replacements).reduce(
    (html, [token, value]) => html.split(token).join(value),
    SAMPLE_TEMPLATE,
  )
}

type ToolButtonProps = {
  onClick: () => void
  active?: boolean
  disabled?: boolean
  title: string
  children: React.ReactNode
}

function ToolButton({ onClick, active, disabled, title, children }: ToolButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
      aria-pressed={!!active}
      className={cn(
        "grid size-8 place-items-center rounded-lg text-zinc-700 transition",
        "hover:bg-zinc-100 hover:text-zinc-950",
        "disabled:cursor-not-allowed disabled:opacity-50",
        active && "bg-zinc-950 text-white hover:bg-zinc-950 hover:text-white",
      )}
    >
      {children}
    </button>
  )
}

function Divider() {
  return <span aria-hidden className="mx-1 h-5 w-px bg-zinc-200" />
}

function Toolbar({ editor }: { editor: Editor }) {
  const setLink = () => {
    const previous = editor.getAttributes("link").href as string | undefined
    const url = window.prompt("Link URL", previous ?? "https://")
    if (url === null) return
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run()
      return
    }
    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: url, target: "_blank", rel: "noopener noreferrer" })
      .run()
  }

  return (
    <div className="flex flex-wrap items-center gap-0.5 rounded-2xl bg-white p-1.5 ring-1 ring-zinc-200/70">
      <ToolButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        active={editor.isActive("heading", { level: 1 })}
        title="Title (H1)"
      >
        <span className="text-xs font-bold">H1</span>
      </ToolButton>
      <ToolButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        active={editor.isActive("heading", { level: 2 })}
        title="Section heading (H2)"
      >
        <span className="text-xs font-bold">H2</span>
      </ToolButton>
      <ToolButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        active={editor.isActive("heading", { level: 3 })}
        title="Sub-heading (H3)"
      >
        <span className="text-xs font-bold">H3</span>
      </ToolButton>
      <ToolButton
        onClick={() => editor.chain().focus().setParagraph().run()}
        active={editor.isActive("paragraph")}
        title="Paragraph"
      >
        <span className="text-xs font-semibold">¶</span>
      </ToolButton>

      <Divider />

      <ToolButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        active={editor.isActive("bold")}
        title="Bold (⌘B)"
      >
        <Bold className="size-3.5" />
      </ToolButton>
      <ToolButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        active={editor.isActive("italic")}
        title="Italic (⌘I)"
      >
        <Italic className="size-3.5" />
      </ToolButton>
      <ToolButton
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        active={editor.isActive("underline")}
        title="Underline (⌘U)"
      >
        <UnderlineIcon className="size-3.5" />
      </ToolButton>
      <ToolButton
        onClick={setLink}
        active={editor.isActive("link")}
        title="Insert link"
      >
        <LinkIcon className="size-3.5" />
      </ToolButton>

      <Divider />

      <ToolButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        active={editor.isActive("bulletList")}
        title="Bulleted list"
      >
        <List className="size-3.5" />
      </ToolButton>
      <ToolButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        active={editor.isActive("orderedList")}
        title="Numbered list"
      >
        <ListOrdered className="size-3.5" />
      </ToolButton>
      <ToolButton
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        active={editor.isActive("blockquote")}
        title="Quote"
      >
        <Quote className="size-3.5" />
      </ToolButton>

      <Divider />

      <ToolButton
        onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
        title="Clear formatting"
      >
        <RemoveFormatting className="size-3.5" />
      </ToolButton>

      <Divider />

      <ToolButton
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        title="Undo (⌘Z)"
      >
        <Undo2 className="size-3.5" />
      </ToolButton>
      <ToolButton
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        title="Redo (⌘⇧Z)"
      >
        <Redo2 className="size-3.5" />
      </ToolButton>
    </div>
  )
}

export function RichBioEditor({
  initialHtml,
  profile,
  onSave,
  onCancel,
  saving,
}: {
  initialHtml: string
  profile: GuideProfile
  onSave: (html: string) => Promise<void> | void
  onCancel: () => void
  saving: boolean
}) {
  const [confirmReplace, setConfirmReplace] = useState(false)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      Placeholder.configure({
        placeholder:
          "Tell travelers your story. Use H1 for a welcome title, H2 for section headings, and bullets for what you offer.",
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" },
      }),
    ],
    content: initialHtml || "",
    editorProps: {
      attributes: {
        class:
          "tiptap bio-content min-h-[260px] w-full max-w-none rounded-3xl bg-white p-6 ring-1 ring-zinc-200/70 focus:outline-none",
      },
    },
    immediatelyRender: false,
  })

  useEffect(() => {
    return () => {
      editor?.destroy()
    }
  }, [editor])

  if (!editor) {
    return (
      <div className="grid place-items-center rounded-3xl bg-white p-8 ring-1 ring-zinc-200/70">
        <div className="size-6 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-950" />
      </div>
    )
  }

  function insertTemplate() {
    if (!editor) return
    const hasContent = !editor.isEmpty
    if (hasContent && !confirmReplace) {
      setConfirmReplace(true)
      return
    }
    const filled = buildTemplate(profile)
    editor.chain().focus().setContent(filled, { emitUpdate: true }).run()
    setConfirmReplace(false)
  }

  function clearAll() {
    if (!editor) return
    editor.chain().focus().clearContent(true).run()
  }

  async function handleSave() {
    if (!editor) return
    const html = editor.isEmpty ? "" : editor.getHTML()
    await onSave(html)
  }

  return (
    <div className="grid gap-3">
      <Toolbar editor={editor} />

      <EditorContent editor={editor} />

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-3 ring-1 ring-zinc-200/70">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={insertTemplate}
            className="h-9 rounded-full text-xs"
          >
            {confirmReplace ? "Replace existing? Click again" : "Insert sample template"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearAll}
            className="h-9 rounded-full text-xs text-zinc-500 hover:text-red-600"
          >
            Clear
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onCancel}
            disabled={saving}
            className="h-9 rounded-full text-xs"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="h-9 rounded-full bg-zinc-950 px-5 text-xs font-semibold text-white hover:bg-zinc-900"
          >
            {saving ? "Saving…" : "Save bio"}
          </Button>
        </div>
      </div>

      <div className="rounded-2xl bg-zinc-50 px-4 py-3 text-xs text-zinc-500 ring-1 ring-zinc-200/70">
        Tip: travelers see your bio exactly as styled here. Use a clear welcome title at
        the top, break long content into sections with H2 headings, and use bullets for
        what you specialise in.
      </div>
    </div>
  )
}
