export type Tick = "sent" | "delivered" | "read"

export type ChatMessage = {
  id: string
  /** Who sent it: the guide (me) or the traveler. */
  from: "me" | "them"
  /** ISO timestamp string. */
  at: string
  kind: "text" | "image" | "video" | "link" | "file"
  text?: string
  imageUrl?: string
  /** For "file" messages — a document attachment shown as a card. */
  file?: {
    name: string
    sizeLabel: string
    kind: "pdf" | "ppt" | "doc" | "xls" | "zip" | "other"
  }
  /** For "link" messages — embedded link preview. */
  link?: {
    title: string
    siteName: string
    url: string
    thumbUrl?: string
  }
  tick?: Tick
}

export type ChatSummary = {
  id: string
  /** Display name shown in the list and the thread header. */
  name: string
  /** Optional avatar URL — falls back to initials when missing. */
  avatarUrl?: string
  /** Short preview of the most recent message. */
  preview: string
  /** Same shape — we render an icon for image/video/document previews. */
  previewKind?: "text" | "image" | "video" | "document" | "voice"
  /** ISO timestamp of the most recent message. */
  lastAt: string
  unreadCount: number
  muted?: boolean
  /** Whether the contact is currently online (drives the green dot). */
  online?: boolean
  /** Tick state of the LAST outgoing message (drives the row tick icon). */
  lastTick?: Tick
  /** "online" | "last seen 2h ago" etc. (free text for now). */
  presence?: string
}

export type ChatThread = {
  summary: ChatSummary
  messages: ChatMessage[]
}

const now = new Date()
const todayAt = (h: number, m: number) => {
  const d = new Date(now)
  d.setHours(h, m, 0, 0)
  return d.toISOString()
}
const yesterdayAt = (h: number, m: number) => {
  const d = new Date(now)
  d.setDate(d.getDate() - 1)
  d.setHours(h, m, 0, 0)
  return d.toISOString()
}
const daysAgo = (days: number, h = 14, m = 30) => {
  const d = new Date(now)
  d.setDate(d.getDate() - days)
  d.setHours(h, m, 0, 0)
  return d.toISOString()
}

