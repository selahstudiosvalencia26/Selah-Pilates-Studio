import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth/server";
import OwnPasswordForm from "@/shell/account/OwnPasswordForm";
import { signOut } from "@/shell/signin/actions";

export const dynamic = "force-dynamic";

// The first sign-in with a temporary password: choose your own before anything else opens.
export default async function WelcomePage() {
  const who = await currentUser();
  if (!who) redirect("/sign-in");
  if (!who.mustChange) redirect("/preview");
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-6 px-4 py-10">
      <div>
        <h1 className="text-2xl font-semibold">Welcome, {who.name}</h1>
        <p className="mt-1 text-sm text-text-soft">Choose your own password to finish. Only you will know it.</p>
      </div>
      <OwnPasswordForm first />
      <form action={signOut}>
        <button type="submit" className="min-h-11 text-sm text-text-soft underline underline-offset-4">
          Sign out
        </button>
      </form>
    </main>
  );
}
