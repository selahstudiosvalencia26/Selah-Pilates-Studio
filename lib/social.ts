// The Messenger address for a Facebook page address.
// A page like facebook.com/profile.php?id=123 becomes m.me/123.
export function messengerUrl(facebook: string | null): string | null {
  if (!facebook) return null;
  try {
    const url = new URL(facebook);
    const id = url.searchParams.get("id");
    if (id) return `https://m.me/${id}`;
    const name = url.pathname.replace(/\//g, "");
    return name ? `https://m.me/${name}` : facebook;
  } catch {
    return facebook;
  }
}
