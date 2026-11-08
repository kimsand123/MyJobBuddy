import { describe, expect, it } from "vitest";
import type { ChatAnswerDto, ChatQuestionDto } from "@/mockApi/apiTypes";
import { createTestApi, expectTraceId } from "../../testUtils/mockApiTestClient";

describe("GET /chat/questions", () => {
  it("getChatQuestions_Seed_ReturnsThreeQuestionsWithText", async () => {
    // Arrange
    const api = createTestApi();

    // Act
    const questions = await api.data<ChatQuestionDto[]>("GET", "/chat/questions");

    // Assert
    expect(questions).toHaveLength(3);
    for (const question of questions) {
      expect(question.id.length).toBeGreaterThan(0);
      expect(question.text.length).toBeGreaterThan(0);
    }
    expect(new Set(questions.map((question) => question.id)).size).toBe(3);
  });

  it("getChatQuestions_Seed_IncludesQuestion3", async () => {
    // Arrange
    const api = createTestApi();

    // Act
    const questions = await api.data<ChatQuestionDto[]>("GET", "/chat/questions");

    // Assert
    expect(questions.map((question) => question.id)).toContain("question-3");
  });
});

describe("GET /chat/questions/:questionId/answer", () => {
  it("getChatAnswer_EachSeedQuestion_ReturnsAnswerAndSource", async () => {
    // Arrange
    const api = createTestApi();
    const questions = await api.data<ChatQuestionDto[]>("GET", "/chat/questions");

    for (const question of questions) {
      // Act
      const answer = await api.data<ChatAnswerDto>("GET", `/chat/questions/${question.id}/answer`);

      // Assert
      expect(answer.questionId).toBe(question.id);
      expect(answer.answer.length).toBeGreaterThan(0);
      expect(answer.source.length).toBeGreaterThan(0);
    }
  });

  it("getChatAnswer_Question3_RefersToUnion", async () => {
    // Arrange
    const api = createTestApi();

    // Act
    const answer = await api.data<ChatAnswerDto>("GET", "/chat/questions/question-3/answer");

    // Assert
    expect(answer.referToUnion).toBe(true);
  });

  it("getChatAnswer_OtherQuestions_DoNotReferToUnion", async () => {
    // Arrange
    const api = createTestApi();
    const questions = await api.data<ChatQuestionDto[]>("GET", "/chat/questions");
    const others = questions.filter((question) => question.id !== "question-3");

    for (const question of others) {
      // Act
      const answer = await api.data<ChatAnswerDto>("GET", `/chat/questions/${question.id}/answer`);

      // Assert
      expect(answer.referToUnion).toBe(false);
    }
  });

  it("getChatAnswer_UnknownQuestion_NotFoundWithTraceId", async () => {
    // Arrange
    const api = createTestApi();

    // Act
    const failure = await api.failure("GET", "/chat/questions/question-999/answer");

    // Assert
    expect(failure.errorType).toBe("notFound");
    expectTraceId(failure);
  });
});
