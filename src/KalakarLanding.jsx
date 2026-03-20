import { useState, useEffect, useRef, useCallback } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import * as d3 from "d3";
import * as topojson from "topojson-client";

// ——— CSS Keyframes & Global Styles ———
const globalStyles = `
  @import url('https://api.fontshare.com/v2/css?f[]=satoshi@300,400,500,600,700,800,900&display=swap');
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Instrument+Serif:ital@0;1&family=Space+Grotesk:wght@400;500;700&family=Noto+Sans+Devanagari:wght@400;600&family=Noto+Nastaliq+Urdu:wght@400;700&family=Noto+Sans+Tamil:wght@400;600&family=Noto+Sans+Malayalam:wght@400;600&family=Noto+Sans+Bengali:wght@400;600&family=Noto+Sans+Gujarati:wght@400;600&family=Noto+Sans+Kannada:wght@400;600&family=Noto+Sans+Telugu:wght@400;600&family=Noto+Sans+Gurmukhi:wght@400;600&display=swap');

  :root {
    --bg-primary: #0a0a0a;
    --bg-elevated: #141414;
    --bg-card: #111111;
    --bg-card-hover: #1a1a1a;
    --accent: #03ffb2;
    --accent-light: #48ffcc;
    --accent-glow: rgba(3,255,178,0.15);
    --highlight: #48a680;
    --accent-secondary: #7C3AED;
    --accent-secondary-light: #A78BFA;
    --text-primary: #F5F5F5;
    --text-secondary: #9CA3AF;
    --text-muted: #6B7280;
    --border: rgba(255,255,255,0.06);
    --border-light: rgba(255,255,255,0.1);
    --success: #10B981;
    --gold: #F59E0B;
    --font-display: 'Satoshi', 'Space Grotesk', sans-serif;
    --font-body: 'DM Sans', sans-serif;
    --font-accent: 'Instrument Serif', serif;
  }

  * { margin: 0; padding: 0; box-sizing: border-box; }
  html { scroll-behavior: smooth; }
  body {
    background: var(--bg-primary);
    color: var(--text-primary);
    font-family: var(--font-body);
    overflow-x: hidden;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  ::selection {
    background: rgba(72,166,128,0.3);
    color: #fff;
  }

  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(30px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes marqueeLeft {
    0% { transform: translateX(0); }
    100% { transform: translateX(-50%); }
  }
  @keyframes marqueeRight {
    0% { transform: translateX(-50%); }
    100% { transform: translateX(0); }
  }
  @keyframes subtlePulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.03); }
  }
  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  @keyframes gradientFlow {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }

  .anim-trigger {
    opacity: 0; transform: translateY(30px);
    transition: all 0.7s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .anim-trigger.visible { opacity: 1; transform: translateY(0); }
  .anim-trigger.visible.delay-1 { transition-delay: 0.1s; }
  .anim-trigger.visible.delay-2 { transition-delay: 0.2s; }
  .anim-trigger.visible.delay-3 { transition-delay: 0.3s; }
  .anim-trigger.visible.delay-4 { transition-delay: 0.4s; }

  .marquee-track:hover .marquee-inner {
    animation-play-state: paused !important;
  }

  /* Mobile responsive */
  @media (max-width: 768px) {
    .desktop-nav-links { display: none !important; }
    .mobile-menu-btn { display: flex !important; }
    .pricing-grid { grid-template-columns: 1fr !important; }
    .audio-card { grid-template-columns: 1fr !important; padding: 24px 16px !important; gap: 20px !important; }
    .export-layout { grid-template-columns: 1fr !important; text-align: center !important; gap: 32px !important; }
    .export-layout .export-text { align-items: center !important; }
    .export-pipeline { padding: 32px 20px !important; min-height: 380px !important; }
    .testimonials-grid { grid-template-columns: 1fr !important; max-width: 480px !important; margin: 0 auto !important; }
    .audio-pills { flex-wrap: wrap !important; }
    .hero-headline { font-size: clamp(32px, 8vw, 40px) !important; }
    .globe-lang-ui { right: 50% !important; transform: translate(50%, -50%) !important; top: auto !important; bottom: 10% !important; }
    .globe-hero-content h1 { font-size: clamp(26px, 7vw, 36px) !important; }
  }

  @keyframes bob {
    0%, 100% { transform: translateY(0) rotate(45deg); }
    50% { transform: translateY(4px) rotate(45deg); }
  }
`;

// ——— Intersection Observer Hook ———
function useInView(threshold = 0.15) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}

// ——— Animated Section Wrapper ———
function AnimSection({ children, className = "", delay = "", style = {} }) {
  const [ref, visible] = useInView(0.1);
  return (
    <div ref={ref} className={`anim-trigger ${visible ? "visible" : ""} ${delay} ${className}`} style={style}>
      {children}
    </div>
  );
}

// ——— NAVBAR ———
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  // Lock body scroll when mobile menu open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const navLinks = [
    { label: "About", href: "#why" },
    { label: "Testimonials", href: "#reviews" },
    { label: "Pricing", href: "#pricing" },
  ];

  return (
    <>
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 1000,
        padding: "12px 24px",
        transition: "all 0.4s ease",
      }}>
        <div style={{
          maxWidth: 1200, margin: "0 auto",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          height: 60, padding: "0 28px",
          background: scrolled ? "rgba(10,10,10,0.88)" : "rgba(20,20,20,0.4)",
          backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
          borderRadius: 16,
          border: `1px solid ${scrolled ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.04)"}`,
          transition: "all 0.4s ease",
        }}>
          {/* Logo */}
          <a href="#" style={{ display: "flex", alignItems: "center", textDecoration: "none" }}>
            <img src="/kalakar-logo-full.svg" alt="Kalakar" style={{ height: 24 }} />
          </a>

          {/* Desktop links */}
          <div className="desktop-nav-links" style={{ display: "flex", gap: 36, alignItems: "center" }}>
            {navLinks.map(t => (
              <a key={t.label} href={t.href} style={{
                color: "var(--text-secondary)", textDecoration: "none", fontSize: 14,
                fontWeight: 500, transition: "color 0.2s", fontFamily: "var(--font-display)",
              }}
                onMouseEnter={e => e.target.style.color = "var(--text-primary)"}
                onMouseLeave={e => e.target.style.color = "var(--text-secondary)"}>
                {t.label}
              </a>
            ))}
            <a href="https://app.kalakar.io/signup" target="_blank" rel="noopener noreferrer" style={{
              background: "var(--accent)", color: "#0a0a0a", padding: "10px 24px",
              borderRadius: 999, textDecoration: "none", fontSize: 14, fontWeight: 600,
              transition: "all 0.3s", border: "none",
              display: "inline-flex", alignItems: "center", gap: 8,
              fontFamily: "var(--font-display)",
              boxShadow: "0 0 20px rgba(3,255,178,0.25), 0 0 60px rgba(3,255,178,0.08)",
            }}
              onMouseEnter={e => { e.target.style.transform = "translateY(-1px)"; e.target.style.boxShadow = "0 0 30px rgba(3,255,178,0.4), 0 0 80px rgba(3,255,178,0.12)"; }}
              onMouseLeave={e => { e.target.style.transform = "translateY(0)"; e.target.style.boxShadow = "0 0 20px rgba(3,255,178,0.25), 0 0 60px rgba(3,255,178,0.08)"; }}>
              Sign In
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="7" y1="17" x2="17" y2="7" /><polyline points="7 7 17 7 17 17" />
              </svg>
            </a>
          </div>

          {/* Mobile menu button */}
          <button className="mobile-menu-btn" onClick={() => setMobileOpen(!mobileOpen)} style={{
            display: "none", background: "none", border: "none", color: "var(--text-primary)",
            cursor: "pointer", flexDirection: "column", gap: 5, padding: 8, zIndex: 1002,
          }}>
            <span style={{ width: 22, height: 2, background: "var(--text-primary)", borderRadius: 2, transition: "all 0.3s", transform: mobileOpen ? "rotate(45deg) translate(5px, 5px)" : "none" }} />
            <span style={{ width: 22, height: 2, background: "var(--text-primary)", borderRadius: 2, transition: "all 0.3s", opacity: mobileOpen ? 0 : 1 }} />
            <span style={{ width: 22, height: 2, background: "var(--text-primary)", borderRadius: 2, transition: "all 0.3s", transform: mobileOpen ? "rotate(-45deg) translate(5px, -5px)" : "none" }} />
          </button>
        </div>
      </nav>

      {/* Mobile drawer backdrop */}
      <div onClick={() => setMobileOpen(false)} style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
        zIndex: 998, opacity: mobileOpen ? 1 : 0, pointerEvents: mobileOpen ? "auto" : "none",
        transition: "opacity 0.3s ease",
      }} />

      {/* Mobile drawer */}
      <div style={{
        position: "fixed", top: 0, right: 0, bottom: 0,
        width: 280, maxWidth: "80vw", zIndex: 999,
        background: "rgba(10,10,10,0.98)",
        backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
        borderLeft: "1px solid rgba(255,255,255,0.06)",
        transform: mobileOpen ? "translateX(0)" : "translateX(100%)",
        transition: "transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
        padding: "100px 32px 48px",
        display: "flex", flexDirection: "column", gap: 8,
      }}>
        {navLinks.map(t => (
          <a key={t.label} href={t.href} onClick={() => setMobileOpen(false)} style={{
            color: "var(--text-secondary)", textDecoration: "none", fontSize: 18, fontWeight: 500,
            fontFamily: "var(--font-display)", padding: "12px 0",
            borderBottom: "1px solid rgba(255,255,255,0.04)",
            transition: "color 0.2s",
          }}>{t.label}</a>
        ))}
        <a href="https://app.kalakar.io/signup" target="_blank" rel="noopener noreferrer" onClick={() => setMobileOpen(false)} style={{
          background: "var(--accent)", color: "#0a0a0a", padding: "14px 24px",
          borderRadius: 12, textDecoration: "none", fontSize: 16, fontWeight: 600,
          textAlign: "center", marginTop: 16, fontFamily: "var(--font-display)",
        }}>Sign In</a>
      </div>
    </>
  );
}

// ——— GLOBE HERO + LANGUAGE SELECTOR ———
const LANG_CDN = "https://kalakar-cdn.b-cdn.net/Captioned%20Languages";
function langVideoUrl(lang, script) {
  if (lang.id === "English" || lang.id === "Malay") return `${LANG_CDN}/One%20Standard/${lang.id}.mp4`;
  const cdnName = lang.id === "Bengali" ? "Bangali" : lang.id;
  const folder = script === "roman" ? "Roman" : "Native";
  return `${LANG_CDN}/${folder}/${cdnName}.mp4`;
}

