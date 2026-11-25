import RoleEditor from "@/shell/people/RoleEditor";
import { loadSystems } from "@/shell/registry";
import { installHref } from "@/shell/systems/installLink";

// Roles, for the owner: what each role can do in each system.
export default function RolesPage() {
  const { systems } = loadSystems();
  return (
    <div className="grid gap-6">
      <p className="max-w-2xl text-sm text-text-soft">A role is a set of things a person may do. Give someone more than one role and what they can do adds up.</p>
      <RoleEditor systems={systems} installHref={installHref()} />
    </div>
  );
}
