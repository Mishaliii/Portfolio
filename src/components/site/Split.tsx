import type { CSSProperties, ReactNode } from "react";
import { gsap } from "gsap";
import { wobble } from "@/lib/motion";
import { Hot, parseHot, plain, type Fx } from "./Hot";

/** Heading split into word masks of chars. Words with hl get highlight animation; {{word|fx}} words are hot. */
export function SplitReveal({ text, hl, className, style }: { text: string; hl?: boolean | "gold"; className?: string; style?: CSSProperties }) {
  const segs = parseHot(text);
  const words: { w: string; fx?: Fx }[] = segs.flatMap((s) => (s.fx ? [{ w: s.t, fx: s.fx }] : s.t.split(" ").filter(Boolean).map((w) => ({ w }))));
  return (
    <span className={className} style={style} aria-label={plain(text)} role="text">
      {words.map(({ w, fx }, i) => (
        <span key={i} aria-hidden data-hl={hl ? (hl === "gold" ? "gold" : "ink") : undefined} style={{ whiteSpace: "nowrap" }}>
          {fx ? <Hot word={w} fx={fx} masked /> : [...w].map((c, j) => (
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

export function Btn({ children, solid, href, onClick, download, label, ext }: { children?: ReactNode; solid?: boolean; href?: string; onClick?: () => void; download?: boolean; label: string; ext?: boolean }) {
  const cls = `btn ${solid ? "btn-solid" : ""}`;
  const inner = children ?? <WobbleText text={label} />;
  const enter = (e: React.MouseEvent<HTMLElement>) => wobble(e.currentTarget);
  if (href)
    return (
      <a className={cls} href={href} download={download || undefined} onMouseEnter={enter} target={ext ? "_blank" : undefined} rel={ext ? "noreferrer" : undefined}>
        {inner}
      </a>
    );
  return (
    <button type="button" className={cls} onClick={onClick} onMouseEnter={enter}>
      {inner}
    </button>
  );
}

/** Text split into words that pull up one by one; animate with pullUpWords(). Reusable for section titles. */
export function WordsPullUp({ text, className, as: Tag = "span" }: { text: string; className?: string; as?: "span" | "p" | "h2" }) {
  const words = text.split(" ").filter(Boolean);
  return (
    <Tag className={className} data-words aria-label={text}>
      {words.map((w, i) => (
        <span key={i}><span aria-hidden data-word className="inline-block">{w}</span>{i < words.length - 1 ? " " : ""}</span>
      ))}
    </Tag>
  );
}
export function pullUpWords(root: ParentNode) {
  return gsap.fromTo(root.querySelectorAll("[data-word]"), { y: 35, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: "expo.out", stagger: 0.07 });
}
