const urlRegex = /(https?:\/\/[^\s]+)/g;

export default function LinkifiedText({ text }: { text: string }) {
  const parts = text.split(urlRegex);
  return (
    <>
      {parts.map((part, i) =>
        urlRegex.test(part) ? (
          <a key={i} href={part} target="_blank" rel="noopener noreferrer"
            className="text-blue-600 hover:underline">
            {(() => { try { return new URL(part).hostname.replace(/^www\./, ""); } catch { return part; } })()}
          </a>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}
