import { TypeChangeRequestsTable } from "./type-change-requests-table"

export default function TransportTypeChangeRequestsPage() {
  return (
    <div className="flex flex-1 flex-col gap-4">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">
          Transport Type Change Requests
        </h1>
        <p className="text-xs text-muted-foreground">
          Providers requesting to switch their provider type. Approving flips
          the type on their profile and copies any new licence documents.
        </p>
      </div>
      <TypeChangeRequestsTable />
    </div>
  )
}
