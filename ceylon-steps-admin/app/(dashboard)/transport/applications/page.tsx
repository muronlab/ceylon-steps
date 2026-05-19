import { TransportApplicationsTable } from "./transport-applications-table"

export default function TransportApplicationsPage() {
  return (
    <div className="flex flex-1 flex-col gap-4">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">
          Transport Applications
        </h1>
        <p className="text-xs text-muted-foreground">
          Review submitted transport provider applications. Approving creates the
          transport profile and grants the TRANSPORT_PROVIDER role.
        </p>
      </div>
      <TransportApplicationsTable />
    </div>
  )
}
