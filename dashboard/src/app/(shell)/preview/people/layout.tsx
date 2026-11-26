import PageHeader from "@/shell/frame/PageHeader";
import SystemTabs from "@/shell/frame/SystemTabs";

// People and Roles belong together: they are two tabs along the top.
const PEOPLE_SECTIONS = [
  { title: "People", href: "/preview/people" },
  { title: "Roles", href: "/preview/people/roles" },
];

export default function PeopleLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PageHeader title="People" description="Add your team and choose what each person can do." />
      <SystemTabs name="People" sections={PEOPLE_SECTIONS} />
      {children}
    </>
  );
}
