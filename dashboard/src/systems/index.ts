// Every system folder that is added to this dashboard (docs/dashboard/app-flow.md, Flow B). The install check inspects each one
// before it is switched on. `npm run new-system <word>` adds a new folder and writes its two lines here.
// This is main: it holds the dashboard only, so the list is empty. Each system lives on its own system/<word> branch
// (docs/architecture/branching.md), and a client's copy merges the ones it needs.
// systems:imports
import booking from "./booking/manifest";
import content from "./content/manifest";

export const CANDIDATES: { folder: string; manifest: unknown }[] = [
  // systems:candidates
  { folder: "booking", manifest: booking },
  { folder: "content", manifest: content },
];
