import { TransportProvidersTable } from "./transport-providers-table"

export default function TransportProvidersPage() {
  return (
    <div className="flex flex-1 flex-col gap-4">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">
          Transport Providers
        </h1>
        <p className="text-xs text-muted-foreground">
          Every approved transport partner — active and hidden. Filter by
          provider type, business status, and activation.
        </p>
      </div>
      <TransportProvidersTable />
    </div>
  )
}
