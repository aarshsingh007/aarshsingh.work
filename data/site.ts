/*
 * All site copy lives here. Anything not yet provided is marked as a
 * placeholder — nothing is invented.
 */

export type NavLink = { label: string; href: `#${string}` };

/** Pointer effect on the hero headline. "none" today; kept as a flag for later. */
export const HEADLINE_HOVER: "none" = "none";

export type HeadlineLine = { text: string; italic?: boolean; highlight?: boolean };




/** `position` = object-position (focal point) inside the 4:5 frame. */
export type AboutPhoto = { src: string; alt: string; position?: string };

/** Signature image (transparent PNG in public/), shown under the meta line. */
export type AboutSignature = { src: string; width: number; height: number };

export type AboutContent = {
  heading: string;
  /** Word inside `heading` set in italic with the lime highlighter. */
  highlight: string;
  paragraphs: readonly string[];
  meta?: string;
  /** Phrase in the paragraphs that gets a lime marker once the copy has inked in. */
  emphasis?: string;
  badge: string;
  /** Portrait in public/about/. Without it a lime "Photo coming soon" panel shows. */
  photo?: AboutPhoto;
  /** Signature under the meta line; nothing renders without it. */
  signature?: AboutSignature;
};

const about: AboutContent = {
  heading: "Hi! I'm Aarsh.",
  highlight: "Aarsh",
  paragraphs: [
    "Based in Chandigarh, India, I'm a UX designer passionate about turning ideas into meaningful digital experiences.",
    "I like looking at everyday things from a different perspective. Small problems, missed details and little things people often overlook are what spark my curiosity. I enjoy turning these observations into ideas and creating experiences that make things simpler, better and more interesting. Whether it's improving an existing design or exploring something completely new, I like questioning the usual and finding better ways to do things. I believe great design starts with noticing what others might miss.",
  ],
  meta: "UI/UX Design student, Chitkara University",
  emphasis: "noticing what others might miss",
  photo: {
    src: "/about/portrait.webp",
    alt: "Aarsh Singh smiling in a dark grey hoodie, seated at a café table",
    position: "50% 25%",
  },
  signature: { src: "/about/signature.png", width: 307, height: 127 },
  badge: "USER EXPERIENCE · VISUAL DESIGN · CREATIVE THINKING ·",
};

/** Contact section colour theme. */
export const CONTACT_THEME: "dark" | "light" = "dark";

export type ContactIcon = "mail" | "linkedin" | "behance" | "download";

/** One contact row. Leave email/url empty to show it dimmed as "Coming soon". */
export type ContactRow =
  | { kind: "email"; label: string; email: string; icon: ContactIcon }
  | { kind: "link"; label: string; url: string; icon: ContactIcon };

export type ContactContent = {
  heading: { before: string; accent: string };
  subline: string;
  cursor: string;
  rows: readonly ContactRow[];
  ui: { copy: string; copied: string; stamp: string; copiedAnnouncement: string; comingSoon: string; newTab: string };
  /** Cursor labels over the contact rows (email row, link rows, Copy button, "coming soon" row). */
  rowCursor: { email: string; link: string; copy: string; soon: string };
  footer: {
    /** "{year}" is replaced with the current year. */
    copyright: string;
    links: readonly NavLink[];
    backToTop: string;
  };
};

const contact: ContactContent = {
  heading: { before: "Let's", accent: "connect" },
  subline: "Have a project, an opportunity, or a thought about design? I'd love to hear from you.",
  /** Custom cursor label over empty areas of the Contact section. */
  cursor: "Say hi",
  rows: [
    { kind: "email", label: "Email", email: "aarshsingh5003@gmail.com", icon: "mail" },
    { kind: "link", label: "LinkedIn", url: "https://www.linkedin.com/in/aarshsingh5003", icon: "linkedin" },
    { kind: "link", label: "Behance", url: "https://www.behance.net/aarshsingh4", icon: "behance" },
    // Resume lives on Google Drive, so it opens in a new tab like the other links.
    { kind: "link", label: "Download resume", url: "https://drive.google.com/file/d/15AGUESJvBqoq6LNpGkHCTl0o-ZIN8CMR/view?usp=sharing", icon: "download" },
  ],
  ui: {
    copy: "Copy",
    copied: "Copied ✓",
    stamp: "Copied",
    copiedAnnouncement: "Email address copied to clipboard",
    comingSoon: "Coming soon",
    newTab: "opens in a new tab",
  },
  rowCursor: { email: "Write", link: "Open ↗", copy: "Copy", soon: "Soon" },
  footer: {
    copyright: "© {year} Aarsh Singh",
    links: [
      { label: "Work", href: "#work" },
      { label: "About", href: "#about" },
      { label: "Play", href: "#play" },
      { label: "Exploration", href: "#exploration" },
    ],
    backToTop: "Back to top ↑",
  },
};

