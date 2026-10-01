"use client";

import { englishMode } from "../App";
import { useStore } from "../store";
import Challenges from "./Challenges";
import DoubtSolver from "./DoubtSolver";
import Slang from "./Slang";
import Tenses from "./Tenses";
import TopicCards from "./TopicCards";
import PunctuationFix from "./PunctuationFix";
import Vocabulary from "./Vocabulary";
import WordOfDay from "./WordOfDay";
import WritingArena from "./WritingArena";

export default function EnglishView() {
  const { ui } = useStore();
  const mode = englishMode(ui, ui.englishCat);
  switch (ui.englishCat) {
    case "word":
      return <WordOfDay />;
    case "vocab":
      return <Vocabulary key={mode} mode={mode as "flashcards" | "quiz" | "recall"} />;
    case "tenses":
      return <Tenses mode={mode as "trainer" | "map" | "drill"} />;
    case "grammar":
      return <TopicCards key={`g-${mode}`} kind="grammar" mode={mode as "cards" | "practice"} />;
    case "punct":
      return mode === "fix" ? <PunctuationFix /> : <TopicCards key="p-cards" kind="punctuation" mode="cards" />;
    case "challenge":
      return <Challenges />;
    case "writing":
      return <WritingArena key={mode} mode={mode as "challenge" | "free"} />;
    case "slang":
      return <Slang key={mode} mode={mode as "cards" | "quiz"} />;
    case "doubt":
      return <DoubtSolver />;
  }
}
