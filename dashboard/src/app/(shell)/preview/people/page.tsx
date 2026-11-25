import { currentAvatar } from "@/shell/account/status";
import PeopleManager from "@/shell/people/PeopleManager";
import { loadSystems } from "@/shell/registry";

// People, for the owner and managers: who has an account, their roles, and what that lets them do in each system.
export default async function PeoplePage() {
  const { systems } = loadSystems();
  return <PeopleManager systems={systems} avatarUrl={await currentAvatar()} />;
}
