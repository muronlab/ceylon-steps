"use client"

import { useState } from "react"
import { Pencil, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { GuideProfile } from "@/services/guide-profile.service"
import { BioContent } from "./bio-content"
import { RichBioEditor } from "./rich-bio-editor"

function looksLikeHtml(s: string | null | undefined): boolean {
  if (!s) return false
  return /<\w+[^>]*>/.test(s)
}

export function BioEditor({
  profile,
  onSave,
}: {
  profile: GuideProfile
  onSave: (payload: { bio: string | null }) => Promise<void>
}) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  function startEdit() {
    setEditing(true)
  }

  async function save(html: string) {
    setSaving(true)
    try {
      await onSave({ bio: html.trim() ? html : null })
      setEditing(false)
    } catch {
      // parent renders top-level error
    } finally {
      setSaving(false)
    }
  }

  // Initial HTML for the editor: existing bio if it's HTML, plain text wrapped
  // in <p> if it's legacy plaintext, else empty.
  const initialHtml = looksLikeHtml(profile.bio)
    ? profile.bio!
    : profile.bio
      ? `<p>${profile.bio
          .split(/\n{2,}/)
          .map((para) => para.replace(/\n/g, "<br>"))
          .join("</p><p>")}</p>`
      : ""

  return (
    <div className="mt-5 rounded-4xl bg-zinc-50 p-6 ring-1 ring-zinc-200/70">
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Bio</div>
        {!editing ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 rounded-full text-xs"
            onClick={startEdit}
          >
            <Pencil className="size-3.5" />
            Edit bio
          </Button>
        ) : (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 rounded-full text-xs"
            onClick={() => setEditing(false)}
            disabled={saving}
          >
            <X className="size-3.5" />
            Cancel
          </Button>
        )}
      </div>

      {!editing ? (
        <div className="mt-4">
          {profile.bio ? (
            looksLikeHtml(profile.bio) ? (
              <BioContent html={profile.bio} />
            ) : (
              <div className="whitespace-pre-wrap text-[15px] leading-7 text-zinc-700">
                {profile.bio}
              </div>
            )
          ) : (
            <span className="italic text-zinc-400">
              No bio yet. Click &quot;Edit bio&quot; to start — or insert the sample template to get going fast.
            </span>
          )}
        </div>
      ) : (
        <div className="mt-4">
          <RichBioEditor
            initialHtml={initialHtml}
            profile={profile}
            saving={saving}
            onCancel={() => setEditing(false)}
            onSave={save}
          />
        </div>
      )}
    </div>
  )
}
