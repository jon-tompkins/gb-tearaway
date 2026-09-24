import type { PrintJob } from "./types";
import { hashString } from "./rng";

export interface AnswerItem {
  title: string;
  answer: string;
}

export interface AnswersPayload {
  kidName: string;
  date: string;
  items: AnswerItem[];
  generatedAt: string;
}

/** Stable token for a dispatch's answers (same kid+day+nonce → same token). */
export function answersToken(kidId: string, date: string, nonce: number): string {
  return (hashString(`${kidId}|${date}|${nonce}|answers`) >>> 0).toString(36);
}

/** Pull the answer keys out of a generated job (riddle/scramble/sequence text + sudoku solution). */
export function collectAnswers(job: PrintJob): AnswerItem[] {
  const items: AnswerItem[] = [];
  for (const s of job.sections) {
    if (s.kind === "header" || s.kind === "footer") continue;
    if (typeof s.answer === "string" && s.answer.trim()) {
      items.push({ title: s.title, answer: s.answer.trim() });
    } else if (s.kind === "sudoku" && s.sudoku?.solution) {
      items.push({
        title: s.title,
        answer: s.sudoku.solution.map((row) => row.join(" ")).join("\n"),
      });
    }
  }
  return items;
}
