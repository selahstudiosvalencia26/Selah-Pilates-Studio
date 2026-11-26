import RoleEditor from "@/shell/people/RoleEditor";
import { loadSystems } from "@/shell/registry";
import { installHref } from "@/shell/systems/installLink";

// Roles, for the owner: what each role can do in each system.
export default function RolesPage() {
  const { systems } = loadSystems();
  return (
    <div className="grid gap-6">
      {/* Roles are not saved or enforced yet. Said plainly on the live site, so nobody thinks access is limited when it is not. */}
      {process.env.NODE_ENV === "production" && (
        <p role="note" className="card border-warning p-4 text-sm">
          <span className="font-semibold">Not active yet.</span> You can look and try the choices, but they are not saved. For now, everyone who can sign in can do everything.
        </p>
      )}
      <p className="max-w-2xl text-sm text-text-soft">A role is a set of things a person may do. Give someone more than one role and what they can do adds up.</p>
      <RoleEditor systems={systems} installHref={installHref()} />
    </div>
  );
}
