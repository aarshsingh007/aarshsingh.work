import PhotoBoard from "./PhotoBoard";

/** Play — heading, hint, Shuffle / Tidy up and the draggable photo board. */
export default function PlaySection() {
  return (
    <section id="play" aria-labelledby="play-title" className="play-zone py-(--section-y)">
      <PhotoBoard />
    </section>
  );
}
