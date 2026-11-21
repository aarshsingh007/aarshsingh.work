/*
 * Tools shown in the cursor trail. Add more here.
 * "simple" → `mark` is an SVG path (24×24) from the simple-icons package.
 * "monogram" → `mark` is text drawn as a typographic tile (Adobe's marks
 * aren't in simple-icons).
 */
import { siFigma, siFramer, siWebflow } from "simple-icons";

export type Tool = {
  id: string;
  name: string;
  icon: "simple" | "monogram";
  mark: string;
};

/** Show a small name label under each trail tile. */
export const SHOW_LABELS = false;

export const tools: Tool[] = [
  { id: "figma", name: "Figma", icon: "simple", mark: siFigma.path },
  { id: "photoshop", name: "Photoshop", icon: "monogram", mark: "Ps" },
  { id: "after-effects", name: "After Effects", icon: "monogram", mark: "Ae" },
  { id: "webflow", name: "Webflow", icon: "simple", mark: siWebflow.path },
  { id: "framer", name: "Framer", icon: "simple", mark: siFramer.path },
];
