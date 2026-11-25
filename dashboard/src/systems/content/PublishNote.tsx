import { publishingOn } from "./publish";

// One line that says what saving does on the live site, and says plainly when the website is not connected to it yet.
export default function PublishNote() {
  return publishingOn() ? (
    <p className="mb-6 text-sm text-text-soft">Saving also updates your website. It takes about 2 minutes to show.</p>
  ) : (
    <p role="status" className="card mb-6 p-4 text-sm text-text-soft">
      Your changes are saved, but they do not reach your website yet. Ask the builder to finish the setup.
    </p>
  );
}
