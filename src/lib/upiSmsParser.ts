export type UpiSmsType = 'expense' | 'income';

export interface ParsedUpiSms {
  amount: number;
  type: UpiSmsType;
  merchant: string;
  dedupeKey: string;
}

const OTP_PATTERN = /\b(otp|one[- ]?time|verification code|do not share)\b/i;
const BANK_PATTERN = /\b(debited|credited|spent|received|paid|upi|imps|neft|rtgs|withdrawn|deposited)\b/i;

function parseAmount(text: string): number | null {
  const patterns = [
    /(?:rs\.?|inr|₹)\s*([\d,]+(?:\.\d{1,2})?)/i,
    /([\d,]+(?:\.\d{1,2})?)\s*(?:rs\.?|inr)/i,
    /(?:debited|credited|spent|paid|received)\s*(?:with|for|of)?\s*(?:rs\.?|inr|₹)?\s*([\d,]+(?:\.\d{1,2})?)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      const value = Number.parseFloat(match[1].replace(/,/g, ''));
      if (Number.isFinite(value) && value > 0) return value;
    }
  }

  return null;
}

function detectType(text: string): UpiSmsType | null {
  const lower = text.toLowerCase();
  if (/\b(credited|received|deposited|credit)\b/.test(lower) && !/\bdebited\b/.test(lower)) {
    return 'income';
  }
  if (/\b(debited|debited|spent|paid|withdrawn|purchase|sent)\b/.test(lower)) {
    return 'expense';
  }
  return null;
}

function extractMerchant(text: string): string {
  const patterns = [
    /\bto\s+([A-Za-z0-9@.\s/_-]{2,60}?)\s+(?:on|ref|upi|via|at)\b/i,
    /\bat\s+([A-Za-z0-9@.\s/_-]{2,60}?)\s+on\b/i,
    /\bfrom\s+([A-Za-z0-9@.\s/_-]{2,60}?)\s+(?:on|via)\b/i,
    /\btrf\s+to\s+([A-Za-z0-9@.\s/_-]{2,60})/i,
    /\bVPA[:\s]+([A-Za-z0-9@._-]+)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    const candidate = match?.[1]?.trim();
    if (candidate && candidate.length >= 2) {
      return candidate.replace(/\s+/g, ' ').slice(0, 80);
    }
  }

  return 'UPI transaction';
}

export function buildSmsDedupeKey(sender: string, body: string, amount: number, timestamp: number) {
  const minute = Math.floor(timestamp / 60_000);
  return `${sender}|${amount}|${minute}|${body.slice(0, 48)}`;
}

export function parseUpiSms(
  body: string,
  sender: string,
  timestamp: number,
): ParsedUpiSms | null {
  const normalized = body.replace(/\s+/g, ' ').trim();
  if (!normalized || OTP_PATTERN.test(normalized)) return null;
  if (!BANK_PATTERN.test(normalized)) return null;

  const amount = parseAmount(normalized);
  const type = detectType(normalized);
  if (amount == null || type == null) return null;

  const merchant = extractMerchant(normalized);

  return {
    amount,
    type,
    merchant,
    dedupeKey: buildSmsDedupeKey(sender, normalized, amount, timestamp),
  };
}
