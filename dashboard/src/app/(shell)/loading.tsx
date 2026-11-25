import { LoadingPage } from "@/kit/Skeleton";

// Shown by the framework while any page inside the shell is still loading its data. The menu stays, only the page area
// shows the placeholder. A page with a different shape can add its own loading.tsx beside it.
export default function Loading() {
  return <LoadingPage />;
}
