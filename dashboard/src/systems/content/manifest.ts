import { defineSystem } from "@/shell/systems/manifest";

// Content: the facts and words the website shows, edited here (docs/systems/content/design.md). The editor
// screens follow the website's pages, one tab for each (Home, About, Class, Contact), then the facts every page shares (Site
// information, Opening hours). Classes, team and photos come next (the website's CMS-PAGES.md).
export default defineSystem({
  id: "content",
  name: "Website",
  version: "0.1.0",
  requires_shell: ">=0.1.0 <1.0.0",
  icon: "globe",
  needs: ["files"],
  optional: [],
  pages: [
    { path: "/content", title: "Home", permission: "content.view", nav: true },
    {
      path: "/content/about",
      title: "About",
      permission: "content.view",
      nav: true,
    },
    { path: "/content/lists/blog", title: "Blog", permission: "content.view", nav: true },
    { path: "/content/lists/reviews", title: "Reviews", permission: "content.view", nav: true },
    {
      path: "/content/contact",
      title: "Contact",
      permission: "content.view",
      nav: true,
    },
    {
      path: "/content/site",
      title: "Site information",
      permission: "content.view",
      nav: true,
    },
    {
      path: "/content/hours",
      title: "Opening hours",
      permission: "content.view",
      nav: true,
    },
  ],

  permissions: [
    {
      id: "content.view",
      label: "See the website content",
      default: ["owner", "manager", "staff"],
    },
    {
      id: "content.edit",
      label: "Edit the website content",
      default: ["owner", "manager"],
    },
    {
      id: "content.approve",
      label: "Publish changes to the website",
      default: ["owner", "manager"],
    },
    {
      id: "content.manage",
      label: "Change how the website is organized",
      default: ["owner"],
    },
  ],
  tables: ["content_pages", "content_blocks", "content_media"],
  migrations: ["001_create_tables.sql"],
  labels: {},
  today: [
    {
      id: "unpublished",
      title: "Unpublished changes",
      permission: "content.view",
    },
  ],
  emails: [],
  public: [
    { id: "page", method: "GET", fields: [] },
    { id: "site", method: "GET", fields: [] },
  ],
  search: {
    table: "content_pages",
    fields: ["title"],
    permission: "content.view",
  },
  provides: ["getPublishedPage", "getSiteInfo"],
});
