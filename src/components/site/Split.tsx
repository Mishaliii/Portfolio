import type { CSSProperties, ReactNode } from "react";
import { wobble } from "@/lib/motion";

/** Heading split into word masks of chars. Words with hl get highlight animation. */
export function SplitReveal({
  text,
  hl,
  className,
  style,
}: {
  text: string;
  hl?: boolean | "gold";
  className?: string;
  style?: CSSProperties;
}) {
  const words = text.split(" ").filter(Boolean);
  return (
    <span className={className} style={style} aria-label={text} role="text">
      {words.map((w, i) => (
        <span
          key={i}
          aria-hidden
          data-hl={hl ? (hl === "gold" ? "gold" : "ink") : undefined}
          style={{ whiteSpace: "nowrap" }}
        >
          {[...w].map((c, j) => (
            <span className="mask" key={j}>
              <span data-char>{c}</span>
            </span>
          ))}
          {i < words.length - 1 ? " " : ""}
        </span>
      ))}
    </span>
  );
}

export function WobbleText({ text }: { text: string }) {
  return (
    <span aria-label={text}>
      {[...text].map((c, i) => (
        <span className="wob" aria-hidden key={i}>
          {c === " " ? "\u00a0" : c}
        </span>
      ))}
    </span>
  );
}

export function Btn({
  children,
  solid,
  href,
  onClick,
  download,
  label,
  ext,
}: {
  children?: ReactNode;
  solid?: boolean;
  href?: string;
  onClick?: () => void;
  download?: boolean;
  label: string;
  ext?: boolean;
}) {
  const cls = `btn ${solid ? "btn-solid" : ""}`;
  const inner = children ?? <WobbleText text={label} />;
  const enter = (e: React.MouseEvent<HTMLElement>) => wobble(e.currentTarget);
  if (href)
    return (
      <a
        className={cls}
        href={href}
        download={download || undefined}
        onMouseEnter={enter}
        target={ext ? "_blank" : undefined}
        rel={ext ? "noopener noreferrer" : undefined}
      >
        {inner}
      </a>
    );
  return (
    <button type="button" className={cls} onClick={onClick} onMouseEnter={enter}>
      {inner}
    </button>
  );
}
