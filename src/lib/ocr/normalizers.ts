import { ReceiptLineItem } from "@/types/domain";

const DATE_PATTERNS = [
  /(?<year>20\d{2})[\/-](?<month>\d{1,2})[\/-](?<day>\d{1,2})/g,
  /(?<year>20\d{2})年\s*(?<month>\d{1,2})月\s*(?<day>\d{1,2})日/g,
] as const;

const AMOUNT_PATTERNS = [
  /(?:合計|ご利用額|請求額|総額|total)\s*[:：]?\s*[¥￥]?\s*(?<amount>[0-9][0-9,]*(?:\.[0-9]{1,2})?)/gi,
  /[¥￥]\s*(?<amount>[0-9][0-9,]*(?:\.[0-9]{1,2})?)/g,
] as const;

const PAYMENT_METHOD_KEYWORDS = ["現金", "クレジット", "カード", "PayPay", "交通系", "電子マネー"] as const;

const sanitizeNumberString = (value: string) => value.replace(/,/g, "").trim();

const toIsoDate = ({ year, month, day }: { year: string; month: string; day: string }): string | null => {
  const yyyy = Number(year);
  const mm = Number(month);
  const dd = Number(day);

  if (!Number.isInteger(yyyy) || !Number.isInteger(mm) || !Number.isInteger(dd) || mm < 1 || mm > 12 || dd < 1 || dd > 31) {
    return null;
  }

  const date = new Date(Date.UTC(yyyy, mm - 1, dd));
  const isValid = date.getUTCFullYear() === yyyy && date.getUTCMonth() + 1 === mm && date.getUTCDate() === dd;
  if (!isValid) {
    return null;
  }

  return `${year.padStart(4, "0")}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
};

export const extractDateCandidates = (rawText: string): string[] => {
  if (!rawText.trim()) return [];

  const candidates = new Set<string>();

  for (const pattern of DATE_PATTERNS) {
    for (const match of rawText.matchAll(pattern)) {
      if (!match.groups?.year || !match.groups.month || !match.groups.day) continue;
      const iso = toIsoDate({ year: match.groups.year, month: match.groups.month, day: match.groups.day });
      if (iso) {
        candidates.add(iso);
      }
    }
  }

  return Array.from(candidates).sort();
};

export const extractAmountCandidates = (rawText: string): number[] => {
  if (!rawText.trim()) return [];

  const candidates = new Set<number>();

  for (const pattern of AMOUNT_PATTERNS) {
    for (const match of rawText.matchAll(pattern)) {
      const amountText = match.groups?.amount;
      if (!amountText) continue;
      const parsed = Number(sanitizeNumberString(amountText));
      if (Number.isFinite(parsed) && parsed > 0) {
        candidates.add(Number(parsed.toFixed(2)));
      }
    }
  }

  return Array.from(candidates).sort((a, b) => b - a);
};

export const extractMerchantCandidate = (rawText: string): string | null => {
  const lines = rawText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return null;
  }

  const ignored = ["領収書", "レシート", "receipt", "tel", "合計", "小計", "税込"];
  const firstMeaningful = lines.find((line) => !ignored.some((word) => line.toLowerCase().includes(word)));

  if (!firstMeaningful) {
    return null;
  }

  return firstMeaningful.length > 80 ? firstMeaningful.slice(0, 80) : firstMeaningful;
};

export const extractPaymentMethod = (rawText: string): string | null => {
  const keyword = PAYMENT_METHOD_KEYWORDS.find((item) => rawText.includes(item));
  return keyword ?? null;
};

export const buildMemoCandidate = (rawText: string): string => {
  const compact = rawText.replace(/\s+/g, " ").trim();
  if (!compact) {
    return "";
  }

  return compact.length > 160 ? `${compact.slice(0, 160)}…` : compact;
};

export const extractLineItems = (rawText: string): ReceiptLineItem[] => {
  const lines = rawText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 20);

  return lines.map((line, index) => ({
    id: `line-${index + 1}`,
    name: line,
    amount: null,
    quantity: null,
    confidence: null,
  }));
};
