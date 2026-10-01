"use client";

import { useStore } from "../store";
import DesignFlashcards from "./DesignFlashcards";
import DesignQuiz from "./DesignQuiz";
import DesignRecall from "./DesignRecall";

export default function DesignView() {
  const { ui } = useStore();
  // Keyed by category so each mode starts a fresh round when the filter changes.
  if (ui.designMode === "quiz") return <DesignQuiz key={ui.designCat} category={ui.designCat} />;
  if (ui.designMode === "recall") return <DesignRecall key={ui.designCat} category={ui.designCat} />;
  return <DesignFlashcards key={ui.designCat} category={ui.designCat} />;
}
