import { useEffect, useRef } from "react";
import { animateCounter, pulseAlongPath } from "../animations/ledger";

const SUPPLIED_KWH = 15000;
const BILLED_KWH = 13900;
const TECHNICAL_LOSS_KWH = 300;
const NTL_DELTA_KWH = SUPPLIED_KWH - (BILLED_KWH + TECHNICAL_LOSS_KWH);

const MODULES = [
  { tag: "01", name: "Digital Twin", copy: "Learns each consumer's normal load shape so deviations stand out on their own." },
  { tag: "02", name: "Physics + Graph AI", copy: "Cross-checks meter reports against transformer supply across the feeder graph." },
  { tag: "03", name: "Explainable Detection", copy: "Every flag ships with the evidence an inspector can act on, not just a score." },
  { tag: "04", name: "Inspection Planner", copy: "Ranks which transformer to visit first using a reinforcement-learning policy." },
];

export default function Home() {
  const suppliedRef = useRef<HTMLSpanElement>(null);
  const billedRef = useRef<HTMLSpanElement>(null);
  const lossRef = useRef<HTMLSpanElement>(null);
  const deltaRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    animateCounter(suppliedRef.current, SUPPLIED_KWH, { suffix: " kWh" });
    animateCounter(billedRef.current, BILLED_KWH, { suffix: " kWh", duration: 1600 });
    animateCounter(lossRef.current, TECHNICAL_LOSS_KWH, { suffix: " kWh", duration: 1200 });
    animateCounter(deltaRef.current, NTL_DELTA_KWH, { suffix: " kWh", duration: 2000 });

    pulseAlongPath(".flow-dot-1", 0);
    pulseAlongPath(".flow-dot-2", 400);
    pulseAlongPath(".flow-dot-3", 800);
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-6 py-10 sm:px-10">
      {/* Top bar */}
      <header className="flex items-center justify-between border-b border-grid-line pb-6">
        <div>
          <p className="font-mono text-xs tracking-[0.3em] text-muted">CHARLOTTE</p>
          <h1 className="font-display text-2xl font-semibold text-ink">
            Smart Grid Intelligence
          </h1>
        </div>
        <p className="hidden font-mono text-xs text-muted sm:block">
          Intelligent&nbsp;&middot;&nbsp;Predictive&nbsp;&middot;&nbsp;Explainable
        </p>
      </header>

      {/* Hero: energy ledger signature */}
      <section className="mt-10 grid gap-8 lg:grid-cols-[1.1fr_1fr]">
        <div>
          <h2 className="font-display text-3xl leading-tight text-ink sm:text-4xl">
            Every kilowatt-hour is accounted for.
            <br />
            <span className="text-amber">The ones that aren't get flagged.</span>
          </h2>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-muted">
            CHARLOTTE watches the energy balance at every distribution transformer in
            real time — supplied vs. billed vs. expected technical loss — and narrows
            unexplained gaps down to a short list of meters worth inspecting.
          </p>

          {/* Topology diagram */}
          <svg
            viewBox="0 0 420 180"
            className="mt-8 w-full max-w-md"
            role="img"
            aria-label="Grid topology from substation to smart meters"
          >
            <defs>
              <path id="line1" d="M40,30 L200,30" />
              <path id="line2" d="M200,30 L200,90" />
              <path id="line3" d="M200,90 L360,140" />
            </defs>

            <line x1="40" y1="30" x2="200" y2="30" stroke="var(--color-grid-line)" strokeWidth="2" />
            <line x1="200" y1="30" x2="200" y2="90" stroke="var(--color-grid-line)" strokeWidth="2" />
            <line x1="200" y1="90" x2="120" y2="140" stroke="var(--color-grid-line)" strokeWidth="2" />
            <line x1="200" y1="90" x2="200" y2="140" stroke="var(--color-grid-line)" strokeWidth="2" />
            <line x1="200" y1="90" x2="280" y2="140" stroke="var(--color-grid-line)" strokeWidth="2" />

            <circle className="flow-dot-1" r="3.5" fill="var(--color-safe)" style={{ offsetPath: "path('M40,30 L200,30')" }} />
            <circle className="flow-dot-2" r="3.5" fill="var(--color-safe)" style={{ offsetPath: "path('M200,30 L200,90')" }} />
            <circle className="flow-dot-3" r="3.5" fill="var(--color-amber)" style={{ offsetPath: "path('M200,90 L280,140')" }} />

            <g fontFamily="JetBrains Mono, monospace" fontSize="9" fill="var(--color-muted)">
              <circle cx="40" cy="30" r="6" fill="var(--color-panel)" stroke="var(--color-grid-line)" />
              <text x="20" y="18">Substation</text>

              <circle cx="200" cy="30" r="6" fill="var(--color-panel)" stroke="var(--color-grid-line)" />
              <text x="180" y="18">Feeder</text>

              <circle cx="200" cy="90" r="7" fill="var(--color-panel)" stroke="var(--color-safe)" />
              <text x="170" y="104">DT-001</text>

              <circle cx="120" cy="140" r="5" fill="var(--color-panel)" stroke="var(--color-grid-line)" />
              <circle cx="200" cy="140" r="5" fill="var(--color-panel)" stroke="var(--color-grid-line)" />
              <circle cx="280" cy="140" r="6" fill="var(--color-panel)" stroke="var(--color-critical)" />
              <text x="260" y="158" fill="var(--color-critical)">flagged</text>
            </g>
          </svg>
        </div>

        {/* Signature: live energy ledger */}
        <div className="rounded-lg border border-grid-line bg-panel p-6">
          <p className="font-mono text-xs uppercase tracking-widest text-muted">
            Distribution Transformer &middot; DT-001
          </p>
          <dl className="mt-4 space-y-3 font-mono text-sm">
            <div className="flex items-center justify-between border-b border-grid-line pb-2">
              <dt className="text-muted">Energy supplied</dt>
              <dd ref={suppliedRef} className="text-ink">0 kWh</dd>
            </div>
            <div className="flex items-center justify-between border-b border-grid-line pb-2">
              <dt className="text-muted">Billed to consumers</dt>
              <dd ref={billedRef} className="text-ink">0 kWh</dd>
            </div>
            <div className="flex items-center justify-between border-b border-grid-line pb-2">
              <dt className="text-muted">Expected technical loss</dt>
              <dd ref={lossRef} className="text-ink">0 kWh</dd>
            </div>
            <div className="flex items-center justify-between pt-1">
              <dt className="font-semibold text-ink">Unexplained (NTL) delta</dt>
              <dd ref={deltaRef} className="text-lg font-semibold text-amber">0 kWh</dd>
            </div>
          </dl>
          <p className="mt-4 text-xs leading-relaxed text-muted">
            An 800 kWh/day gap this size, sustained across a week, is enough for
            CHARLOTTE to rank DT-001 for inspection ahead of transformers with a
            clean energy balance.
          </p>
        </div>
      </section>

      {/* Module grid */}
      <section className="mt-16">
        <h3 className="font-mono text-xs uppercase tracking-widest text-muted">
          Core intelligence modules
        </h3>
        <div className="mt-4 grid gap-px overflow-hidden rounded-lg border border-grid-line bg-grid-line sm:grid-cols-2 lg:grid-cols-4">
          {MODULES.map((m) => (
            <div key={m.tag} className="bg-panel p-5">
              <p className="font-mono text-xs text-safe">{m.tag}</p>
              <p className="mt-2 font-display text-base font-medium text-ink">{m.name}</p>
              <p className="mt-2 text-xs leading-relaxed text-muted">{m.copy}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="mt-16 border-t border-grid-line pt-6 pb-10">
        <p className="font-mono text-[11px] text-muted">
          React 19 &middot; FastAPI &middot; PostgreSQL/TimescaleDB &middot; Redis &middot; MQTT &middot; Kafka &middot; Docker
        </p>
      </footer>
    </div>
  );
}