const globeLanguages = [
  { id: "Pushto", native: "پښتو", font: "'Noto Nastaliq Urdu', serif", lat: 34.5, lon: 71.5, sz: 12 },
  { id: "Urdu", native: "اردو", font: "'Noto Nastaliq Urdu', serif", lat: 30.0, lon: 68.0, sz: 16 },
  { id: "Punjabi", native: "ਪੰਜਾਬੀ", font: "'Noto Sans Gurmukhi', sans-serif", lat: 31.5, lon: 74.8, sz: 11 },
  { id: "Sindhi", native: "سنڌي", font: "'Noto Nastaliq Urdu', serif", lat: 26.0, lon: 68.5, sz: 11 },
  { id: "Hindi", native: "हिन्दी", font: "'Noto Sans Devanagari', sans-serif", lat: 26.8, lon: 80.5, sz: 16 },
  { id: "Nepali", native: "नेपाली", font: "'Noto Sans Devanagari', sans-serif", lat: 28.2, lon: 85.3, sz: 11 },
  { id: "Gujarati", native: "ગુજરાતી", font: "'Noto Sans Gujarati', sans-serif", lat: 22.5, lon: 71.5, sz: 11 },
  { id: "Marathi", native: "मराठी", font: "'Noto Sans Devanagari', sans-serif", lat: 19.0, lon: 75.5, sz: 11 },
  { id: "Bengali", native: "বাংলা", font: "'Noto Sans Bengali', sans-serif", lat: 24.0, lon: 90.0, sz: 13 },
  { id: "Telugu", native: "తెలుగు", font: "'Noto Sans Telugu', sans-serif", lat: 17.0, lon: 79.5, sz: 11 },
  { id: "Kannada", native: "ಕನ್ನಡ", font: "'Noto Sans Kannada', sans-serif", lat: 14.5, lon: 75.5, sz: 11 },
  { id: "Tamil", native: "தமிழ்", font: "'Noto Sans Tamil', sans-serif", lat: 11.0, lon: 79.0, sz: 12 },
  { id: "Malayalam", native: "മലയാളം", font: "'Noto Sans Malayalam', sans-serif", lat: 10.0, lon: 76.3, sz: 10 },
  { id: "Malay", native: "Melayu", font: "system-ui, sans-serif", lat: 3.5, lon: 101.5, sz: 10 },
  { id: "English", native: "English", font: "system-ui, sans-serif", lat: 34.0, lon: 62.0, sz: 10 },
];

function GlobeHeroSection() {
  const canvasRef = useRef(null);
  const trackRef = useRef(null);
  const projectionRef = useRef(null);
  const landDataRef = useRef(null);
  const defaultLang = globeLanguages.find(l => l.id === "English");
  const selectedRef = useRef(defaultLang.id);
  const [selectedLang, setSelectedLang] = useState(defaultLang);
  const [videoFailed, setVideoFailed] = useState(false);
  const [scriptMode, setScriptMode] = useState("native"); // "native" or "roman"
  const heroRef = useRef(null);
  const langUIRef = useRef(null);
  const scrollHintRef = useRef(null);
  const rafRef = useRef(null);

  // Keep ref in sync with state for the rAF loop
  useEffect(() => { selectedRef.current = selectedLang?.id || null; }, [selectedLang]);

  // Fetch world atlas data
  useEffect(() => {
    fetch("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json")
      .then(r => r.json())
      .then(w => { landDataRef.current = topojson.feature(w, w.objects.countries); });
  }, []);

  // Setup canvas and animation loop — runs once, reads selectedRef inside rAF
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;

    const projection = d3.geoOrthographic().clipAngle(90);
    projectionRef.current = projection;
    const geoPath = d3.geoPath(projection, ctx);

    function resize() {
      const frame = canvas.parentElement;
      const W = frame.clientWidth;
      const H = frame.clientHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      canvas.style.width = W + "px";
      canvas.style.height = H + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener("resize", resize);

    function lerp(a, b, t) { return a + (b - a) * t; }
    function ease(t) { return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1; }

    function getP() {
      const track = trackRef.current;
      if (!track) return 0;
      const r = track.getBoundingClientRect();
      return Math.max(0, Math.min(1, -r.top / (r.height - window.innerHeight)));
    }

    function draw() {
      const frame = canvas.parentElement;
      const W = frame.clientWidth;
      const H = frame.clientHeight;
      const p = getP();
      const z = ease(Math.max(0, Math.min(1, (p - 0.3) / 0.45)));
      const heroFade = 1 - Math.min(1, p / 0.2);
      const labelsIn = Math.max(0, Math.min(1, (p - 0.6) / 0.12));

      const s0 = Math.min(W, H) * 0.28;
      const s1 = Math.min(W, H) * 1.5;
      const scale = lerp(s0, s1, z);
      const rx = lerp(-25, -76, z);
      const ry = lerp(-8, -22, z);
      const cx = lerp(W * 0.5, W * 0.55, z);
      const cy = lerp(H * 0.48, H * 0.5, z);

      projection.rotate([rx, ry, 0]).scale(scale).translate([cx, cy]);
      ctx.clearRect(0, 0, W, H);

      // Sphere — subtle outline for 3D cue
      ctx.beginPath();
      geoPath({ type: "Sphere" });
      ctx.fillStyle = "rgba(255,255,255,0.012)";
      ctx.strokeStyle = "rgba(255,255,255,0.06)";
      ctx.lineWidth = 1;
      ctx.fill();
      ctx.stroke();

      // Graticule — fades during zoom
      if (z < 0.85) {
        ctx.beginPath();
        geoPath(d3.geoGraticule10());
        ctx.strokeStyle = `rgba(255,255,255,${0.025 * (1 - z)})`;
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }

      // Land — ghostly outlines, not solid fills
      if (landDataRef.current) {
        ctx.beginPath();
        geoPath(landDataRef.current);
        ctx.fillStyle = `rgba(255,255,255,${(0.03 + 0.03 * z).toFixed(3)})`;
        ctx.strokeStyle = `rgba(255,255,255,${(0.08 + 0.07 * z).toFixed(3)})`;
        ctx.lineWidth = 0.3 + 0.2 * z;
        ctx.fill();
        ctx.stroke();
      }

      // Language labels — prominent, readable
      const currentSelected = selectedRef.current;
      globeLanguages.forEach((l, i) => {
        const co = [l.lon, l.lat];
        const angularDist = d3.geoDistance(co, [-projection.rotate()[0], -projection.rotate()[1]]);
        if (angularDist > Math.PI / 2) return;
        const pt = projection(co);
        if (!pt) return;
        const edgeFade = Math.max(0, 1 - angularDist / (Math.PI / 2));
        if (labelsIn <= 0) return;

        const isOn = currentSelected === l.id;
        const breathe = 0.5 + 0.15 * Math.sin(Date.now() / 1500 + i * 0.7);
        const alpha = (isOn ? 1.0 : breathe) * edgeFade * labelsIn;
        // Uniform size in English; selected gets slightly larger
        const fs = isOn ? Math.round(16 * (1 + 0.8 * z)) : Math.round(13 * (1 + 0.6 * z));

        ctx.save();
        ctx.globalAlpha = Math.min(1, alpha);
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        if (isOn) {
          // Selected: show native script with glow
          ctx.font = "700 " + fs + "px " + l.font;
          ctx.shadowColor = "rgba(3,255,178,0.6)";
          ctx.shadowBlur = 22;
          ctx.fillStyle = "#03ffb2";
          ctx.fillText(l.native, pt[0], pt[1]);
          ctx.shadowBlur = 0;
          // English name below
          ctx.globalAlpha = 0.6 * edgeFade * labelsIn;
          ctx.font = "500 11px 'Satoshi', system-ui";
          ctx.fillStyle = "#bbb";
          ctx.fillText(l.id, pt[0], pt[1] + fs * 0.7 + 10);
        } else {
          // Idle: clean English label
          ctx.font = "500 " + fs + "px 'Satoshi', system-ui";
          ctx.fillStyle = "rgba(255,255,255,0.85)";
          ctx.fillText(l.id, pt[0], pt[1]);
        }
        ctx.restore();
      });

      // UI transitions
      if (heroRef.current) {
        heroRef.current.style.opacity = heroFade;
        heroRef.current.style.transform = `translate(-50%,-50%) translateY(${-p * 50}px) scale(${lerp(1, 0.96, p)})`;
        heroRef.current.style.pointerEvents = heroFade > 0.1 ? "auto" : "none";
      }
      if (scrollHintRef.current) {
        scrollHintRef.current.style.opacity = heroFade * 0.5;
      }
      if (langUIRef.current) {
        if (labelsIn > 0.2) {
          langUIRef.current.style.opacity = Math.min(1, (labelsIn - 0.2) / 0.4);
          langUIRef.current.style.pointerEvents = "auto";
        } else {
          langUIRef.current.style.opacity = 0;
          langUIRef.current.style.pointerEvents = "none";
        }
      }

      rafRef.current = requestAnimationFrame(draw);
    }

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener("resize", resize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []); // stable — no deps, reads refs

  // Canvas click handler
  const handleCanvasClick = useCallback((e) => {
    const track = trackRef.current;
    if (!track) return;
    const r = track.getBoundingClientRect();
    const p = Math.max(0, Math.min(1, -r.top / (r.height - window.innerHeight)));
    if (p < 0.5) return;

    const canvas = canvasRef.current;
    const cr = canvas.getBoundingClientRect();
    const mx = e.clientX - cr.left;
    const my = e.clientY - cr.top;
    const projection = projectionRef.current;
    if (!projection) return;

    let closest = null;
    let closestDist = 40;
    globeLanguages.forEach(l => {
      const co = [l.lon, l.lat];
      const dist = d3.geoDistance(co, [-projection.rotate()[0], -projection.rotate()[1]]);
      if (dist > Math.PI / 2) return;
      const pt = projection(co);
      if (!pt) return;
      const dd = Math.hypot(pt[0] - mx, pt[1] - my);
      if (dd < closestDist) { closestDist = dd; closest = l; }
    });

    if (closest) {
      setSelectedLang(closest);
      setVideoFailed(false);
    }
  }, []);

  return (
    <div ref={trackRef} style={{ height: "300vh", position: "relative" }}>
      <div style={{ position: "sticky", top: 0, height: "100vh", overflow: "hidden" }}>
        {/* Bottom fade — blends into next section */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0, height: "30%",
          background: "linear-gradient(to bottom, transparent 0%, #0a0a0a 100%)",
          zIndex: 4, pointerEvents: "none",
        }} />
        {/* Canvas */}
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          style={{ position: "absolute", inset: 0, zIndex: 1, cursor: "pointer" }}
        />

        {/* Hero content */}
        <div
          ref={heroRef}
          className="globe-hero-content"
          style={{
            position: "absolute", zIndex: 2, top: "50%", left: "50%",
            transform: "translate(-50%,-50%)", textAlign: "center",
            pointerEvents: "none", width: "90%", maxWidth: 720,
          }}
        >
          <h1 style={{
            fontSize: "clamp(30px, 5vw, 62px)", fontWeight: 800, lineHeight: 1.12,
            letterSpacing: "-2px", color: "#fff",
            fontFamily: "var(--font-display)",
          }}>
            <span style={{ color: "var(--highlight)" }}>Captioning</span> Software,<br />
            Made by Desi Creators,<br />
            <span style={{
              fontFamily: "var(--font-accent)", fontStyle: "italic",
              fontWeight: 400, color: "var(--highlight)",
            }}>For Desi Creators</span>
          </h1>
          <p style={{
            color: "var(--text-secondary)", fontSize: "clamp(14px, 1.5vw, 18px)",
            marginTop: 18, lineHeight: 1.6, fontFamily: "var(--font-body)",
          }}>
            Auto-generate accurate captions in all major{" "}
            <strong style={{ color: "rgba(255,255,255,0.7)" }}>desi languages</strong> in seconds
          </p>
          <a href="#pricing" style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            marginTop: 28, background: "var(--accent)", color: "#0a0a0a",
            padding: "14px 32px", borderRadius: 999, textDecoration: "none",
            fontSize: 15, fontWeight: 600, pointerEvents: "auto",
            transition: "all 0.3s", fontFamily: "var(--font-display)",
            boxShadow: "0 0 30px rgba(3,255,178,0.3), 0 0 80px rgba(3,255,178,0.1)",
          }}
            onMouseEnter={e => { e.target.style.transform = "translateY(-2px)"; e.target.style.boxShadow = "0 0 40px rgba(3,255,178,0.45), 0 0 100px rgba(3,255,178,0.15)"; }}
            onMouseLeave={e => { e.target.style.transform = "none"; e.target.style.boxShadow = "0 0 30px rgba(3,255,178,0.3), 0 0 80px rgba(3,255,178,0.1)"; }}>
            Get started now
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 12L12 4M12 4H6M12 4V10" />
            </svg>
          </a>
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            gap: 8, marginTop: 20, color: "var(--text-muted)", fontSize: 13,
          }}>
            <span style={{ color: "var(--gold)", fontSize: 14, letterSpacing: 1 }}>★★★★★</span>
            Trusted by over 30,000 Users · 4.9
          </div>
        </div>

        {/* Language UI (phone mockup) */}
        <div
          ref={langUIRef}
          className="globe-lang-ui"
          style={{
            position: "absolute", zIndex: 3, opacity: 0, pointerEvents: "none",
            transition: "opacity 0.2s", right: "5%", top: "50%",
            transform: "translateY(-50%)", display: "flex", flexDirection: "column",
            alignItems: "center", gap: 10,
          }}
        >
          <div style={{
            fontSize: 10, letterSpacing: 3, color: "var(--accent)",
            textTransform: "uppercase", marginBottom: 4,
            fontFamily: "var(--font-display)",
          }}>Select your language</div>
          {/* Phone frame — 1:1 square to match 1920×1920 video */}
          <div style={{
            width: 200, height: 200, border: "2px solid #2a2a2e",
            borderRadius: 20, overflow: "hidden",
            background: "rgba(14,14,16,0.92)", backdropFilter: "blur(12px)",
            position: "relative", display: "flex", alignItems: "center",
            justifyContent: "center",
          }}>
            {/* Notch */}
            <div style={{
              position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)",
              width: 48, height: 8, background: "var(--bg-primary)",
              borderRadius: "0 0 6px 6px", zIndex: 2,
            }} />
            {videoFailed ? (
              <div style={{ color: "#555", fontSize: 11, padding: 14, textAlign: "center" }}>Preview unavailable</div>
            ) : (
              <video
                key={`${selectedLang.id}-${scriptMode}`}
                autoPlay muted loop playsInline
                style={{
                  width: "100%", height: "100%",
                  objectFit: "cover", background: "#000",
                  borderRadius: 18, display: "block",
                }}
                src={langVideoUrl(selectedLang, scriptMode)}
                onError={() => setVideoFailed(true)}
              />
            )}
          </div>
          {/* Native / Roman toggle — hidden for English & Malay (only one version) */}
          {selectedLang.id !== "English" && selectedLang.id !== "Malay" && (
            <div style={{ display: "flex", gap: 4, marginTop: 8 }}>
              {["native", "roman"].map(mode => {
                const active = scriptMode === mode;
                return (
                  <button
                    key={mode}
                    onClick={() => { setScriptMode(mode); setVideoFailed(false); }}
                    style={{
                      padding: "5px 14px", borderRadius: 999, border: "none",
                      fontSize: 10, fontWeight: 600, cursor: "pointer",
                      textTransform: "uppercase", letterSpacing: 1,
                      fontFamily: "var(--font-display)",
                      background: active ? "var(--accent)" : "rgba(255,255,255,0.08)",
                      color: active ? "#0a0a0a" : "var(--text-secondary)",
                      transition: "all 0.2s",
                    }}
                  >{mode}</button>
                );
              })}
            </div>
          )}
          {/* Selected name */}
          <div style={{ color: "#fff", fontSize: 13, fontWeight: 600, textAlign: "center", marginTop: 6 }}>
            {selectedLang.native}
          </div>
          <div style={{ color: "var(--text-muted)", fontSize: 10, textAlign: "center" }}>
            {selectedLang.id}
          </div>
        </div>

        {/* Scroll hint */}
        <div ref={scrollHintRef} style={{
          position: "absolute", bottom: 20, left: "50%", transform: "translateX(-50%)",
          zIndex: 5, display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
        }}>
          <span style={{
            color: "rgba(255,255,255,0.2)", fontSize: 9, letterSpacing: 2,
            textTransform: "uppercase", fontFamily: "var(--font-display)",
          }}>Scroll</span>
          <div style={{
            width: 14, height: 14,
            borderRight: "1.5px solid rgba(255,255,255,0.25)",
            borderBottom: "1.5px solid rgba(255,255,255,0.25)",
            transform: "rotate(45deg)", animation: "bob 1.5s ease-in-out infinite",
          }} />
        </div>
      </div>
    </div>
  );
}

