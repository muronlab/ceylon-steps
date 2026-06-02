import { ActivityApplicationsTable } from "./activity-applications-table"

export default function ActivityApplicationsPage() {
  return (
    <div className="flex flex-1 flex-col gap-4">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">
          Activity Applications
        </h1>
        <p className="text-xs text-muted-foreground">
          Review submitted activity provider applications. Approving creates the
          activity profile and grants the ACTIVITY_PROVIDER role.
        </p>
      </div>
      <ActivityApplicationsTable />
    </div>
  )
}
