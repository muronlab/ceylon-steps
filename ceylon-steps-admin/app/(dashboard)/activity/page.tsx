import { ActivityProvidersTable } from "./activity-providers-table"

export default function ActivityProvidersPage() {
  return (
    <div className="flex flex-1 flex-col gap-4">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">
          Activity Providers
        </h1>
        <p className="text-xs text-muted-foreground">
          Every approved activity partner — active and hidden. Toggle visibility
          and review their details.
        </p>
      </div>
      <ActivityProvidersTable />
    </div>
  )
}
