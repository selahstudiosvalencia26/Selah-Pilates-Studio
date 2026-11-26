import { notFound } from "next/navigation";
import { isOwnerNow } from "@/kit/session";
import RoleEditor from "@/shell/people/RoleEditor";
import { readRoles } from "@/shell/people/teamStore";
import { loadSystems } from "@/shell/registry";
import { installHref } from "@/shell/systems/installLink";

export const dynamic = "force-dynamic";

// Roles, for the owner: what each role can do in each system.
export default async function RolesPage() {
  if (!(await isOwnerNow())) notFound();
  const { systems } = loadSystems();
  return (
    <div className="flex grow flex-col gap-6">
      <p className="max-w-2xl text-sm text-text-soft">A role is a set of things a person may do. Choose what each one can do, then save.</p>
      <RoleEditor systems={systems} saved={await readRoles()} installHref={installHref()} />
    </div>
  );
}
