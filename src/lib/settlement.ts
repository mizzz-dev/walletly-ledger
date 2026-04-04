import { SettlementEdge } from "@/types/domain";

interface NetInput {
  memberId: string;
  paid: number;
  burden: number;
}

export const calculateNet = (items: NetInput[]) =>
  items.map((v) => ({ ...v, net: Number((v.paid - v.burden).toFixed(2)) }));

export const suggestSettlements = (items: NetInput[]): SettlementEdge[] => {
  const netItems = calculateNet(items);
  const creditors = netItems.filter((v) => v.net > 0).map((v) => ({ ...v }));
  const debtors = netItems.filter((v) => v.net < 0).map((v) => ({ ...v, net: Math.abs(v.net) }));
  const edges: SettlementEdge[] = [];

  let i = 0;
  let j = 0;
  while (i < debtors.length && j < creditors.length) {
    const debt = debtors[i];
    const credit = creditors[j];
    const amount = Number(Math.min(debt.net, credit.net).toFixed(2));
    edges.push({ fromMemberId: debt.memberId, toMemberId: credit.memberId, amount });
    debt.net = Number((debt.net - amount).toFixed(2));
    credit.net = Number((credit.net - amount).toFixed(2));
    if (debt.net <= 0.009) i += 1;
    if (credit.net <= 0.009) j += 1;
  }

  return edges.filter((edge) => edge.amount > 0);
};
