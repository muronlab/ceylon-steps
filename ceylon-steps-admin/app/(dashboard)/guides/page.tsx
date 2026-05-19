import { GuidesTable } from "./guides-table";

export default function GuidesPage() {
  return (
    <div className="flex flex-1 flex-col gap-4">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">Guides</h1>
        <p className="text-sm text-muted-foreground">
          Every approved guide profile — active and inactive. Filter by
          category, region, language, experience or price.
        </p>
      </div>
      <GuidesTable />
    </div>
  );
}
