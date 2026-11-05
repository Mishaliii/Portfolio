import { useEffect, useRef, useState } from "react";
import { expertise } from "@/content";
import { SplitReveal } from "./Split";
import { Liquid } from "./Liquid";
import { subscribe, onPage } from "@/lib/motion";
import { linkedSkills, projectsForSkill, skillState } from "@/lib/expertise";

export function PageExpertise({ goProject, active = true }: { goProject: (id: string) => void; active?: boolean }) {
  const box = useRef<HTMLDivElement>(null), cv = useRef<HTMLCanvasElement>(null);
  const category = useRef(-1), focus = useRef(-1), pinned = useRef(-1);
  const [selected, setSelected] = useState(-1), [activeCluster, setActiveCluster] = useState(-1);
  const activeRef = useRef(active);
  activeRef.current = active;

  useEffect(() => {
    const b = box.current, c = cv.current;
    if (!b || !c) return;
    const ctx = c.getContext("2d"); if (!ctx) return;
    const skills = expertise.skills, N = skills.length;
    const states = skills.map((s) => skillState(s.name));
    const links = skills.map((s) => linkedSkills(s.name));
    const px = new Float32Array(N), py = new Float32Array(N), leanX = new Float32Array(N), leanY = new Float32Array(N), vx = new Float32Array(N), vy = new Float32Array(N), flashes = new Float64Array(N);
    const centers = [[.25,.32],[.74,.32],[.74,.77],[.25,.77]];
    let W = 0, H = 0, qx = -1000, qy = -1000, lastInput = performance.now(), touched = false, prev = performance.now(), elapsed = 0, entry = 0, wasActive = false;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    let ink = "", muted = "", green = "", gold = "", paper = "", grid = "", circle = "", circleLine = "", scanColor = "";

    const size = () => {
      const r = b.getBoundingClientRect(); W = r.width; H = r.height;
      const d = Math.min(1.5, window.devicePixelRatio || 1);
      c.width = Math.round(W*d); c.height = Math.round(H*d); ctx.setTransform(d,0,0,d,0,0);
      const css = getComputedStyle(b), token = (s: string) => css.getPropertyValue(s).trim();
      ink=token("--ink"); muted=token("--muted"); green=token("--accent-green"); gold=token("--gold"); paper=token("--cream"); grid=token("--map-grid"); circle=token("--map-circle"); circleLine=token("--map-circle-line"); scanColor=token("--map-scan");
    };
    size(); const ro = new ResizeObserver(size); ro.observe(b);

    const input = () => { lastInput = performance.now(); touched = true; };
    const nearest = () => { let best = -1, distance = 24; for(let i=0;i<N;i++){ const d=Math.hypot(px[i]-qx,py[i]-qy); if(d<distance){best=i;distance=d;} } return best; };
    const update = (i: number) => { if(focus.current!==i){focus.current=i;setSelected(i);} };
    const move = (e: PointerEvent) => { if(!onPage(b))return; const r=b.getBoundingClientRect(); qx=e.clientX-r.left; qy=e.clientY-r.top; input(); if(pinned.current<0)update(nearest()); };
    const leave = () => { qx=qy=-1000; if(pinned.current<0)update(-1); };
    const click = (e: PointerEvent) => { move(e); const i=nearest(); pinned.current=pinned.current===i?-1:i; update(pinned.current); };
    const key = (e: KeyboardEvent) => { input(); if(e.key==="Escape"){pinned.current=-1;update(-1);} };

    b.addEventListener("pointermove",move);b.addEventListener("pointerleave",leave);b.addEventListener("pointerup",click);
    window.addEventListener("keydown",key);window.addEventListener("wheel",input,{passive:true});window.addEventListener("pointerdown",input,{passive:true});window.addEventListener("pointermove",input,{passive:true});

    let lastCluster=-1;
    const unsub=subscribe((t)=>{
      const dt=Math.min(32,t-prev)/1000;prev=t;
      if (!activeRef.current || !onPage(b)) { wasActive = false; return; }

      if(!wasActive){entry=0;wasActive=true;} entry+=dt;elapsed+=dt;
      const idle=t-lastInput>4000;
      const tour=!reduce.matches&&idle&&focus.current<0&&category.current<0?Math.floor((t-lastInput-4000)/4600)%4:-1;
      const cluster=category.current>=0?category.current:tour;
      if(cluster!==lastCluster){lastCluster=cluster;setActiveCluster(cluster);}
      const f=focus.current, neighbours=f>=0?links[f]:null;
      const sx=(elapsed%8)/8*(W+60)-60;
      ctx.clearRect(0,0,W,H);ctx.globalAlpha=1;ctx.lineWidth=1;ctx.strokeStyle=grid;
      for(let x=1;x<10;x++){ctx.beginPath();ctx.moveTo(x*W/10,0);ctx.lineTo(x*W/10,H);ctx.stroke();}
      for(let y=1;y<8;y++){ctx.beginPath();ctx.moveTo(0,y*H/8);ctx.lineTo(W,y*H/8);ctx.stroke();}
      for(let i=0;i<4;i++){const center=centers[i];ctx.fillStyle=circle;ctx.strokeStyle=circleLine;const r=Math.min(W,H)*.17;ctx.beginPath();ctx.arc(center[0]*W,center[1]*H,r,0,Math.PI*2);ctx.fill();ctx.setLineDash([2,4]);ctx.stroke();ctx.setLineDash([]);}
      if(!reduce.matches){ctx.fillStyle=scanColor;ctx.fillRect(sx,0,60,H);}
      for(let i=0;i<N;i++){
        const s=skills[i]; const period=5+i%5;
        const driftX=reduce.matches?0:4*Math.sin(elapsed*Math.PI*2/period+i*1.7), driftY=reduce.matches?0:4*Math.cos(elapsed*Math.PI*2/(period+.3)+i*2.3);
        const x=s.x*W+driftX,y=s.y*H+driftY, dx=qx-x,dy=qy-y,dist=Math.hypot(dx,dy);
        const strength=!reduce.matches&&dist<130?Math.min(10,dist*.1)*(1-dist/130):0;
        const tx=dist?dx/dist*strength:0,ty=dist?dy/dist*strength:0;
        vx[i]+=(tx-leanX[i])*90*dt;vy[i]+=(ty-leanY[i])*90*dt;const damp=Math.exp(-18*dt);vx[i]*=damp;vy[i]*=damp;leanX[i]+=vx[i]*dt;leanY[i]+=vy[i]*dt;
        px[i]=x+(reduce.matches?0:leanX[i]);py[i]=y+(reduce.matches?0:leanY[i]);
        if(!reduce.matches&&px[i]>sx&&px[i]<sx+60)flashes[i]=t;
      }
      if(f>=0&&neighbours){ctx.strokeStyle=green;ctx.globalAlpha=.65;for(let j=0;j<neighbours.length;j++){const i=neighbours[j];ctx.beginPath();ctx.moveTo(px[f],py[f]);ctx.lineTo(px[i],py[i]);ctx.stroke();}}
      for(let i=0;i<N;i++){
        const s=skills[i], bright=f>=0?(i===f||Boolean(neighbours?.includes(i))):cluster>=0?s.cluster===cluster:true;
        const appear=reduce.matches?1:Math.min(1,Math.max(0,(entry-i*.03)/.35));
        ctx.globalAlpha=(bright?1:.25)*appear;const r=3.5*(i===f?1.4:1)*appear;
        const st=states[i]; ctx.lineWidth=1.5;
        if(st===2){
          ctx.fillStyle=green;ctx.beginPath();ctx.arc(px[i],py[i],r,0,Math.PI*2);ctx.fill();
        }else if(st===1){
          ctx.strokeStyle=green;ctx.beginPath();ctx.arc(px[i],py[i],r,0,Math.PI*2);ctx.stroke();
          ctx.fillStyle=green;ctx.beginPath();ctx.arc(px[i],py[i],Math.max(0,r-0.5),-Math.PI/2,Math.PI/2);ctx.closePath();ctx.fill();
        }else{
          ctx.strokeStyle=gold;ctx.beginPath();ctx.arc(px[i],py[i],r,0,Math.PI*2);ctx.stroke();
        }
        if(t-flashes[i]<400&&!reduce.matches){ctx.strokeStyle=gold;ctx.globalAlpha*=1-(t-flashes[i])/400;ctx.beginPath();ctx.arc(px[i],py[i],8,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=(bright?1:.25)*appear;}
        if(pinned.current===i){ctx.strokeStyle=green;ctx.beginPath();ctx.arc(px[i],py[i],10,0,Math.PI*2);ctx.stroke();}
        ctx.font=`${i===f?700:500} ${W<500?11:13}px Manrope, sans-serif`;
        const width=ctx.measureText(s.name).width, labelX=Math.min(W-width-8,px[i]+9);
        ctx.fillStyle=paper;ctx.fillRect(labelX-2,py[i]-9,width+4,17);ctx.fillStyle=bright?ink:muted;ctx.fillText(s.name,labelX,py[i]+4);
      }
      ctx.globalAlpha=1;ctx.font="500 11px 'JetBrains Mono', monospace";
      for(let i=0;i<4;i++){const center=centers[i],r=Math.min(W,H)*.17;const name=expertise.clusters[i];const x=Math.max(8,center[0]*W-r),y=center[1]*H-r-10;ctx.fillStyle=paper;ctx.fillRect(x-4,y-12,ctx.measureText(name).width+8,18);ctx.fillStyle=gold;ctx.fillText(name,x,y);}
    });
    return()=>{unsub();ro.disconnect();b.removeEventListener("pointermove",move);b.removeEventListener("pointerleave",leave);b.removeEventListener("pointerup",click);window.removeEventListener("keydown",key);window.removeEventListener("wheel",input);window.removeEventListener("pointerdown",input);window.removeEventListener("pointermove",input);};
  },[]);

  const skill = selected >= 0 ? expertise.skills[selected] : null;
  const projects = skill ? projectsForSkill(skill.name) : [];
  const linked = skill ? linkedSkills(skill.name).map((idx) => expertise.skills[idx]?.name).filter(Boolean) : [];

  return (
    <div className="page-inner">
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-[3vw] lg:grid-cols-[minmax(0,.85fr)_minmax(0,1.15fr)]">
        <div className="flex min-h-0 flex-col">
          <Liquid>
            <h2 className="display" style={{ fontSize: "min(7vw, 15vh)" }}>
              <span className="block"><SplitReveal text={expertise.heading.split(" ")[0]} /></span>
              <span className="block"><SplitReveal text={expertise.heading.split(" ")[1]} hl="gold" /></span>
            </h2>
          </Liquid>
          <p className="mt-[2vh] max-w-[34ch] text-[15px] leading-relaxed" data-lines>{expertise.intro}</p>

          <div className="expertise-detail" aria-live="polite" data-fade>
            {skill ? (
              <div>
                <div className="display tracking-tight" style={{ fontSize: "clamp(34px, 6.4dvh, 76px)", lineHeight: 0.95 }}>
                  {skill.name}
                </div>
                {projects.length > 0 ? (
                  <>
                    <div className="mt-2.5 flex flex-wrap items-baseline gap-x-2 gap-y-1 text-[15px]">
                      {projects.map(([name, p], i) => (
                        <span key={name} className="inline-flex items-baseline gap-1">
                          <a
                            href={p.target === "overview" ? "#overview" : "#works"}
                            onClick={(e) => { e.preventDefault(); goProject(p.target); }}
                            className="underline underline-offset-3 hover:opacity-80"
                            style={{ color: "var(--accent-green)" }}
                          >
                            {name}
                          </a>
                          {p.status === "in progress" && <span className="muted text-[13px]"> ({p.status})</span>}
                          {i < projects.length - 1 && <span className="muted">,</span>}
                        </span>
                      ))}
                    </div>
                    {linked.length > 0 && (
                      <p className="muted mt-2 text-[14px] leading-relaxed">
                        {expertise.usedWithPrefix}{linked.join(", ")}.
                      </p>
                    )}
                  </>
                ) : (
                  <p className="muted mt-2.5 text-[15px] leading-relaxed">
                    {skill.name === "Docker" ? expertise.dockerCore : expertise.core}
                  </p>
                )}
              </div>
            ) : activeCluster >= 0 ? (
              <div>
                <div className="display tracking-tight text-gold" style={{ fontSize: "clamp(34px, 6.4dvh, 76px)", lineHeight: 0.95 }}>
                  {expertise.clusters[activeCluster]}
                </div>
                <p className="muted mt-2 text-[14px] leading-relaxed">
                  {expertise.skills.filter((s) => s.cluster === activeCluster).map((s) => s.name).join(" · ")}
                </p>
              </div>
            ) : (
              <div className="muted text-[15px]">{expertise.idle}</div>
            )}
          </div>

          <ul className="grid grid-cols-2 gap-x-6 gap-y-[2dvh] pt-4" data-fade>
            {expertise.clusters.map((name, i) => (
              <li
                key={name}
                className="expertise-block min-w-0 border-t border-gold pt-2"
                data-active={activeCluster === i ? "" : undefined}
                data-dim={activeCluster >= 0 && activeCluster !== i ? "" : undefined}
                onPointerEnter={() => { category.current = i; }}
                onPointerLeave={() => { category.current = -1; }}
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="mono flex items-center gap-2">
                    <span className="expertise-dot" />
                    {name}
                  </span>
                </div>
                <div className="muted mt-1 text-[14px] leading-snug">
                  {expertise.skills.filter((s) => s.cluster === i).map((s) => s.name).join(" · ")}
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="expertise-map-layout" data-sig>
          <div ref={box} className="expertise-map" data-cursor="link">
            <canvas ref={cv} aria-hidden="true" />
          </div>
          <div className="expertise-legend" aria-hidden="true">
            <span className="expertise-legend-item">
              <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true" className="shrink-0">
                <circle cx="5" cy="5" r="4" fill="var(--accent-green)" />
              </svg>
              <span>{expertise.legend.used}</span>
            </span>
            <span className="expertise-legend-item">
              <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true" className="shrink-0">
                <circle cx="5" cy="5" r="3.5" fill="none" stroke="var(--accent-green)" strokeWidth="1.4" />
                <path d="M 5 1.5 A 3.5 3.5 0 0 1 5 8.5 Z" fill="var(--accent-green)" />
              </svg>
              <span>{expertise.legend.building}</span>
            </span>
            <span className="expertise-legend-item">
              <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true" className="shrink-0">
                <circle cx="5" cy="5" r="3.5" fill="none" stroke="var(--gold)" strokeWidth="1.4" />
              </svg>
              <span>{expertise.legend.core}</span>
            </span>
          </div>
          <ul className="sr-only">
            {expertise.clusters.map((name, i) => (
              <li key={name}>
                {name}
                <ul>
                  {expertise.skills
                    .filter((s) => s.cluster === i)
                    .map((s) => (
                      <li key={s.id}>
                        <a
                          href="#expertise"
                          onFocus={() => {
                            focus.current = expertise.skills.indexOf(s);
                            setSelected(focus.current);
                          }}
                          onClick={(e) => {
                            e.preventDefault();
                            const index = expertise.skills.indexOf(s);
                            pinned.current = pinned.current === index ? -1 : index;
                            focus.current = pinned.current;
                            setSelected(focus.current);
                          }}
                        >
                          {s.name}
                        </a>
                      </li>
                    ))}
                </ul>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
