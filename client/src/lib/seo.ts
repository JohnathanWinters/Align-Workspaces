export function setPageMeta(opts: {
  title: string;
  description: string;
  url?: string;
  image?: string;
  type?: string;
}) {
  document.title = opts.title;

  const setMeta = (name: string, content: string, attr = "name") => {
    let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null;
    if (!el) {
      el = document.createElement("meta");
      el.setAttribute(attr, name);
      document.head.appendChild(el);
    }
    el.setAttribute("content", content);
  };

  setMeta("description", opts.description);
  setMeta("og:title", opts.title, "property");
  setMeta("og:description", opts.description, "property");
  setMeta("og:type", opts.type || "website", "property");
  if (opts.url) setMeta("og:url", opts.url, "property");
  if (opts.image) setMeta("og:image", opts.image, "property");
  setMeta("twitter:title", opts.title, "name");
  setMeta("twitter:description", opts.description, "name");
  if (opts.image) setMeta("twitter:image", opts.image, "name");
}
