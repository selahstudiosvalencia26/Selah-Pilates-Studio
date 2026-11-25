import { redirect } from "next/navigation";
import PageForm from "@/systems/content/PageForm";
import { SaveGroup } from "@/systems/content/SaveGroup";
import { isPageKind } from "@/systems/content/site/pages";
import { readPage, readPhotos } from "@/systems/content/store";

export const dynamic = "force-dynamic";

// The About, Class and Contact pages: the words and the photos of each part of the page, in the order of the page. One Save for all.
export default async function PageEditor({
  params,
}: {
  params: Promise<{ page: string }>;
}) {
  const { page } = await params;
  if (page === "class") redirect("/booking/classes"); // the Class page words are fixed now; its classes are in Bookings
  // An old link (the earlier Menu, Gallery or Announcement tabs, or /content/home) goes to the first tab instead of a dead end.
  if (!isPageKind(page) || page === "home") redirect("/content");
  const [words, photos] = await Promise.all([readPage(page), readPhotos()]);
  return (
    <SaveGroup key={page}>
      <PageForm kind={page} initial={words} saved={photos} />
    </SaveGroup>
  );
}