// ——— TEMPLATES MARQUEE ———
function TemplatesSection() {
  const templates = [
    { name: "Ali Abdaal", tag: "Fully customizable", img: "https://framerusercontent.com/images/769YZT2otKXGbpYJRC8OStInOI.png?width=262&height=432", video: "https://kalakar-cdn.b-cdn.net/Creator%20Templates%20%20Styles/Ali%20Abdaal%20(Fully%20customizable).mp4" },
    { name: "Mr Beast", tag: "Fully customizable", img: "https://framerusercontent.com/images/eZAgB0PS9mH4LOu1ba4RgZratNU.png?width=260&height=432", video: "https://kalakar-cdn.b-cdn.net/Creator%20Templates%20%20Styles/Mr%20Beast%20(Fully%20customizable).mp4" },
    { name: "Iman Gadzhi", tag: "Fully customizable", img: "https://framerusercontent.com/images/9hchyEyOoRmhIljen2bOehg.png?width=256&height=428", video: "https://kalakar-cdn.b-cdn.net/Creator%20Templates%20%20Styles/Iman%20Gadzhi%20(Fully%20customizable).mp4" },
    { name: "Alex Hormozi", tag: "Partially customizable", img: "https://framerusercontent.com/images/JkJ0KyIYOf2LPS0bJe6WJ87VWo.png?width=265&height=425", video: "https://kalakar-cdn.b-cdn.net/Creator%20Templates%20%20Styles/Alex%20Hormozi%20(Partially%20customizable).mp4" },
    { name: "Devin Jatho", tag: "Fully customizable", img: "https://framerusercontent.com/images/ViUEuCGRVgYPqSq8F0UYT3xvwk.png?width=274&height=427", video: "https://kalakar-cdn.b-cdn.net/Creator%20Templates%20%20Styles/Devin%20Jatho%20(Fully%20customizable).mp4" },
    { name: "Editing Skool", tag: "Fully customizable", img: "https://framerusercontent.com/images/Z9qE4Jj1LUklvFbrpe81skzOiKw.png?width=264&height=428", video: "https://kalakar-cdn.b-cdn.net/Creator%20Templates%20%20Styles/Editing%20Skool(Fully%20customizable).mp4" },
    { name: "Bubble Style", tag: "Fully customizable", img: "https://framerusercontent.com/images/PIjzhFoA55OJlqoevzRCqFzRIs.png?width=264&height=439", video: "https://kalakar-cdn.b-cdn.net/Creator%20Templates%20%20Styles/Bubble%20Style%20(Fully%20customizable).mp4" },
  ];

  const [activeIdx, setActiveIdx] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef(null);
  const n = templates.length;

  const go = (dir) => setActiveIdx(prev => (prev + dir + n) % n);

  // Positions: -3, -2, -1, 0 (center), 1, 2, 3
  const getCardStyle = (offset) => {
    const absOff = Math.abs(offset);
    if (absOff > 3) return { display: "none" };
    const isCenter = offset === 0;
    // Scale: center=1, ±1=0.75, ±2=0.55, ±3=0.4
    const scale = isCenter ? 1 : absOff === 1 ? 0.75 : absOff === 2 ? 0.55 : 0.4;
    // Translate X: each step moves further out
    const xBase = isCenter ? 0 : offset * (absOff === 1 ? 220 : absOff === 2 ? 360 : 440);
    // Z depth
    const zVal = isCenter ? 0 : -absOff * 120;
    const opacity = isCenter ? 1 : absOff === 1 ? 0.8 : absOff === 2 ? 0.5 : 0.3;

    return {
      position: "absolute",
      left: "50%",
      top: "50%",
      width: isCenter ? 320 : 260,
      height: isCenter ? 480 : 400,
      transform: `translate(-50%, -50%) translateX(${xBase}px) translateZ(${zVal}px) scale(${scale})`,
      opacity,
      zIndex: 10 - absOff,
      transition: "all 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
      borderRadius: isCenter ? 24 : 18,
      overflow: "hidden",
      cursor: isCenter ? "default" : "pointer",
      border: isCenter ? "2px solid rgba(255,255,255,0.12)" : "1px solid rgba(255,255,255,0.06)",
      boxShadow: isCenter ? "0 30px 80px rgba(0,0,0,0.5)" : "none",
    };
  };

  return (
    <section style={{ padding: "48px 0 56px", overflow: "hidden" }}>
      <AnimSection>
        <div style={{ textAlign: "center", marginBottom: 40, padding: "0 24px" }}>
          <p style={{
            fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "2px",
            color: "var(--accent)", marginBottom: 8,
            fontFamily: "var(--font-display)",
          }}>Templates</p>
          <h2 style={{
            fontSize: "clamp(32px, 5vw, 56px)", fontWeight: 800,
            letterSpacing: "-2px", lineHeight: 1.1,
            fontFamily: "var(--font-display)",
          }}>
            All your Favourite{" "}
            <span style={{ fontFamily: "var(--font-accent)", fontStyle: "italic", color: "var(--highlight)" }}>Templates</span>
          </h2>
          <p style={{ color: "var(--text-secondary)", marginTop: 14, fontSize: 16, fontFamily: "var(--font-body)" }}>
            Dozens of fully <strong style={{ color: "var(--text-primary)" }}>customizable templates</strong> in all desi languages
          </p>
        </div>
      </AnimSection>

      {/* 3D Carousel */}
      <div style={{
        position: "relative", height: 520, perspective: 1200,
        maxWidth: 1200, margin: "0 auto",
      }}>
        {templates.map((t, i) => {
          let offset = i - activeIdx;
          // Wrap around
          if (offset > Math.floor(n / 2)) offset -= n;
          if (offset < -Math.floor(n / 2)) offset += n;
          const style = getCardStyle(offset);
          if (style.display === "none") return null;
          const isCenter = offset === 0;

          return (
            <div
              key={t.name}
              style={style}
              onClick={() => !isCenter && setActiveIdx(i)}
            >
              {isCenter ? (
                /* Center card: video */
                <>
                  <video
                    ref={videoRef}
                    key={`vid-${t.name}`}
                    autoPlay loop playsInline
                    muted={isMuted}
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                    src={t.video}
                    poster={t.img}
                  />
                  {/* Bottom overlay with name + mute */}
                  <div style={{
                    position: "absolute", bottom: 0, left: 0, right: 0,
                    padding: "40px 20px 18px",
                    background: "linear-gradient(transparent, rgba(0,0,0,0.8))",
                  }}>
                    <div style={{ fontWeight: 700, fontSize: 16, fontFamily: "var(--font-display)" }}>{t.name}</div>
                    <div style={{
                      fontSize: 12, fontWeight: 500, color: "var(--accent)",
                      fontFamily: "var(--font-display)", marginTop: 2,
                    }}>{t.tag}</div>
                  </div>
                  {/* Mute toggle */}
                  <button
                    onClick={(e) => { e.stopPropagation(); setIsMuted(!isMuted); }}
                    style={{
                      position: "absolute", bottom: 18, right: 18,
                      width: 36, height: 36, borderRadius: 10,
                      background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)",
                      backdropFilter: "blur(8px)", cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: "#fff", zIndex: 2,
                    }}
                  >
                    {isMuted ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 5L6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07"/>
                      </svg>
                    )}
                  </button>
                </>
              ) : (
                /* Side cards: image only */
                <img
                  src={t.img}
                  alt={t.name}
                  loading="lazy"
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Navigation bar */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        gap: 16, marginTop: 24,
      }}>
        <button
          onClick={() => go(-1)}
          style={{
            width: 40, height: 40, borderRadius: 12,
            background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
            color: "#fff", cursor: "pointer", display: "flex",
            alignItems: "center", justifyContent: "center",
            transition: "all 0.2s",
          }}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.12)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>

        {/* Thumbnails / dots */}
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {templates.map((t, i) => (
            <button
              key={t.name}
              onClick={() => setActiveIdx(i)}
              style={{
                width: activeIdx === i ? 28 : 8,
                height: 8, borderRadius: 4, border: "none",
                background: activeIdx === i ? "var(--accent)" : "rgba(255,255,255,0.2)",
                cursor: "pointer", transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                padding: 0,
              }}
            />
          ))}
        </div>

        <button
          onClick={() => go(1)}
          style={{
            width: 40, height: 40, borderRadius: 12,
            background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
            color: "#fff", cursor: "pointer", display: "flex",
            alignItems: "center", justifyContent: "center",
            transition: "all 0.2s",
          }}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.12)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </button>
      </div>
    </section>
  );
}