export const CHATS: ChatThread[] = [
  {
    summary: {
      id: "linda",
      name: "Linda Albert",
      preview: "Sounds perfect — see you on the 14th!",
      lastAt: todayAt(18, 24),
      unreadCount: 0,
      online: true,
      lastTick: "read",
      presence: "online",
    },
    messages: [
      {
        id: "m1",
        from: "them",
        at: yesterdayAt(9, 12),
        kind: "text",
        text: "Hi! We loved your Kandy itinerary. Do you have availability the second week of June?",
      },
      {
        id: "m2",
        from: "me",
        at: yesterdayAt(9, 18),
        kind: "text",
        text: "Hi Linda — yes! 10-15 June is open. Would you like the full 5-day plan?",
        tick: "read",
      },
      {
        id: "m3",
        from: "them",
        at: yesterdayAt(9, 26),
        kind: "text",
        text: "Yes please. We're two adults, one teen.",
      },
      {
        id: "m4",
        from: "me",
        at: yesterdayAt(10, 4),
        kind: "image",
        imageUrl:
          "https://images.unsplash.com/photo-1546708973-b339540b5162?auto=format&fit=crop&q=80&w=600",
        tick: "read",
      },
      {
        id: "m5",
        from: "me",
        at: yesterdayAt(10, 5),
        kind: "text",
        text: "Here's a quick look at one of the lunch stops on day 2.",
        tick: "read",
      },
      {
        id: "m6",
        from: "them",
        at: todayAt(17, 50),
        kind: "text",
        text: "That looks amazing. I've forwarded the dates to my husband.",
      },
      {
        id: "m7",
        from: "them",
        at: todayAt(18, 24),
        kind: "text",
        text: "Sounds perfect — see you on the 14th!",
      },
    ],
  },
  {
    summary: {
      id: "tom",
      name: "Tom Weaver",
      preview: "Photo",
      previewKind: "image",
      lastAt: todayAt(15, 12),
      unreadCount: 2,
      online: true,
      presence: "last seen today at 15:14",
    },
    messages: [
      {
        id: "m1",
        from: "them",
        at: daysAgo(3, 11, 4),
        kind: "text",
        text: "Hey, can you do a half-day Galle Fort walking tour next Saturday?",
      },
      {
        id: "m2",
        from: "me",
        at: daysAgo(3, 11, 22),
        kind: "text",
        text: "Yes — 8am to noon works, LKR 12,000 for a private group of 4.",
        tick: "read",
      },
      {
        id: "m3",
        from: "them",
        at: todayAt(15, 11),
        kind: "text",
        text: "Booked the hotel just opposite the entrance. Sending the location now.",
      },
      {
        id: "m4",
        from: "them",
        at: todayAt(15, 12),
        kind: "image",
        imageUrl:
          "https://images.unsplash.com/photo-1588598116712-2f06ff5a1c9f?auto=format&fit=crop&q=80&w=600",
      },
    ],
  },
  {
    summary: {
      id: "aisha",
      name: "Aisha Khan",
      preview: "Will the safari be cancelled if it rains?",
      lastAt: todayAt(11, 42),
      unreadCount: 1,
      presence: "last seen today at 11:42",
    },
    messages: [
      {
        id: "m1",
        from: "them",
        at: todayAt(11, 41),
        kind: "text",
        text: "Quick question before booking —",
      },
      {
        id: "m2",
        from: "them",
        at: todayAt(11, 42),
        kind: "text",
        text: "Will the safari be cancelled if it rains?",
      },
    ],
  },
  {
    summary: {
      id: "sophia",
      name: "Sophia Martinez",
      preview: "Video",
      previewKind: "video",
      lastAt: yesterdayAt(22, 5),
      unreadCount: 0,
      muted: true,
      presence: "last seen yesterday at 22:05",
    },
    messages: [
      {
        id: "m1",
        from: "them",
        at: yesterdayAt(22, 5),
        kind: "text",
        text: "Just sent a short video of the Nine Arches Bridge view — incredible!",
      },
    ],
  },
  {
    summary: {
      id: "chloe",
      name: "Chloe Simmons",
      preview: "Document: Trip-confirmation.pdf",
      previewKind: "document",
      lastAt: daysAgo(2, 16, 22),
      unreadCount: 0,
      online: true,
      lastTick: "read",
      presence: "last seen 2 days ago",
    },
    messages: [
      {
        id: "m1",
        from: "me",
        at: daysAgo(2, 16, 20),
        kind: "file",
        text: "Trip confirmation attached — see you on 5 May!",
        file: { name: "trip-confirmation.pdf", sizeLabel: "1.2 MB", kind: "pdf" },
        tick: "read",
      },
    ],
  },
  {
    summary: {
      id: "hp-innovations",
      name: "TechPulse Company",
      preview: "Reminder that we have a project meeting",
      previewKind: "text",
      lastAt: daysAgo(1, 10, 49),
      unreadCount: 0,
      lastTick: "read",
      presence: "Channel",
    },
    messages: [
      {
        id: "m1",
        from: "them",
        at: daysAgo(1, 10, 49),
        kind: "link",
        link: {
          title: "Project sync notes",
          siteName: "techpulse.com",
          url: "https://techpulse.com/notes",
          thumbUrl:
            "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=400",
        },
      },
    ],
  },
  {
    summary: {
      id: "kavindi",
      name: "Kavindi Perera",
      preview: "Voice note — could you call back when free?",
      previewKind: "voice",
      lastAt: daysAgo(4, 19, 11),
      unreadCount: 0,
      presence: "last seen 4 days ago",
    },
    messages: [
      {
        id: "m1",
        from: "them",
        at: daysAgo(4, 19, 11),
        kind: "text",
        text: "Voice note — could you call back when free?",
      },
    ],
  },
]
