/*
 * Play photo board — all content lives here.
 * Photos live in public/play/ (photo-NN.webp unless a file name is given); alt text below.
 * Optional caption/tag show under a photo and in the viewer.
 */

export type PlayTone = "blue" | "mint" | "green" | "lavender" | "peach";
export type PlayCover = "pink" | "orange" | "green" | "blue" | "rose";
export type PlayAspect = "portrait" | "landscape" | "square";

export type PlayPhoto = {
  id: string;
  kind: "photo";
  /** Path under public/, e.g. "/play/photo-01.jpg". Empty → placeholder. */
  src?: string;
  alt: string;
  caption?: string;
  tag?: string;
  aspect: PlayAspect;
  /** Frame colour. */
  tone: PlayTone;
  /** Placeholder fill (used only while there's no src). */
  cover: PlayCover;
  status: "placeholder" | "ready";
};

export type PlayNote = {
  id: string;
  kind: "note";
  value: string;
  label: string;
  status: "ready";
};

export type PlayItem = PlayPhoto | PlayNote;

/** `file` overrides the default public/play/photo-NN.webp name. */
const photo = (n: number, aspect: PlayAspect, tone: PlayTone, cover: PlayCover, alt: string, file?: string): PlayPhoto => {
  const num = String(n).padStart(2, "0");
  const src = `/play/${file ?? `photo-${num}.webp`}`;
  return { id: `photo-${num}`, kind: "photo", src, alt, aspect, tone, cover, status: "ready" };
};

export const playItems: PlayItem[] = [
  photo(1, "landscape", "blue", "pink", "Two friends smiling in an auto-rickshaw, with a GPS camera stamp from Rajpura, Punjab"),
  photo(2, "portrait", "mint", "orange", "Childhood photo: a boy in a blue T-shirt eating an ice lolly on a park path", "photo-02-childhood.webp"),
  photo(3, "landscape", "green", "blue", "Selfie with a class of school students in maroon uniforms while a team member holds a laptop, with a GPS camera stamp from Rajpura"),
  photo(4, "landscape", "lavender", "rose", "School students gathered around a table in a computer lab as a team member shows them something, with a GPS camera stamp from Rajpura"),
  photo(5, "portrait", "peach", "green", "Childhood photo: a smiling boy in a grey striped hoodie"),
  photo(6, "portrait", "blue", "orange", "Four friends leaning on a red café table, looking at the camera"),
  photo(7, "landscape", "mint", "blue", "Three students in Chitkara University polos sketching on paper at a table"),
  photo(8, "landscape", "green", "pink", "Four students posing in front of the DesignUp Day backdrop at Chitkara University"),
  { id: "note-teacher", kind: "note", value: "2", label: "Teacher testing sessions", status: "ready" },
  { id: "note-students", kind: "note", value: "5+", label: "Student group sessions", status: "ready" },
  { id: "note-projects", kind: "note", value: "6+", label: "Product design projects", status: "ready" },
  { id: "note-freelance", kind: "note", value: "5", label: "Freelance projects", status: "ready" },
];
