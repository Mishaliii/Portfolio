import { useEffect, useRef, useState, useCallback, type FormEvent } from "react";
import { gsap } from "gsap";
import { matchBuddyIntent, type BuddyMood } from "@/lib/buddy-matcher";

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

interface TextToken {
  text: string;
  bold: boolean;
}

function parseTokens(str: string): TextToken[] {
  const parts = str.split(/(\*\*[^*]+\*\*)/g);
  return parts
    .filter((p) => p.length > 0)
    .map((part) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return { text: part.slice(2, -2), bold: true };
      }
      return { text: part, bold: false };
    });
}

const IDLE_ROAM_LINES = [
  "Just having a look around.",
  "Mishal writes clean, tested code.",
  "Nice portfolio, huh?",
  "Looking for good data...",
  "Acorns love clean architectures.",
];

export function Buddy() {
  const [pose, setPose] = useState<BuddyPose>("idle");
  const [facingRight, setFacingRight] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [inputText, setInputText] = useState("");
  const [bubbleText, setBubbleText] = useState<string | null>(null);
  const [bubbleVisible, setBubbleVisible] = useState(false);
  const [isAsleep, setIsAsleep] = useState(false);
  const [hasSitA, setHasSitA] = useState(false);
  const [hasSitB, setHasSitB] = useState(false);

  // DOM Refs
  const walkerRef = useRef<HTMLButtonElement>(null);
  const spriteWrapRef = useRef<HTMLDivElement>(null);
  const doorLeafRef = useRef<SVGGElement>(null);
  const mouthRef = useRef<HTMLDivElement>(null);
  const notesContainerRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const [bubbleOffset, setBubbleOffset] = useState({ shiftX: 0, tailShiftX: 0 });

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

    // Check optional sit poses
    const checkImage = (src: string): Promise<boolean> =>
      new Promise((resolve) => {
        const i = new Image();
        i.onload = () => resolve(true);
        i.onerror = () => resolve(false);
        i.src = src;
      });

    Promise.all([checkImage("/buddy/sit_a.webp"), checkImage("/buddy/sit_b.webp")]).then(
      ([a, b]) => {
        setHasSitA(a);
        setHasSitB(b);
      }
    );
  }, []);

  const prefersReduced = useCallback(() => {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  const updateBubblePlacement = useCallback(() => {
    if (!bubbleText || !walkerRef.current || !bubbleRef.current) return;
    const wRect = walkerRef.current.getBoundingClientRect();
    const bRect = bubbleRef.current.getBoundingClientRect();
    const sproutX = wRect.left + wRect.width / 2;
    const bw = bRect.width || 180;
    const minCenter = 12 + bw / 2;
    const maxCenter = window.innerWidth - 12 - bw / 2;
    const targetCenter = Math.max(minCenter, Math.min(maxCenter, sproutX));
    const shift = targetCenter - sproutX;
    const maxTail = Math.max(0, bw / 2 - 20);
    const tailShift = Math.max(-maxTail, Math.min(maxTail, -shift));
    setBubbleOffset({ shiftX: Math.round(shift), tailShiftX: Math.round(tailShift) });
  }, [bubbleText]);

  useEffect(() => {
    updateBubblePlacement();
    window.addEventListener("resize", updateBubblePlacement);
    return () => window.removeEventListener("resize", updateBubblePlacement);
  }, [bubbleText, isAsleep, updateBubblePlacement]);

  // Idle Bobbing
  const startIdleBob = useCallback(() => {
    if (prefersReduced() || isAsleep || isRunning.current || isPerched.current) return;
    if (idleBobTween.current) idleBobTween.current.kill();
    if (spriteWrapRef.current) {
      idleBobTween.current = gsap.to(spriteWrapRef.current, {
        y: -3,
        duration: 1.3,
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
    if (spriteWrapRef.current && !isPerched.current) {
      gsap.set(spriteWrapRef.current, { y: 0 });
    }
  }, []);

  // Door leaf opening animation
  const openDoor = useCallback((duration = 0.5) => {
    if (!doorLeafRef.current) return;
    gsap.killTweensOf(doorLeafRef.current);
    gsap.to(doorLeafRef.current, {
      scaleX: 0.12,
      duration: duration * 0.5,
      yoyo: true,
      repeat: 1,
      ease: "power2.inOut",
    });
  }, []);

  // Talking / Speech bubble with typewriter & mouth flap
  const speak = useCallback(
    (text: string, mood?: BuddyMood) => {
      // Clear previous talk intervals & timers
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

      setBubbleVisible(true);
      isTalking.current = true;

      if (prefersReduced()) {
        setBubbleText(text);
        isTalking.current = false;
        bubbleFadeTimeout.current = window.setTimeout(() => {
          setBubbleVisible(false);
        }, 9000);
        return;
      }

      const tokens = parseTokens(text);
      const totalChars = tokens.reduce((sum, t) => sum + t.text.length, 0);
      let charIdx = 0;

      talkInterval.current = window.setInterval(() => {
        charIdx++;
        // Construct partially typed string preserving bold syntax
        let remaining = charIdx;
        let constructed = "";
        for (const tok of tokens) {
          if (remaining <= 0) break;
          const sliceLen = Math.min(remaining, tok.text.length);
          const chunk = tok.text.slice(0, sliceLen);
          constructed += tok.bold ? `**${chunk}**` : chunk;
          remaining -= sliceLen;
        }

        setBubbleText(constructed);

        // Mouth flap: only if idle or wave
        const currentChar = text[charIdx - 1] || "";
        if (/[a-zA-Z]/i.test(currentChar)) {
          mouthToggle.current = !mouthToggle.current;
          if (mouthToggle.current && mouthRef.current) {
            const sy = 0.8 + Math.random() * 0.4;
            gsap.to(mouthRef.current, {
              scaleY: sy,
              duration: 0.03,
              yoyo: true,
              repeat: 1,
              ease: "power1.inOut",
            });
          }
        }

        // Tiny squash on word start
        if (
          currentChar !== " " &&
          (charIdx === 1 || text[charIdx - 2] === " ") &&
          spriteWrapRef.current
        ) {
          gsap.to(spriteWrapRef.current, {
            scaleY: 1.02,
            duration: 0.06,
            yoyo: true,
            repeat: 1,
            ease: "sine.inOut",
          });
        }

        if (charIdx >= totalChars) {
          if (talkInterval.current) clearInterval(talkInterval.current);
          isTalking.current = false;
          if (mouthRef.current) gsap.set(mouthRef.current, { scaleY: 0 });

          // Fade out 9s after line finishes
          bubbleFadeTimeout.current = window.setTimeout(() => {
            setBubbleVisible(false);
          }, 9000);
        }
      }, 36);
    },
    [isAsleep, prefersReduced]
  );

  // Run to X coordinate
  const runTo = useCallback(
    (targetX: number, speed = 270, onComplete?: () => void) => {
      if (!walkerRef.current) return;
      const startX = curPos.current.x;
      const dist = Math.abs(targetX - startX);
      if (dist < 4) {
        onComplete?.();
        return;
      }

      const dur = dist / speed;
      const goingRight = targetX > startX;
      setFacingRight(goingRight);
      setPose("run");
      isRunning.current = true;
      stopIdleBob();

      // Run sway
      if (!prefersReduced() && spriteWrapRef.current) {
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
    [prefersReduced, startIdleBob, stopIdleBob]
  );

  // Return home callback
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

    const doorCenterX = 41; // door top center relative to home
    const tl = gsap.timeline({
      onComplete: () => {
        // Landed on perch
        curPos.current.x = doorCenterX;
        curPos.current.y = -94;

        // Pose handling
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

        // Spawn floating music notes
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

        // Perch duration 7.5 - 11 s
        const stayDuration = 7500 + Math.random() * 3500;
        setTimeout(() => {
          if (!isPerched.current) return;
          clearInterval(noteInterval);
          hopDownFromPerch();
        }, stayDuration);
      },
    });

    // Arc jump
    tl.to(curPos.current, {
      x: doorCenterX,
      duration: 0.75,
      ease: "power1.inOut",
      onUpdate: () => {
        if (walkerRef.current) {
          gsap.set(walkerRef.current, { x: curPos.current.x, force3D: true });
        }
      },
    }, 0);

    tl.to(curPos.current, {
      y: -128,
      duration: 0.38,
      ease: "power2.out",
      onUpdate: () => {
        if (walkerRef.current) {
          gsap.set(walkerRef.current, { y: curPos.current.y, force3D: true });
        }
      },
    }, 0);

    tl.to(curPos.current, {
      y: -94,
      duration: 0.37,
      ease: "bounce.out",
      onUpdate: () => {
        if (walkerRef.current) {
          gsap.set(walkerRef.current, { y: curPos.current.y, force3D: true });
        }
      },
    }, 0.38);
  }, [hasSitA, hasSitB, isAsleep, chatOpen, prefersReduced, stopIdleBob]);

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

      setPose("laugh");
      gsap.to(curPos.current, {
        x: 0,
        y: 0,
        duration: 0.6,
        ease: "power2.inOut",
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

  // Wake Sprout up
  const wakeUp = useCallback(() => {
    if (!isAsleep) return;
    setIsAsleep(false);
    setPose("idle");
    if (spriteWrapRef.current) {
      gsap.to(spriteWrapRef.current, {
        scaleY: 1,
        y: -14,
        duration: 0.25,
        yoyo: true,
        repeat: 1,
        ease: "power2.out",
        onComplete: () => {
          startIdleBob();
          speak("I'm awake! I wasn't sleeping.", "happy");
        },
      });
    }
  }, [isAsleep, speak, startIdleBob]);

  // First session entrance
  useEffect(() => {
    let visited = false;
    try {
      visited = sessionStorage.getItem("sprout_visited") === "1";
    } catch {
      /* ignore */
    }

    if (!visited) {
      try {
        sessionStorage.setItem("sprout_visited", "1");
      } catch {
        /* ignore */
      }
      if (!prefersReduced() && walkerRef.current) {
        // Step out of the door
        curPos.current.x = 40;
        gsap.set(walkerRef.current, { x: 40, y: 0 });
        openDoor(0.8);
        setTimeout(() => {
          runTo(0, 270, () => {
            speak("Hi there! I'm **Sprout**, Mishal's acorn buddy.", "happy");
          });
        }, 300);
      } else {
        startIdleBob();
      }
    } else {
      startIdleBob();
    }
  }, [openDoor, prefersReduced, runTo, speak, startIdleBob]);

  // Pointer activity tracking & Sleep / Perk / Fidget timers
  useEffect(() => {
    const onPointerMove = (e: PointerEvent) => {
      lastPointerMove.current = Date.now();

      // Perk check: if cursor comes within 110px of buddy
      if (
        !isAsleep &&
        !isRunning.current &&
        !isPerched.current &&
        !chatOpen &&
        walkerRef.current &&
        !prefersReduced()
      ) {
        const cx = window.innerWidth - 124 + curPos.current.x;
        const cy = window.innerHeight - 72 + curPos.current.y;
        const dist = Math.hypot(e.clientX - cx, e.clientY - cy);

        if (dist < 110 && perkArmed.current) {
          perkArmed.current = false;
          setPose("surprised");
          if (spriteWrapRef.current) {
            gsap.to(spriteWrapRef.current, {
              y: -14,
              duration: 0.35,
              yoyo: true,
              repeat: 1,
              ease: "power1.out",
              onComplete: () => {
                if (!isAsleep && !isPerched.current && !isRunning.current) {
                  setPose("idle");
                }
              },
            });
          }
        } else if (dist > 220 && !perkArmed.current) {
          perkArmed.current = true;
        }
      }
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });

    // Sleep check interval (25s without pointer activity)
    sleepTimer.current = window.setInterval(() => {
      const idleTime = Date.now() - lastPointerMove.current;
      if (
        idleTime > 25000 &&
        !isAsleep &&
        !isPerched.current &&
        !chatOpen &&
        !isRunning.current &&
        !isDragging.current
      ) {
        setIsAsleep(true);
        stopIdleBob();
        setPose("sleep");
        if (spriteWrapRef.current) {
          gsap.to(spriteWrapRef.current, {
            scaleY: 0.93,
            duration: 0.8,
            ease: "sine.inOut",
            transformOrigin: "bottom center",
          });
        }
      }
    }, 2000);

    // Fidget check (every 16s, 60% chance, pointer idle for 9s, not right after load)
    fidgetTimer.current = window.setInterval(() => {
      const now = Date.now();
      const pointerIdle = now - lastPointerMove.current > 9000;
      const loadedAWhile = now - mountTime.current > 15000;
      if (
        pointerIdle &&
        loadedAWhile &&
        !isAsleep &&
        !isPerched.current &&
        !chatOpen &&
        !isRunning.current &&
        !isDragging.current &&
        !prefersReduced() &&
        Math.random() < 0.6
      ) {
        if (Math.random() < 0.5) {
          // Wave fidget
          setPose("wave");
          if (spriteWrapRef.current) {
            gsap.to(spriteWrapRef.current, {
              y: -10,
              duration: 0.4,
              yoyo: true,
              repeat: 3,
              ease: "sine.inOut",
              onComplete: () => {
                setPose("idle");
                startIdleBob();
              },
            });
          }
        } else {
          // Stretch fidget
          setPose("stretch");
          if (spriteWrapRef.current) {
            gsap.to(spriteWrapRef.current, {
              scaleY: 1.04,
              duration: 0.6,
              yoyo: true,
              repeat: 1,
              ease: "elastic.out(1, 0.4)",
              transformOrigin: "bottom center",
              onComplete: () => {
                setPose("idle");
                startIdleBob();
              },
            });
          }
        }
      }
    }, 16000);

    // Roam check (every 11s, 50% chance, mobile 20% frequency)
    roamTimer.current = window.setInterval(() => {
      const isMobile = window.innerWidth < 640;
      const chance = isMobile ? 0.1 : 0.5;
      if (
        !isAsleep &&
        !isPerched.current &&
        !chatOpen &&
        !isRunning.current &&
        !isDragging.current &&
        !prefersReduced() &&
        curPos.current.x === 0 &&
        Math.random() < chance
      ) {
        if (!isMobile && Math.random() < 0.45) {
          // Perch on door
          perchOnDoor();
        } else {
          // Roam across screen
          const maxLeft = -(window.innerWidth - 180);
          const roamDist = maxLeft * (0.3 + Math.random() * 0.6);
          runTo(roamDist, 270, () => {
            const line =
              IDLE_ROAM_LINES[Math.floor(Math.random() * IDLE_ROAM_LINES.length)];
            speak(line);
            if (Math.random() < 0.55) {
              setTimeout(() => {
                if (!chatOpen && !isDragging.current) {
                  returnHome(270);
                }
              }, 3500);
            }
          });
        }
      }
    }, 11000);

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      if (sleepTimer.current) clearInterval(sleepTimer.current);
      if (fidgetTimer.current) clearInterval(fidgetTimer.current);
      if (roamTimer.current) clearInterval(roamTimer.current);
    };
  }, [
    chatOpen,
    isAsleep,
    perchOnDoor,
    prefersReduced,
    returnHome,
    runTo,
    speak,
    startIdleBob,
    stopIdleBob,
  ]);

  // Pause on document hidden
  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.hidden) {
        gsap.globalTimeline.pause();
      } else {
        gsap.globalTimeline.resume();
        lastPointerMove.current = Date.now();
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, []);

  // Door click handler
  const handleDoorClick = () => {
    openDoor();
    if (isPerched.current) {
      speak("I'm up here! Come say hi.", "happy");
      return;
    }
    if (Math.abs(curPos.current.x) > 10) {
      speak("Coming!!", "excited");
      returnHome(425, () => {
        setPose("laugh");
        if (spriteWrapRef.current) {
          gsap.to(spriteWrapRef.current, {
            y: -14,
            duration: 0.25,
            yoyo: true,
            repeat: 1,
            ease: "power2.out",
            onComplete: () => {
              setPose("idle");
              startIdleBob();
            },
          });
        }
      });
    } else {
      speak("I'm already here!", "happy");
    }
  };

  // Buddy click / poke handler
  const handleBuddyClick = () => {
    if (isAsleep) {
      wakeUp();
      return;
    }

    if (isPerched.current) {
      hopDownFromPerch(() => {
        setChatOpen(true);
        speak("Hi! What would you like to know about Mishal's work?", "happy");
      });
      return;
    }

    if (curPos.current.x !== 0) {
      returnHome(425, () => {
        setChatOpen(true);
        speak("Hi! What would you like to know about Mishal's work?", "happy");
      });
      return;
    }

    if (chatOpen) {
      // Poke escalation
      pokesCount.current++;
      const p = pokesCount.current;
      if (p === 1) {
        speak("Hey! That tickles.", "happy");
      } else if (p === 2) {
        speak("Careful, acorns don't bend easily!", "surprised");
      } else if (p === 3) {
        speak("That's three pokes. Ask me something instead!", "shy");
      } else if (p === 4) {
        speak("Still poking?!", "surprised");
      } else if (p === 5) {
        speak("Whoa, getting dizzy...", "sad");
      } else if (p >= 6) {
        pokesCount.current = 0;
        speak("I'm out of here!", "excited");
        if (spriteWrapRef.current && !prefersReduced()) {
          gsap.to(spriteWrapRef.current, {
            rotation: 360,
            duration: 0.6,
            ease: "power2.inOut",
            onComplete: () => {
              gsap.set(spriteWrapRef.current, { rotation: 0 });
              runTo(-(window.innerWidth - 180), 400);
            },
          });
        } else {
          runTo(-(window.innerWidth - 180), 400);
        }
      }
    } else {
      setChatOpen(true);
      speak("Hi! What would you like to know about Mishal's work?", "happy");
      setTimeout(() => chatInputRef.current?.focus(), 150);
    }
  };

  // Drag and drop (desktop pointer only)
  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === "touch" || !window.matchMedia("(pointer: fine)").matches) {
      return;
    }
    if (isAsleep) {
      wakeUp();
      return;
    }
    if (isPerched.current) return;

    const startClientX = e.clientX;
    const startClientY = e.clientY;
    const initialX = curPos.current.x;
    let didDrag = false;

    const onMove = (ev: PointerEvent) => {
      const dx = ev.clientX - startClientX;
      const dy = ev.clientY - startClientY;
      if (!didDrag && Math.hypot(dx, dy) > 8) {
        didDrag = true;
        isDragging.current = true;
        stopIdleBob();
        setPose("surprised");
        speak("Wheee!");
      }
      if (didDrag && walkerRef.current) {
        const maxLeft = -(window.innerWidth - 160);
        const newX = Math.max(maxLeft, Math.min(20, initialX + dx));
        const newY = Math.max(-80, Math.min(0, dy));
        curPos.current.x = newX;
        curPos.current.y = newY;
        gsap.set(walkerRef.current, { x: newX, y: newY, force3D: true });
      }
    };

    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      if (didDrag) {
        isDragging.current = false;
        setPose("laugh");
        speak("Put me down gently next time!");
        gsap.to(curPos.current, {
          y: 0,
          duration: 0.5,
          ease: "bounce.out",
          onUpdate: () => {
            if (walkerRef.current) {
              gsap.set(walkerRef.current, { y: curPos.current.y, force3D: true });
            }
          },
          onComplete: () => {
            setTimeout(() => {
              setPose("idle");
              startIdleBob();
            }, 1000);
          },
        });
      }
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  // Keyboard accessibility
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && chatOpen) {
        setChatOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [chatOpen]);

  // Submit query
  const handleQuery = (q: string) => {
    if (!q || !q.trim()) return;
    const ans = matchBuddyIntent(q);
    if (ans) {
      speak(ans.text, ans.mood);
    }
    setInputText("");
  };

  const onChatSubmit = (e: FormEvent) => {
    e.preventDefault();
    handleQuery(inputText);
  };

  // Chips questions
  const SUGGESTION_CHIPS = [
    "What has Mishal built?",
    "Tech stack?",
    "Is he available?",
    "Tell me about DDSS",
    "Tell me a joke",
    "Contact",
  ];

  // Render formatted speech bubble text
  const renderFormattedBubble = () => {
    if (isAsleep) {
      return <span className="buddy-zzz">zzz...</span>;
    }
    if (!bubbleText) return null;
    const parts = bubbleText.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={i} className="buddy-hl">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  return (
    <div className="buddy-layer" aria-label="Sprout Buddy Layer">
      <div ref={notesContainerRef} className="buddy-notes-anchor" />

      {/* Door */}
      <button
        type="button"
        className="buddy-door"
        onClick={handleDoorClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleDoorClick();
          }
        }}
        aria-label="Sprout's home door"
      >
        <svg
          className="buddy-door-svg"
          viewBox="0 0 58 94"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Frame */}
          <path
            d="M2 92V24C2 11.85 11.85 2 24 2H34C46.15 2 56 11.85 56 24V92H2Z"
            fill="#0B0B0B"
            stroke="#0B0B0B"
            strokeWidth="2"
          />
          {/* Interior Hole */}
          <path
            d="M6 92V25C6 14.5 14.5 6 25 6H33C43.5 6 52 14.5 52 25V92H6Z"
            fill="#070707"
          />
          {/* Door Leaf (swings open from right hinge) */}
          <g ref={doorLeafRef} className="buddy-door-leaf">
            <path
              d="M8 92V25C8 15.6 15.6 8 25 8H33C42.4 8 50 15.6 50 25V92H8Z"
              fill="#1F5A3A"
              stroke="#133824"
              strokeWidth="1.5"
            />
            {/* Panels inside leaf */}
            <rect
              x="13"
              y="18"
              width="32"
              height="30"
              rx="6"
              fill="#17432b"
              stroke="#133824"
              strokeWidth="1"
            />
            <rect
              x="13"
              y="54"
              width="32"
              height="32"
              rx="4"
              fill="#17432b"
              stroke="#133824"
              strokeWidth="1"
            />
            {/* Gold Door Knob on left */}
            <circle cx="16" cy="52" r="3.2" fill="#C3922E" stroke="#0B0B0B" strokeWidth="0.8" />
          </g>
        </svg>
      </button>

      {/* Buddy Walker */}
      <button
        ref={walkerRef}
        type="button"
        className="buddy-walker"
        onClick={handleBuddyClick}
        onPointerDown={onPointerDown}
        onPointerEnter={() => {
          if (isAsleep) wakeUp();
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleBuddyClick();
          }
        }}
        aria-label="Sprout buddy. Click or press Enter to chat."
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

        {/* Speech Bubble */}
        <div
          className="buddy-bubble-wrap"
          style={{
            transform: `translateX(calc(-50% + ${bubbleOffset.shiftX}px))`,
            opacity: (bubbleVisible && bubbleText) || isAsleep ? 1 : 0,
            pointerEvents: (bubbleVisible && bubbleText) || isAsleep ? "auto" : "none",
          }}
        >
          <div ref={bubbleRef} className="buddy-bubble" role="status" aria-live="polite">
            {renderFormattedBubble()}
            <svg
              className="buddy-bubble-tail"
              viewBox="0 0 14 8"
              xmlns="http://www.w3.org/2000/svg"
              style={{
                left: `calc(50% - ${bubbleOffset.tailShiftX}px)`,
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
          </div>
        </div>
      </button>

      {/* Chat Panel */}
      {chatOpen && (
        <aside className="buddy-chat-panel" role="dialog" aria-label="Chat with Sprout">
          <div className="buddy-chat-header">
            <span className="buddy-chat-title">
              <span className="buddy-chat-dot" />
              Sprout · Assistant
            </span>
            <button
              type="button"
              className="buddy-chat-close"
              onClick={() => setChatOpen(false)}
              aria-label="Close chat"
            >
              ×
            </button>
          </div>

          <div className="buddy-chips">
            {SUGGESTION_CHIPS.map((chip) => (
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
