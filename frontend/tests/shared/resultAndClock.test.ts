import { describe, expect, it } from "vitest";
import { createFixedClock, demoClock, demoToday } from "@/shared/clock";
import { fail, ok } from "@/shared/result";

describe("ok", () => {
  it("ok_WithData_ReturnsSuccessWithData", () => {
    // Act
    const result = ok({ value: 42 });

    // Assert
    expect(result).toEqual({ success: true, data: { value: 42 } });
  });
});

describe("fail", () => {
  it("fail_WithDetails_ReturnsFailureWithTraceIdAndFieldErrors", () => {
    // Act
    const result = fail("validationFailed", "Ugyldige felter", {
      traceId: "trace-1",
      fieldErrors: { date: "required" },
    });

    // Assert
    expect(result.success).toBe(false);
    expect(result.errorType).toBe("validationFailed");
    expect(result.message).toBe("Ugyldige felter");
    expect(result.traceId).toBe("trace-1");
    expect(result.fieldErrors).toEqual({ date: "required" });
  });

  it("fail_WithoutDetails_ReturnsFailureWithTypeAndMessage", () => {
    // Act
    const result = fail("notFound", "Findes ikke");

    // Assert
    expect(result.success).toBe(false);
    expect(result.errorType).toBe("notFound");
    expect(result.message).toBe("Findes ikke");
  });
});

describe("clock", () => {
  it("demoToday_Always_Is20261031", () => {
    // Assert
    expect(demoToday).toBe("2026-10-31");
  });

  it("demoClockToday_Called_ReturnsDemoDate", () => {
    // Act
    const today = demoClock.today();

    // Assert
    expect(today).toBe("2026-10-31");
  });

  it("createFixedClockToday_GivenDate_ReturnsSameDateEveryTime", () => {
    // Arrange
    const clock = createFixedClock("2027-02-28");

    // Act
    const first = clock.today();
    const second = clock.today();

    // Assert
    expect(first).toBe("2027-02-28");
    expect(second).toBe("2027-02-28");
  });
});