// ——— ACCURACY BANNER ———
function AccuracyBanner() {
  return (
    <section style={{
      padding: "56px 24px", position: "relative", overflow: "hidden",
    }}>
      {/* Subtle diagonal background strip */}
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(170deg, transparent 35%, rgba(3,255,178,0.03) 50%, transparent 65%)",
        pointerEvents: "none",
      }} />
      <AnimSection>
        <div style={{ textAlign: "center", position: "relative", zIndex: 1 }}>
          <div style={{
            fontSize: "clamp(72px, 10vw, 120px)", fontWeight: 900,
            fontFamily: "var(--font-display)", letterSpacing: "-6px",
            lineHeight: 1,
            background: "linear-gradient(135deg, var(--accent), var(--highlight), var(--accent-secondary-light))",
            backgroundSize: "200% 200%",
            animation: "gradientFlow 6s ease infinite",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}>
            96%
          </div>
          <p style={{
            fontSize: "clamp(20px, 3vw, 32px)", fontWeight: 600,
            color: "var(--text-secondary)", marginTop: 8,
            fontFamily: "var(--font-display)", letterSpacing: "-0.5px",
          }}>
            Accuracy in major Desi languages
          </p>
        </div>
      </AnimSection>
    </section>
  );
}

// ——— NLE LOGO ICONS ———
function NLELogos({ size = 56 }) {
  return (
    <div style={{ display: "flex", alignItems: "center" }}>
      <div style={{ width: size, height: size, borderRadius: "50%", background: "rgba(40,30,70,0.8)", border: "1.5px solid rgba(150,130,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0, position: "relative", zIndex: 3 }}>
        <img src="/logos/Adobe_Premiere_Pro_CC_icon.svg.png" alt="Premiere Pro" style={{ width: size * 0.6, height: size * 0.6, objectFit: "contain" }} />
      </div>
      <div style={{ width: size, height: size, borderRadius: "50%", background: "rgba(30,30,40,0.8)", border: "1.5px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0, marginLeft: -size * 0.22, position: "relative", zIndex: 2 }}>
        <img src="/logos/9qK6wSBUEojw2OBstd2eQfPpu0.png" alt="Final Cut Pro" style={{ width: size * 0.65, height: size * 0.65, objectFit: "contain" }} />
      </div>
      <div style={{ width: size, height: size, borderRadius: "50%", background: "rgba(30,30,35,0.8)", border: "1.5px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0, marginLeft: -size * 0.22, position: "relative", zIndex: 1 }}>
        <img src="/logos/Qs0vy9oifVGgwjpz6qYGBfrWU.png" alt="DaVinci Resolve" style={{ width: size * 0.65, height: size * 0.65, objectFit: "contain" }} />
      </div>
    </div>
  );
}

// ——— EXPORT SECTION ———
function ExportSection() {
  const [step, setStep] = useState(0);
  const sectionRef = useRef(null);

  // Scroll-driven steps: divide section scroll range into 5 equal parts
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const onScroll = () => {
      const rect = el.getBoundingClientRect();
      const sectionH = rect.height;
      const viewH = window.innerHeight;
      // Progress: 0 when section top hits viewport bottom, 1 when section bottom hits viewport top
      const progress = Math.max(0, Math.min(1, (viewH - rect.top) / (sectionH + viewH)));
      // Map to 5 steps (0-4), biased so step 0 starts early
      const newStep = Math.min(4, Math.floor(progress * 5));
      setStep(newStep);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Step descriptions mapped to cards: card1 = steps 0,4  card2 = steps 1,2,3  card3 = step 4
  const card1Labels = { 0: "Export video from your NLE", 4: "Import back into your NLE" };
  const card2Labels = { 1: "Uploading to Kalakar...", 2: "Generating captions with AI", 3: "Rendering SRT & Alpha Channel" };
  const card3Labels = { 4: "Import back into your NLE" };

  return (
    <section ref={sectionRef} style={{ padding: "80px 24px 120px", maxWidth: 1200, margin: "0 auto", minHeight: "80vh" }}>
      {/* Heading + description + CTA */}
      <AnimSection>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <p style={{
            fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "2px",
            color: "var(--accent-secondary-light)", marginBottom: 10,
            fontFamily: "var(--font-display)",
          }}>Pro Export</p>
          <h2 style={{
            fontSize: "clamp(26px, 4vw, 42px)", fontWeight: 800,
            letterSpacing: "-1.5px", lineHeight: 1.1, marginBottom: 14,
            fontFamily: "var(--font-display)",
          }}>
            Export in{" "}
            <span style={{ color: "var(--highlight)" }}>SRT</span> or{" "}
            <span style={{ color: "var(--highlight)" }}>Alpha Channel</span>
          </h2>
          <p style={{
            color: "var(--text-secondary)", fontSize: 15, lineHeight: 1.7,
            maxWidth: 600, margin: "0 auto 20px",
          }}>
            For all the Pro-Editors, <strong style={{ color: "var(--text-primary)" }}>cross NLE support available</strong> to bring captions back locally in your own software of choice
          </p>
          <a href="#pricing" style={{
            background: "var(--accent)", color: "#0a0a0a", padding: "12px 28px",
            borderRadius: 999, textDecoration: "none", fontSize: 14, fontWeight: 700,
            transition: "all 0.3s", fontFamily: "var(--font-display)",
            display: "inline-flex", alignItems: "center", gap: 8,
            boxShadow: "0 0 20px rgba(3,255,178,0.25)",
          }}
            onMouseEnter={e => { e.target.style.transform = "translateY(-2px)"; e.target.style.boxShadow = "0 0 30px rgba(3,255,178,0.4)"; }}
            onMouseLeave={e => { e.target.style.transform = "none"; e.target.style.boxShadow = "0 0 20px rgba(3,255,178,0.25)"; }}
          >
            Join now
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="7" y1="17" x2="17" y2="7" /><polyline points="7 7 17 7 17 17" />
            </svg>
          </a>
        </div>
      </AnimSection>

      {/* 3-column pipeline cards */}
      <AnimSection delay="delay-1">
        <div className="export-columns" style={{
          display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
          gap: 16, position: "relative", maxWidth: 960, margin: "0 auto",
        }}>
          {/* Dotted connector lines (desktop only) */}
          <svg className="export-connectors" style={{ position: "absolute", top: "50%", left: 0, width: "100%", height: 2, pointerEvents: "none", overflow: "visible", transform: "translateY(-50%)" }}>
            <line x1="34%" y1="0" x2="38%" y2="0" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" strokeDasharray="4 4" />
            <line x1="62%" y1="0" x2="66%" y2="0" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" strokeDasharray="4 4" />
          </svg>

          {/* Card 1: Your NLE */}
          <div style={{
            background: (step === 0 || step === 4) ? "rgba(3,255,178,0.03)" : "rgba(16,16,18,0.7)",
            border: (step === 0 || step === 4) ? "1.5px solid rgba(3,255,178,0.2)" : "1.5px solid rgba(255,255,255,0.06)",
            borderRadius: 20, padding: "32px 24px",
            display: "flex", flexDirection: "column", alignItems: "center",
            gap: 16, transition: "all 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
            position: "relative",
          }}>
            {(step === 0 || step === 4) && (
              <div style={{
                position: "absolute", inset: -2, borderRadius: 22,
                border: "1px solid rgba(3,255,178,0.15)",
                animation: "subtlePulse 1.5s ease infinite",
                pointerEvents: "none",
              }} />
            )}
            <NLELogos size={48} />
            <span style={{ fontSize: 11, fontWeight: 500, color: "var(--text-muted)", fontFamily: "var(--font-display)", textTransform: "uppercase", letterSpacing: "1px" }}>Your NLE</span>
            <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
              {["Premiere Pro", "Final Cut", "DaVinci"].map(n => (
                <span key={n} style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-display)" }}>{n}</span>
              ))}
            </div>
            {/* File icon — visible at step 0 */}
            <div style={{
              opacity: step === 0 ? 1 : 0, transition: "opacity 0.4s",
              marginTop: 4,
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={step === 0 ? "var(--accent)" : "#444"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            </div>
            {/* Active step label */}
            <div style={{
              minHeight: 20, marginTop: 8,
              opacity: card1Labels[step] ? 1 : 0,
              transform: card1Labels[step] ? "translateY(0)" : "translateY(6px)",
              transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
            }}>
              <p style={{
                fontSize: 12, fontWeight: 600, color: "var(--accent)",
                fontFamily: "var(--font-display)", textAlign: "center",
              }}>{card1Labels[step] || ""}</p>
            </div>
          </div>

          {/* Card 2: Kalakar */}
          <div style={{
            background: (step >= 1 && step <= 3) ? "linear-gradient(180deg, rgba(3,255,178,0.05), rgba(3,255,178,0.01))" : "rgba(16,16,18,0.7)",
            border: (step >= 1 && step <= 3) ? "1.5px solid rgba(3,255,178,0.25)" : "1.5px solid rgba(255,255,255,0.06)",
            borderRadius: 20, padding: "32px 24px",
            display: "flex", flexDirection: "column", alignItems: "center",
            gap: 16, transition: "all 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
            position: "relative",
          }}>
            {/* Kalakar badge */}
            <div style={{
              position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)",
              background: "var(--bg-primary)", border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 8, padding: "3px 12px",
            }}>
              <img src="/kalakar-logo-full.svg" alt="Kalakar" style={{ height: 14 }} />
            </div>

            {/* Spinner or file icon */}
            <div style={{ width: 48, height: 48, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", marginTop: 8 }}>
              {step === 2 && (
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none" style={{ position: "absolute", animation: "spin 0.8s linear infinite" }}>
                  <circle cx="24" cy="24" r="20" stroke="rgba(3,255,178,0.15)" strokeWidth="2" />
                  <path d="M24 4a20 20 0 0 1 20 20" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" />
                </svg>
              )}
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={(step >= 1 && step <= 3) ? "var(--accent)" : "#444"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ transition: "stroke 0.4s" }}>
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            </div>

            {/* Render output badges */}
            <div style={{
              display: "flex", flexDirection: "column", gap: 6,
              opacity: step === 3 ? 1 : 0,
              transform: step === 3 ? "translateY(0)" : "translateY(8px)",
              transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
            }}>
              <div style={{
                padding: "6px 14px", borderRadius: 6,
                background: "rgba(3,255,178,0.08)", border: "1px solid rgba(3,255,178,0.2)",
                fontSize: 12, fontWeight: 600, color: "var(--accent)",
                fontFamily: "var(--font-display)", textAlign: "center",
              }}>SRT File</div>
              <div style={{
                padding: "6px 14px", borderRadius: 6,
                background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.2)",
                fontSize: 12, fontWeight: 600, color: "var(--accent-secondary-light)",
                fontFamily: "var(--font-display)", textAlign: "center",
              }}>Alpha Channel</div>
            </div>

            {/* Empty space when badges hidden */}
            {step !== 3 && <div style={{ height: 60 }} />}
            {/* Active step label */}
            <div style={{
              minHeight: 20, marginTop: 8,
              opacity: card2Labels[step] ? 1 : 0,
              transform: card2Labels[step] ? "translateY(0)" : "translateY(6px)",
              transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
            }}>
              <p style={{
                fontSize: 12, fontWeight: 600, color: "var(--accent)",
                fontFamily: "var(--font-display)", textAlign: "center",
              }}>{card2Labels[step] || ""}</p>
            </div>
          </div>

          {/* Card 3: Back in NLE */}
          <div style={{
            background: step === 4 ? "rgba(3,255,178,0.03)" : "rgba(16,16,18,0.7)",
            border: step === 4 ? "1.5px solid rgba(3,255,178,0.2)" : "1.5px solid rgba(255,255,255,0.06)",
            borderRadius: 20, padding: "32px 24px",
            display: "flex", flexDirection: "column", alignItems: "center",
            gap: 16, transition: "all 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
            position: "relative",
          }}>
            {step === 4 && (
              <div style={{
                position: "absolute", inset: -2, borderRadius: 22,
                border: "1px solid rgba(3,255,178,0.15)",
                animation: "subtlePulse 1.5s ease infinite",
                pointerEvents: "none",
              }} />
            )}
            <NLELogos size={48} />
            <span style={{ fontSize: 11, fontWeight: 500, color: "var(--text-muted)", fontFamily: "var(--font-display)", textTransform: "uppercase", letterSpacing: "1px" }}>Back in NLE</span>
            {/* Badges landing */}
            <div style={{
              display: "flex", flexDirection: "column", gap: 5, marginTop: 4,
              opacity: step === 4 ? 1 : 0,
              transition: "opacity 0.5s",
            }}>
              <div style={{
                padding: "5px 12px", borderRadius: 6,
                background: "rgba(3,255,178,0.08)", border: "1px solid rgba(3,255,178,0.15)",
                fontSize: 11, fontWeight: 600, color: "var(--accent)",
                fontFamily: "var(--font-display)", textAlign: "center",
              }}>SRT File</div>
              <div style={{
                padding: "5px 12px", borderRadius: 6,
                background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.15)",
                fontSize: 11, fontWeight: 600, color: "var(--accent-secondary-light)",
                fontFamily: "var(--font-display)", textAlign: "center",
              }}>Alpha Channel</div>
            </div>
            {step !== 4 && <div style={{ height: 52 }} />}
            {/* Active step label */}
            <div style={{
              minHeight: 20, marginTop: 8,
              opacity: card3Labels[step] ? 1 : 0,
              transform: card3Labels[step] ? "translateY(0)" : "translateY(6px)",
              transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
            }}>
              <p style={{
                fontSize: 12, fontWeight: 600, color: "var(--accent)",
                fontFamily: "var(--font-display)", textAlign: "center",
              }}>{card3Labels[step] || ""}</p>
            </div>
          </div>
        </div>
      </AnimSection>

      {/* Step dots */}
      <div style={{
        textAlign: "center", marginTop: 20,
        display: "flex", justifyContent: "center", gap: 6,
      }}>
        {[0, 1, 2, 3, 4].map(i => (
          <div key={i} style={{
            width: i === step ? 20 : 6, height: 6, borderRadius: 3,
            background: i === step ? "var(--accent)" : "rgba(255,255,255,0.1)",
            transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
          }} />
        ))}
      </div>

      <style>{`
        @media (max-width: 768px) {
          .export-columns { grid-template-columns: 1fr !important; max-width: 360px !important; }
          .export-connectors { display: none !important; }
        }
      `}</style>
    </section>
  );
}

// ——— AUDIO ENHANCEMENT ———
function AudioSection() {
  const [enhanced, setEnhanced] = useState(false);
  const rawVideoRef = useRef(null);
  const enhancedVideoRef = useRef(null);
  const [hasInteracted, setHasInteracted] = useState(false);

  useEffect(() => {
    const raw = rawVideoRef.current;
    const enh = enhancedVideoRef.current;
    if (!raw || !enh) return;
    const from = enhanced ? raw : enh;
    const to = enhanced ? enh : raw;
    to.currentTime = from.currentTime;
    to.play().catch(() => {});
    if (hasInteracted) {
      raw.muted = enhanced;
      enh.muted = !enhanced;
    }
  }, [enhanced, hasInteracted]);

  const handleToggle = () => {
    setHasInteracted(true);
    setEnhanced(e => !e);
  };

  return (
    <section style={{ padding: "40px 24px", maxWidth: 1100, margin: "0 auto" }}>
      <AnimSection>
        <div className="audio-card" style={{
          background: "rgba(20,20,20,0.6)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 20, padding: "28px 28px",
          display: "grid", gridTemplateColumns: "1.1fr 0.9fr",
          gap: 28, alignItems: "center",
        }}>
          {/* Text content */}
          <div>
            <p style={{
              fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "2px",
              color: "var(--accent-secondary-light)", marginBottom: 10,
              fontFamily: "var(--font-display)",
            }}>Audio AI</p>
            <h2 style={{
              fontSize: "clamp(20px, 2.5vw, 28px)", fontWeight: 800,
              letterSpacing: "-0.5px", lineHeight: 1.2, marginBottom: 12,
              fontFamily: "var(--font-display)",
            }}>
              State of The Art
              <br />
              <span style={{ color: "var(--highlight)" }}>Audio Enhancement!</span>
            </h2>

            <p style={{
              color: "var(--text-secondary)", fontSize: 13, lineHeight: 1.6, marginBottom: 16,
            }}>
              <strong style={{ color: "var(--text-primary)" }}>Kalakar</strong> offers{" "}
              <strong style={{ color: "var(--text-primary)" }}>Studio Grade Audio Enhancement</strong> using complex{" "}
              Algorithms & AI. Tested for Harsh Traffic, white noise, crowds, hiss or any other Noise Pattern.
            </p>

            <div className="audio-pills" style={{ display: "flex", gap: 8, flexWrap: "nowrap" }}>
              {[
                { icon: "⏱", label: "Works in Seconds" },
                { icon: "▶", label: "Realtime Playback" },
                { icon: "✦", label: "Studio Quality" },
              ].map(({ icon, label }) => (
                <div key={label} style={{
                  padding: "7px 14px", borderRadius: 999,
                  background: "rgba(124,58,237,0.06)",
                  border: "1px solid rgba(124,58,237,0.15)",
                  fontSize: 12, fontWeight: 500, color: "var(--accent-secondary-light)",
                  fontFamily: "var(--font-display)",
                  display: "flex", alignItems: "center", gap: 5,
                  whiteSpace: "nowrap",
                }}>
                  <span style={{ fontSize: 11 }}>{icon}</span> {label}
                </div>
              ))}
            </div>
          </div>

          {/* Video with toggle */}
          <div style={{ position: "relative" }}>
            <div style={{
              width: "100%", aspectRatio: "4/5",
              borderRadius: 16, overflow: "hidden",
              border: "1px solid rgba(255,255,255,0.06)",
              position: "relative", background: "#000",
              maxHeight: 380,
            }}>
              <video
                ref={rawVideoRef}
                autoPlay muted loop playsInline preload="auto"
                controlsList="nodownload nofullscreen noremoteplayback"
                disablePictureInPicture
                style={{
                  width: "100%", height: "100%", objectFit: "cover",
                  display: "block", position: "absolute", inset: 0,
                  opacity: enhanced ? 0 : 1, transition: "opacity 0.5s ease",
                  pointerEvents: "none",
                }}
              >
                <source src="https://kalakar-cdn.b-cdn.net/Audio%20Enhancement/Unprocessed%20Audio.mp4" type="video/mp4" />
              </video>
              <video
                ref={enhancedVideoRef}
                autoPlay muted loop playsInline preload="auto"
                controlsList="nodownload nofullscreen noremoteplayback"
                disablePictureInPicture
                style={{
                  width: "100%", height: "100%", objectFit: "cover",
                  display: "block", position: "absolute", inset: 0,
                  opacity: enhanced ? 1 : 0, transition: "opacity 0.5s ease",
                  pointerEvents: "none",
                }}
              >
                <source src="https://kalakar-cdn.b-cdn.net/Audio%20Enhancement/Cleaned%20Audio.mp4" type="video/mp4" />
              </video>

              {/* Status badge */}
              <div style={{
                position: "absolute", top: 16, right: 16,
                background: enhanced ? "rgba(3,255,178,0.85)" : "rgba(0,0,0,0.6)",
                backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
                borderRadius: 999, padding: "8px 16px",
                display: "flex", alignItems: "center", gap: 8,
                transition: "all 0.4s ease",
                border: enhanced ? "1px solid rgba(3,255,178,0.5)" : "1px solid rgba(255,255,255,0.1)",
              }}>
                <div style={{
                  width: 8, height: 8, borderRadius: "50%",
                  background: enhanced ? "#fff" : "#aaa",
                  transition: "all 0.3s ease",
                }} />
                <span style={{
                  fontSize: 13, fontWeight: 600, fontFamily: "var(--font-display)",
                  color: enhanced ? "#fff" : "#ccc",
                }}>
                  {enhanced ? "AI Enhanced" : "Raw Audio"}
                </span>
              </div>

              {/* Toggle */}
              <div style={{
                position: "absolute", bottom: 20, left: "50%", transform: "translateX(-50%)",
              }}>
                <button
                  onClick={handleToggle}
                  style={{
                    width: 64, height: 34, borderRadius: 999,
                    background: enhanced ? "var(--accent)" : "rgba(80,80,80,0.8)",
                    border: "none", cursor: "pointer",
                    position: "relative", transition: "background 0.3s ease", padding: 0,
                  }}
                >
                  <div style={{
                    width: 28, height: 28, borderRadius: "50%",
                    background: "#fff", position: "absolute", top: 3,
                    left: enhanced ? 33 : 3,
                    transition: "left 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
                  }} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </AnimSection>
    </section>
  );
}

// ——— PRICING ———
function PricingSection() {
  const [isYearly, setIsYearly] = useState(false);
  const [currency, setCurrency] = useState({ sym: "$", code: "USD" });

  useEffect(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    const lang = navigator.language || "en-US";
    if (tz.includes("Kolkata") || lang.includes("IN")) setCurrency({ sym: "Rs", code: "INR" });
    else if (tz.includes("Karachi") || lang.includes("PK")) setCurrency({ sym: "Rs", code: "PKR" });
    else if (tz.includes("Dhaka") || lang.includes("BD")) setCurrency({ sym: "৳", code: "BDT" });
    else if (tz.includes("Kathmandu") || lang.includes("NP")) setCurrency({ sym: "Rs", code: "NPR" });
  }, []);

  const plans = [
    {
      name: "Free", slug: null, popular: false,
      monthly: { USD: "0.00", INR: "0.00", PKR: "0.00", BDT: "0.00", NPR: "0.00" },
      yearly: { USD: "0", INR: "0", PKR: "0", BDT: "0", NPR: "0" },
      yearlyStrike: null, save: null,
      featuresLabel: "Key Features",
      features: ["All Languages", "10 Minutes Free Testing", "Full Templates", "5 GB Cloud Storage", "Max Video Length 2 min", "3 Audio Enhancement Credits"],
    },
    {
      name: "Editor", slug: "editor", popular: false,
      monthly: { USD: "6.99", INR: "1,950", PKR: "1,950", BDT: "1,200", NPR: "1,600" },
      yearly: { USD: "5.83", INR: "1,625", PKR: "1,625", BDT: "1,000", NPR: "1,333" },
      yearlyStrike: { USD: "6.99", INR: "1,950", PKR: "1,950", BDT: "1,200", NPR: "1,600" },
      save: "2 months free",
      featuresLabel: "Everything in Free, plus",
      features: ["2 Hours of Transcription", "20 GB Cloud Storage", "1080P Video Render", "Max Video Length 2 min", "50 Audio Enhancement Credits", "Custom Font Upload"],
    },
    {
      name: "Creator", slug: "creator", popular: false,
      monthly: { USD: "9.99", INR: "2,800", PKR: "2,800", BDT: "1,800", NPR: "2,200" },
      yearly: { USD: "8.33", INR: "2,333", PKR: "2,333", BDT: "1,500", NPR: "1,833" },
      yearlyStrike: { USD: "9.99", INR: "2,800", PKR: "2,800", BDT: "1,800", NPR: "2,200" },
      save: "2 months free",
      featuresLabel: "Everything in Editor, plus",
      features: ["5 Hours of Transcription", "60 GB Cloud Storage", "4K Video Render", "Max Video Length 5 min", "Unlimited Audio Enhancement", "Alpha Channel Render", "SRT Render", "2 Hours of Translation"],
    },
    {
      name: "Business", slug: "business", popular: true,
      monthly: { USD: "24.99", INR: "6,999", PKR: "6,999", BDT: "4,500", NPR: "5,500" },
      yearly: { USD: "20.83", INR: "5,833", PKR: "5,833", BDT: "3,750", NPR: "4,583" },
      yearlyStrike: { USD: "24.99", INR: "6,999", PKR: "6,999", BDT: "4,500", NPR: "5,500" },
      save: "2 months free",
      featuresLabel: "Everything in Creator, plus",
      features: ["12 Hours of Transcription", "150 GB Cloud Storage", "4K Video", "Max Video Length 30 min", "5 Hours of Translation"],
    },
  ];

  const getPrice = (plan) => {
    const prices = isYearly ? plan.yearly : plan.monthly;
    return prices[currency.code] || prices.USD;
  };
  const getStrike = (plan) => {
    if (!isYearly || !plan.yearlyStrike) return null;
    return plan.yearlyStrike[currency.code] || plan.yearlyStrike.USD;
  };

  return (
    <section id="pricing" style={{ padding: "48px 24px", maxWidth: 1200, margin: "0 auto" }}>
      <AnimSection>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <p style={{
            fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "2px",
            color: "var(--highlight)", marginBottom: 8, fontFamily: "var(--font-display)",
          }}>Pricing</p>
          <h2 style={{
            fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 800,
            letterSpacing: "-1.5px", marginBottom: 16,
            fontFamily: "var(--font-display)",
          }}>
            Unbeatable Pricing{" "}
            <span style={{ fontFamily: "var(--font-accent)", fontStyle: "italic", color: "var(--highlight)" }}>
              Across Industry
            </span>
          </h2>

          {/* Monthly / Yearly toggle */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 16,
          }}>
            <div style={{
              display: "inline-flex", background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 999, padding: 4,
            }}>
              <button onClick={() => setIsYearly(false)} style={{
                padding: "10px 28px", borderRadius: 999, border: "none",
                background: !isYearly ? "var(--text-primary)" : "transparent",
                color: !isYearly ? "var(--bg-primary)" : "var(--text-muted)",
                fontSize: 14, fontWeight: 600, cursor: "pointer",
                fontFamily: "var(--font-display)", transition: "all 0.3s ease",
              }}>Monthly</button>
              <button onClick={() => setIsYearly(true)} style={{
                padding: "10px 28px", borderRadius: 999, border: "none",
                background: isYearly ? "var(--text-primary)" : "transparent",
                color: isYearly ? "var(--bg-primary)" : "var(--text-muted)",
                fontSize: 14, fontWeight: 600, cursor: "pointer",
                fontFamily: "var(--font-display)", transition: "all 0.3s ease",
              }}>Yearly</button>
            </div>
            <div style={{
              padding: "6px 14px", borderRadius: 999,
              background: "rgba(72,166,128,0.1)", border: "1px solid rgba(72,166,128,0.25)",
              fontSize: 12, fontWeight: 700, color: "var(--highlight)",
              fontFamily: "var(--font-display)",
              animation: "subtlePulse 2s ease infinite",
            }}>
              2 months free
            </div>
          </div>
        </div>
      </AnimSection>

      <div className="pricing-grid" style={{
        display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
        gap: 16, alignItems: "stretch",
      }}>
        {plans.map((plan, idx) => {
          const strike = getStrike(plan);
          return (
            <AnimSection key={plan.name} delay={`delay-${idx + 1}`}>
              <div style={{
                background: plan.popular
                  ? "linear-gradient(180deg, rgba(3,255,178,0.04), rgba(20,20,20,0.6))"
                  : "rgba(20,20,20,0.6)",
                borderRadius: 18, padding: "24px 22px",
                border: plan.popular
                  ? "1.5px solid rgba(3,255,178,0.3)"
                  : "1px solid rgba(255,255,255,0.06)",
                position: "relative", height: "100%",
                display: "flex", flexDirection: "column",
                transition: "all 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
                transform: plan.popular ? "translateY(-8px)" : "none",
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = plan.popular ? "translateY(-12px)" : "translateY(-4px)"; e.currentTarget.style.borderColor = plan.popular ? "rgba(3,255,178,0.5)" : "rgba(255,255,255,0.12)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = plan.popular ? "translateY(-8px)" : "none"; e.currentTarget.style.borderColor = plan.popular ? "rgba(3,255,178,0.3)" : "rgba(255,255,255,0.06)"; }}
              >
                {/* Most Popular badge */}
                {plan.popular && (
                  <div style={{
                    position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)",
                    padding: "5px 16px", borderRadius: 999,
                    background: "linear-gradient(135deg, var(--accent), var(--accent-light))",
                    fontSize: 11, fontWeight: 700, color: "#0a0a0a",
                    fontFamily: "var(--font-display)", whiteSpace: "nowrap",
                    boxShadow: "0 4px 16px rgba(3,255,178,0.3)",
                  }}>Most Popular</div>
                )}

                {/* Plan name */}
                <div style={{
                  fontSize: 16, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8,
                  fontFamily: "var(--font-display)",
                }}>{plan.name}</div>

                {/* Price */}
                <div style={{ marginBottom: 4 }}>
                  <span style={{
                    fontSize: "clamp(28px, 3.5vw, 34px)", fontWeight: 800,
                    color: "#fff", letterSpacing: "-1px",
                    fontFamily: "var(--font-display)",
                  }}>
                    {currency.sym}{getPrice(plan)}
                  </span>
                  {strike && (
                    <span style={{
                      fontSize: 14, color: "var(--text-muted)", textDecoration: "line-through",
                      marginLeft: 8,
                    }}>
                      {currency.sym}{strike}
                    </span>
                  )}
                </div>

                {/* Period */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                  <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
                    / {isYearly ? "month, billed yearly" : "month"}
                  </span>
                  {isYearly && plan.save && (
                    <span style={{
                      padding: "3px 10px", borderRadius: 6,
                      background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)",
                      fontSize: 10, fontWeight: 700, color: "var(--success)",
                      fontFamily: "var(--font-display)",
                    }}>{plan.save}</span>
                  )}
                </div>

                {/* CTA */}
                <a
                  href={plan.slug ? `https://app.kalakar.io/signup?plan=${plan.slug}&interval=${isYearly ? "year" : "month"}` : "https://app.kalakar.io/signup"}
                  target="_blank" rel="noopener noreferrer"
                  style={{
                    display: "block", textAlign: "center", padding: "11px",
                    borderRadius: 12, textDecoration: "none", fontWeight: 600, fontSize: 14,
                    fontFamily: "var(--font-display)",
                    background: plan.popular ? "var(--accent)" : "transparent",
                    color: plan.popular ? "#0a0a0a" : "var(--text-secondary)",
                    border: plan.popular ? "none" : "1px solid rgba(255,255,255,0.1)",
                    marginBottom: 16, transition: "all 0.25s",
                    boxShadow: plan.popular ? "0 4px 20px rgba(3,255,178,0.25)" : "none",
                  }}
                  onMouseEnter={e => {
                    if (!plan.popular) { e.target.style.borderColor = "rgba(255,255,255,0.2)"; e.target.style.background = "rgba(255,255,255,0.04)"; e.target.style.color = "var(--text-primary)"; }
                    else { e.target.style.background = "#02d99a"; }
                  }}
                  onMouseLeave={e => {
                    if (!plan.popular) { e.target.style.borderColor = "rgba(255,255,255,0.1)"; e.target.style.background = "transparent"; e.target.style.color = "var(--text-secondary)"; }
                    else { e.target.style.background = "var(--accent)"; }
                  }}
                >Get Started</a>

                {/* Divider */}
                <div style={{ height: 1, background: "rgba(255,255,255,0.06)", marginBottom: 14 }} />

                {/* Features label */}
                <div style={{
                  fontSize: 11, fontWeight: 700, color: "var(--text-muted)", marginBottom: 10,
                  textTransform: "uppercase", letterSpacing: "1px",
                  fontFamily: "var(--font-display)",
                }}>{plan.featuresLabel}</div>

                {/* Features list */}
                <div style={{ flex: 1 }}>
                  {plan.features.map((f, fi) => (
                    <div key={fi} style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 8 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}>
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <span style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.4 }}>{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            </AnimSection>
          );
        })}
      </div>
    </section>
  );
}

// ——— TESTIMONIALS ———
function TestimonialsSection() {
  const [playingVideo, setPlayingVideo] = useState(null);
  const bhuwanRef = useRef(null);
  const danyalRef = useRef(null);

  const handlePlay = (which) => {
    const ref = which === "bhuwan" ? bhuwanRef : danyalRef;
    if (ref.current) {
      ref.current.play();
      setPlayingVideo(which);
    }
  };

  const StarRow = ({ size = 14 }) => (
    <div style={{ display: "flex", gap: 2 }}>
      {[...Array(5)].map((_, i) => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24" fill="var(--gold)" stroke="none">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </div>
  );

  const VideoCard = ({ name, location, quote, videoSrc, videoRef: ref, videoKey }) => (
    <div style={{
      background: "var(--bg-card)", borderRadius: 20,
      border: "1px solid rgba(255,255,255,0.06)",
      overflow: "hidden", display: "flex", flexDirection: "column",
      transition: "all 0.3s",
    }}
      onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(3,255,178,0.2)"}
      onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"}
    >
      <div style={{ flex: 1, position: "relative", minHeight: 200 }}>
        <video
          ref={ref}
          src={videoSrc}
          playsInline preload="metadata"
          controls={playingVideo === videoKey}
          onClick={() => handlePlay(videoKey)}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", cursor: "pointer" }}
        />
        {playingVideo !== videoKey && (
          <div onClick={() => handlePlay(videoKey)} style={{
            position: "absolute", bottom: 20, left: 20,
            width: 52, height: 52, borderRadius: "50%",
            background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", transition: "all 0.2s",
            boxShadow: "0 4px 20px rgba(3,255,178,0.3)",
          }}
            onMouseEnter={e => e.currentTarget.style.transform = "scale(1.1)"}
            onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff"><path d="M8 5v14l11-7z"/></svg>
          </div>
        )}
      </div>
      <div style={{ padding: "18px 22px" }}>
        <StarRow size={12} />
        {quote && (
          <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6, margin: "10px 0 14px" }}>
            "{quote}"
          </p>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: quote ? 0 : 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: "50%",
            background: "linear-gradient(135deg, var(--accent), var(--accent-light))",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 700, fontSize: 14, color: "#fff", fontFamily: "var(--font-display)",
          }}>{name[0]}</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, fontFamily: "var(--font-display)" }}>{name}</div>
            {location && <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{location}</div>}
          </div>
        </div>
      </div>
    </div>
  );

  const TextCard = ({ name, text, style: cardStyle = {} }) => (
    <div style={{
      background: "var(--bg-card)", borderRadius: 20,
      border: "1px solid rgba(255,255,255,0.06)",
      padding: 20, display: "flex", flexDirection: "column", justifyContent: "space-between",
      transition: "all 0.3s", ...cardStyle,
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(3,255,178,0.2)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; e.currentTarget.style.transform = "none"; }}
    >
      <div>
        <StarRow />
        {text && <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6, marginTop: 10 }}>{text}</p>}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 20 }}>
        <div style={{
          width: 40, height: 40, borderRadius: "50%",
          background: "linear-gradient(135deg, var(--accent-secondary), var(--accent-secondary-light))",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontWeight: 700, fontSize: 16, color: "#fff", fontFamily: "var(--font-display)",
        }}>{name[0]}</div>
        <div style={{ fontWeight: 700, fontSize: 14, fontFamily: "var(--font-display)" }}>{name}</div>
      </div>
    </div>
  );

  return (
    <section id="reviews" style={{ padding: "48px 24px", overflow: "hidden" }}>
      <AnimSection>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <p style={{
            fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "2px",
            color: "var(--gold)", marginBottom: 8, fontFamily: "var(--font-display)",
          }}>Testimonials</p>
          <h2 style={{
            fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 800, letterSpacing: "-1px",
            fontFamily: "var(--font-display)",
          }}>
            Loved by Creators{" "}
            <span style={{ fontFamily: "var(--font-accent)", fontStyle: "italic", color: "var(--highlight)" }}>
              Across South Asia
            </span>
          </h2>
        </div>
      </AnimSection>

      <AnimSection delay="delay-1">
        <div className="testimonials-grid" style={{
          display: "grid",
          gridTemplateColumns: "1fr 1.2fr 1fr",
          gridTemplateRows: "auto auto",
          gap: 20, maxWidth: 1200, margin: "0 auto",
        }}>
          {/* Left — Bhuwan Video (spans 2 rows) */}
          <div style={{ gridRow: "1 / 3" }}>
            <VideoCard
              name="Bhuwan" location="India"
              quote="I've been using Kalakaar recently & it's honestly super helpful. It supports multiple languages, generating Hindi captions used to be a real struggle, but with Kalakaar, the process is super smooth."
              videoSrc="https://kalakar-cdn.b-cdn.net/Testimonials/Bhuwan%20-%20India.mp4"
              videoRef={bhuwanRef} videoKey="bhuwan"
            />
          </div>

          {/* Center top — Aarav text */}
          <TextCard
            name="Aarav"
            text="If you're an editor or creator from South Asia, this software is your only solution. It's got all the trendy captioning styles available like beast style, Iman Gadzi, Devin Jatho, Alex Harmozi etc just one click away."
          />

          {/* Right — Danyal Video (spans 2 rows) */}
          <div style={{ gridRow: "1 / 3" }}>
            <VideoCard
              name="Danyal" location="Pakistan"
              videoSrc="https://kalakar-cdn.b-cdn.net/Testimonials/Danyal%20-%20Pakistan%20.mp4"
              videoRef={danyalRef} videoKey="danyal"
            />
          </div>

          {/* Center bottom — Zaryab text */}
          <TextCard
            name="Zaryab Khan"
            text="Kalakaar as a captioning software is one of the best out there. It's premade templates are really helpful & loading times are really quick. Overall as an editor it makes the captioning much more easier."
          />
        </div>
      </AnimSection>
    </section>
  );
}

// ——— MAGIC TEXT (scroll-reveal word-by-word, sequential paragraphs) ———
function MagicWord({ children, progress, range }) {
  const opacity = useTransform(progress, range, [0, 1]);
  return (
    <span style={{
      position: "relative", marginRight: 4,
      fontSize: "clamp(13px, 1.4vw, 16px)", fontWeight: 400, lineHeight: 1.8,
      fontFamily: "var(--font-body)",
    }}>
      <span style={{ opacity: 0.12 }}>{children}</span>
      <motion.span style={{ opacity, position: "absolute", left: 0, top: 0 }}>{children}</motion.span>
    </span>
  );
}

// ——— WHY WE BUILT KALAKAR ———
function WhySection() {
  const paragraphs = [
    "Kalakar was built out of necessity. We built this beautiful software because whenever we made our videos, subtitling used to take the longest as every other company was & is focused on Western Market, big money there, why would they care about developing countries like us and our languages, right?",
    "Well we could either cry about it, or fix it ourselves. We chose the latter and started building Kalakar in early 2025.",
    "And after months of Development, deep research & analysis, we finally launched Beta version of Kalakar on 28th of April, around 50 Editors and Creators from across south Asia used it, gave us constant feedback and we literally made it exactly how a south Asian would want it.",
    "Because Kalakar is built by actual creators and editors, we are very much community centric. We are constantly developing & improving exactly to meet the needs for South Asia and we will keep on developing technologies that would cater to our Market, no more asking for help from Gora Market, we are here!",
  ];

  // Single scroll container drives all paragraphs sequentially
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 0.85", "end 0.3"],
  });

  // Build a flat list of all words with their global progress ranges
  const allWords = [];
  const totalWords = paragraphs.reduce((sum, p) => sum + p.split(" ").length, 0);
  let wordIndex = 0;

  paragraphs.forEach((p) => {
    const words = p.split(" ");
    const paraWords = [];
    words.forEach((word) => {
      const start = wordIndex / totalWords;
      const end = (wordIndex + 1) / totalWords;
      paraWords.push({ word, start, end });
      wordIndex++;
    });
    allWords.push(paraWords);
  });

  return (
    <section id="why" style={{ padding: "48px 24px", maxWidth: 800, margin: "0 auto" }}>
      <AnimSection>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <h2 style={{
            fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 800,
            letterSpacing: "-1px",
            fontFamily: "var(--font-display)",
          }}>
            Why we Built{" "}
            <span style={{ fontFamily: "var(--font-accent)", fontStyle: "italic", color: "var(--highlight)" }}>
              Kalakar?
            </span>
          </h2>
        </div>
      </AnimSection>

      {/* Letter-style card */}
      <div ref={containerRef} style={{
        background: "rgba(20,20,20,0.4)",
        border: "1px solid rgba(255,255,255,0.04)",
        borderRadius: 24, padding: "36px 32px",
        borderLeft: "3px solid var(--highlight)",
      }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {allWords.map((paraWords, pi) => (
            <p key={pi} style={{ display: "flex", flexWrap: "wrap", margin: 0 }}>
              {paraWords.map((w, wi) => (
                <MagicWord key={wi} progress={scrollYProgress} range={[w.start, w.end]}>
                  {w.word}
                </MagicWord>
              ))}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}

// ——— FAQ ———
function FAQSection() {
  const faqs = [
    { q: "How accurate is the transcription?", a: "Kalakar provides up to 96% accuracy in all major desi languages including Hindi, Urdu, Tamil, Bengali, Punjabi, and more. Our AI models are specifically trained on South Asian accents and dialects." },
    { q: "Is it possible to edit the transcription?", a: "Yes! You can fully edit the transcription in our editor. Fix any word, adjust timing, and customize styles — all in real-time with instant preview." },
    { q: "What are the rendering options?", a: "You can render videos directly with captions baked in (up to 4K), export as SRT subtitle files, or export as Alpha Channel for importing into your NLE of choice." },
    { q: "How is the billing managed for team accounts?", a: "Team billing is managed centrally. The account owner can add/remove team members and manage usage. All credits are shared across the team." },
    { q: "What is available in the Free Plan?", a: "The Free Plan includes 10 minutes of testing with full templates, all language support, 5GB cloud storage, and 3 audio enhancement credits." },
    { q: "Can we edit the pre-built Templates?", a: "Absolutely! All templates marked as 'Fully customizable' can be completely edited — change fonts, colors, animations, sizes, positioning and more." },
    { q: "How do I cancel my subscription?", a: "You can cancel anytime from your account settings. Your plan remains active until the end of your billing period with no additional charges." },
    { q: "How is the payment processed?", a: "Payments are processed securely through Stripe. We accept all major credit/debit cards and regional payment methods." },
  ];

  const [open, setOpen] = useState(null);

  return (
    <section style={{ padding: "48px 24px", maxWidth: 760, margin: "0 auto" }}>
      <AnimSection>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <p style={{
            fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "2px",
            color: "var(--accent-secondary-light)", marginBottom: 8, fontFamily: "var(--font-display)",
          }}>FAQ</p>
          <h2 style={{
            fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 800,
            letterSpacing: "-1px", fontFamily: "var(--font-display)",
          }}>
            Frequently Asked{" "}
            <span style={{ fontFamily: "var(--font-accent)", fontStyle: "italic", color: "var(--highlight)" }}>
              Questions
            </span>
          </h2>
        </div>
      </AnimSection>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {faqs.map((faq, i) => (
          <AnimSection key={i} delay={i < 4 ? `delay-${i + 1}` : ""}>
            <div style={{
              background: "rgba(20,20,20,0.6)",
              borderRadius: 14,
              border: `1px solid ${open === i ? "rgba(3,255,178,0.3)" : "rgba(255,255,255,0.06)"}`,
              overflow: "hidden", transition: "all 0.3s",
            }}>
              <button onClick={() => setOpen(open === i ? null : i)} style={{
                width: "100%", display: "flex", alignItems: "center",
                justifyContent: "space-between", padding: "16px 20px",
                background: "none", border: "none", color: "var(--text-primary)",
                fontSize: 15, fontWeight: 600, cursor: "pointer",
                fontFamily: "var(--font-display)", textAlign: "left",
              }}>
                {faq.q}
                {/* Chevron icon */}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{
                  transition: "transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                  transform: open === i ? "rotate(180deg)" : "none",
                  flexShrink: 0, marginLeft: 16,
                }}>
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
              <div style={{
                maxHeight: open === i ? 200 : 0,
                overflow: "hidden",
                transition: "max-height 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
              }}>
                <p style={{
                  padding: "0 24px 20px", fontSize: 14,
                  color: "var(--text-secondary)", lineHeight: 1.7,
                }}>
                  {faq.a}
                </p>
              </div>
            </div>
          </AnimSection>
        ))}
      </div>
    </section>
  );
}

// ——— FOOTER ———
function Footer() {
  return (
    <footer style={{
      padding: "48px 24px 36px", borderTop: "1px solid rgba(255,255,255,0.06)",
      maxWidth: 1200, margin: "0 auto",
    }}>
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "flex-start",
        flexWrap: "wrap", gap: 24,
      }}>
        {/* Left — logo + support */}
        <div>
          <div style={{ marginBottom: 16 }}>
            <img src="/kalakar-logo-full.svg" alt="Kalakar" style={{ height: 20 }} />
          </div>
          <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 12, maxWidth: 300 }}>
            Still have a query? Drop your questions at our Support Email
          </p>
          <a href="mailto:support@kalakar.io" style={{
            color: "var(--highlight)", textDecoration: "none",
            fontSize: 14, fontWeight: 600, fontFamily: "var(--font-display)",
          }}>
            support@kalakar.io →
          </a>
        </div>

        {/* Right — links */}
        <div style={{ display: "flex", gap: 32, flexWrap: "wrap" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "1px", fontFamily: "var(--font-display)", marginBottom: 4 }}>Legal</span>
            {[
              { label: "Terms & Conditions", href: "https://www.kalakar.io/termsandconditions" },
              { label: "Privacy Policy", href: "https://www.kalakar.io/privacypolicy" },
            ].map(link => (
              <a key={link.label} href={link.href} target="_blank" rel="noopener noreferrer" style={{
                color: "var(--text-secondary)", textDecoration: "none",
                fontSize: 13, transition: "color 0.2s",
              }}
                onMouseEnter={e => e.target.style.color = "var(--text-primary)"}
                onMouseLeave={e => e.target.style.color = "var(--text-secondary)"}>
                {link.label}
              </a>
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "1px", fontFamily: "var(--font-display)", marginBottom: 4 }}>Social</span>
            {[
              { label: "Instagram", href: "https://www.instagram.com/kalakar_app/" },
              { label: "LinkedIn", href: "https://www.linkedin.com/company/kalakarr" },
            ].map(link => (
              <a key={link.label} href={link.href} target="_blank" rel="noopener noreferrer" style={{
                color: "var(--text-secondary)", textDecoration: "none",
                fontSize: 13, transition: "color 0.2s",
              }}
                onMouseEnter={e => e.target.style.color = "var(--text-primary)"}
                onMouseLeave={e => e.target.style.color = "var(--text-secondary)"}>
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </div>

      <div style={{
        textAlign: "center", marginTop: 40, paddingTop: 20,
        borderTop: "1px solid rgba(255,255,255,0.04)",
      }}>
        <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
          © 2025 Kalakar. All rights reserved.
        </span>
      </div>
    </footer>
  );
}

// ——— MAIN APP ———
export default function KalakarLanding() {
  return (
    <>
      <style>{globalStyles}</style>
      <Navbar />
      <GlobeHeroSection />
      <TemplatesSection />
      <AccuracyBanner />
      <ExportSection />
      <AudioSection />
      <PricingSection />
      <TestimonialsSection />
      <WhySection />
      <FAQSection />
      <Footer />
    </>
  );
}
