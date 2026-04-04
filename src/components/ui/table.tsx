import { ReactNode } from "react";

export const SimpleTable = ({ headers, rows }: { headers: string[]; rows: ReactNode[][] }) => (
  <div className="overflow-x-auto rounded-2xl border border-border">
    <table className="min-w-full text-sm">
      <thead className="bg-muted/70 text-left">
        <tr>{headers.map((h) => <th key={h} className="px-4 py-3 font-semibold">{h}</th>)}</tr>
      </thead>
      <tbody>
        {rows.map((row, idx) => (
          <tr key={idx} className="border-t border-border">
            {row.map((cell, cIdx) => <td key={cIdx} className="px-4 py-3">{cell}</td>)}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);
