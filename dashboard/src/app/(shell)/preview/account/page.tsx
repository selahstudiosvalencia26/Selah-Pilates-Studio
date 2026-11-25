import type { Metadata } from "next";
import ActivityList from "@/shell/account/ActivityList";
import AvatarEditor from "@/shell/account/AvatarEditor";
import ChangePasswordForm from "@/shell/account/ChangePasswordForm";
import DevicesList from "@/shell/account/DevicesList";
import { accountStatus } from "@/shell/account/status";
import PageHeader from "@/shell/frame/PageHeader";

export const metadata: Metadata = { title: "Account" };

// Your own sign-in details, for anyone signed in (not only the owner). Two columns on a computer, one under the other on a phone:
// on the left, who you are and your password (what you change); on the right, where you are signed in and what happened lately
// (what you check). The person is read on the server. When nobody is signed in (sign-in is not connected), it says so instead
// of showing forms that cannot work.
function Section({
  id,
  title,
  text,
  children,
}: {
  id: string;
  title: string;
  text?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      aria-labelledby={id}
      className="grid gap-4 border-t border-border pt-6 first:border-t-0 first:pt-0"
    >
      <div>
        <h2 id={id} className="text-base font-semibold">
          {title}
        </h2>
        {text && <p className="mt-1 max-w-xl text-sm text-text-soft">{text}</p>}
      </div>
      {children}
    </section>
  );
}

export default async function AccountPage() {
  const status = await accountStatus();
  if (!status) {
    return (
      <>
        <PageHeader
          title="Account"
          description="Sign in to see your account."
        />
        <p className="text-sm text-text-soft">
          Your account is not connected yet.
        </p>
      </>
    );
  }

  const details = [
    { label: "Name", value: status.name },
    { label: "Email", value: status.email },
    { label: "Role", value: status.role },
    {
      label: "How you sign in",
      value: status.hasPassword
        ? "An emailed code, or your password"
        : "An emailed code",
    },
  ];

  return (
    <>
      <PageHeader title="Account" description="Your own sign-in details." />
      <div className="grid items-start gap-10 lg:grid-cols-2 lg:gap-16">
        <div className="grid content-start gap-8">
          <Section id="details-heading" title="Your details">
            <AvatarEditor name={status.name} avatarUrl={status.avatarUrl} />
            <dl className="grid gap-x-8 gap-y-3 text-sm sm:grid-cols-[9rem_1fr]">
              {details.map((row) => (
                <div key={row.label} className="contents">
                  <dt className="text-text-soft">{row.label}</dt>
                  <dd className="min-w-0 break-words font-medium">
                    {row.value}
                  </dd>
                </div>
              ))}
            </dl>
          </Section>

          <Section
            id="password-heading"
            title={
              status.hasPassword ? "Change your password" : "Add a password"
            }
            text={
              status.hasPassword
                ? "You can sign in with a password or with an emailed code."
                : "A password is optional. You can always sign in with an emailed code."
            }
          >
            <ChangePasswordForm
              email={status.email}
              hasPassword={status.hasPassword}
            />
          </Section>
        </div>

        <div className="grid content-start gap-8">
          <Section
            id="devices-heading"
            title="Where you are signed in"
            text="If you do not know a device, sign it out and change your password."
          >
            <DevicesList sessions={status.sessions} />
          </Section>

          <Section
            id="activity-heading"
            title="Recent activity"
            text="Sign-ins and changes to your account. If something here was not you, change your password."
          >
            <ActivityList items={status.activity} />
          </Section>
        </div>
      </div>
    </>
  );
}
