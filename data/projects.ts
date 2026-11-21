export type ProjectStatus = "placeholder" | "ready";

export type ProjectImage = {
  src: string;
  alt: string;
  width: number;
  height: number;
  /** object-position (focal point) when cropped into a card. */
  position?: string;
};

/** Frame colour (Play/Exploration cards). Peach is reserved for the Hello card. */
export type Tone = "blue" | "mint" | "green" | "lavender";
/** Placeholder cover fill. */
export type Cover = "pink" | "orange" | "green" | "blue" | "rose";
/** Selected Work banner: one fixed colour + layout per project. */
export type SheetLook = "lime" | "white" | "black";

export type Project = {
  slug: string;
  number: string;
  title: string;
  /** Only where given or stated by the project name; Play falls back to "Exploration". */
  tag?: string;
  status: ProjectStatus;
  /** true → Selected Work (with a /work/[slug] page); false → Play. */
  featured: boolean;
  summary?: string;
  role?: string;
  tools?: string[];
  /** Cover images. Missing ones render as typographic placeholders. */
  images?: ProjectImage[];
  /** External link, opened in a new tab. Selected Work: case-study deck. Exploration: the only clickable card. */
  link?: string;
  /** Frame colour — explorations only. */
  tone?: Tone;
  /** Cover colour (a --cover-* token) — explorations only. */
  cover?: Cover;
  /** Exploration: shows the "Available to download" chip on its card. */
  downloadable?: boolean;
  /** Selected Work only: banner look, never changes on hover, scroll or focus. */
  sheet?: SheetLook;
};

export const projects: Project[] = [
  /* ---------- Selected Work (featured), in display order ---------- */
  { slug: "ideaforge-taj-hotel", number: "01", title: "Ideaforge × Taj Hotel", tag: "Design Process", status: "placeholder", featured: true, sheet: "lime",
    link: "https://www.figma.com/deck/AWHwA29SHxzxwLSaTaVh0l/TAJ-CASE-STUDY?node-id=4-2&t=Us6LCThmtsMg5AP3-1&scaling=min-zoom&content-scaling=fixed&page-id=0%3A1" },
  { slug: "government-school-education", number: "02", title: "Government School Education", tag: "Design Process", status: "placeholder", featured: true, sheet: "white",
    link: "https://www.figma.com/deck/dm54fOjT2iMtk1Oy6NheQz/GOVERNMENT-SCHOOL-EDUCATION-CASE-STUDY?node-id=4-2&t=IQ0ZjqlHkEmqNYNh-1&scaling=min-zoom&content-scaling=fixed&page-id=0%3A1" },
  { slug: "rapido", number: "03", title: "Rapido", tag: "Service Design", status: "placeholder", featured: true, sheet: "black",
    link: "https://www.figma.com/deck/b8q5iHcyWSC6I4CU5ZAGuQ/Rapido-Visually-Guided-Smart-Pickup-UX-Case-Study?node-id=3-2&t=0Tq0nfUBbabHrLwb-1&scaling=min-zoom&content-scaling=fixed&page-id=0%3A1" },

  /* ---------- Play (explorations), in display order ---------- */
  { slug: "field-research", number: "01", title: "Field Research", status: "placeholder", featured: false, tone: "blue", cover: "pink",
    images: [{ src: "/explorations/field-research.webp", alt: "Aarsh and a friend taking a selfie in an auto-rickshaw in Rajpura, Punjab, with a GPS camera stamp of the location and date", width: 2000, height: 1500, position: "50% 50%" }] },
  { slug: "first-year-color-module", number: "02", title: "1st Year Color Module", status: "placeholder", featured: false, tone: "mint", cover: "orange",
    images: [{ src: "/explorations/first-year-color-module.webp", alt: "Colour wheel of twelve hand-cut paper swatches on white, from yellow through red, brown, navy, blue and green", width: 1274, height: 1894, position: "50% 45%" }] },
  { slug: "eduwand", number: "03", title: "EduWand", tag: "UI Freelancing", status: "placeholder", featured: false, downloadable: true, tone: "mint", cover: "pink",
    images: [{ src: "/explorations/eduwand.webp", alt: "Phone showing a teacher's home screen with a purple lesson card and weekly calendar", width: 2000, height: 1500, position: "50% 50%" }] },
  { slug: "mehars-delicacy", number: "04", title: "Mehar's Delicacy", tag: "UI Freelancing", status: "placeholder", featured: false, downloadable: true, tone: "green", cover: "orange",
    images: [{ src: "/explorations/mehars-delicacy.webp", alt: "Phone on an orange sofa showing the Mehar's Delicacy welcome screen with a palace photo", width: 1452, height: 1083, position: "50% 50%" }] },
  { slug: "photography", number: "05", title: "Photography", status: "placeholder", featured: false, tone: "green", cover: "green",
    images: [{ src: "/explorations/photography.webp", alt: "Peach trumpet-shaped flowers among green leaves under a cloudy sky", width: 1500, height: 2000, position: "50% 50%" }] },
  { slug: "adobe-workshop-branding", number: "06", title: "Adobe Workshop", tag: "Branding", status: "placeholder", featured: false, tone: "lavender", cover: "blue",
    images: [{ src: "/explorations/adobe-workshop-branding.webp", alt: "Hand with tropical nail art holding a Lotta Colada sparkling fruit drink can", width: 941, height: 1672, position: "50% 55%" }] },
  { slug: "samsung-infographic", number: "07", title: "Samsung", tag: "Infographic", status: "placeholder", featured: false, tone: "blue", cover: "rose",
    images: [{ src: "/explorations/samsung-infographic.webp", alt: "Five tablets showing Samsung revenue, profit and market-share dashboards in blue", width: 1920, height: 1280, position: "50% 50%" }] },
  { slug: "lumi-gamification", number: "08", title: "LUMI", tag: "Gamification", status: "placeholder", featured: false, tone: "lavender", cover: "green",
    images: [{ src: "/explorations/lumi-gamification.webp", alt: "Phone on green fabric showing a skincare product page for a hydration serum", width: 1450, height: 1085, position: "50% 50%" }] },
  { slug: "html-css-website", number: "09", title: "HTML/CSS", tag: "Website", status: "ready", featured: false, tone: "blue", cover: "blue",
    link: "https://aarshsingh2445992001.netlify.app",
    images: [{ src: "/explorations/html-css-website.webp", alt: "KYRO website contact page with a Get in touch form and a jewellery photo", width: 2000, height: 1138, position: "25% 50%" }] },
  { slug: "calligraphy", number: "10", title: "Calligraphy", tag: "Devanagari font & more", status: "placeholder", featured: false, tone: "mint", cover: "rose",
    images: [{ src: "/explorations/calligraphy.webp", alt: "Certificate of participation for Aarsh Singh from The Calligraphy Foundation's 5-day workshop", width: 2000, height: 1414, position: "50% 50%" }] },
];

export const featuredProjects = projects.filter((p) => p.featured);
export const playProjects = projects.filter((p) => !p.featured);

/** Exploration detail lookup — non-featured projects only. */
export function getExploration(slug: string): Project | undefined {
  return playProjects.find((p) => p.slug === slug);
}

/** Case-study lookup — featured projects only. */
export function getProject(slug: string): Project | undefined {
  return featuredProjects.find((p) => p.slug === slug);
}
