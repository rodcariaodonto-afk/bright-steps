import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { EngineDefinition, EngineProps } from "./types";

interface QuizQuestion {
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
}
interface QuizConfig {
  questions: QuizQuestion[];
  shuffleOptions?: boolean;
  showExplanation?: boolean;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function QuizGame({ config, emit, onFinish }: EngineProps<QuizConfig>) {
  const questions = config?.questions ?? [];
  const showExplanation = config?.showExplanation ?? true;

  const prepared = useMemo(
    () =>
      questions.map((q) => {
        if (!config?.shuffleOptions) return { ...q, order: q.options.map((_, i) => i) };
        const idx = shuffle(q.options.map((_, i) => i));
        return {
          prompt: q.prompt,
          options: idx.map((i) => q.options[i]),
          correctIndex: idx.indexOf(q.correctIndex),
          explanation: q.explanation,
          order: idx,
        };
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const shown = useRef<Set<number>>(new Set());

  useEffect(() => {
    if (prepared.length === 0) {
      onFinish({ score: 0, maxScore: 0, status: "completed" });
      return;
    }
    if (!shown.current.has(current)) {
      shown.current.add(current);
      emit({ event_type: "question_shown", payload: { index: current } });
    }
  }, [current, prepared.length, emit, onFinish]);

  if (prepared.length === 0) {
    return <div className="p-8 text-center text-muted-foreground">Sem perguntas configuradas.</div>;
  }

  const q = prepared[current];
  const answered = selected !== null;
  const isCorrect = answered && selected === q.correctIndex;

  const choose = (i: number) => {
    if (answered) return;
    setSelected(i);
    const correct = i === q.correctIndex;
    if (correct) setCorrectCount((c) => c + 1);
    emit({
      event_type: "answer_selected",
      payload: { index: current, chosen: i, correct },
    });
  };

  const next = () => {
    emit({ event_type: "question_completed", payload: { index: current } });
    if (current + 1 >= prepared.length) {
      onFinish({
        score: correctCount + (isCorrect ? 0 : 0),
        maxScore: prepared.length,
        status: "completed",
        metadata: { correct: correctCount, total: prepared.length },
      });
      return;
    }
    setCurrent((c) => c + 1);
    setSelected(null);
  };

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 p-6">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>Pergunta {current + 1} de {prepared.length}</span>
        <span>Acertos: {correctCount}</span>
      </div>
      <h2 className="text-2xl font-bold">{q.prompt}</h2>
      <div className="grid gap-3">
        {q.options.map((opt, i) => {
          const isSelected = selected === i;
          const isRight = i === q.correctIndex;
          const state = !answered
            ? "border-input hover:border-primary"
            : isRight
              ? "border-green-500 bg-green-50 dark:bg-green-950"
              : isSelected
                ? "border-red-500 bg-red-50 dark:bg-red-950"
                : "border-input opacity-60";
          return (
            <button
              key={i}
              onClick={() => choose(i)}
              disabled={answered}
              aria-label={opt}
              className={cn(
                "min-h-[56px] rounded-xl border-2 px-4 py-3 text-left text-base font-medium transition-colors",
                state,
              )}
            >
              {opt}
            </button>
          );
        })}
      </div>
      {answered && showExplanation && q.explanation && (
        <p className="rounded-lg bg-muted p-3 text-sm">{q.explanation}</p>
      )}
      {answered && (
        <Button size="lg" onClick={next} className="self-end">
          {current + 1 >= prepared.length ? "Finalizar" : "Próxima"}
        </Button>
      )}
    </div>
  );
}

export const quizEngine: EngineDefinition<QuizConfig> = {
  code: "quiz",
  name: "Quiz",
  listed: true,
  Component: QuizGame,
  validateConfig: (cfg) => {
    const c = cfg as QuizConfig;
    if (!c?.questions || !Array.isArray(c.questions) || c.questions.length === 0)
      return "Adicione ao menos uma pergunta em 'questions'.";
    for (const q of c.questions) {
      if (!q.prompt || !Array.isArray(q.options) || q.options.length < 2) return "Cada pergunta precisa de prompt e >=2 options.";
      if (typeof q.correctIndex !== "number" || q.correctIndex < 0 || q.correctIndex >= q.options.length)
        return "correctIndex fora do intervalo de options.";
    }
    return null;
  },
};
