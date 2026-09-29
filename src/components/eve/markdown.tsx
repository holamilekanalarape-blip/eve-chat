import { useState, type ReactNode } from "react";
import { Check, Copy } from "lucide-react";

function inline(text: string, key: string): ReactNode[] {
  const pattern =
    /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\(https?:\/\/[^)\s]+\))/g;
  const nodes: ReactNode[] = [];
  let last = 0;
  let index = 0;
  for (const match of text.matchAll(pattern)) {
    const start = match.index ?? 0;
    if (start > last) nodes.push(text.slice(last, start));
    const token = match[0];
    const id = `${key}-${index}`;
    index += 1;
    if (token.startsWith("**")) {
      nodes.push(<strong key={id}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith("`")) {
      nodes.push(
        <code key={id} className="rounded bg-muted px-1 py-0.5 font-mono text-sm">
          {token.slice(1, -1)}
        </code>,
      );
    } else if (token.startsWith("*")) {
      nodes.push(<em key={id}>{token.slice(1, -1)}</em>);
    } else {
      const linked = token.match(/^\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)$/);
      if (linked?.[1] && linked[2]) nodes.push(<SafeLink key={id} href={linked[2]}>{linked[1]}</SafeLink>);
    }
    last = start + token.length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

function SafeLink({ href, children }: { href: string; children: ReactNode }) {
  let url: URL;
  try {
    url = new URL(href);
  } catch {
    return <span>{children}</span>;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return <span>{children}</span>;
  return (
    <a
      href={url.href}
      target="_blank"
      rel="noreferrer"
      className="underline decoration-border underline-offset-4 hover:decoration-foreground"
    >
      {children}
    </a>
  );
}

function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const body = code.replace(/^[a-z0-9_+-]+\n/i, (header) => (header.trim().includes(" ") ? header : ""));

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-muted">
      <div className="flex justify-end px-2 py-1">
        <button
          type="button"
          className="inline-flex h-8 items-center gap-1 rounded-md px-2 text-xs text-muted-foreground hover:bg-background hover:text-foreground"
          onClick={() => {
            void navigator.clipboard.writeText(code.replace(/^[a-z0-9_+-]+\n/i, "")).then(() => {
              setCopied(true);
              window.setTimeout(() => setCopied(false), 1200);
            });
          }}
        >
          {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto px-3 pb-3 font-mono text-sm leading-relaxed text-foreground">
        <code>{body}</code>
      </pre>
    </div>
  );
}

function proseBlocks(source: string, key: string) {
  const lines = source.split("\n");
  const blocks: ReactNode[] = [];
  let i = 0;
  let n = 0;

  while (i < lines.length) {
    const line = lines[i] ?? "";
    if (!line.trim()) {
      i += 1;
      continue;
    }

    const heading = /^(#{1,3})\s+(.+)$/.exec(line);
    if (heading?.[1] && heading[2]) {
      const Tag = heading[1].length === 1 ? "h2" : heading[1].length === 2 ? "h3" : "h4";
      const className =
        Tag === "h2"
          ? "mt-4 text-lg font-semibold text-balance"
          : "mt-3 text-base font-semibold text-balance";
      blocks.push(
        <Tag key={`${key}-h-${n}`} className={className}>
          {inline(heading[2], `${key}-h-${n}`)}
        </Tag>,
      );
      n += 1;
      i += 1;
      continue;
    }

    if (/^>\s?/.test(line)) {
      const quoted: string[] = [];
      while (i < lines.length && /^>\s?/.test(lines[i] ?? "")) {
        quoted.push((lines[i] ?? "").replace(/^>\s?/, ""));
        i += 1;
      }
      blocks.push(
        <blockquote
          key={`${key}-q-${n}`}
          className="border-l-2 border-border pl-3 text-muted-foreground"
        >
          {inline(quoted.join(" "), `${key}-q-${n}`)}
        </blockquote>,
      );
      n += 1;
      continue;
    }

    if (/^\s*[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i] ?? "")) {
        items.push((lines[i] ?? "").replace(/^\s*[-*]\s+/, ""));
        i += 1;
      }
      blocks.push(
        <ul key={`${key}-ul-${n}`} className="list-disc space-y-1 pl-5">
          {items.map((item, itemIndex) => (
            <li key={`${key}-li-${n}-${itemIndex}`}>{inline(item, `${key}-li-${n}-${itemIndex}`)}</li>
          ))}
        </ul>,
      );
      n += 1;
      continue;
    }

    if (/^\s*\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i] ?? "")) {
        items.push((lines[i] ?? "").replace(/^\s*\d+\.\s+/, ""));
        i += 1;
      }
      blocks.push(
        <ol key={`${key}-ol-${n}`} className="list-decimal space-y-1 pl-5">
          {items.map((item, itemIndex) => (
            <li key={`${key}-oi-${n}-${itemIndex}`}>{inline(item, `${key}-oi-${n}-${itemIndex}`)}</li>
          ))}
        </ol>,
      );
      n += 1;
      continue;
    }

    const paragraph: string[] = [];
    while (
      i < lines.length &&
      (lines[i] ?? "").trim() &&
      !/^(#{1,3})\s+/.test(lines[i] ?? "") &&
      !/^>\s?/.test(lines[i] ?? "") &&
      !/^\s*[-*]\s+/.test(lines[i] ?? "") &&
      !/^\s*\d+\.\s+/.test(lines[i] ?? "")
    ) {
      paragraph.push(lines[i] ?? "");
      i += 1;
    }
    blocks.push(
      <p key={`${key}-p-${n}`} className="text-pretty">
        {inline(paragraph.join(" "), `${key}-p-${n}`)}
      </p>,
    );
    n += 1;
  }

  return blocks;
}

export function Markdown({ text }: { text: string }) {
  const pieces = text.split("```");
  return (
    <div className="space-y-3 leading-relaxed">
      {pieces.map((piece, index) => {
        if (index % 2 === 1) return <CodeBlock key={`code-${index}`} code={piece.replace(/^\n/, "").replace(/\n$/, "")} />;
        if (!piece.trim()) return null;
        return <div key={`prose-${index}`} className="space-y-3">{proseBlocks(piece, `p${index}`)}</div>;
      })}
    </div>
  );
}
