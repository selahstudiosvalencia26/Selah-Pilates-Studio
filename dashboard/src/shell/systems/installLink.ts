// Where a system is added. Owners never install anything: only the builder has the Systems page. Until sign-in decides who
// the builder is, the page shows only while developing with BUILDER_PAGES=on (see .env.example). With no link, screens
// tell the owner to ask us instead.
export const installHref = (): string | undefined => (process.env.BUILDER_PAGES === "on" ? "/preview/systems" : undefined);
