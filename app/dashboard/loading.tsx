import { Card } from "@/components/ui/card";

export default function Loading() {
  return (
    <section className="space-y-4">
      <Card className="space-y-3">
        <div className="h-7 w-44 animate-pulse rounded bg-muted" />
        <div className="h-4 w-72 animate-pulse rounded bg-muted" />
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="h-24 animate-pulse rounded-2xl bg-muted/70" />
          <div className="h-24 animate-pulse rounded-2xl bg-muted/70" />
          <div className="h-24 animate-pulse rounded-2xl bg-muted/70" />
        </div>
      </Card>
      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <div className="h-80 animate-pulse rounded bg-muted/70" />
        </Card>
        <Card>
          <div className="h-80 animate-pulse rounded bg-muted/70" />
        </Card>
      </div>
    </section>
  );
}
