import type { PayCheckCategory, PayCheckData } from "@/shared/apiSchemas";

// Præsentationsberegninger for løntjekket.

type CheckedPayCheck = Extract<PayCheckData, { status: "checked" }>;
type CategoryLine = CheckedPayCheck["categories"][number];

/** Linjen for en kategori (forventet og udbetalt), eller undefined hvis den mangler. */
export function categoryLineFor(
  payCheck: CheckedPayCheck,
  category: PayCheckCategory,
): CategoryLine | undefined {
  return payCheck.categories.find((line) => line.category === category);
}

// AI-spørgsmålet, der passer til en mulig fejl ("Spørg AI"). Id'erne er API'ets faste spørgsmål.
const followUpQuestionIds: Readonly<Partial<Record<PayCheckCategory, string>>> = {
  hours: "question-missing-hours",
  sunday: "question-missing-sunday",
};

/** Id på spørgsmålet til AI'en for kategorien, eller undefined hvis der ikke er et. */
export function followUpQuestionId(category: PayCheckCategory): string | undefined {
  return followUpQuestionIds[category];
}