export const site = {
  name: "Aarsh Singh",
  mark: "®",
  role: "UI/UX Design Student",
  country: "India",

  /** TODO(Aarsh): set NEXT_PUBLIC_SITE_URL once the domain is live. */
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",

  seo: {
    title: "Aarsh Singh — UI/UX Design Portfolio",
    titleTemplate: "%s — Aarsh Singh",
    description:
      "Portfolio of Aarsh Singh, a UI/UX design student in India — designing digital experiences built around people, purpose & possibility.",
    keywords: ["Aarsh Singh", "UI/UX", "UX design", "product design", "portfolio", "India"],
  },

  nav: [
    { label: "Work", href: "#work" },
    { label: "About", href: "#about" },
    { label: "Play", href: "#play" },
    { label: "Contact", href: "#contact" },
  ] satisfies NavLink[],

  /** "Available for work" pill in the nav. */
  availability: {
    label: "Available for work",
    hover: "Let's talk",
    href: "#contact",
  },

  clock: {
    timeZone: "Asia/Kolkata",
    label: "IST",
  },

  hero: {
    headline: [
      { text: "Designing" },
      { text: "digital", italic: true, highlight: true },
      { text: "experiences" },
    ] satisfies HeadlineLine[],
    subline: "Built around people, purpose & possibility.",
    cta: { label: "See the work", href: "#work" },
    /** Runs around the rotating badge; end with a separator so it loops cleanly. */
    badge: "UI/UX DESIGN STUDENT · BASED IN INDIA ·",
  },

  about,

  work: {
    heading: "Selected Work",
    viewCase: "View case study",
    comingSoon: "Case study coming soon",
    back: "Back to work",
  },

  play: {
    heading: "Play",
    previewLabel: "Explorations preview",
    fallbackTag: "Exploration",
    /* Photo board (items live in data/play.ts). */
    hint: "Drag anything. Click a photo to enlarge.",
    shuffle: "Shuffle",
    tidy: "Tidy up",
    boardLabel: "Photo board",
    boardInstructions:
      "Each item can be dragged, or focused and moved with the arrow keys (hold Shift for bigger steps). Press Enter on a photo to see it larger.",
    announceShuffle: "Items shuffled",
    announceTidy: "Items tidied into a grid",
    viewer: { close: "Close", previous: "Previous photo", next: "Next photo", dialogLabel: "Photo viewer" },
    hello: {
      label: "Nice to see you",
      category: "Hello",
      /* Tap the photo to flip between now and then. `position` = object-position (focal point). */
      now: { src: "/hello/now.webp", alt: "Aarsh Singh, smiling, in a black embroidered kurta", label: "Now", position: "50% 32%" },
      then: { src: "/hello/then.jpg", alt: "Aarsh as a kid in sunglasses and a yellow T-shirt, on a boat", label: "Then", position: "50% 42%" },
      flipToThen: "Show a childhood photo",
      flipToNow: "Show the current photo",
    },
  },

  exploration: {
    heading: "Exploration",
    regionLabel: "Explorations",
    hint: "Hover to pause, drag to browse",
    /** Chip on cards marked `downloadable` in data/projects.ts. */
    downloadable: "Available to download",
    pause: "Pause",
    play: "Play",
    /** Auto-scroll speed (px/s) and the pause before it resumes after hover/focus/drag (ms). */
    speed: 40,
    resumeDelay: 500,
    comingSoon: "Details coming soon",
    back: "Back to exploration",
    visit: "Visit project",
  },

  contact,

  /** Empty sections the nav anchors to — content comes later. */
  sections: [] as readonly { id: string; title: string }[],
} as const;
