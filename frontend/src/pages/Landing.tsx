import { motion, useMotionValue, useSpring } from "framer-motion";
import { useEffect, useRef } from "react";
 
const ease: [number, number, number, number] = [0.22, 1, 0.36, 1];
 
/* ── Magnetic button hook ── */
function useMagnetic(strength = 0.35) {
  const ref = useRef<HTMLAnchorElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 200, damping: 18 });
  const sy = useSpring(y, { stiffness: 200, damping: 18 });
 
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      x.set((e.clientX - r.left - r.width / 2) * strength);
      y.set((e.clientY - r.top - r.height / 2) * strength);
    };
    const onLeave = () => { x.set(0); y.set(0); };
    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    return () => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
    };
  }, []);
 
  return { ref, style: { x: sx, y: sy } };
}
 
/* ── Ticker items ── */
const TICKER_ITEMS = [
  "Realtime dashboards", "Smart task queues", "Zero friction workflows",
  "One-click priorities", "Team sync", "Focused execution", "Ship faster",
];
 
/* ── Stat cards data ── */
const STAT_CARDS = [
  { icon: "⚡", title: "Realtime view",  desc: "Track every project and task from a single live dashboard." },
  { icon: "🎯", title: "Fast execution", desc: "Create tasks and push progress updates in under a second." },
  { icon: "✦",  title: "Modern UI",      desc: "Smooth, fluid interactions with a clean visual hierarchy." },
];
 
/* ── Particle field ── */
const PARTICLES = Array.from({ length: 16 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: Math.random() * 4 + 2,
  duration: Math.random() * 12 + 10,
  delay: Math.random() * 6,
  opacity: Math.random() * 0.18 + 0.04,
  color: i % 3 === 0 ? "232,93,56" : i % 3 === 1 ? "251,176,59" : "100,116,234",
}));
 
export default function Landing() {
  const magPrimary   = useMagnetic(0.3);
  const magSecondary = useMagnetic(0.3);
 
  return (
    <div className="lp-root">
 
      {/* background layers */}
      <div className="lp-mesh" />
      <div className="lp-grid" />
 
      {/* floating particles */}
      {PARTICLES.map((p) => (
        <motion.div
          key={p.id}
          className="lp-particle"
          style={{
            left: `${p.x}%`, top: `${p.y}%`,
            width: p.size, height: p.size,
            background: `rgba(${p.color},${p.opacity})`,
            boxShadow: `0 0 ${p.size * 3}px rgba(${p.color},${p.opacity * 0.5})`,
          }}
          animate={{ y: [0, -28, 0], opacity: [p.opacity, p.opacity * 0.25, p.opacity] }}
          transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
 
      {/* nav */}
      <motion.nav
        className="lp-nav"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease }}
      >
        <a className="lp-nav-logo" href="#">
          <span className="lp-nav-dot" />
          Taskflow
        </a>
        <span className="lp-nav-pill">Smart workflow platform</span>
      </motion.nav>
 
      {/* ticker */}
      <motion.div
        className="lp-ticker-wrap"
        style={{ marginTop: 72 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.1 }}
      >
        <div className="lp-ticker-track">
          {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
            <span className="lp-ticker-item" key={i}>{item}</span>
          ))}
        </div>
      </motion.div>
 
      {/* hero */}
      <section className="lp-hero">
 
        {/* title */}
        <motion.h1
          className="lp-title"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75, delay: 0.42, ease }}
        >
          Plan your{" "}
          <span className="lp-underline-word">tasks</span>
          <br />
          <span className="lp-accent-word">ship</span> faster
        </motion.h1>
 
        {/* subtitle */}
        <motion.p
          className="lp-subtitle"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.56, ease }}
        >
          Organize projects, track progress, and ship faster with a clean dashboard
          built for focused teams.
        </motion.p>
 
        {/* CTAs */}
        <motion.div
          className="lp-actions"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.68, ease }}
        >
          <motion.a
            ref={magPrimary.ref}
            style={magPrimary.style}
            className="lp-primary-btn"
            href="/login"
            whileTap={{ scale: 0.96 }}
          >
            Get started
            <span className="lp-btn-arrow">→</span>
          </motion.a>
          <motion.a
            ref={magSecondary.ref}
            style={magSecondary.style}
            className="lp-secondary-btn"
            href="/register"
            whileTap={{ scale: 0.96 }}
          >
            Create account
          </motion.a>
        </motion.div>
 
        {/* stat cards */}
        <motion.div
          className="lp-hero-stats"
          initial="hidden"
          animate="show"
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.12, delayChildren: 0.82 } },
          }}
        >
          {STAT_CARDS.map((card) => (
            <motion.article
              className="lp-stat-card"
              key={card.title}
              variants={{
                hidden: { opacity: 0, y: 28 },
                show:   { opacity: 1, y: 0, transition: { duration: 0.65, ease } },
              }}
            >
              <div className="lp-stat-icon">{card.icon}</div>
              <strong>{card.title}</strong>
              <p>{card.desc}</p>
            </motion.article>
          ))}
        </motion.div>
      </section>
 
      {/* scroll indicator */}
      <div className="lp-scroll-hint">
        <div className="lp-scroll-line" />
        <span>scroll</span>
      </div>
 
    </div>
  );
}