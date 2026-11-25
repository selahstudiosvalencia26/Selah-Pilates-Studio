import PageHeader from "@/shell/frame/PageHeader";
import Demo from "./Demo";

// A look at the form controls of the toolbox (src/kit): the text box with an icon, the dropdown, the time list, the switch and the tick
// boxes. Development only, like the other preview screens. Resize the window, or open it on a phone, to see the dropdown become a sheet.
export default function ComponentsPreview() {
  return (
    <>
      <PageHeader title="Controls" description="The form controls every screen uses. Try them on a computer and on a phone." />
      <Demo />
    </>
  );
}
