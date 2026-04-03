export function normalizeEmailIdentifier(input: string): string {
  const value = String(input || "").trim().toLowerCase();
  if (!value.includes("@")) {
    return value;
  }

  const [localPart, domainPart] = value.split("@");
  const isGmail = domainPart === "gmail.com" || domainPart === "googlemail.com";

  if (!isGmail) {
    return value;
  }

  const plusIndex = localPart.indexOf("+");
  const strippedLocal = plusIndex >= 0 ? localPart.slice(0, plusIndex) : localPart;
  const canonicalLocal = strippedLocal.replace(/\./g, "");

  return `${canonicalLocal}@gmail.com`;
}
