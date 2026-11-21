import {
  DM_Sans,
  Instrument_Serif,
  Noto_Naskh_Arabic,
  Noto_Serif_Devanagari,
  Noto_Serif_JP,
  Noto_Serif_KR,
} from "next/font/google";

/*
 * Variable names are prefixed (--font-dm-sans, --font-instrument-serif) so
 * they don't collide with Tailwind's own --font-sans / --font-serif tokens,
 * which are mapped onto these in globals.css.
 */

/* DM Sans as a true variable font — real bold, never synthesised. */
export const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

/* Instrument Serif ships a single weight (400) in roman + italic. */
export const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-instrument-serif",
  display: "swap",
});

/*
 * Script-specific faces for the preloader greetings. Not
 * preloaded; only the glyphs actually used are fetched via unicode-range.
 */
export const notoArabic = Noto_Naskh_Arabic({
  subsets: ["arabic"],
  weight: "400",
  variable: "--font-arabic",
  display: "swap",
  preload: false,
});

export const notoDevanagari = Noto_Serif_Devanagari({
  subsets: ["devanagari"],
  weight: "400",
  variable: "--font-devanagari",
  display: "swap",
  preload: false,
});

export const notoJP = Noto_Serif_JP({
  weight: "400",
  variable: "--font-jp",
  display: "swap",
  preload: false,
});

export const notoKR = Noto_Serif_KR({
  weight: "400",
  variable: "--font-kr",
  display: "swap",
  preload: false,
});

export const fontVariables = [
  dmSans.variable,
  instrumentSerif.variable,
  notoArabic.variable,
  notoDevanagari.variable,
  notoJP.variable,
  notoKR.variable,
].join(" ");
