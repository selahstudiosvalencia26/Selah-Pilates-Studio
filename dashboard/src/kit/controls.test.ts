import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import Button, { buttonClass } from "./Button";
import Dialog from "./Dialog";
import { Field, Input, Textarea, type FieldProps } from "./Input";
import Select from "./Select";
import { firstEnabled, moveActive, typeahead, type Option } from "./selectLogic";
import { timeOptions } from "./TimeSelect";
import Toggle from "./Toggle";

// The form controls of the toolbox: the Select's keyboard rules, and what each control puts on the page.
const options: Option[] = [
  { value: "a", label: "Apple" },
  { value: "b", label: "Banana", disabled: true },
  { value: "c", label: "Cherry" },
  { value: "d", label: "Cranberry" },
  { value: "e", label: "Date" },
];
const html = (el: React.ReactElement) => renderToStaticMarkup(el);

describe("the Select's keyboard rules", () => {
  it("lands on the first choice that can be picked", () => {
    expect(firstEnabled(options)).toBe(0);
    expect(firstEnabled([{ value: "x", label: "X", disabled: true }])).toBe(-1);
  });
  it("moves down and up, skipping disabled choices, and stops at the ends", () => {
    expect(moveActive(options, 0, "ArrowDown")).toBe(2); // Banana is skipped
    expect(moveActive(options, 2, "ArrowUp")).toBe(0);
    expect(moveActive(options, 4, "ArrowDown")).toBe(4);
    expect(moveActive(options, 0, "ArrowUp")).toBe(0);
    expect(moveActive(options, -1, "ArrowDown")).toBe(0);
  });
  it("Home and End go to the first and last choice that can be picked", () => {
    expect(moveActive(options, 2, "Home")).toBe(0);
    expect(moveActive(options, 2, "End")).toBe(4);
  });
  it("has nowhere to go when nothing can be picked", () => expect(moveActive([{ value: "x", label: "X", disabled: true }], -1, "ArrowDown")).toBe(-1));
  it("typing letters jumps to the next choice that starts with them", () => {
    expect(typeahead(options, 0, "c")).toBe(2);
    expect(typeahead(options, 0, "cr")).toBe(3);
    expect(typeahead(options, 0, "D")).toBe(4); // capitals do not matter
    expect(typeahead(options, 0, "z")).toBe(-1);
    expect(typeahead(options, 0, "")).toBe(-1);
  });
  it("pressing the same letter again moves on to the next one, and comes back round to the first", () => {
    expect(typeahead(options, 2, "cc")).toBe(3);
    expect(typeahead(options, 3, "cc")).toBe(2);
  });
  it("never lands on a disabled choice", () => expect(typeahead(options, 0, "b")).toBe(-1));
});

describe("the times offered", () => {
  it("every 30 minutes from midnight to 11:30 PM by default, in words", () => {
    const all = timeOptions("18:00");
    expect(all).toHaveLength(48);
    expect(all[0]).toEqual({ value: "00:00", label: "12:00 AM" });
    expect(all.find((o) => o.value === "18:00")?.label).toBe("6:00 PM");
    expect(all.at(-1)).toEqual({ value: "23:30", label: "11:30 PM" });
  });
  it("can be narrowed, and the step changed", () => expect(timeOptions("09:00", "09:00", "10:00", 15).map((o) => o.value)).toEqual(["09:00", "09:15", "09:30", "09:45", "10:00"]));
  it("keeps a time that is already chosen even when it is outside the list, so editing never loses it", () => {
    const list = timeOptions("22:15", "09:00", "21:00", 30);
    expect(list.some((o) => o.value === "22:15")).toBe(true);
    expect(list.at(-1)?.value).toBe("22:15"); // in its place, in order
  });
});

describe("the Select on the page", () => {
  const closed = html(createElement(Select, { value: "c", onChange: () => {}, options, label: "Fruit", id: "fruit", name: "fruit" }));

  it("is a button that says it opens a list, and shows the chosen words", () => {
    expect(closed).toContain('role="combobox"');
    expect(closed).toContain('aria-haspopup="listbox"');
    expect(closed).toContain('aria-expanded="false"');
    expect(closed).toContain("Cherry");
  });
  it("sends its value with a form, when it has a name", () => expect(closed).toContain('<input type="hidden" name="fruit" value="c"/>'));
  it("shows the placeholder, quietly, when nothing is chosen", () => {
    const empty = html(createElement(Select, { value: "", onChange: () => {}, options, label: "Fruit", placeholder: "Pick a fruit" }));
    expect(empty).toContain("Pick a fruit");
    expect(empty).toContain("text-text-soft");
  });
  it("can be switched off and marked invalid", () => {
    const off = html(createElement(Select, { value: "a", onChange: () => {}, options, label: "Fruit", disabled: true, invalid: true }));
    expect(off).toMatch(/<button[^>]*disabled/);
    expect(off).toContain('aria-invalid="true"');
  });
  it("is at least 44 px high, for a thumb", () => expect(closed).toContain("h-11"));
});

