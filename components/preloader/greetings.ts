export type Greeting = {
  word: string;
  language: string;
  /** BCP 47 tag — drives font selection and screen-reader pronunciation. */
  lang: string;
  dir?: "ltr" | "rtl";
  /** CSS font-family stack for this script. */
  font: string;
  /** Optical size multiplier so every script reads at a similar visual weight and fits the viewport. */
  scale: number;
  /** How long the word stays on screen, in ms. */
  hold: number;
};

const SERIF = "var(--font-instrument-serif), 'Times New Roman', serif";

export const GREETINGS: readonly Greeting[] = [
  { word: "Hello", language: "English", lang: "en", font: SERIF, scale: 1, hold: 900 },
  { word: "Bonjour", language: "French", lang: "fr", font: SERIF, scale: 1, hold: 620 },
  { word: "Hola", language: "Spanish", lang: "es", font: SERIF, scale: 1, hold: 620 },
  { word: "Ciao", language: "Italian", lang: "it", font: SERIF, scale: 1, hold: 620 },
  { word: "Hallo", language: "German", lang: "de", font: SERIF, scale: 1, hold: 620 },
  {
    word: "مرحبا",
    language: "Arabic",
    lang: "ar",
    dir: "rtl",
    font: "var(--font-arabic), 'Geeza Pro', 'Noto Naskh Arabic', serif",
    scale: 0.78,
    hold: 640,
  },
  {
    word: "こんにちは",
    language: "Japanese",
    lang: "ja",
    font: "var(--font-jp), 'Hiragino Mincho ProN', 'Yu Mincho', serif",
    scale: 0.56,
    hold: 640,
  },
  {
    word: "안녕하세요",
    language: "Korean",
    lang: "ko",
    font: "var(--font-kr), 'AppleMyungjo', 'Batang', serif",
    scale: 0.56,
    hold: 640,
  },
  {
    word: "नमस्ते",
    language: "Hindi",
    lang: "hi",
    font: "var(--font-devanagari), 'Kohinoor Devanagari', 'Noto Serif Devanagari', serif",
    scale: 0.74,
    hold: 650,
  },
];
