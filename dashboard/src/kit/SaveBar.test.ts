import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import SaveBar from "./SaveBar";

// The one Save bar (SaveBar.tsx): what it says, when its button is greyed out, and that it lines up with the frame's panel.
const html = (props: Parameters<typeof SaveBar>[0] = {}) => renderToStaticMarkup(createElement(SaveBar, props));

describe("the Save bar", () => {
  it("says 'Save changes' and that there are unsaved changes, by default", () => {
    const out = html();
    expect(out).toContain("Save changes");
    expect(out).toContain("You have changes that are not saved yet.");
  });
  it("greys the button out and says nothing when there is nothing to save", () => {
    const out = html({ dirty: false });
    expect(out).toMatch(/<button[^>]*disabled/);
    expect(out).not.toContain("not saved yet");
  });
  it("says 'Saving' while it works, and greys the button out so a double press does nothing", () => {
    const out = html({ pending: true });
    expect(out).toContain("Saving");
    expect(out).toMatch(/<button[^>]*disabled/);
  });
  it("shows what happened beside the button, in danger colour when it failed", () => {
    expect(html({ message: { text: "Saved." } })).toContain("Saved.");
    const bad = html({ message: { text: "Enter a name.", bad: true } });
    expect(bad).toContain("Enter a name.");
    expect(bad).toContain("text-danger");
  });
  it("submits the form it is in, unless it is given its own way to save", () => {
    expect(html()).toContain('type="submit"');
    expect(html({ onSave: () => {} })).toContain('type="button"');
  });
  it("uses the words it is given for the button", () => expect(html({ label: "Save settings" })).toContain("Save settings"));
  it("shows a quieter action beside the button, such as Reset", () => expect(renderToStaticMarkup(createElement(SaveBar, {}, createElement("button", { type: "button" }, "Reset")))).toContain("Reset"));
  it("lines up with the frame's panel: 8px above the window edge, the panel's full width and rounded corners, flush with the panel's end", () => {
    const out = html();
    for (const part of ["sticky", "bottom-2", "rounded-b-2xl", "-mx-4", "lg:-mx-10", "-mb-4", "lg:-mb-10"]) expect(out, part).toContain(part);
  });
});
