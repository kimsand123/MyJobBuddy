// Fælles opsætning for Vitest: jest-dom-matchere (toBeInTheDocument osv.) og oprydning efter hver test.
import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(() => {
  cleanup();
});
