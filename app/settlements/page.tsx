import { Card } from "@/components/ui/card";
import { suggestSettlements } from "@/lib/settlement";

const proposals = suggestSettlements([
  { memberId: "あや", paid: 22000, burden: 13000 },
  { memberId: "けん", paid: 6000, burden: 11000 },
  { memberId: "ゆい", paid: 2000, burden: 6000 },
]);

export default function SettlementsPage() {
  return (
    <Card>
      <h1 className="text-xl font-bold">清算提案</h1>
      <ul className="mt-3 space-y-2 text-sm">
        {proposals.map((proposal, idx) => (
          <li key={`${proposal.fromMemberId}-${idx}`} className="rounded-xl bg-muted/50 px-3 py-2">
            <span className="font-semibold">{proposal.fromMemberId}</span> が <span className="font-semibold">{proposal.toMemberId}</span> に
            <span className="ml-1 font-bold tabular-nums">¥{proposal.amount.toLocaleString()}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