describe("the Toggle", () => {
  it("is a switch that says on or off, in words as well as by its knob", () => {
    const on = html(createElement(Toggle, { checked: true, onChange: () => {}, label: "A deposit holds the date" }));
    expect(on).toContain('role="switch"');
    expect(on).toContain('aria-checked="true"');
    expect(on).toContain(">On<");
    expect(html(createElement(Toggle, { checked: false, onChange: () => {}, label: "x" }))).toContain(">Off<");
  });
  it("shows its hint, and can be switched off", () => {
    const t = html(createElement(Toggle, { checked: false, onChange: () => {}, label: "x", hint: "Some help", disabled: true }));
    expect(t).toContain("Some help");
    expect(t).toMatch(/<button[^>]*disabled/);
  });
});

describe("the text boxes", () => {
  it("an Input can start with an icon, and makes room for it", () => {
    const out = html(createElement(Input, { icon: "search", placeholder: "Search" }));
    expect(out).toContain("<svg");
    expect(out).toContain("pl-10");
  });
  it("has no icon and no extra room when none is asked for", () => expect(html(createElement(Input, {}))).not.toContain("pl-10"));
  it("uses 16 px text on a phone, so it never zooms in when tapped", () => {
    expect(html(createElement(Input, {}))).toContain("text-base sm:text-sm");
    expect(html(createElement(Textarea, {}))).toContain("text-base sm:text-sm");
  });
  it("is marked invalid when it is", () => expect(html(createElement(Input, { invalid: true }))).toContain('aria-invalid="true"'));
});

describe("a Field", () => {
  // The box is passed as `children` (a function), which is how Field is written; the test says so on purpose.
  // eslint-disable-next-line react/no-children-prop
  const field = (error?: string | null, hint?: string) => html(createElement(Field, { label: "Phone", hint, error, children: (p: FieldProps) => createElement(Input, p) }));

  it("connects the label to the box, so the label is clickable and read out", () => {
    const out = field();
    const id = /<label for="([^"]+)"/.exec(out)?.[1];
    expect(id).toBeTruthy();
    expect(out).toContain(`id="${id}"`);
    expect(out).toContain("Phone");
  });
  it("shows the hint, and connects it to the box", () => {
    const out = field(null, "We may call you.");
    expect(out).toContain("We may call you.");
    expect(out).toMatch(/aria-describedby="[^"]+-hint"/);
  });
  it("shows an error in plain words next to the box, instead of the hint, and says so to a screen reader", () => {
    const out = field("Enter a number we can call.", "We may call you.");
    expect(out).toContain("Enter a number we can call.");
    expect(out).toContain('role="alert"');
    expect(out).toContain('aria-invalid="true"');
    expect(out).not.toContain("We may call you.");
    expect(out).toMatch(/aria-describedby="[^"]+-error"/);
  });
});

describe("the Button", () => {
  it("is rounded and at least 44 px high, in every variant", () => {
    for (const v of ["primary", "secondary", "quiet", "danger"] as const) {
      const c = buttonClass(v);
      expect(c, v).toContain("rounded-xl");
      expect(c, v).toContain("min-h-11");
      expect(c, v).toContain("focus-visible:outline-accent");
    }
  });
  it("primary is the accent colour, secondary has a soft edge, danger is outlined in the danger colour", () => {
    expect(buttonClass("primary")).toContain("bg-accent");
    expect(buttonClass("secondary")).toContain("border-border-strong");
    expect(buttonClass("danger")).toContain("text-danger");
    expect(buttonClass("quiet")).toContain("bg-surface");
  });
  it("can fill the width of its row", () => {
    expect(buttonClass("primary", { block: true })).toContain("w-full");
    expect(buttonClass("primary")).not.toContain("w-full");
  });
  it("is a plain button that does not submit a form unless it is told to", () => {
    expect(html(createElement(Button, {}, "Cancel"))).toContain('type="button"');
    expect(html(createElement(Button, { type: "submit" }, "Save"))).toContain('type="submit"');
  });
  it("can be greyed out", () => expect(html(createElement(Button, { disabled: true }, "Save"))).toMatch(/<button[^>]*disabled/));
});

describe("the Dialog", () => {
  // eslint-disable-next-line react/no-children-prop
  const out = html(createElement(Dialog, { open: false, onClose: () => {}, title: "Add a class", actions: createElement("span", null, "Actions here"), children: createElement("p", null, "Inside") }));
  it("has a title, its content and its actions", () => {
    expect(out).toContain("Add a class");
    expect(out).toContain("Inside");
    expect(out).toContain("Actions here");
  });
  it("is the browser's own dialog, named by its title, with a round close button a screen reader can find", () => {
    expect(out).toContain("<dialog");
    expect(out).toContain('aria-labelledby="kit-dialog-title"');
    expect(out).toContain('aria-label="Close"');
    expect(out).toContain("rounded-full");
  });
  it("rises full width from the bottom on a phone", () => expect(out).toContain("max-sm:w-full"));
});

describe("a Select option with a colour", () => {
  it("shows a small coloured square in the field before the chosen words", () => {
    const out = html(createElement(Select, { value: "a", onChange: () => {}, label: "Colour", options: [{ value: "a", label: "Blue", swatch: "var(--accent)" }] }));
    expect(out).toContain("background-color:var(--accent)");
    expect(out).toContain("Blue");
  });
});
