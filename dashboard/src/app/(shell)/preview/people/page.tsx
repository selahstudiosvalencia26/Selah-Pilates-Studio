import { notFound } from "next/navigation";
import { getBusiness } from "@/kit/business";
import { isOwnerNow } from "@/kit/session";
import { allowedEmails } from "@/lib/auth/config";
import { getBranding } from "@/shell/branding/server";
import Team from "@/shell/people/Team";
import { readMembers, readRoles } from "@/shell/people/teamStore";

export const dynamic = "force-dynamic";

// People, for the owner: who can sign in, with which role.
export default async function PeoplePage() {
  if (!(await isOwnerNow())) notFound();
  const [members, roles, look] = await Promise.all([readMembers(), readRoles(), getBranding()]);
  const owners = allowedEmails();
  return <Team owners={owners.length ? owners : ["owner@example.com"]} members={members} roles={roles} business={look.name || getBusiness().name} />;
}
