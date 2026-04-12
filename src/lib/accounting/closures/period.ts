import { AccountingPeriodClosure } from "@/types/domain";

const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

export const toMonthlyPeriod = (period: string) => {
  if (!MONTH_PATTERN.test(period)) {
    throw new Error("対象月はYYYY-MM形式で入力してください");
  }

  const [yearText, monthText] = period.split("-");
  const year = Number(yearText);
  const month = Number(monthText);

  const periodStart = new Date(Date.UTC(year, month - 1, 1));
  const periodEnd = new Date(Date.UTC(year, month, 0));

  return {
    period,
    periodStart: periodStart.toISOString().slice(0, 10),
    periodEnd: periodEnd.toISOString().slice(0, 10),
  };
};

export const toPeriodLabel = (dateText: string) => {
  if (!dateText) {
    return "";
  }
  return dateText.slice(0, 7);
};

export const isDateWithinPeriod = ({ date, periodStart, periodEnd }: { date: string; periodStart: string; periodEnd: string }) => {
  return date >= periodStart && date <= periodEnd;
};

export const findClosedPeriodByDate = ({ closures, date }: { closures: AccountingPeriodClosure[]; date: string }) => {
  return closures.find((closure) => closure.status === "closed" && isDateWithinPeriod({ date, periodStart: closure.periodStart, periodEnd: closure.periodEnd })) ?? null;
};
