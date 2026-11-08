// Læsning af felter fra en ukendt request-body. Body kommer fra klienten og stoles ikke på.

export type FieldRead<T> =
  { status: "missing" } | { status: "invalid" } | { status: "ok"; value: T };

export type RequestBody = Readonly<Record<string, unknown>>;

export function isRequestBody(body: unknown): body is RequestBody {
  return typeof body === "object" && body !== null && !Array.isArray(body);
}

/** Tekstfelt. Tom tekst (efter trim) tæller som manglende. */
export function readTextField(body: RequestBody, key: string): FieldRead<string> {
  const value = body[key];
  if (value === undefined || value === null) {
    return { status: "missing" };
  }
  if (typeof value !== "string") {
    return { status: "invalid" };
  }
  const trimmed = value.trim();
  if (trimmed === "") {
    return { status: "missing" };
  }
  return { status: "ok", value: trimmed };
}

export function readIntegerField(body: RequestBody, key: string): FieldRead<number> {
  const value = body[key];
  if (value === undefined || value === null) {
    return { status: "missing" };
  }
  if (typeof value !== "number" || !Number.isInteger(value)) {
    return { status: "invalid" };
  }
  return { status: "ok", value };
}

export function readBooleanField(body: RequestBody, key: string): FieldRead<boolean> {
  const value = body[key];
  if (value === undefined || value === null) {
    return { status: "missing" };
  }
  if (typeof value !== "boolean") {
    return { status: "invalid" };
  }
  return { status: "ok", value };
}
