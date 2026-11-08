import type { HttpMethod } from "@/shared/apiClient";
import { getAgreements } from "./endpoints/agreementEndpoints";
import { getChatAnswer, getChatQuestion, getChatQuestions } from "./endpoints/chatEndpoints";
import { getConsents, setSicknessConsent } from "./endpoints/consentEndpoints";
import { createJob, getJobs } from "./endpoints/jobEndpoints";
import type { MockHandler } from "./endpoints/mockRequest";
import { getPayCheck } from "./endpoints/payCheckEndpoints";
import { getProfile, getSubscription } from "./endpoints/profileEndpoints";
import {
  createShift,
  estimateShift,
  getShiftsForMonth,
  markShiftSick,
  unmarkShiftSick,
} from "./endpoints/shiftEndpoints";

// Alle endpoints i mock-API'et. ":navn" i et mønster er en sti-parameter.

type Route = {
  method: HttpMethod;
  pattern: string;
  handler: MockHandler;
};

const routes: readonly Route[] = [
  { method: "GET", pattern: "/profile", handler: getProfile },
  { method: "GET", pattern: "/subscription", handler: getSubscription },
  { method: "GET", pattern: "/consents", handler: getConsents },
  { method: "PUT", pattern: "/consents/sickness", handler: setSicknessConsent },
  { method: "GET", pattern: "/agreements", handler: getAgreements },
  { method: "GET", pattern: "/jobs", handler: getJobs },
  { method: "POST", pattern: "/jobs", handler: createJob },
  { method: "GET", pattern: "/jobs/:jobId/shifts", handler: getShiftsForMonth },
  { method: "GET", pattern: "/jobs/:jobId/pay-check", handler: getPayCheck },
  { method: "POST", pattern: "/shifts/estimate", handler: estimateShift },
  { method: "POST", pattern: "/shifts", handler: createShift },
  { method: "PUT", pattern: "/shifts/:shiftId/sick", handler: markShiftSick },
  { method: "DELETE", pattern: "/shifts/:shiftId/sick", handler: unmarkShiftSick },
  { method: "GET", pattern: "/chat/questions", handler: getChatQuestions },
  { method: "GET", pattern: "/chat/questions/:questionId", handler: getChatQuestion },
  { method: "GET", pattern: "/chat/questions/:questionId/answer", handler: getChatAnswer },
];

export type RouteMatch = {
  handler: MockHandler;
  pathParams: Partial<Record<string, string>>;
};

function toSegments(path: string): string[] {
  return path.split("/").filter((segment) => segment !== "");
}

function matchPattern(
  pattern: string,
  pathSegments: readonly string[],
): Partial<Record<string, string>> | undefined {
  const patternSegments = toSegments(pattern);
  if (patternSegments.length !== pathSegments.length) {
    return undefined;
  }

  const pathParams: Partial<Record<string, string>> = {};
  for (const [index, patternSegment] of patternSegments.entries()) {
    const pathSegment = pathSegments[index];
    if (pathSegment === undefined) {
      return undefined;
    }
    if (patternSegment.startsWith(":")) {
      pathParams[patternSegment.slice(1)] = pathSegment;
      continue;
    }
    if (patternSegment !== pathSegment) {
      return undefined;
    }
  }
  return pathParams;
}

/** Finder endpointet for metode og sti (uden query string). */
export function findRoute(method: HttpMethod, pathname: string): RouteMatch | undefined {
  const pathSegments = toSegments(pathname);
  for (const route of routes) {
    if (route.method !== method) {
      continue;
    }
    const pathParams = matchPattern(route.pattern, pathSegments);
    if (pathParams !== undefined) {
      return { handler: route.handler, pathParams };
    }
  }
  return undefined;
}
