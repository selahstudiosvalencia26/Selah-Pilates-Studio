import PageForm from "@/systems/content/PageForm";
import { SaveGroup } from "@/systems/content/SaveGroup";
import { readPage, readPhotos } from "@/systems/content/store";

export const dynamic = "force-dynamic";

// The Home page: the words and the photos of each part of it, in the order of the page. One Save for all of it.
export default async function HomePageEditor() {
  const [words, photos] = await Promise.all([readPage("home"), readPhotos()]);
  return (
    <SaveGroup>
      <PageForm kind="home" initial={words} saved={photos} />
    </SaveGroup>
  );
}
