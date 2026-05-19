import { ApplicationsTable } from "./applications-table";

export default function GuideApplicationsPage() {
  return (
    <div className="flex flex-1 flex-col gap-4">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">
          Guide Applications
        </h1>
        <p className="text-sm text-muted-foreground">
          Review submitted guide applications. Approving an application creates
          the guide profile and grants the GUIDE role.
        </p>
      </div>
      <ApplicationsTable />
    </div>
  );
}
