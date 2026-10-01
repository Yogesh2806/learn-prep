"use client";

import { useMemo } from "react";
import { DECK } from "@/lib/design-data";
import { useStore } from "../store";
import RecallRound from "../RecallRound";

export default function DesignRecall({ category }: { category: string }) {
  const { design, setDesign, record } = useStore();
  const items = useMemo(
    () => (category === "All" ? DECK : DECK.filter((c) => c.cat === category)).map((c) => ({ id: c.id, prompt: c.def, answer: c.term, tag: c.cat })),
    [category],
  );
  return (
    <RecallRound
      id={`design:${category}`}
      items={items}
      // Recall is the strongest signal we have, so it drives the card's mark.
      onResult={(id, correct) => {
        setDesign((p) => ({ ...p, marks: { ...p.marks, [id]: correct ? "known" : "review" } }));
        record(`design:${DECK.find((c) => c.id === id)?.cat ?? "All"}`, correct, 15);
      }}
      onFinish={(pct, full) => {
        const prev = design.bestRecall[category];
        if (!full) return null;
        if (prev == null || pct > prev) {
          setDesign((p) => ({ ...p, bestRecall: { ...p.bestRecall, [category]: pct } }));
          return `New best recall for ${category}${prev != null ? ` — up from ${prev}%` : ""}`;
        }
        return `Best recall for ${category} · ${prev}%`;
      }}
    />
  );
}
