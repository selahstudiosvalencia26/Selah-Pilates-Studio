import { notFound } from "next/navigation";
import ListForm from "@/systems/content/ListForm";
import { SaveGroup } from "@/systems/content/SaveGroup";
import { editorSupports } from "@/systems/content/listDef";
import { listById } from "@/systems/content/site/lists";
import { readList, readPhotos } from "@/systems/content/store";

export const dynamic = "force-dynamic";

// One list of the website (the classes, the menu, the projects...), described in site/lists.ts. One Save for all of it.
export default async function ListPage({ params }: { params: Promise<{ list: string }> }) {
  const def = listById((await params).list);
  if (!def) notFound();
  if (!editorSupports(def)) {
    return (
      <p className="max-w-xl text-sm text-text-soft">
        This list has fields the editor cannot show yet (a list inside a list, or items without ids). Its data is checked and saved
        correctly; ask the builder to add the editor for it.
      </p>
    );
  }
  const [items, photos] = await Promise.all([readList(def), readPhotos()]);
  return (
    <SaveGroup>
      <ListForm listId={def.id} initial={items} photos={photos} />
    </SaveGroup>
  );
}
