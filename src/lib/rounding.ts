import { RoundingMode } from "@/types/domain";

export const roundAmount = (value: number, mode: RoundingMode, precision = 0): number => {
  const base = 10 ** precision;
  const scaled = value * base;
  if (mode === "ceil") return Math.ceil(scaled) / base;
  if (mode === "floor") return Math.floor(scaled) / base;
  return Math.round(scaled) / base;
};
