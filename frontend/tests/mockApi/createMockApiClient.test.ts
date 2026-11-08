// Mock-API'ets transport: forsinkelse, AbortSignal, ukendte stier og at hver klient har sin egen
// hukommelse. Forsinkelsen styres med fake timers.
import { afterEach, describe, expect, it, vi } from "vitest";
import type { JobDto, ProfileDto } from "@/mockApi/apiTypes";
import { createMockApiClient, defaultMockDelayMs } from "@/mockApi/createMockApiClient";
import { createSeedStore } from "@/mockApi/seed";
import type { HttpMethod } from "@/shared/apiClient";
import type { Result } from "@/shared/result";
import { expectFailure, expectSuccess } from "../testUtils/resultAssertions";
import { createTestApi, expectTraceId } from "../testUtils/mockApiTestClient";

afterEach(() => {
  vi.useRealTimers();
});

type Tracked = { settled: () => boolean; promise: Promise<Result<unknown>> };

function track(promise: Promise<Result<unknown>>): Tracked {
  let isSettled = false;
  void promise.then(() => {
    isSettled = true;
  });
  return { settled: () => isSettled, promise };
}

describe("createMockApiClient – forsinkelse", () => {
  it("defaultMockDelayMs_Always_Is300", () => {
    // Assert
    expect(defaultMockDelayMs).toBe(300);
  });

  it("request_DefaultDelay_ResolvesAfter300Ms", async () => {
    // Arrange
    vi.useFakeTimers();
    const client = createMockApiClient({ store: createSeedStore() });

    // Act
    const request = track(client.request({ method: "GET", path: "/profile" }));
    await vi.advanceTimersByTimeAsync(299);
    const settledBefore = request.settled();
    await vi.advanceTimersByTimeAsync(1);

    // Assert
    expect(settledBefore).toBe(false);
    expect(request.settled()).toBe(true);
    expectSuccess(await request.promise);
  });

  it("request_CustomDelay_ResolvesAfterThatDelay", async () => {
    // Arrange
    vi.useFakeTimers();
    const client = createMockApiClient({ delayMs: 50, store: createSeedStore() });

    // Act
    const request = track(client.request({ method: "GET", path: "/profile" }));
    await vi.advanceTimersByTimeAsync(49);
    const settledBefore = request.settled();
    await vi.advanceTimersByTimeAsync(1);

    // Assert
    expect(settledBefore).toBe(false);
    expect(request.settled()).toBe(true);
  });

  it("request_ZeroDelay_ReturnsSuccess", async () => {
    // Arrange
    const client = createMockApiClient({ delayMs: 0, store: createSeedStore() });

    // Act
    const result = await client.request({ method: "GET", path: "/profile" });

    // Assert
    expect(result.success).toBe(true);
  });
});

describe("createMockApiClient – AbortSignal", () => {
  it("request_SignalAlreadyAborted_ReturnsAborted", async () => {
    // Arrange
    const client = createMockApiClient({ delayMs: 0, store: createSeedStore() });
    const controller = new AbortController();
    controller.abort();

    // Act
    const result = await client.request({
      method: "GET",
      path: "/profile",
      signal: controller.signal,
    });

    // Assert
    const failure = expectFailure(result);
    expect(failure.errorType).toBe("aborted");
    expectTraceId(failure);
  });

  it("request_AbortedDuringDelay_ReturnsAborted", async () => {
    // Arrange
    vi.useFakeTimers();
    const client = createMockApiClient({ store: createSeedStore() });
    const controller = new AbortController();

    // Act
    const request = track(
      client.request({ method: "GET", path: "/profile", signal: controller.signal }),
    );
    await vi.advanceTimersByTimeAsync(100);
    controller.abort();
    await vi.advanceTimersByTimeAsync(defaultMockDelayMs);

    // Assert
    const failure = expectFailure(await request.promise);
    expect(failure.errorType).toBe("aborted");
    expectTraceId(failure);
  });

  it("request_SignalNotAborted_ReturnsSuccess", async () => {
    // Arrange
    const client = createMockApiClient({ delayMs: 0, store: createSeedStore() });
    const controller = new AbortController();

    // Act
    const result = await client.request({
      method: "GET",
      path: "/profile",
      signal: controller.signal,
    });

    // Assert
    expect(result.success).toBe(true);
  });
});

describe("createMockApiClient – ukendte stier og metoder", () => {
  it.each<[HttpMethod, string]>([
    ["GET", "/findes-ikke"],
    ["GET", "/"],
    ["GET", ""],
    ["DELETE", "/profile"],
    ["POST", "/profile"],
    ["PUT", "/jobs"],
    ["GET", "/jobs/job-1/ukendt?month=2026-10"],
    ["GET", "/chat"],
  ])("request_%s%s_ReturnsNotFoundWithTraceId", async (method, path) => {
    // Arrange
    const api = createTestApi();

    // Act
    const failure = await api.failure(method, path);

    // Assert
    expect(failure.errorType).toBe("notFound");
    expectTraceId(failure);
  });
});

describe("createMockApiClient – hukommelse", () => {
  it("createMockApiClient_WithoutStore_StartsFromSeed", async () => {
    // Arrange
    const client = createMockApiClient({ delayMs: 0 });

    // Act
    const profile = expectSuccess(await client.request({ method: "GET", path: "/profile" }));

    // Assert
    expect(profile as ProfileDto).toEqual({ firstName: "Maja", age: 17 });
  });

  it("createMockApiClient_TwoClientsWithoutStore_DoNotShareData", async () => {
    // Arrange
    const first = createMockApiClient({ delayMs: 0 });
    const second = createMockApiClient({ delayMs: 0 });
    expectSuccess(
      await first.request({
        method: "POST",
        path: "/jobs",
        body: {
          workplace: "Testkiosken",
          position: "Butiksassistent",
          agreementCode: "hk-handel-butik",
        },
      }),
    );

    // Act
    const firstJobs = expectSuccess(await first.request({ method: "GET", path: "/jobs" }));
    const secondJobs = expectSuccess(await second.request({ method: "GET", path: "/jobs" }));

    // Assert
    expect((firstJobs as JobDto[]).length).toBe((secondJobs as JobDto[]).length + 1);
  });
});
