import { useEffect, useRef, useState, useCallback, type FormEvent } from "react";
import { gsap } from "gsap";
import { matchBuddyIntent, type BuddyMood, DEFAULT_FOLLOW_UPS } from "@/lib/buddy-matcher";

export type BuddyPose =
  | "idle"
  | "run"
  | "wave"
  | "sleep"
  | "surprised"
  | "laugh"
  | "stretch"
  | "sit_a"
  | "sit_b";

interface ChatMessage {
  id: string;
  sender: "user" | "sprout";
  text: string;
  isTyping?: boolean;
  typedLength?: number;
}

function renderFormattedText(raw: string): React.ReactNode {
  if (!raw) return null;

  // Split by line breaks first
  const lines = raw.split(/\r?\n/);

  return (
    <>
      {lines.map((line, lineIdx) => {
        // Regex matches markdown links [text](url), complete bold **text**, or unclosed **text at end
        const tokenRegex = /(\[[^\]]+\]\([^)]+\)|\*\*[^*]+\*\*|\*\*[^*]+$)/g;
        const parts = line.split(tokenRegex);

        const nodes: React.ReactNode[] = [];
        parts.forEach((part, pIdx) => {
          if (!part) return;

          // Markdown link
          const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
          if (linkMatch) {
            nodes.push(
              <a
                key={`l-${lineIdx}-${pIdx}`}
                href={linkMatch[2]}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="underline hover:text-white"
              >
                {linkMatch[1]}
              </a>
            );
            return;
          }

          // Complete bold **text**
          if (part.startsWith("**") && part.endsWith("**") && part.length >= 4) {
            nodes.push(
              <strong key={`b-${lineIdx}-${pIdx}`} className="buddy-hl font-bold text-white">
                {part.slice(2, -2)}
              </strong>
            );
            return;
          }

          // Incomplete bold (e.g. during typewriter typing "**Dermatology")
          if (part.startsWith("**")) {
            const clean = part.slice(2);
            if (clean.length > 0) {
              nodes.push(
                <strong key={`pb-${lineIdx}-${pIdx}`} className="buddy-hl font-bold text-white">
                  {clean}
                </strong>
              );
            }
            return;
          }

          // Strip any stray ** in normal text
          const sanitized = part.replace(/\*\*/g, "");
          if (sanitized) {
            nodes.push(<span key={`s-${lineIdx}-${pIdx}`}>{sanitized}</span>);
          }
        });

        return (
          <div key={`line-${lineIdx}`} className={lineIdx > 0 ? "mt-1.5" : ""}>
            {nodes.length > 0 ? nodes : <br />}
          </div>
        );
      })}
    </>
  );
}

interface IdleBubbleItem {
  id: string;
  text: string;
  action?: string;
  query?: string;
  page?: string;
  timeContext?: "morning" | "night";
}

const IDLE_BUBBLES_POOL: IdleBubbleItem[] = [
  // Time of day
  { id: "t1", text: "Good morning! Coffee first, portfolio second.", action: "Ask me something", query: "Tell me about Mishal", timeContext: "morning" },
  { id: "t2", text: "Late night coding session? Let's explore some ML.", action: "What can you do?", query: "What can you do?", timeContext: "night" },
  // Returning to tab / scroll
  { id: "r1", text: "You're back! I wasn't counting. (It was 4 minutes.)", action: "What's new?", query: "What has Mishal built?" },
  { id: "s1", text: "Whoa, speed reader! Want the 10 second version?", action: "Tell me about Mishal", query: "Who is Mishal?" },
  { id: "s2", text: "Scrolling fast! Looking for anything specific?", action: "Show projects", query: "What has Mishal built?" },
  // Page aware: Works
  { id: "w1", text: "Psst, DDSS is the one with the clinical images.", action: "Tell me about DDSS", query: "Tell me about DDSS", page: "works" },
  { id: "w2", text: "Three case studies here. DDSS is a personal favourite.", action: "Why DDSS?", query: "How does DDSS work?", page: "works" },
  // Page aware: Journey
  { id: "j1", text: "That is a lot of years and chai.", action: "How did he start?", query: "Education background", page: "journey" },
  { id: "j2", text: "Notice the odometer rolling back in time?", action: "Career path", query: "Tell me about your career", page: "journey" },
  // Page aware: Expertise
  { id: "e1", text: "Python, FastAPI, PyTorch... he even knows what a tensor is.", action: "Tech stack?", query: "Tech stack?", page: "expertise" },
  { id: "e2", text: "Computer vision and NLP are his core superpowers.", action: "What is he best at?", query: "What is he best at?", page: "expertise" },
  // Page aware: Connect
  { id: "c1", text: "Say hi, he replies faster than me.", action: "Contact", query: "How can I contact Mishal?", page: "connect" },
  { id: "c2", text: "Coffee chat or job offer? He's open to both.", action: "Is he available?", query: "Is he available to hire?", page: "connect" },
  // Page aware: About
  { id: "a1", text: "All facts verified. No hallucinations in this bio.", action: "Why hire him?", query: "Why should I hire him?", page: "about" },
  { id: "a2", text: "TKM College of Engineering and Blue Cast roots!", action: "Background", query: "Tell me about your background", page: "about" },
  // Generic & playful
  { id: "g1", text: "I can tell jokes. They are bad.", action: "Tell me a joke", query: "Tell me a joke" },
  { id: "g2", text: "Poke me. I dare you." },
  { id: "g3", text: "Did you know Mishal is open to work?", action: "Is he available?", query: "Is Mishal available for hire?" },
  { id: "g4", text: "I don't sleep often, but I might doze off soon.", action: "Ask me anything", query: "What are your skills?" },
  { id: "g5", text: "Want to see my wooden dance moves?", action: "Dance for me", query: "Dance for me" },
  { id: "g6", text: "Tabs or spaces? Let's play a game.", action: "Play a game", query: "Play a game" },
];

const INITIAL_TRANSCRIPT: ChatMessage[] = [
  {
    id: "welcome",
    sender: "sprout",
    text: "Hi there! I'm **Sprout**, Mishal's portfolio assistant. Ask me about his projects, skills, education, or hiring!",
  },
];

