"use client"

import { useState } from "react"
import { Mail, MapPin, Pencil, Phone, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import type { GuideProfile } from "@/services/guide-profile.service"

type Draft = {
  email: string
  mobileNumber: string
  whatsappNumber: string
  whatsappAvailable: boolean
  address: string
}

type SavePayload = {
  email?: string
  mobileNumber?: string
  whatsappNumber?: string | null
  whatsappAvailable?: boolean
  address?: string
}

export function ContactEditor({
  profile,
  onSave,
}: {
  profile: GuideProfile
  onSave: (payload: SavePayload) => Promise<void>
}) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [draft, setDraft] = useState<Draft>({
    email: profile.email,
    mobileNumber: profile.mobileNumber,
    whatsappNumber: profile.whatsappNumber ?? "",
    whatsappAvailable: profile.whatsappAvailable,
    address: profile.address,
  })

  function startEdit() {
    setDraft({
      email: profile.email,
      mobileNumber: profile.mobileNumber,
      whatsappNumber: profile.whatsappNumber ?? "",
      whatsappAvailable: profile.whatsappAvailable,
      address: profile.address,
    })
    setEditing(true)
  }

  async function save() {
    setSaving(true)
    try {
      await onSave({
        email: draft.email.trim(),
        mobileNumber: draft.mobileNumber.trim(),
        whatsappNumber: draft.whatsappNumber.trim() || null,
        whatsappAvailable: draft.whatsappAvailable,
        address: draft.address.trim(),
      })
      setEditing(false)
    } catch {
      // top-level error is rendered by the parent
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-4xl bg-white p-5 ring-1 ring-zinc-200/70">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-zinc-950">Contact</div>
        {!editing ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 rounded-full text-xs"
            onClick={startEdit}
          >
            <Pencil className="size-3.5" />
            Edit
          </Button>
        ) : (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 rounded-full text-xs"
            onClick={() => setEditing(false)}
          >
            <X className="size-3.5" />
            Cancel
          </Button>
        )}
      </div>

      {!editing ? (
        <div className="mt-3 grid gap-3 text-sm text-zinc-700">
          <Row icon={<Mail className="mt-0.5 size-4 shrink-0 text-zinc-500" />} label="Email" value={profile.email} />
          <Row icon={<Phone className="mt-0.5 size-4 shrink-0 text-zinc-500" />} label="Telephone" value={profile.mobileNumber} />
          <Row
            icon={<Phone className="mt-0.5 size-4 shrink-0 text-zinc-500" />}
            label="WhatsApp"
            value={profile.whatsappNumber ?? (profile.whatsappAvailable ? profile.mobileNumber : "—")}
          />
          <Row icon={<MapPin className="mt-0.5 size-4 shrink-0 text-zinc-500" />} label="Address" value={profile.address} />
        </div>
      ) : (
        <div className="mt-3 grid gap-3">
          <FieldBlock label="Email">
            <Input
              type="email"
              value={draft.email}
              onChange={(e) => setDraft((d) => ({ ...d, email: e.target.value }))}
              className="h-10 rounded-2xl"
            />
          </FieldBlock>
          <FieldBlock label="Telephone">
            <Input
              value={draft.mobileNumber}
              onChange={(e) => setDraft((d) => ({ ...d, mobileNumber: e.target.value }))}
              className="h-10 rounded-2xl"
              placeholder="+947XXXXXXXX"
            />
          </FieldBlock>
          <FieldBlock label="WhatsApp number">
            <Input
              value={draft.whatsappNumber}
              onChange={(e) => setDraft((d) => ({ ...d, whatsappNumber: e.target.value }))}
              className="h-10 rounded-2xl"
              placeholder="Leave blank if same as telephone"
            />
            <div className="mt-2 flex items-center gap-2">
              <Checkbox
                id="whatsappAvailable"
                checked={draft.whatsappAvailable}
                onCheckedChange={(v) => setDraft((d) => ({ ...d, whatsappAvailable: v === true }))}
              />
              <Label htmlFor="whatsappAvailable" className="text-xs text-zinc-600">
                Available on WhatsApp
              </Label>
            </div>
          </FieldBlock>
          <FieldBlock label="Address">
            <Textarea
              value={draft.address}
              onChange={(e) => setDraft((d) => ({ ...d, address: e.target.value }))}
              rows={3}
              className="rounded-2xl"
            />
          </FieldBlock>

          <div className="flex justify-end">
            <Button
              type="button"
              disabled={saving}
              onClick={save}
              className="h-10 rounded-full bg-zinc-950 px-5 text-sm font-semibold text-white hover:bg-zinc-900"
            >
              {saving ? "Saving…" : "Save"}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      {icon}
      <div className="min-w-0">
        <div className="text-xs font-semibold text-zinc-500">{label}</div>
        <div className="mt-0.5 break-all font-medium text-zinc-800">{value}</div>
      </div>
    </div>
  )
}

function FieldBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-xs font-semibold text-zinc-600">{label}</Label>
      {children}
    </div>
  )
}
