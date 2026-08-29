import { Download as DownloadIcon } from "lucide-react";

/**
 * The one thing a reader came to this page to do: get the jar.
 *
 * A button rather than a sentence with a link in it, because "here is a URL,
 * and by the way it is stable" is a paragraph somebody has to read before they
 * can act on it. The URL is still written underneath — a server owner pasting
 * it into a startup script needs to see the string, not copy a button.
 */
export function DownloadJar() {
  const href = "https://cdn.resourcepack.ai/RPEngine.jar";

  return (
    <div className="my-5 flex flex-wrap items-center gap-x-4 gap-y-2">
      <a
        href={href}
        className="bg-primary text-primary-foreground inline-flex items-center gap-2 rounded-lg px-4 py-2 text-[0.9rem] font-semibold no-underline transition-opacity hover:opacity-90"
      >
        <DownloadIcon className="size-4" strokeWidth={2.2} />
        Download RPEngine.jar
      </a>
      <code className="text-muted-foreground text-[0.8rem]">{href}</code>
    </div>
  );
}