export function Buddy() {
  const [pose, setPose] = useState<BuddyPose>("idle");
  const [facingRight, setFacingRight] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [inputText, setInputText] = useState("");
  const [bubbleText, setBubbleText] = useState<string | null>(null);
  const [bubbleAction, setBubbleAction] = useState<{ label: string; query: string } | null>(null);
  const [bubbleVisible, setBubbleVisible] = useState(false);
  const [flipLeft, setFlipLeft] = useState(false);
  const [isAsleep, setIsAsleep] = useState(false);
  const [hasSitA, setHasSitA] = useState(false);
  const [hasSitB, setHasSitB] = useState(false);

  // Transcript & conversation state (session React state)
  const [transcript, setTranscript] = useState<ChatMessage[]>(INITIAL_TRANSCRIPT);
  const [followUps, setFollowUps] = useState<string[]>(DEFAULT_FOLLOW_UPS);
  const [gameStep, setGameStep] = useState<number>(0);
  const askedIntents = useRef<Set<string>>(new Set());
  const hasChatted = useRef(false);

  // Visitor identity & conversation memory (session React state)
  const [visitorName, setVisitorName] = useState<string | null>(() => {
    try {
      return sessionStorage.getItem("sprout_visitor_name");
    } catch {
      return null;
    }
  });
  const awaitingName = useRef<boolean>(false);
  const greetedWithName = useRef<boolean>(false);
  const lastIntent = useRef<string | null>(null);
  const lastResponseText = useRef<string | null>(null);

  // DOM Refs
  const walkerRef = useRef<HTMLDivElement>(null);
  const spriteWrapRef = useRef<HTMLDivElement>(null);
  const doorLeafRef = useRef<SVGGElement>(null);
  const mouthRef = useRef<HTMLDivElement>(null);
  const notesContainerRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);
  const transcriptScrollRef = useRef<HTMLDivElement>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const [bubbleOffset, setBubbleOffset] = useState({ shiftX: 0, tailShiftX: 0, tailLeft: 110 });

  // Motion & Animation state
  const curPos = useRef({ x: 0, y: 0 });
  const isRunning = useRef(false);
  const isPerched = useRef(false);
  const isDragging = useRef(false);
  const isTalking = useRef(false);
  const perkArmed = useRef(true);
  const pokesCount = useRef(0);
  const lastPointerMove = useRef(Date.now());
  const mountTime = useRef(Date.now());
  const mouthToggle = useRef(false);
  const idleBobTween = useRef<gsap.core.Tween | null>(null);
  const runSwayTween = useRef<gsap.core.Tween | null>(null);
  const perchTween = useRef<gsap.core.Tween | null>(null);
  const bubbleFadeTimeout = useRef<number | null>(null);
  const talkInterval = useRef<number | null>(null);
  const roamTimer = useRef<number | null>(null);
  const fidgetTimer = useRef<number | null>(null);
  const sleepTimer = useRef<number | null>(null);

  // Idle bubbles tracking
  const lastIdleBubbleTime = useRef<number>(0);
  const idleBubbleCount = useRef<number>(0);
  const lastScrollTime = useRef<number>(0);
  const isFastScrolling = useRef<boolean>(false);

  // Active typing state for instant click completion
  const activeTypingRef = useRef<{ cancel: () => void; finish: () => void } | null>(null);

  // Preload assets & detect sit_a / sit_b
  useEffect(() => {
    const preload = () => {
      const img = new Image();
      img.src = "/buddy/idle.webp";
      img.onload = () => {
        ["run", "wave", "sleep", "surprised", "laugh", "stretch"].forEach((name) => {
          const other = new Image();
          other.src = `/buddy/${name}.webp`;
        });
      };
    };

    if ("requestIdleCallback" in window) {
      (window as any).requestIdleCallback(preload, { timeout: 2000 });
    } else {
      setTimeout(preload, 2000);
    }

    setHasSitA(false);
    setHasSitB(false);
  }, []);

  const prefersReduced = useCallback(() => {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  // Bubble positioning: clamp horizontally with 16px viewport margins, and flip left if overlapping content
  const updateBubblePlacement = useCallback(() => {
    if (!walkerRef.current || !bubbleRef.current) return;
    const walkerRect = walkerRef.current.getBoundingClientRect();
    const walkerCenterX = walkerRect.left + walkerRect.width / 2;
    const bubbleWidth = bubbleRef.current.offsetWidth || 240;
    const bubbleHeight = bubbleRef.current.offsetHeight || 60;
    const margin = 16;

    // Check if on Works page or near right edge / content
    const isWorks =
      window.location.hash === '#works' ||
      Boolean(document.querySelector('#works.is-active, [data-page="works"].is-active'));

    const canFlipLeft = walkerRect.left >= bubbleWidth + 24;
    let shouldFlipLeft = false;

    if (canFlipLeft) {
      if (isWorks) {
        shouldFlipLeft = true;
      } else if (walkerRect.right > window.innerWidth - 300) {
        const candidateAboveTop = walkerRect.top - bubbleHeight - 14;
        const candidateAboveBottom = walkerRect.top - 6;
        const candidateAboveLeft = walkerRect.left - (bubbleWidth - walkerRect.width) / 2;
        const candidateAboveRight = candidateAboveLeft + bubbleWidth;

        const checkPoints = [
          { x: candidateAboveLeft + 15, y: candidateAboveTop + 15 },
          { x: candidateAboveRight - 15, y: candidateAboveTop + 15 },
          { x: (candidateAboveLeft + candidateAboveRight) / 2, y: (candidateAboveTop + candidateAboveBottom) / 2 },
        ];
        for (const pt of checkPoints) {
          if (pt.x > 0 && pt.x < window.innerWidth && pt.y > 0 && pt.y < window.innerHeight) {
            const el = document.elementFromPoint(pt.x, pt.y);
            if (el && !walkerRef.current.contains(el)) {
              if (
                el.closest(
                  'main h1, main h2, main h3, main p, main a, main button, main input, [data-content], .project-card, .case-study, .score-box, .interactive-explorer, .hero-chip, .productivity-card, .productivity-chart'
                )
              ) {
                shouldFlipLeft = true;
                break;
              }
            }
          }
        }
      }
    }

    setFlipLeft(shouldFlipLeft);

    let minCenter = margin + bubbleWidth / 2;
    const bendListEl = document.querySelector('.page.is-active .bend-list-wrapper');
    if (bendListEl) {
      const blRect = bendListEl.getBoundingClientRect();
      if (blRect.right > 0 && blRect.right < window.innerWidth * 0.75) {
        minCenter = Math.max(minCenter, blRect.right + 24 + bubbleWidth / 2);
      }
    }

    const maxCenter = window.innerWidth - margin - bubbleWidth / 2;
    const clampedCenter = Math.max(minCenter, Math.min(maxCenter, walkerCenterX));
    const shiftX = clampedCenter - walkerCenterX;
    const tailShiftX = shiftX;
    const tailLeft = Math.max(14, Math.min(bubbleWidth - 14, bubbleWidth / 2 - shiftX));

    setBubbleOffset({ shiftX, tailShiftX, tailLeft });
  }, []);

  useEffect(() => {
    updateBubblePlacement();
    window.addEventListener("resize", updateBubblePlacement);
    return () => window.removeEventListener("resize", updateBubblePlacement);
  }, [updateBubblePlacement, bubbleText, bubbleVisible]);

  // Auto-scroll transcript to bottom directly to prevent interval fighting
  useEffect(() => {
    if (chatOpen && transcriptScrollRef.current) {
      transcriptScrollRef.current.scrollTop = transcriptScrollRef.current.scrollHeight;
    }
  }, [transcript, chatOpen]);

  // Idle Bobbing
  const startIdleBob = useCallback(() => {
    if (prefersReduced() || isRunning.current || isPerched.current || isAsleep || idleBobTween.current)
      return;
    if (spriteWrapRef.current) {
      idleBobTween.current = gsap.to(spriteWrapRef.current, {
        y: -3,
        duration: 1.4,
        yoyo: true,
        repeat: -1,
        ease: "sine.inOut",
      });
    }
  }, [isAsleep, prefersReduced]);

  const stopIdleBob = useCallback(() => {
    if (idleBobTween.current) {
      idleBobTween.current.kill();
      idleBobTween.current = null;
    }
    if (spriteWrapRef.current) {
      gsap.set(spriteWrapRef.current, { y: 0 });
    }
  }, []);

  // Speech bubble over head (for reactions, idle lines, pokes)
  const speakReaction = useCallback(
    (text: string, mood?: BuddyMood, action?: { label: string; query: string }) => {
      if (talkInterval.current) clearInterval(talkInterval.current);
      if (bubbleFadeTimeout.current) clearTimeout(bubbleFadeTimeout.current);

      if (mood) {
        if (mood === "excited") setPose("laugh");
        else if (mood === "happy") setPose("wave");
        else if (mood === "shy") setPose("idle");
        else if (mood === "laugh") setPose("laugh");
        else if (mood === "hug") setPose("laugh");
        else if (mood === "surprised") setPose("surprised");
        else if (mood === "sad") {
          setPose("sleep");
          setTimeout(() => {
            if (!isAsleep) setPose("idle");
          }, 1400);
        }
      }

      // If chat panel is open, head bubble is strictly disabled
      if (chatOpen) {
        setBubbleVisible(false);
        setBubbleText(null);
        setBubbleAction(null);
        return;
      }

      setBubbleAction(action || null);
      setBubbleText(text);
      setBubbleVisible(true);

      const fadeTime = 6000;
      bubbleFadeTimeout.current = window.setTimeout(() => {
        setBubbleVisible(false);
        setBubbleAction(null);
        setBubbleText(null);
      }, fadeTime);
    },
    [chatOpen, isAsleep]
  );

  // Dismiss speech bubble immediately on any page change
  useEffect(() => {
    const dismissBubble = () => {
      setBubbleVisible(false);
      setBubbleText(null);
      setBubbleAction(null);
      if (bubbleFadeTimeout.current) clearTimeout(bubbleFadeTimeout.current);
    };
    window.addEventListener("page-change", dismissBubble);
    window.addEventListener("hashchange", dismissBubble);
    window.addEventListener("popstate", dismissBubble);
    return () => {
      window.removeEventListener("page-change", dismissBubble);
      window.removeEventListener("hashchange", dismissBubble);
      window.removeEventListener("popstate", dismissBubble);
    };
  }, []);

  // Dance sequence (alternate laugh and wave poses with hops for 3 seconds)
  const performDance = useCallback(() => {
    if (prefersReduced()) return;
    stopIdleBob();
    const tl = gsap.timeline({
      onComplete: () => {
        setPose("idle");
        startIdleBob();
      },
    });

    for (let i = 0; i < 4; i++) {
      tl.call(() => setPose(i % 2 === 0 ? "laugh" : "wave"));
      tl.to(curPos.current, {
        y: -18,
        duration: 0.18,
        ease: "power2.out",
        onUpdate: () => {
          if (walkerRef.current) gsap.set(walkerRef.current, { y: curPos.current.y });
        },
      });
      tl.to(curPos.current, {
        y: 0,
        duration: 0.18,
        ease: "power2.in",
        onUpdate: () => {
          if (walkerRef.current) gsap.set(walkerRef.current, { y: curPos.current.y });
        },
      });
    }
  }, [prefersReduced, startIdleBob, stopIdleBob]);

  // Door opening animation
  const openDoor = useCallback((onComplete?: () => void) => {
    if (!doorLeafRef.current) {
      onComplete?.();
      return;
    }
    gsap.fromTo(
      doorLeafRef.current,
      { scaleX: 1 },
      {
        scaleX: 0.12,
        duration: 0.5,
        ease: "power2.out",
        transformOrigin: "right center",
        onComplete: () => {
          setTimeout(() => {
            if (doorLeafRef.current) {
              gsap.to(doorLeafRef.current, {
                scaleX: 1,
                duration: 0.45,
                ease: "power2.inOut",
                transformOrigin: "right center",
                onComplete,
              });
            } else {
              onComplete?.();
            }
          }, 150);
        },
      }
    );
  }, []);

  // Roam Movement
  const runTo = useCallback(
    (targetX: number, speed = 190, onComplete?: () => void) => {
      if (prefersReduced() || isPerched.current || isDragging.current) {
        onComplete?.();
        return;
      }

      isRunning.current = true;
      stopIdleBob();

      const dx = targetX - curPos.current.x;
      const dist = Math.abs(dx);
      if (dist < 4) {
        isRunning.current = false;
        startIdleBob();
        onComplete?.();
        return;
      }

      const dur = dist / speed;
      setFacingRight(dx > 0);
      setPose("run");

      if (spriteWrapRef.current) {
        if (runSwayTween.current) runSwayTween.current.kill();
        runSwayTween.current = gsap.to(spriteWrapRef.current, {
          rotation: 4,
          y: -9,
          duration: 0.19,
          yoyo: true,
          repeat: -1,
          ease: "sine.inOut",
        });
      }

      gsap.to(curPos.current, {
        x: targetX,
        duration: dur,
        ease: "none",
        onUpdate: () => {
          if (walkerRef.current) {
            gsap.set(walkerRef.current, {
              x: curPos.current.x,
              y: curPos.current.y,
              force3D: true,
            });
          }
        },
        onComplete: () => {
          isRunning.current = false;
          if (runSwayTween.current) {
            runSwayTween.current.kill();
            runSwayTween.current = null;
          }
          if (spriteWrapRef.current) {
            gsap.set(spriteWrapRef.current, { rotation: 0, y: 0 });
          }
          setFacingRight(false);
          setPose("idle");
          startIdleBob();
          onComplete?.();
        },
      });
    },
    [prefersReduced, startIdleBob, stopIdleBob, updateBubblePlacement]
  );

  const returnHome = useCallback(
    (speed = 270, onComplete?: () => void) => {
      runTo(0, speed, onComplete);
    },
    [runTo]
  );

  // Perch on door
  const perchOnDoor = useCallback(() => {
    if (prefersReduced() || isRunning.current || isPerched.current || isAsleep || chatOpen)
      return;
    isPerched.current = true;
    stopIdleBob();
    setPose("run");

    const doorCenterX = 41;
    const tl = gsap.timeline({
      onComplete: () => {
        curPos.current.x = doorCenterX;
        curPos.current.y = -94;

        if (hasSitA && hasSitB) {
          let sitToggle = false;
          perchTween.current = gsap.to(
            {},
            {
              duration: 0.76,
              repeat: -1,
              onRepeat: () => {
                sitToggle = !sitToggle;
                setPose(sitToggle ? "sit_b" : "sit_a");
              },
            }
          );
        } else {
          setPose("sleep");
          if (spriteWrapRef.current) {
            perchTween.current = gsap.to(spriteWrapRef.current, {
              rotation: 3,
              duration: 0.76,
              yoyo: true,
              repeat: -1,
              ease: "sine.inOut",
              transformOrigin: "bottom center",
            });
          }
        }

        const notes = ["♪", "♫"];
        const noteInterval = window.setInterval(() => {
          if (!isPerched.current) {
            clearInterval(noteInterval);
            return;
          }
          if (notesContainerRef.current) {
            const el = document.createElement("span");
            el.className = "buddy-note";
            el.textContent = notes[Math.floor(Math.random() * notes.length)];
            notesContainerRef.current.appendChild(el);
            gsap.fromTo(
              el,
              { x: 0, y: 0, opacity: 1 },
              {
                x: -70 + (Math.random() * 30 - 15),
                y: -80 + (Math.random() * 20 - 10),
                opacity: 0,
                duration: 1.8,
                ease: "power1.out",
                onComplete: () => el.remove(),
              }
            );
          }
        }, 760);

        const stayDuration = 7500 + Math.random() * 3500;
        setTimeout(() => {
          if (!isPerched.current) return;
          clearInterval(noteInterval);
          hopDownFromPerch();
        }, stayDuration);
      },
    });

    tl.to(
      curPos.current,
      {
        x: doorCenterX,
        duration: 0.75,
        ease: "power1.inOut",
        onUpdate: () => {
          if (walkerRef.current) {
            gsap.set(walkerRef.current, { x: curPos.current.x, force3D: true });
          }
        },
      },
      0
    );

    tl.to(
      curPos.current,
      {
        y: -128,
        duration: 0.38,
        ease: "power2.out",
        onUpdate: () => {
          if (walkerRef.current) {
            gsap.set(walkerRef.current, { y: curPos.current.y, force3D: true });
          }
        },
      },
      0
    );

    tl.to(
      curPos.current,
      {
        y: -94,
        duration: 0.37,
        ease: "bounce.out",
        onUpdate: () => {
          if (walkerRef.current) {
            gsap.set(walkerRef.current, { y: curPos.current.y, force3D: true });
          }
        },
      },
      0.38
    );
  }, [chatOpen, hasSitA, hasSitB, isAsleep, prefersReduced, stopIdleBob]);

  const hopDownFromPerch = useCallback(
    (onComplete?: () => void) => {
      if (!isPerched.current) {
        onComplete?.();
        return;
      }
      isPerched.current = false;
      if (perchTween.current) {
        perchTween.current.kill();
        perchTween.current = null;
      }
      if (spriteWrapRef.current) {
        gsap.set(spriteWrapRef.current, { rotation: 0 });
      }

      setPose("surprised");

      gsap.to(curPos.current, {
        x: 0,
        y: 0,
        duration: 0.45,
        ease: "power2.in",
        onUpdate: () => {
          if (walkerRef.current) {
            gsap.set(walkerRef.current, {
              x: curPos.current.x,
              y: curPos.current.y,
              force3D: true,
            });
          }
        },
        onComplete: () => {
          setPose("idle");
          startIdleBob();
          onComplete?.();
        },
      });
    },
    [startIdleBob]
  );

  // Sleep & Wake
  const putToSleep = useCallback(() => {
    if (prefersReduced() || isRunning.current || isPerched.current || isAsleep || chatOpen)
      return;
    setIsAsleep(true);
    stopIdleBob();
    setPose("sleep");

    if (spriteWrapRef.current) {
      gsap.to(spriteWrapRef.current, {
        scaleY: 0.93,
        duration: 1.4,
        yoyo: true,
        repeat: -1,
        ease: "sine.inOut",
        transformOrigin: "bottom center",
      });
    }
  }, [chatOpen, isAsleep, prefersReduced, stopIdleBob]);

  const wakeUp = useCallback(() => {
    if (!isAsleep) return;
    setIsAsleep(false);
    if (spriteWrapRef.current) {
      gsap.killTweensOf(spriteWrapRef.current);
      gsap.set(spriteWrapRef.current, { scaleY: 1 });
    }
    setPose("surprised");
    gsap.to(curPos.current, {
      y: -12,
      duration: 0.18,
      yoyo: true,
      repeat: 1,
      ease: "power1.out",
      onUpdate: () => {
        if (walkerRef.current) gsap.set(walkerRef.current, { y: curPos.current.y });
      },
      onComplete: () => {
        setPose("idle");
        startIdleBob();
        speakReaction("I'm awake! I wasn't sleeping.", "happy");
      },
    });
  }, [isAsleep, speakReaction, startIdleBob]);

  // First session entrance
  useEffect(() => {
    let hasEntered = false;
    try {
      hasEntered = sessionStorage.getItem("sprout_entered") === "1";
    } catch {}

    if (!hasEntered && !prefersReduced()) {
      try {
        sessionStorage.setItem("sprout_entered", "1");
      } catch {}

      openDoor(() => {
        curPos.current.x = 20;
        runTo(0, 240, () => {
          setPose("wave");
          speakReaction("Hi there! I'm **Sprout**, Mishal's portfolio assistant.", "happy");
          setTimeout(() => setPose("idle"), 1200);
        });
      });
    } else {
      startIdleBob();
    }
  }, [openDoor, prefersReduced, runTo, speakReaction, startIdleBob]);

  // Cursor perk up
  useEffect(() => {
    if (prefersReduced()) return;

    const onPointerMove = (e: PointerEvent) => {
      lastPointerMove.current = Date.now();
      if (isAsleep || isRunning.current || isPerched.current || isDragging.current) return;
      if (!walkerRef.current) return;

      const rect = walkerRef.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dist = Math.hypot(e.clientX - cx, e.clientY - cy);

      if (dist < 110 && perkArmed.current) {
        perkArmed.current = false;
        setPose("surprised");
        gsap.to(curPos.current, {
          y: -10,
          duration: 0.16,
          yoyo: true,
          repeat: 1,
          ease: "power2.out",
          onUpdate: () => {
            if (walkerRef.current) gsap.set(walkerRef.current, { y: curPos.current.y });
          },
          onComplete: () => {
            setPose("idle");
          },
        });
      } else if (dist > 220 && !perkArmed.current) {
        perkArmed.current = true;
      }
    };

    window.addEventListener("pointermove", onPointerMove);
    return () => window.removeEventListener("pointermove", onPointerMove);
  }, [isAsleep, prefersReduced]);

  // Fast scroll tracker
  useEffect(() => {
    let lastY = window.scrollY;
    let scrollTimeout: number | undefined;

    const onScroll = () => {
      const dy = Math.abs(window.scrollY - lastY);
      lastY = window.scrollY;
      if (dy > 45) {
        lastScrollTime.current = Date.now();
        isFastScrolling.current = true;
        clearTimeout(scrollTimeout);
        scrollTimeout = window.setTimeout(() => {
          isFastScrolling.current = false;
        }, 1500);
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      clearTimeout(scrollTimeout);
    };
  }, []);

  // Idle Bubble Scheduler (Problem 4)
  useEffect(() => {
    const interval = window.setInterval(() => {
      if (
        chatOpen ||
        isAsleep ||
        isRunning.current ||
        isPerched.current ||
        isDragging.current ||
        document.hidden ||
        bubbleVisible
      ) {
        return;
      }

      const now = Date.now();
      // First idle bubble no earlier than 14 s after buddy appears
      if (now - mountTime.current < 14000) return;
      // At most one per 45 s
      if (now - lastIdleBubbleTime.current < 45000) return;
      // At most 4 per session unless visitor has chatted
      if (idleBubbleCount.current >= 4 && !hasChatted.current) return;

      const currentPage = window.location.hash.slice(1) || "overview";
      const hour = new Date().getHours();

      // Find suitable candidate from pool
      let candidates = IDLE_BUBBLES_POOL.filter((item) => {
        if (item.page && item.page !== currentPage) return false;
        if (item.timeContext === "morning" && hour >= 12) return false;
        if (item.timeContext === "night" && (hour >= 6 && hour < 20)) return false;
        return true;
      });

      if (candidates.length === 0) candidates = IDLE_BUBBLES_POOL.filter((item) => !item.page && !item.timeContext);

      const picked = candidates[Math.floor(Math.random() * candidates.length)];
      if (!picked) return;

      lastIdleBubbleTime.current = now;
      idleBubbleCount.current++;

      speakReaction(
        picked.text,
        "happy",
        picked.action && picked.query ? { label: picked.action, query: picked.query } : undefined
      );
    }, 7000);

    return () => clearInterval(interval);
  }, [bubbleVisible, chatOpen, isAsleep, speakReaction]);

  // Fidget, Sleep, Roam Timers
  useEffect(() => {
    if (prefersReduced()) return;

    fidgetTimer.current = window.setInterval(() => {
      const now = Date.now();
      if (
        now - lastPointerMove.current >= 9000 &&
        !isRunning.current &&
        !isPerched.current &&
        !isAsleep &&
        !chatOpen &&
        curPos.current.x === 0
      ) {
        const pick = Math.random() > 0.5 ? "stretch" : "wave";
        setPose(pick);
        setTimeout(() => {
          if (!isAsleep) setPose("idle");
        }, 1300);
      }
    }, 10000);

    sleepTimer.current = window.setInterval(() => {
      const now = Date.now();
      if (
        now - lastPointerMove.current >= 25000 &&
        !isRunning.current &&
        !isPerched.current &&
        !isAsleep &&
        !chatOpen
      ) {
        putToSleep();
      }
    }, 5000);

    roamTimer.current = window.setInterval(() => {
      if (isRunning.current || isPerched.current || isAsleep || chatOpen) return;
      if (Math.random() > 0.5) {
        if (Math.random() < 0.45 && curPos.current.x === 0) {
          perchOnDoor();
        } else {
          const maxLeft = -(window.innerWidth - 180);
          const pct = 0.3 + Math.random() * 0.6;
          const targetX = Math.round(maxLeft * pct);

          runTo(targetX, 190, () => {
            if (Math.random() < 0.55) {
              setTimeout(() => {
                returnHome(210);
              }, 3500);
            }
          });
        }
      }
    }, 11000);

    return () => {
      if (fidgetTimer.current) clearInterval(fidgetTimer.current);
      if (sleepTimer.current) clearInterval(sleepTimer.current);
      if (roamTimer.current) clearInterval(roamTimer.current);
    };
  }, [chatOpen, isAsleep, perchOnDoor, prefersReduced, putToSleep, returnHome, runTo]);

  // Visibility change
  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) {
        stopIdleBob();
      } else if (!isAsleep && !isPerched.current && !isRunning.current) {
        startIdleBob();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [isAsleep, startIdleBob, stopIdleBob]);

  // Door click
  const onDoorClick = () => {
    if (isPerched.current) {
      speakReaction("I'm up here! Come say hi.", "happy");
      return;
    }
    if (curPos.current.x !== 0) {
      speakReaction("Coming!!", "excited");
      returnHome(425, () => {
        setPose("laugh");
        gsap.to(curPos.current, {
          y: -14,
          duration: 0.16,
          yoyo: true,
          repeat: 1,
          ease: "power2.out",
          onUpdate: () => {
            if (walkerRef.current) gsap.set(walkerRef.current, { y: curPos.current.y });
          },
          onComplete: () => {
            setTimeout(() => setPose("idle"), 500);
          },
        });
      });
    } else {
      speakReaction("I'm already here!", "happy");
    }
  };

  // Buddy walker click (opens chat, wakes up, or pokes)
  const onBuddyClick = () => {
    if (isAsleep) {
      wakeUp();
      return;
    }

    if (!chatOpen) {
      setChatOpen(true);
      wakeUp();
      setBubbleVisible(false);
      setBubbleText(null);
      setBubbleAction(null);
      if (bubbleFadeTimeout.current) clearTimeout(bubbleFadeTimeout.current);
      setTimeout(() => {
        if (window.innerWidth >= 640) chatInputRef.current?.focus();
      }, 100);
      return;
    }

    // Poke escalation if clicked while panel is open
    pokesCount.current++;
    const p = pokesCount.current;
    if (p === 1) {
      speakReaction("Hey! That tickles.", "happy");
    } else if (p === 2) {
      speakReaction("Careful, sprites don't bend easily!", "surprised");
    } else if (p === 3) {
      speakReaction("That's three pokes. Ask me something instead!", "shy");
    } else if (p === 4) {
      speakReaction("Still poking?!", "surprised");
    } else if (p === 5) {
      speakReaction("Whoa, getting dizzy...", "sad");
    } else if (p >= 6) {
      pokesCount.current = 0;
      speakReaction("I'm out of here for a second!", "excited");
      if (spriteWrapRef.current) {
        gsap.to(spriteWrapRef.current, {
          rotation: 360,
          duration: 0.6,
          ease: "power2.inOut",
          onComplete: () => {
            gsap.set(spriteWrapRef.current, { rotation: 0 });
            runTo(-160, 360, () => {
              setTimeout(() => returnHome(220), 2000);
            });
          },
        });
      }
    }
  };

  // Drag and drop physics on desktop
  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === "touch" || prefersReduced() || isRunning.current) return;
    const startX = e.clientX;
    const startY = e.clientY;
    const initialPos = { ...curPos.current };
    let hasMoved = false;

    const onMove = (ev: PointerEvent) => {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      if (Math.hypot(dx, dy) > 8 && !isDragging.current) {
        isDragging.current = true;
        hasMoved = true;
        stopIdleBob();
        setPose("surprised");
        if (spriteWrapRef.current) {
          gsap.to(spriteWrapRef.current, { scaleY: 1.08, duration: 0.15 });
        }
        speakReaction("Wheee!", "surprised");
      }

      if (isDragging.current && walkerRef.current) {
        curPos.current.x = initialPos.x + dx;
        curPos.current.y = initialPos.y + dy;
        gsap.set(walkerRef.current, {
          x: curPos.current.x,
          y: curPos.current.y,
          force3D: true,
        });
        updateBubblePlacement();
      }
    };

    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);

      if (isDragging.current) {
        isDragging.current = false;
        if (spriteWrapRef.current) {
          gsap.to(spriteWrapRef.current, { scaleY: 1, duration: 0.2 });
        }
        setPose("surprised");

        gsap.to(curPos.current, {
          y: 0,
          duration: 0.65,
          ease: "bounce.out",
          onUpdate: () => {
            if (walkerRef.current) {
              gsap.set(walkerRef.current, { y: curPos.current.y, force3D: true });
            }
          },
          onComplete: () => {
            speakReaction("Put me down gently next time!", "happy");
            setPose("idle");
            startIdleBob();
          },
        });
      } else if (!hasMoved) {
        // Simple click handled by onClick
      }
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  const closeChat = useCallback(() => {
    if (activeTypingRef.current) activeTypingRef.current.cancel();
    if (talkInterval.current) clearInterval(talkInterval.current);
    isTalking.current = false;
    setChatOpen(false);
    setBubbleVisible(false);
    setBubbleText(null);
    setBubbleAction(null);
    if (bubbleFadeTimeout.current) clearTimeout(bubbleFadeTimeout.current);
  }, []);

  // Keyboard accessibility
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && chatOpen) {
        closeChat();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [chatOpen]);

  // Submit query & handle conversation flow
  const handleQuery = useCallback(
    (q: string) => {
      if (!q || !q.trim()) return;
      const cleanQ = q.trim();
      hasChatted.current = true;

      // Ensure chat is open
      if (!chatOpen) setChatOpen(true);

      // Disable head bubble strictly while chat panel is open
      setBubbleVisible(false);
      setBubbleText(null);
      setBubbleAction(null);
      if (bubbleFadeTimeout.current) clearTimeout(bubbleFadeTimeout.current);

      if (activeTypingRef.current) {
        activeTypingRef.current.cancel();
        activeTypingRef.current = null;
      }
      if (talkInterval.current) {
        clearInterval(talkInterval.current);
        talkInterval.current = null;
      }
      isTalking.current = false;

      const userMsgId = "user_" + Date.now();
      const sproutMsgId = "sprout_" + (Date.now() + 1);

      // Match intent with session identity & repetition context
      const ans = matchBuddyIntent(cleanQ, {
        gameStep,
        visitorName: visitorName || undefined,
        awaitingName: awaitingName.current,
        greetedWithName: greetedWithName.current,
        lastIntent: lastIntent.current || undefined,
        lastResponseText: lastResponseText.current || undefined,
      });
      if (!ans) return;

      if (ans.newVisitorName) {
        setVisitorName(ans.newVisitorName);
        try {
          sessionStorage.setItem("sprout_visitor_name", ans.newVisitorName);
        } catch {}
        awaitingName.current = false;
      }
      if (ans.awaitingName !== undefined) {
        awaitingName.current = ans.awaitingName;
      }
      if (ans.greetedWithName) {
        greetedWithName.current = true;
      }

      // Anti-repetition: if user triggers the same intent consecutively, append follow-up
      let responseText = ans.text;
      let responseFollowUps = [...ans.followUps];
      if (lastIntent.current === ans.intent && lastResponseText.current) {
        responseText = `As mentioned: ${ans.text}\n\nWould you like to explore another topic?`;
        responseFollowUps = ["Tell me about DDSS", "Tech stack?", "Download CV"];
      }
      lastIntent.current = ans.intent;
      lastResponseText.current = ans.text;

      askedIntents.current.add(ans.intent);
      if (typeof ans.gameStep === "number") {
        setGameStep(ans.gameStep);
      }

      // Add user message & sprout message with typing indicator
      setTranscript((prev) => [
        ...prev,
        { id: userMsgId, sender: "user", text: cleanQ },
        { id: sproutMsgId, sender: "sprout", text: "", isTyping: true },
      ]);

      setInputText("");

      // Visual pose reaction only (no speech bubble over head while panel is open!)
      if (ans.mood) {
        if (ans.mood === "excited") setPose("laugh");
        else if (ans.mood === "happy") setPose("wave");
        else if (ans.mood === "shy") setPose("idle");
        else if (ans.mood === "laugh") setPose("laugh");
        else if (ans.mood === "hug") setPose("laugh");
        else if (ans.mood === "surprised") setPose("surprised");
      }

      // Brief typing indicator (~200ms) then live typewriter effect into the transcript bubble
      const timer = setTimeout(() => {
        if (prefersReduced()) {
          setTranscript((prev) =>
            prev.map((m) => (m.id === sproutMsgId ? { ...m, isTyping: false, text: responseText } : m))
          );
          if (transcriptScrollRef.current) {
            transcriptScrollRef.current.scrollTop = transcriptScrollRef.current.scrollHeight;
          }
          setFollowUps(responseFollowUps);
          if (ans.dance) performDance();
          if (window.innerWidth >= 640) chatInputRef.current?.focus();
          return;
        }

        // Switch isTyping to false, start live typing into the bubble
        setTranscript((prev) =>
          prev.map((m) => (m.id === sproutMsgId ? { ...m, isTyping: false, text: "" } : m))
        );

        isTalking.current = true;
        const completeInstantly = () => {
          if (talkInterval.current) {
            clearInterval(talkInterval.current);
            talkInterval.current = null;
          }
          isTalking.current = false;
          activeTypingRef.current = null;
          setTranscript((prev) =>
            prev.map((m) => (m.id === sproutMsgId ? { ...m, isTyping: false, text: responseText } : m))
          );
          if (transcriptScrollRef.current) {
            transcriptScrollRef.current.scrollTop = transcriptScrollRef.current.scrollHeight;
          }
          setFollowUps(responseFollowUps);
          if (ans.dance) performDance();
          if (window.innerWidth >= 640) chatInputRef.current?.focus();
        };

        activeTypingRef.current = { cancel: completeInstantly, finish: completeInstantly };

        // Chunk by words and whitespace so nothing is ever truncated mid-word
        const chunks = responseText.match(/\S+|\s+/g) || [responseText];
        let chunkIdx = 0;
        let accumulated = "";

        talkInterval.current = window.setInterval(() => {
          if (chunkIdx >= chunks.length) {
            completeInstantly();
            return;
          }

          accumulated += chunks[chunkIdx];
          chunkIdx++;
          // If the next token is whitespace, append it immediately with the word
          if (chunkIdx < chunks.length && /^\s+$/.test(chunks[chunkIdx])) {
            accumulated += chunks[chunkIdx];
            chunkIdx++;
          }

          setTranscript((prev) =>
            prev.map((m) => (m.id === sproutMsgId ? { ...m, isTyping: false, text: accumulated } : m))
          );
          if (transcriptScrollRef.current) {
            transcriptScrollRef.current.scrollTop = transcriptScrollRef.current.scrollHeight;
          }

          // Mouth flap
          mouthToggle.current = !mouthToggle.current;
          if (mouthToggle.current && mouthRef.current) {
            const h = 5 + Math.random() * 2;
            gsap.to(mouthRef.current, {
              height: h,
              duration: 0.03,
              yoyo: true,
              repeat: 1,
              ease: "power1.inOut",
            });
          }
        }, 36);
      }, 200);

      return () => clearTimeout(timer);
    },
    [chatOpen, gameStep, performDance, prefersReduced, visitorName]
  );

  const onChatSubmit = (e: FormEvent) => {
    e.preventDefault();
    handleQuery(inputText);
  };

  const clearTranscript = () => {
    if (activeTypingRef.current) activeTypingRef.current.cancel();
    if (talkInterval.current) clearInterval(talkInterval.current);
    isTalking.current = false;
    setTranscript([]);
    setFollowUps(DEFAULT_FOLLOW_UPS);
    setGameStep(0);
    askedIntents.current.clear();
    lastIntent.current = null;
    lastResponseText.current = null;
  };

  // Head bubble content
  const renderFormattedBubble = () => {
    if (isAsleep) {
      return <span className="buddy-zzz">zzz...</span>;
    }
    if (!bubbleText) return null;
    return (
      <div className="flex flex-col gap-1">
        <div>{renderFormattedText(bubbleText)}</div>
        {bubbleAction && (
          <button
            type="button"
            className="buddy-bubble-action"
            onClick={(e) => {
              e.stopPropagation();
              setBubbleVisible(false);
              setBubbleAction(null);
              handleQuery(bubbleAction.query);
            }}
          >
            {bubbleAction.label} →
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="buddy-layer" aria-hidden={false}>
      {/* Little Door in bottom-right corner */}
      <button
        type="button"
        className="buddy-door"
        onClick={onDoorClick}
        aria-label="Sprout's door. Call Sprout back to his home."
        tabIndex={0}
      >
        <svg
          viewBox="0 0 58 94"
          width="100%"
          height="100%"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M 6 92 L 6 32 A 23 23 0 0 1 52 32 L 52 92 Z"
            fill="#0B0B0B"
            stroke="#0B0B0B"
            strokeWidth="3"
          />
          <g ref={doorLeafRef}>
            <path
              d="M 8 90 L 8 32 A 21 21 0 0 1 50 32 L 50 90 Z"
              fill="#1F5A3A"
              stroke="#0B0B0B"
              strokeWidth="1.5"
            />
            <path
              d="M 14 36 A 15 15 0 0 1 44 36 L 44 54 L 14 54 Z"
              fill="#17452c"
              stroke="#0B0B0B"
              strokeWidth="1"
            />
            <rect
              x="14"
              y="59"
              width="30"
              height="26"
              rx="2"
              fill="#17452c"
              stroke="#0B0B0B"
              strokeWidth="1"
            />
            <circle cx="16" cy="61" r="3" fill="#C3922E" stroke="#0B0B0B" strokeWidth="1" />
          </g>
          <line x1="2" y1="92" x2="56" y2="92" stroke="#0B0B0B" strokeWidth="3" />
        </svg>
      </button>

      {/* Floating Notes Container for door perch */}
      <div
        ref={notesContainerRef}
        style={{
          position: "absolute",
          right: "calc(16px + env(safe-area-inset-right) + 24px)",
          bottom: "calc(16px + env(safe-area-inset-bottom) + 94px)",
          pointerEvents: "none",
        }}
      />

      {/* Sprout Sprite Walker */}
      <div
        ref={walkerRef}
        role="button"
        className="buddy-walker"
        onClick={onBuddyClick}
        onPointerDown={onPointerDown}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onBuddyClick();
          }
        }}
        aria-label="Sprout assistant. Click or press Enter to chat."
      >
        <div
          className="buddy-facing"
          style={{ transform: facingRight ? "scaleX(1)" : "scaleX(-1)" }}
        >
          <div ref={spriteWrapRef} className="buddy-sprite-wrap">
            <img src="/buddy/idle.webp" alt="Sprout idle" className={pose === "idle" ? "is-visible" : ""} />
            <img src="/buddy/run.webp" alt="Sprout running" className={pose === "run" ? "is-visible" : ""} />
            <img src="/buddy/wave.webp" alt="Sprout waving" className={pose === "wave" ? "is-visible" : ""} />
            <img src="/buddy/sleep.webp" alt="Sprout sleeping" className={pose === "sleep" ? "is-visible" : ""} />
            <img src="/buddy/surprised.webp" alt="Sprout surprised" className={pose === "surprised" ? "is-visible" : ""} />
            <img src="/buddy/laugh.webp" alt="Sprout laughing" className={pose === "laugh" ? "is-visible" : ""} />
            <img src="/buddy/stretch.webp" alt="Sprout stretching" className={pose === "stretch" ? "is-visible" : ""} />
            {hasSitA && (
              <img src="/buddy/sit_a.webp" alt="Sprout sitting A" className={pose === "sit_a" ? "is-visible" : ""} />
            )}
            {hasSitB && (
              <img src="/buddy/sit_b.webp" alt="Sprout sitting B" className={pose === "sit_b" ? "is-visible" : ""} />
            )}

            {/* Mouth Flap */}
            <div
              ref={mouthRef}
              className="buddy-mouth"
              style={{
                display:
                  (pose === "idle" || pose === "wave") && isTalking.current
                    ? "block"
                    : "none",
              }}
            >
              <div className="buddy-tongue" />
            </div>
          </div>
        </div>

        {/* Soft shadow */}
        <div
          className="buddy-shadow"
          style={{ opacity: isPerched.current ? 0 : 1 }}
        />

        {/* Head Speech Bubble */}
        <div
          aria-hidden="true"
          className={`buddy-bubble-wrap ${flipLeft ? "is-flipped-left" : ""}`}
          style={{
            transform: flipLeft ? "none" : `translateX(calc(-50% + ${bubbleOffset.shiftX}px))`,
            opacity: !chatOpen && ((bubbleVisible && bubbleText) || isAsleep) ? 1 : 0,
            pointerEvents: !chatOpen && ((bubbleVisible && bubbleText) || isAsleep) ? "auto" : "none",
          }}
        >
          <div
            ref={bubbleRef}
            className="buddy-bubble"
            role="status"
            aria-live="polite"
            onPointerEnter={() => {
              if (!isAsleep) {
                setBubbleVisible(false);
                setBubbleAction(null);
                setBubbleText(null);
                if (bubbleFadeTimeout.current) clearTimeout(bubbleFadeTimeout.current);
              }
            }}
          >
            {renderFormattedBubble()}
            {flipLeft ? (
              <svg
                className="buddy-bubble-tail-right"
                viewBox="0 0 14 8"
                xmlns="http://www.w3.org/2000/svg"
              >
                <polygon points="0,0 14,0 7,8" fill="#F3ECE0" />
                <polyline
                  points="0,0 7,8 14,0"
                  stroke="#0B0B0B"
                  strokeWidth="1.5"
                  fill="none"
                />
              </svg>
            ) : (
              <svg
                className="buddy-bubble-tail"
                viewBox="0 0 14 8"
                xmlns="http://www.w3.org/2000/svg"
                style={{
                  left: `${bubbleOffset.tailLeft}px`,
                }}
              >
                <polygon points="0,0 14,0 7,8" fill="#F3ECE0" />
                <polyline
                  points="0,0 7,8 14,0"
                  stroke="#0B0B0B"
                  strokeWidth="1.5"
                  fill="none"
                />
              </svg>
            )}
          </div>
        </div>
      </div>

      {/* Conversation Panel (STAYS OPEN across answers) */}
      {chatOpen && (
        <aside className="buddy-chat-panel" role="dialog" aria-label="Conversation with Sprout">
          <div className="buddy-chat-header">
            <span className="buddy-chat-title">
              <span className="buddy-chat-dot" />
              SPROUT · ASSISTANT
            </span>
            <div className="buddy-chat-actions">
              <button
                type="button"
                className="buddy-chat-clear"
                onClick={clearTranscript}
                title="Clear transcript"
              >
                Clear
              </button>
              <button
                type="button"
                className="buddy-chat-close"
                onClick={closeChat}
                aria-label="Close chat"
              >
                ×
              </button>
            </div>
          </div>

          {/* Scrollable Transcript with lenis prevent */}
          <div
            ref={transcriptScrollRef}
            className="buddy-transcript"
            data-lenis-prevent
            aria-live="polite"
          >
            {transcript.length === 0 ? (
              <div className="buddy-transcript-empty">
                <p>Ask me anything about Mishal's projects, technical skills, or availability!</p>
              </div>
            ) : (
              transcript.map((msg) =>
                msg.sender === "user" ? (
                  <div key={msg.id} className="buddy-msg-user">
                    {msg.text}
                  </div>
                ) : (
                  <div
                    key={msg.id}
                    className="buddy-msg-sprout"
                    onClick={() => {
                      if (activeTypingRef.current) activeTypingRef.current.finish();
                    }}
                    title={msg.isTyping || isTalking.current ? "Click to complete instantly" : undefined}
                  >
                    {msg.isTyping ? (
                      <div className="buddy-typing-dots">
                        <span className="buddy-typing-dot" />
                        <span className="buddy-typing-dot" />
                        <span className="buddy-typing-dot" />
                      </div>
                    ) : (
                      renderFormattedText(msg.text)
                    )}
                  </div>
                )
              )
            )}
          </div>

          {/* Follow-up Chips (always visible, outside transcript) */}
          <div className="buddy-chips">
            {followUps.map((chip) => (
              <button
                key={chip}
                type="button"
                className="buddy-chip"
                onClick={() => handleQuery(chip)}
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Input Form */}
          <form className="buddy-chat-form" onSubmit={onChatSubmit}>
            <input
              ref={chatInputRef}
              type="text"
              className="buddy-chat-input"
              placeholder="Ask Sprout anything..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              aria-label="Ask Sprout a question"
            />
            <button type="submit" className="buddy-chat-btn">
              Ask
            </button>
          </form>
        </aside>
      )}
    </div>
  );
}
