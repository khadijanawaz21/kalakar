import { useState, useEffect, useRef } from "react";
import { createNoise2D } from "simplex-noise";
import { motion, useScroll, useTransform } from "motion/react";

// ——— CSS Keyframes & Global Styles ———
const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700;800;900&family=Outfit:wght@300;400;700&family=Space+Grotesk:wght@400;500;700&family=Instrument+Serif:ital@0;1&display=swap');

  :root {
    --bg-primary: #0c0c0c;
    --bg-card: #151515;
    --bg-card-hover: #1a1a1a;
    --accent: #48A680;
    --accent-light: #00ffb2;
    --accent-glow: rgba(72, 166, 128, 0.15);
    --text-primary: #f5f5f5;
    --text-secondary: #9c9c9c;
    --text-muted: #666;
    --border: #202026;
    --border-light: #333;
    --green: #48A680;
    --gold: #f59e0b;
    --popular-gradient: linear-gradient(135deg, #48A680, #00ffb2);
  }

  * { margin: 0; padding: 0; box-sizing: border-box; }
  html { scroll-behavior: smooth; }
  body {
    background: var(--bg-primary);
    color: var(--text-primary);
    font-family: 'DM Sans', 'Inter', sans-serif;
    overflow-x: hidden;
  }

  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(40px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes slideInLeft {
    from { opacity: 0; transform: translateX(-60px); }
    to { opacity: 1; transform: translateX(0); }
  }
  @keyframes slideInRight {
    from { opacity: 0; transform: translateX(60px); }
    to { opacity: 1; transform: translateX(0); }
  }
  @keyframes marqueeLeft {
    0% { transform: translateX(0); }
    100% { transform: translateX(-50%); }
  }
  @keyframes marqueeRight {
    0% { transform: translateX(-50%); }
    100% { transform: translateX(0); }
  }
  @keyframes float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
  @keyframes scaleIn {
    from { opacity: 0; transform: scale(0.9); }
    to { opacity: 1; transform: scale(1); }
  }
  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
  @keyframes gradientShift {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }

  .anim-trigger {
    opacity: 0; transform: translateY(30px);
    transition: all 0.7s cubic-bezier(0.22, 1, 0.36, 1);
  }
  .anim-trigger.visible { opacity: 1; transform: translateY(0); }
  .anim-trigger.visible.delay-1 { transition-delay: 0.1s; }
  .anim-trigger.visible.delay-2 { transition-delay: 0.2s; }
  .anim-trigger.visible.delay-3 { transition-delay: 0.3s; }
  .anim-trigger.visible.delay-4 { transition-delay: 0.4s; }

  /* Mobile responsive */
  @media (max-width: 768px) {
    .desktop-nav-links { display: none !important; }
    .mobile-menu-btn { display: flex !important; }
    .export-grid { grid-template-columns: 1fr !important; }
    .pricing-grid { grid-template-columns: 1fr !important; }
    .hero-title { font-size: 36px !important; }
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

  return (
    <nav style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 1000,
      padding: "12px 24px",
      transition: "all 0.4s ease",
    }}>
      <div style={{
        maxWidth: 1200, margin: "0 auto",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        height: 60, padding: "0 28px",
        background: scrolled ? "rgba(12,12,12,0.85)" : "rgba(20,20,20,0.5)",
        backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
        borderRadius: 16,
        border: "1px solid rgba(255,255,255,0.06)",
        transition: "all 0.4s ease",
      }}>
        <a href="#" style={{ display: "flex", alignItems: "center", textDecoration: "none" }}>
          <img src="/logos/kalakar-logo.svg" alt="Kalakar" style={{ height: 24 }} />
        </a>

        {/* Desktop links */}
        <div className="desktop-nav-links" style={{ display: "flex", gap: 36, alignItems: "center" }}>
          {["About", "Testimonials", "Pricing"].map(t => (
            <a key={t} href={`#${t.toLowerCase()}`} style={{
              color: "var(--text-secondary)", textDecoration: "none", fontSize: 14,
              fontWeight: 500, transition: "color 0.2s",
            }}
              onMouseEnter={e => e.target.style.color = "var(--text-primary)"}
              onMouseLeave={e => e.target.style.color = "var(--text-secondary)"}>
              {t}
            </a>
          ))}
          <a href="#pricing" style={{
            background: "#00ffb2", color: "#0c0c0c", padding: "10px 24px",
            borderRadius: 999, textDecoration: "none", fontSize: 14, fontWeight: 600,
            transition: "all 0.3s", border: "none",
            display: "inline-flex", alignItems: "center", gap: 8,
            boxShadow: "0 0 20px rgba(0,255,178,0.25), 0 0 60px rgba(0,255,178,0.1)",
          }}
            onMouseEnter={e => { e.target.style.transform = "translateY(-1px)"; e.target.style.boxShadow = "0 0 30px rgba(0,255,178,0.4), 0 0 80px rgba(0,255,178,0.15)"; }}
            onMouseLeave={e => { e.target.style.transform = "translateY(0)"; e.target.style.boxShadow = "0 0 20px rgba(0,255,178,0.25), 0 0 60px rgba(0,255,178,0.1)"; }}>
            Sign In
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="7" y1="17" x2="17" y2="7" /><polyline points="7 7 17 7 17 17" />
            </svg>
          </a>
        </div>

        {/* Mobile menu button */}
        <button className="mobile-menu-btn" onClick={() => setMobileOpen(!mobileOpen)} style={{
          display: "none", background: "none", border: "none", color: "var(--text-primary)",
          fontSize: 24, cursor: "pointer", flexDirection: "column", gap: 5, padding: 8,
        }}>
          <span style={{ width: 22, height: 2, background: "var(--text-primary)", borderRadius: 2, transition: "all 0.3s", transform: mobileOpen ? "rotate(45deg) translate(5px, 5px)" : "none" }} />
          <span style={{ width: 22, height: 2, background: "var(--text-primary)", borderRadius: 2, transition: "all 0.3s", opacity: mobileOpen ? 0 : 1 }} />
          <span style={{ width: 22, height: 2, background: "var(--text-primary)", borderRadius: 2, transition: "all 0.3s", transform: mobileOpen ? "rotate(-45deg) translate(5px, -5px)" : "none" }} />
        </button>
      </div>

      {/* Mobile menu dropdown */}
      {mobileOpen && (
        <div style={{
          padding: "16px 24px 24px", display: "flex", flexDirection: "column", gap: 16,
          background: "rgba(10,10,10,0.98)", borderTop: "1px solid var(--border)",
          maxWidth: 1200, margin: "8px auto 0", borderRadius: 16,
          border: "1px solid rgba(255,255,255,0.06)",
        }}>
          {["About", "Testimonials", "Pricing"].map(t => (
            <a key={t} href={`#${t.toLowerCase()}`} onClick={() => setMobileOpen(false)} style={{
              color: "var(--text-secondary)", textDecoration: "none", fontSize: 16, fontWeight: 500,
            }}>{t}</a>
          ))}
          <a href="#pricing" onClick={() => setMobileOpen(false)} style={{
            background: "#00ffb2", color: "#0c0c0c", padding: "12px 24px",
            borderRadius: 999, textDecoration: "none", fontSize: 14, fontWeight: 600, textAlign: "center",
          }}>Sign In</a>
        </div>
      )}
    </nav>
  );
}

// ——— HERO ———
function Hero() {
  return (
    <section style={{ paddingTop: 140, paddingBottom: 80, textAlign: "center", position: "relative", overflow: "hidden" }}>
      {/* Background grid pattern */}
      <div style={{
        position: "absolute", bottom: 0, left: "50%", transform: "translateX(-50%)",
        width: "100%", maxWidth: 1000, height: "60%",
        backgroundImage: `
          linear-gradient(rgba(72,166,128,0.06) 1px, transparent 1px),
          linear-gradient(90deg, rgba(72,166,128,0.06) 1px, transparent 1px)
        `,
        backgroundSize: "60px 60px",
        maskImage: "linear-gradient(transparent 0%, rgba(0,0,0,0.3) 40%, rgba(0,0,0,0.5) 70%, transparent 100%)",
        WebkitMaskImage: "linear-gradient(transparent 0%, rgba(0,0,0,0.3) 40%, rgba(0,0,0,0.5) 70%, transparent 100%)",
        pointerEvents: "none",
        perspective: "500px",
        transform: "translateX(-50%) rotateX(45deg)",
        transformOrigin: "center bottom",
      }} />
      {/* Green radial glow */}
      <div style={{
        position: "absolute", top: "20%", left: "50%", transform: "translateX(-50%)",
        width: 900, height: 600, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(72,166,128,0.06) 0%, rgba(0,255,178,0.02) 40%, transparent 70%)",
        pointerEvents: "none",
      }} />

      <div style={{ position: "relative", maxWidth: 900, margin: "0 auto", padding: "0 24px" }}>
        <h1 className="hero-title" style={{
          fontSize: "clamp(40px, 5.5vw, 72px)", fontWeight: 700, lineHeight: 1.15,
          letterSpacing: "-2px", marginBottom: 28,
          animation: "fadeInUp 0.8s 0.1s ease both",
          fontFamily: "'DM Sans', sans-serif",
        }}>
          <span style={{ color: "#65d7a9" }}>Captioning</span> Software,
          <br />Made by Desi Creators,
          <br />For Desi Creators
        </h1>
        <p style={{
          fontSize: 17, color: "var(--text-secondary)", maxWidth: 560,
          margin: "0 auto 36px", lineHeight: 1.7,
          animation: "fadeInUp 0.8s 0.25s ease both",
        }}>
          Auto-generate accurate captions in all major <strong style={{ color: "var(--text-primary)", fontWeight: 600 }}>desi languages</strong> in seconds
        </p>
        <div style={{ animation: "fadeInUp 0.8s 0.4s ease both", display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
          <a href="#pricing" style={{
            background: "#00ffb2", color: "#0c0c0c", padding: "16px 36px",
            borderRadius: 999, textDecoration: "none", fontSize: 16, fontWeight: 700,
            transition: "all 0.3s",
            boxShadow: "0 0 30px rgba(0,255,178,0.3), 0 0 80px rgba(0,255,178,0.1)",
            display: "inline-flex", alignItems: "center", gap: 10,
          }}
            onMouseEnter={e => { e.target.style.transform = "translateY(-2px)"; e.target.style.boxShadow = "0 0 40px rgba(0,255,178,0.45), 0 0 100px rgba(0,255,178,0.15)"; }}
            onMouseLeave={e => { e.target.style.transform = "none"; e.target.style.boxShadow = "0 0 30px rgba(0,255,178,0.3), 0 0 80px rgba(0,255,178,0.1)"; }}>
            Get started now
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="7" y1="17" x2="17" y2="7" /><polyline points="7 7 17 7 17 17" />
            </svg>
          </a>
        </div>
        {/* Trust indicators — BELOW CTA */}
        <div style={{ animation: "fadeIn 1s 0.65s ease both", marginTop: 36 }}>
          <p style={{ fontSize: 14, color: "var(--text-secondary)", fontWeight: 500, marginBottom: 10 }}>
            Trusted by over 30,000 Users
          </p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <div style={{ display: "flex", gap: 2 }}>
              {[...Array(5)].map((_, i) => (
                <svg key={i} width="16" height="16" viewBox="0 0 24 24" fill="#f5f5f5" stroke="none">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              ))}
            </div>
            <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>4.9</span>
            <span style={{ fontSize: 16, fontWeight: 700, color: "var(--text-secondary)", marginLeft: 2 }}>G</span>
          </div>
        </div>
      </div>
    </section>
  );
}

// ——— LANGUAGE SELECTOR WITH VIDEOS ———
function LanguageSection() {
  const languages = [
    { name: "Hindi", roman: "https://kalakar-cdn.b-cdn.net/Captioned%20Languages/Roman/Hindi.mp4", native: "https://kalakar-cdn.b-cdn.net/Captioned%20Languages/Native/Hindi.mp4" },
    { name: "English", roman: "https://kalakar-cdn.b-cdn.net/Captioned%20Languages/One%20Standard/English.mp4", native: "https://kalakar-cdn.b-cdn.net/Captioned%20Languages/One%20Standard/English.mp4" },
    { name: "Nepali", roman: "https://kalakar-cdn.b-cdn.net/Captioned%20Languages/Roman/Nepali.mp4", native: "https://kalakar-cdn.b-cdn.net/Captioned%20Languages/Native/Nepali.mp4" },
    { name: "Urdu", roman: "https://kalakar-cdn.b-cdn.net/Captioned%20Languages/Roman/Urdu.mp4", native: "https://kalakar-cdn.b-cdn.net/Captioned%20Languages/Native/Urdu.mp4" },
    { name: "Tamil", roman: "https://kalakar-cdn.b-cdn.net/Captioned%20Languages/Roman/Tamil.mp4", native: "https://kalakar-cdn.b-cdn.net/Captioned%20Languages/Native/Tamil.mp4" },
    { name: "Malayalam", roman: "https://kalakar-cdn.b-cdn.net/Captioned%20Languages/Roman/Malayalam.mp4", native: "https://kalakar-cdn.b-cdn.net/Captioned%20Languages/Native/Malayalam.mp4" },
    { name: "Gujarati", roman: "https://kalakar-cdn.b-cdn.net/Captioned%20Languages/Roman/Gujarati.mp4", native: "https://kalakar-cdn.b-cdn.net/Captioned%20Languages/Native/Gujarati.mp4" },
    { name: "Bengali", roman: "https://kalakar-cdn.b-cdn.net/Captioned%20Languages/Roman/Bengali.mp4", native: "https://kalakar-cdn.b-cdn.net/Captioned%20Languages/Native/Bengali.mp4" },
    { name: "Punjabi", roman: "https://kalakar-cdn.b-cdn.net/Captioned%20Languages/Roman/Punjabi.mp4", native: "https://kalakar-cdn.b-cdn.net/Captioned%20Languages/Native/Punjabi.mp4" },
    { name: "Telugu", roman: "https://kalakar-cdn.b-cdn.net/Captioned%20Languages/Roman/Telugu.mp4", native: "https://kalakar-cdn.b-cdn.net/Captioned%20Languages/Native/Telugu.mp4" },
    { name: "Sindhi", roman: "https://kalakar-cdn.b-cdn.net/Captioned%20Languages/Roman/Sindhi.mp4", native: "https://kalakar-cdn.b-cdn.net/Captioned%20Languages/Native/Sindhi.mp4" },
    { name: "Marathi", roman: "https://kalakar-cdn.b-cdn.net/Captioned%20Languages/Roman/Marathi.mp4", native: "https://kalakar-cdn.b-cdn.net/Captioned%20Languages/Native/Marathi.mp4" },
    { name: "Kannada", roman: "https://kalakar-cdn.b-cdn.net/Captioned%20Languages/Roman/Kannada.mp4", native: "https://kalakar-cdn.b-cdn.net/Captioned%20Languages/Native/Kannada.mp4" },
    { name: "Pushto", roman: "https://kalakar-cdn.b-cdn.net/Captioned%20Languages/Roman/Pushto.mp4", native: "https://kalakar-cdn.b-cdn.net/Captioned%20Languages/Native/Pushto.mp4" },
    { name: "Malay", roman: "https://kalakar-cdn.b-cdn.net/Captioned%20Languages/Roman/Malay.mp4", native: "https://kalakar-cdn.b-cdn.net/Captioned%20Languages/Native/Malay.mp4" },
  ];

  // Layout: rows of 4, 4, 4, 3
  const rows = [
    languages.slice(0, 4),
    languages.slice(4, 8),
    languages.slice(8, 12),
    languages.slice(12, 15),
  ];

  const [selectedIdx, setSelectedIdx] = useState(1); // default English
  const [videoOpacity, setVideoOpacity] = useState(1);
  const [currentSrc, setCurrentSrc] = useState(languages[1].roman);
  const videoRef = useRef(null);
  const targetSrc = languages[selectedIdx].roman;

  // Crossfade on language change
  useEffect(() => {
    if (targetSrc === currentSrc) return;
    setVideoOpacity(0);
    const t = setTimeout(() => setCurrentSrc(targetSrc), 280);
    return () => clearTimeout(t);
  }, [targetSrc]);

  useEffect(() => {
    if (!videoRef.current) return;
    videoRef.current.load();
    videoRef.current.play().catch(() => {});
    const t = setTimeout(() => setVideoOpacity(1), 100);
    return () => clearTimeout(t);
  }, [currentSrc]);

  return (
    <section style={{ padding: "0 24px 80px", maxWidth: 1100, margin: "0 auto" }}>
      <AnimSection>
        {/* Outer card container */}
        <div style={{
          background: "rgba(21,21,21,0.7)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 24, padding: "48px 0",
          overflow: "hidden",
        }}>
          <div className="lang-section-inner" style={{
            display: "grid", gridTemplateColumns: "1fr 1fr",
            gap: 0, alignItems: "center",
          }}>
            {/* LEFT — Language Picker */}
            <div style={{ padding: "0 48px" }}>
              <h2 style={{
                fontSize: 28, fontWeight: 700, letterSpacing: "-0.5px",
                marginBottom: 36, textAlign: "center",
                fontFamily: "'DM Sans', sans-serif",
              }}>
                Select your Language
              </h2>

              {/* Language pills in rows */}
              <div style={{ display: "flex", flexDirection: "column", gap: 14, alignItems: "center" }}>
                {rows.map((row, ri) => (
                  <div key={ri} style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                    {row.map((lang) => {
                      const idx = languages.indexOf(lang);
                      const isSelected = selectedIdx === idx;
                      return (
                        <button
                          key={lang.name}
                          onClick={() => setSelectedIdx(idx)}
                          className="lang-pill"
                          style={{
                            background: isSelected
                              ? "linear-gradient(135deg, #2d7a5a, #48A680)"
                              : "rgba(30,30,30,0.8)",
                            color: isSelected ? "#fff" : "#c0c0c0",
                            border: isSelected
                              ? "1px solid rgba(72,166,128,0.5)"
                              : "1px solid rgba(255,255,255,0.08)",
                            borderRadius: 999,
                            padding: isSelected ? "10px 22px" : "10px 22px",
                            fontSize: 14, fontWeight: 500,
                            cursor: "pointer",
                            transition: "all 0.3s cubic-bezier(0.22, 1, 0.36, 1)",
                            fontFamily: "'DM Sans', sans-serif",
                            display: "inline-flex", alignItems: "center", gap: 7,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {isSelected && (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          )}
                          <span>{lang.name}</span>
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT — Video Preview */}
            <div style={{ padding: "0 40px 0 0" }}>
              <div style={{
                width: "100%", maxWidth: 420,
                aspectRatio: "16/14",
                position: "relative",
                background: "#000", borderRadius: 16,
                border: "1px solid rgba(255,255,255,0.06)",
                overflow: "hidden",
                boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
              }}>
                {/* Video */}
                <video
                  ref={videoRef}
                  autoPlay muted loop playsInline preload="auto"
                  style={{
                    width: "100%", height: "100%", objectFit: "cover",
                    opacity: videoOpacity,
                    transition: "opacity 0.35s cubic-bezier(0.22, 1, 0.36, 1)",
                    display: "block",
                  }}
                >
                  <source src={currentSrc} type="video/mp4" />
                </video>

                {/* Muted speaker icon — top right */}
                <div style={{
                  position: "absolute", top: 14, right: 14,
                  color: "#48A680", opacity: 0.8,
                }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                    <path d="M11 5L6 9H2v6h4l5 4V5z" />
                    <line x1="23" y1="9" x2="17" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <line x1="17" y1="9" x2="23" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AnimSection>

      <style>{`
        .lang-pill {
          transform: rotate(0deg);
        }
        .lang-pill:hover {
          transform: rotate(-12deg) !important;
          border-color: rgba(72,166,128,0.4) !important;
          background: rgba(40,40,40,0.9) !important;
        }
        .lang-pill:active {
          transform: rotate(0deg) scale(0.96) !important;
        }
        @media (max-width: 768px) {
          .lang-section-inner {
            grid-template-columns: 1fr !important;
            gap: 32px !important;
          }
          .lang-section-inner > div:first-child {
            padding: 0 24px !important;
          }
          .lang-section-inner > div:last-child {
            padding: 0 24px !important;
          }
        }
      `}</style>
    </section>
  );
}

// ——— TEMPLATES CAROUSEL ———
function TemplatesSection() {
  const templates = [
    { name: "Ali Abdaal", tag: "Fully customizable", video: "https://kalakar-cdn.b-cdn.net/Creator%20Templates%20%20Styles/Ali%20Abdaal%20(Fully%20customizable).mp4" },
    { name: "Alex Hormozi", tag: "Partially customizable", video: "https://kalakar-cdn.b-cdn.net/Creator%20Templates%20%20Styles/Alex%20Hormozi%20(Partially%20customizable).mp4" },
    { name: "Iman Gadzhi", tag: "Fully customizable", video: "https://kalakar-cdn.b-cdn.net/Creator%20Templates%20%20Styles/Iman%20Gadzhi%20(Fully%20customizable).mp4" },
    { name: "Mr Beast", tag: "Fully customizable", video: "https://kalakar-cdn.b-cdn.net/Creator%20Templates%20%20Styles/Mr%20Beast%20(Fully%20customizable).mp4" },
    { name: "Editing Skool", tag: "Fully customizable", video: "https://kalakar-cdn.b-cdn.net/Creator%20Templates%20%20Styles/Editing%20Skool(Fully%20customizable).mp4" },
    { name: "Devin Jatho", tag: "Fully customizable", video: "https://kalakar-cdn.b-cdn.net/Creator%20Templates%20%20Styles/Devin%20Jatho%20(Fully%20customizable).mp4" },
    { name: "Bubble Style", tag: "Fully customizable", video: "https://kalakar-cdn.b-cdn.net/Creator%20Templates%20%20Styles/Bubble%20Style%20(Fully%20customizable).mp4" },
  ];

  const [active, setActive] = useState(0);
  const [spread, setSpread] = useState(false);
  const [paused, setPaused] = useState(false);
  const videoRefs = useRef({});
  const touchStart = useRef(null);
  const sectionRef = useRef(null);
  const count = templates.length;

  const goPrev = () => setActive((active - 1 + count) % count);
  const goNext = () => setActive((active + 1) % count);
  const goTo = (idx) => { if (idx !== active) setActive(idx); };

  // Spread cards when section scrolls into view
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setSpread(true); obs.disconnect(); }
    }, { threshold: 0.25 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Play active video, pause others
  useEffect(() => {
    Object.entries(videoRefs.current).forEach(([key, vid]) => {
      if (!vid) return;
      if (parseInt(key) === active) {
        vid.currentTime = 0;
        vid.play().catch(() => {});
      } else {
        vid.pause();
      }
    });
  }, [active]);

  // Auto-advance
  useEffect(() => {
    if (paused || !spread) return;
    const timer = setInterval(() => setActive(a => (a + 1) % count), 5000);
    return () => clearInterval(timer);
  }, [paused, count, spread]);

  const userInteract = () => {
    setPaused(true);
    const t = setTimeout(() => setPaused(false), 12000);
    return () => clearTimeout(t);
  };

  // Keyboard
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "ArrowLeft") { goPrev(); userInteract(); }
      if (e.key === "ArrowRight") { goNext(); userInteract(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [active]);

  // Touch
  const onTouchStart = (e) => { touchStart.current = e.touches[0].clientX; };
  const onTouchEnd = (e) => {
    if (touchStart.current === null) return;
    const diff = e.changedTouches[0].clientX - touchStart.current;
    if (Math.abs(diff) > 50) { diff > 0 ? goPrev() : goNext(); userInteract(); }
    touchStart.current = null;
  };

  // Card positioning — fanned out layout
  const getCardStyle = (idx) => {
    let diff = idx - active;
    if (diff > count / 2) diff -= count;
    if (diff < -count / 2) diff += count;

    const absDiff = Math.abs(diff);
    if (absDiff > 3) return { opacity: 0, transform: "scale(0.4)", zIndex: 0, pointerEvents: "none", visibility: "hidden" };

    // Before spread — all stacked in center
    if (!spread) {
      return {
        opacity: absDiff <= 2 ? 0.6 - absDiff * 0.15 : 0,
        transform: `scale(${0.85 - absDiff * 0.06}) translateX(${diff * 12}px)`,
        zIndex: 10 - absDiff,
        filter: absDiff > 0 ? "brightness(0.4)" : "none",
      };
    }

    // Spread layout
    if (absDiff === 0) {
      return {
        opacity: 1,
        transform: "scale(1) translateX(0px)",
        zIndex: 10,
        filter: "none",
        width: 300,
        height: 500,
      };
    }
    if (absDiff === 1) {
      return {
        opacity: 0.85,
        transform: `scale(0.85) translateX(${diff * 300}px)`,
        zIndex: 7,
        filter: "brightness(0.55)",
        width: 300,
        height: 500,
      };
    }
    if (absDiff === 2) {
      return {
        opacity: 0.5,
        transform: `scale(0.6) translateX(${diff * 340}px)`,
        zIndex: 4,
        filter: "brightness(0.35)",
        width: 300,
        height: 500,
      };
    }
    return {
      opacity: 0.25,
      transform: `scale(0.45) translateX(${diff * 320}px)`,
      zIndex: 2,
      filter: "brightness(0.2)",
      width: 300,
      height: 500,
    };
  };

  const progressWidth = (active / (count - 1)) * 100;

  return (
    <section ref={sectionRef} style={{ padding: "80px 0 60px", overflow: "hidden", position: "relative" }}>
      <AnimSection>
        <div style={{ textAlign: "center", marginBottom: 48, padding: "0 24px" }}>
          <h2 style={{
            fontSize: "clamp(32px, 5vw, 56px)", fontWeight: 800,
            letterSpacing: "-2px", lineHeight: 1.1,
            fontFamily: "'DM Sans', sans-serif",
          }}>
            All your Favourite{" "}
            <span style={{ color: "#48A680" }}>Templates</span>
          </h2>
          <p style={{ color: "var(--text-secondary)", marginTop: 16, fontSize: 16 }}>
            Dozens of fully <strong style={{ color: "var(--text-primary)" }}>customizable templates</strong> in all desi language
          </p>
        </div>
      </AnimSection>

      {/* Carousel */}
      <div
        onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}
        style={{
          position: "relative", height: 560, display: "flex",
          alignItems: "center", justifyContent: "center",
        }}
      >
        {templates.map((t, idx) => {
          const s = getCardStyle(idx);
          return (
            <div
              key={t.name}
              onClick={() => { goTo(idx); userInteract(); }}
              style={{
                position: "absolute",
                width: s.width || 300, height: s.height || 500,
                borderRadius: 24,
                overflow: "hidden",
                cursor: "pointer",
                transition: "all 0.7s cubic-bezier(0.22, 1, 0.36, 1)",
                opacity: s.opacity,
                transform: s.transform,
                zIndex: s.zIndex,
                filter: s.filter || "none",
                visibility: s.visibility || "visible",
                pointerEvents: s.pointerEvents || "auto",
                border: idx === active
                  ? "2px solid rgba(255,255,255,0.1)"
                  : "2px solid rgba(255,255,255,0.04)",
                boxShadow: idx === active
                  ? "0 30px 80px rgba(0,0,0,0.5)"
                  : "0 10px 30px rgba(0,0,0,0.3)",
              }}
            >
              <video
                ref={el => { videoRefs.current[idx] = el; }}
                muted loop playsInline
                preload={Math.abs(idx - active) <= 1 ? "auto" : "none"}
                style={{
                  width: "100%", height: "100%", objectFit: "cover",
                  display: "block",
                }}
              >
                <source src={t.video} type="video/mp4" />
              </video>
            </div>
          );
        })}
      </div>

      {/* Bottom nav */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        marginTop: 20,
      }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 0,
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 16, padding: 6,
          backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
        }}>
          <button
            onClick={() => { goPrev(); userInteract(); }}
            style={{
              width: 40, height: 40, borderRadius: 12,
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "#aaa", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.2s", fontFamily: "inherit", flexShrink: 0,
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.12)"; e.currentTarget.style.color = "#fff"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "#aaa"; }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>

          <div style={{
            display: "flex", alignItems: "center", gap: 12,
            padding: "4px 20px", minWidth: 220, justifyContent: "center",
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10, flexShrink: 0,
              background: "linear-gradient(135deg, #48A680, #22c55e)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: 800, fontSize: 15, color: "#fff",
              overflow: "hidden",
            }}>
              {templates[active].name[0]}
            </div>
            <div style={{ textAlign: "left" }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: "#fff", whiteSpace: "nowrap" }}>
                {templates[active].name}
              </div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                {templates[active].tag}
              </div>
            </div>
          </div>

          <button
            onClick={() => { goNext(); userInteract(); }}
            style={{
              width: 40, height: 40, borderRadius: 12,
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "#aaa", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.2s", fontFamily: "inherit", flexShrink: 0,
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.12)"; e.currentTarget.style.color = "#fff"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "#aaa"; }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{
        width: 120, height: 3, background: "rgba(255,255,255,0.08)",
        borderRadius: 2, margin: "16px auto 0", overflow: "hidden",
      }}>
        <div style={{
          width: `${progressWidth}%`, height: "100%",
          background: "#48A680", borderRadius: 2,
          transition: "width 0.4s ease",
        }} />
      </div>
    </section>
  );
}

// ——— INTERACTIVE WAVE GRID ———
function WaveGrid({ style = {} }) {
  const containerRef = useRef(null);
  const svgRef = useRef(null);
  const mouseRef = useRef({ x: -500, y: 0, lx: 0, ly: 0, sx: -500, sy: 0, v: 0, vs: 0, a: 0, set: false });
  const pathsRef = useRef([]);
  const linesRef = useRef([]);
  const noiseRef = useRef(null);
  const rafRef = useRef(null);
  const boundingRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || !svgRef.current) return;
    noiseRef.current = createNoise2D();
    const setSize = () => {
      boundingRef.current = containerRef.current.getBoundingClientRect();
      const { width, height } = boundingRef.current;
      svgRef.current.setAttribute("width", width);
      svgRef.current.setAttribute("height", height);
      svgRef.current.setAttribute("viewBox", `0 0 ${width} ${height}`);
    };
    const setLines = () => {
      if (!boundingRef.current) return;
      const { width, height } = boundingRef.current;
      linesRef.current = [];
      pathsRef.current.forEach(p => p.remove());
      pathsRef.current = [];
      const xGap = 32, yGap = 32;
      const oW = width + 100, oH = height + 30;
      const totalLines = Math.ceil(oW / xGap);
      const totalPoints = Math.ceil(oH / yGap);
      const xStart = (width - xGap * totalLines) / 2;
      const yStart = (height - yGap * totalPoints) / 2;
      for (let i = 0; i <= totalLines; i++) {
        const pts = [];
        for (let j = 0; j <= totalPoints; j++) {
          pts.push({ x: xStart + xGap * i, y: yStart + yGap * j, wave: { x: 0, y: 0 }, cursor: { x: 0, y: 0, vx: 0, vy: 0 } });
        }
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("fill", "none");
        path.setAttribute("stroke", "rgba(255,255,255,0.045)");
        path.setAttribute("stroke-width", "1");
        svgRef.current.appendChild(path);
        pathsRef.current.push(path);
        linesRef.current.push(pts);
      }
    };
    setSize(); setLines();
    const onResize = () => { setSize(); setLines(); };
    const onMouseMove = (e) => {
      if (!boundingRef.current) return;
      const m = mouseRef.current;
      m.x = e.clientX - boundingRef.current.left;
      m.y = e.clientY - boundingRef.current.top + window.scrollY;
      if (!m.set) { m.sx = m.x; m.sy = m.y; m.lx = m.x; m.ly = m.y; m.set = true; }
    };
    const onTouchMove = (e) => {
      e.preventDefault();
      const t = e.touches[0];
      if (!boundingRef.current) return;
      const m = mouseRef.current;
      m.x = t.clientX - boundingRef.current.left;
      m.y = t.clientY - boundingRef.current.top + window.scrollY;
      if (!m.set) { m.sx = m.x; m.sy = m.y; m.lx = m.x; m.ly = m.y; m.set = true; }
    };
    const tick = (time) => {
      const m = mouseRef.current;
      const noise = noiseRef.current;
      m.sx += (m.x - m.sx) * 0.1;
      m.sy += (m.y - m.sy) * 0.1;
      const dx = m.x - m.lx, dy = m.y - m.ly;
      m.v = Math.hypot(dx, dy);
      m.vs += (m.v - m.vs) * 0.1;
      m.vs = Math.min(100, m.vs);
      m.lx = m.x; m.ly = m.y;
      m.a = Math.atan2(dy, dx);
      // Move points
      linesRef.current.forEach(pts => {
        pts.forEach(p => {
          const mv = noise((p.x + time * 0.006) * 0.003, (p.y + time * 0.002) * 0.002) * 6;
          p.wave.x = Math.cos(mv) * 8;
          p.wave.y = Math.sin(mv) * 4;
          const pdx = p.x - m.sx, pdy = p.y - m.sy;
          const d = Math.hypot(pdx, pdy);
          const l = Math.max(150, m.vs);
          if (d < l) {
            const s = 1 - d / l;
            const f = Math.cos(d * 0.001) * s;
            p.cursor.vx += Math.cos(m.a) * f * l * m.vs * 0.0003;
            p.cursor.vy += Math.sin(m.a) * f * l * m.vs * 0.0003;
          }
          p.cursor.vx += (0 - p.cursor.x) * 0.012;
          p.cursor.vy += (0 - p.cursor.y) * 0.012;
          p.cursor.vx *= 0.94; p.cursor.vy *= 0.94;
          p.cursor.x += p.cursor.vx; p.cursor.y += p.cursor.vy;
          p.cursor.x = Math.min(40, Math.max(-40, p.cursor.x));
          p.cursor.y = Math.min(40, Math.max(-40, p.cursor.y));
        });
      });
      // Draw
      linesRef.current.forEach((pts, li) => {
        if (pts.length < 2 || !pathsRef.current[li]) return;
        const first = pts[0];
        let d = `M ${first.x + first.wave.x} ${first.y + first.wave.y}`;
        for (let i = 1; i < pts.length; i++) {
          const pt = pts[i];
          d += ` L ${pt.x + pt.wave.x + pt.cursor.x} ${pt.y + pt.wave.y + pt.cursor.y}`;
        }
        pathsRef.current[li].setAttribute("d", d);
      });
      rafRef.current = requestAnimationFrame(tick);
    };
    window.addEventListener("resize", onResize);
    window.addEventListener("mousemove", onMouseMove);
    containerRef.current.addEventListener("touchmove", onTouchMove, { passive: false });
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("mousemove", onMouseMove);
    };
  }, []);

  return (
    <div ref={containerRef} style={{ position: "absolute", inset: 0, overflow: "hidden", ...style }}>
      <svg ref={svgRef} style={{ display: "block", width: "100%", height: "100%" }} />
    </div>
  );
}

// ——— ACCURACY BANNER ———
function AccuracyBanner() {
  return (
    <section style={{
      padding: "140px 24px", position: "relative", overflow: "hidden",
    }}>
      <WaveGrid />
      <AnimSection>
        <h2 style={{
          fontSize: "clamp(36px, 5.5vw, 64px)", fontWeight: 700,
          letterSpacing: "-2px", lineHeight: 1.3,
          textAlign: "center", maxWidth: 800, margin: "0 auto",
          fontFamily: "'DM Sans', sans-serif",
          position: "relative", zIndex: 1,
        }}>
          "Up to <span style={{ color: "#65d7a9" }}>96%</span> Accuracy
          <br />in major Desi languages"
        </h2>
      </AnimSection>
    </section>
  );
}

// ——— NLE LOGO ICONS ———
function NLELogos({ size = 56 }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
      <div style={{ width: size, height: size, borderRadius: "50%", background: "rgba(40,30,70,0.8)", border: "1.5px solid rgba(150,130,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0, position: "relative", zIndex: 3 }}>
        <img src="/logos/Adobe_Premiere_Pro_CC_icon.svg.png" alt="Pr" style={{ width: size * 0.6, height: size * 0.6, objectFit: "contain" }} />
      </div>
      <div style={{ width: size, height: size, borderRadius: "50%", background: "rgba(30,30,40,0.8)", border: "1.5px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0, marginLeft: -size * 0.25, position: "relative", zIndex: 2 }}>
        <img src="/logos/9qK6wSBUEojw2OBstd2eQfPpu0.png" alt="FCP" style={{ width: size * 0.65, height: size * 0.65, objectFit: "contain" }} />
      </div>
      <div style={{ width: size, height: size, borderRadius: "50%", background: "rgba(30,30,35,0.8)", border: "1.5px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0, marginLeft: -size * 0.25, position: "relative", zIndex: 1 }}>
        <img src="/logos/Qs0vy9oifVGgwjpz6qYGBfrWU.png" alt="DR" style={{ width: size * 0.65, height: size * 0.65, objectFit: "contain" }} />
      </div>
    </div>
  );
}

// ——— FILE ICON ———
function FileDocIcon({ size = 40, active = false }) {
  const color = active ? "#48A680" : "#444";
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ transition: "all 0.6s ease", flexShrink: 0 }}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}

// ——— WORKFLOW SECTION (scroll-synced) ———
function ExportSection() {
  /*
    Scroll-driven steps (matching Framer variants 1→4→9→5→6→7→8):
    0 = Export video from software
    1 = Generating subtitles in Kalakar (file + spinner in center)
    2 = Render in SRT / Alpha Channel (badges in center)
    3 = Export (badges slide below center)
    4 = Export (badges slide to right panel area)
    5 = Import SRT/Alpha back in NLE (badges inside right panel)
  */
  const stepLabels = [
    "Export video from software",
    "Generating subtitles in Kalakar",
    "Render in SRT / Alpha Channel",
    "Export",
    "Export",
    "Import SRT/Alpha back in NLE",
  ];
  const totalSteps = stepLabels.length;

  const [scrollProgress, setScrollProgress] = useState(0);
  const sectionRef = useRef(null);
  const stickyRef = useRef(null);

  // Scroll-linked progress: section is tall, content is sticky
  useEffect(() => {
    const onScroll = () => {
      if (!sectionRef.current) return;
      const rect = sectionRef.current.getBoundingClientRect();
      const sectionHeight = sectionRef.current.offsetHeight;
      const viewH = window.innerHeight;
      // progress 0→1 as we scroll through the tall section
      const rawProgress = (-rect.top) / (sectionHeight - viewH);
      setScrollProgress(Math.max(0, Math.min(1, rawProgress)));
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Map scroll progress to step (0 to totalSteps-1)
  const step = Math.min(totalSteps - 1, Math.floor(scrollProgress * totalSteps));
  // Sub-progress within current step (0→1)


  // Panel states
  const centerActive = step >= 1 && step <= 2;
  const rightActive = step >= 5;

  // Format badge positions interpolated for smooth motion
  // step 2: center, step 3: below center, step 4: moving right, step 5: in right panel
  const FormatBadge = ({ label }) => (
    <div style={{
      padding: "7px 18px", borderRadius: 8,
      background: "rgba(72,166,128,0.06)", border: "1px solid rgba(72,166,128,0.2)",
      fontSize: 14, fontWeight: 500, color: "#65d7a9",
      whiteSpace: "nowrap",
    }}>{label}</div>
  );


  return (
    <section ref={sectionRef} style={{
      // Tall section to create scroll room — 5x viewport
      height: `${totalSteps * 100}vh`,
      position: "relative",
    }}>
      {/* Sticky container — stays in view while scrolling */}
      <div ref={stickyRef} style={{
        position: "sticky", top: 0,
        height: "100vh",
        display: "flex", flexDirection: "column",
        justifyContent: "center",
        padding: "0 24px",
      }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", width: "100%" }}>
          {/* Top: Heading + CTA */}
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <h2 style={{
              fontSize: "clamp(32px, 5vw, 56px)", fontWeight: 700,
              letterSpacing: "-2px", lineHeight: 1.15, marginBottom: 16,
              fontFamily: "'DM Sans', sans-serif",
            }}>
              Export in <span style={{ color: "#65d7a9" }}>SRT or Alpha Channel</span>
            </h2>
            <p style={{
              color: "var(--text-secondary)", fontSize: 16, maxWidth: 600,
              margin: "0 auto 32px", lineHeight: 1.7,
            }}>
              For all the Pro-Editors, <strong style={{ color: "var(--text-primary)" }}>cross NLE support available</strong> to bring captions back locally in your own
              software of choice, both as Alpha channel or as an SRT File
            </p>
            <a href="#pricing" style={{
              display: "inline-flex", alignItems: "center", gap: 10,
              background: "#00ffb2", color: "#0c0c0c", padding: "16px 36px",
              borderRadius: 999, textDecoration: "none", fontSize: 16, fontWeight: 700,
              boxShadow: "0 0 30px rgba(0,255,178,0.3), 0 0 80px rgba(0,255,178,0.1)",
              transition: "all 0.3s",
            }}
              onMouseEnter={e => { e.target.style.transform = "translateY(-2px)"; e.target.style.boxShadow = "0 0 40px rgba(0,255,178,0.45), 0 0 100px rgba(0,255,178,0.15)"; }}
              onMouseLeave={e => { e.target.style.transform = "none"; e.target.style.boxShadow = "0 0 30px rgba(0,255,178,0.3), 0 0 80px rgba(0,255,178,0.1)"; }}
            >
              Join now
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="7" y1="17" x2="17" y2="7" /><polyline points="7 7 17 7 17 17" />
              </svg>
            </a>
          </div>

          {/* Three-panel workflow */}
          <div style={{ position: "relative", maxWidth: 960, margin: "0 auto" }}>
            <div className="workflow-panels" style={{
              display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
              gap: 16, alignItems: "stretch",
            }}>
              {/* LEFT — NLE + colon + file */}
              <div style={{
                background: "rgba(18,18,20,0.7)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 18, padding: "24px 20px",
                display: "flex", alignItems: "center", gap: 14,
                transition: "all 0.5s ease",
              }}>
                <NLELogos size={48} />
                <span style={{ fontSize: 22, color: "#333", fontWeight: 300, flexShrink: 0 }}>:</span>
                <FileDocIcon size={24} active={step === 0} />
              </div>

              {/* CENTER — Kalakar */}
              <div style={{
                background: centerActive
                  ? "linear-gradient(180deg, rgba(72,166,128,0.05), rgba(72,166,128,0.01))"
                  : "rgba(18,18,20,0.7)",
                border: centerActive
                  ? "1px solid rgba(72,166,128,0.2)"
                  : "1px solid rgba(255,255,255,0.06)",
                borderRadius: 18, padding: "24px 20px",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 14,
                transition: "all 0.5s cubic-bezier(0.22, 1, 0.36, 1)",
                position: "relative", minHeight: 100,
              }}>
                {/* Kalakar logo badge */}
                <div style={{
                  position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)",
                  background: "#131315", border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 8, padding: "3px 12px",
                  display: "flex", alignItems: "center",
                }}>
                  <img src="/logos/kalakar-logo.svg" alt="Kalakar" style={{ height: 14 }} />
                </div>

                {/* File icon + spinner at step 1 */}
                {step === 0 && <FileDocIcon size={24} active={false} />}
                {step === 1 && (
                  <>
                    <FileDocIcon size={24} active={true} />
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" style={{ animation: "spin 1s linear infinite" }}>
                      <path d="M12 2a10 10 0 0 1 10 10" stroke="#48A680" strokeWidth="2.5" strokeLinecap="round" />
                    </svg>
                  </>
                )}

                {/* Formats inside center at step 2 */}
                {step === 2 && (
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <FileDocIcon size={24} active={true} />
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <FormatBadge label="SRT File" />
                      <FormatBadge label="Alpha Channel" />
                    </div>
                  </div>
                )}

                {/* Just file icon when formats have moved out */}
                {step >= 3 && <FileDocIcon size={24} active={false} />}
              </div>

              {/* RIGHT — NLE */}
              <div style={{
                background: "rgba(18,18,20,0.7)",
                border: `1px solid ${rightActive ? "rgba(72,166,128,0.15)" : "rgba(255,255,255,0.06)"}`,
                borderRadius: 18, padding: "24px 20px",
                display: "flex", alignItems: "center", justifyContent: "center",
                gap: 14, transition: "all 0.5s ease",
                position: "relative",
              }}>
                <NLELogos size={48} />
                {/* Badges inside right panel at final step */}
                {step >= 5 && (
                  <div style={{
                    display: "flex", flexDirection: "column", gap: 5,
                    transition: "all 0.5s ease",
                  }}>
                    <FormatBadge label="SRT File" />
                    <FormatBadge label="Alpha Channel" />
                  </div>
                )}
              </div>
            </div>

            {/* Dotted connection lines */}
            <svg style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none", overflow: "visible" }}>
              <line x1="34%" y1="50%" x2="38%" y2="50%" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" strokeDasharray="4 4" />
              <line x1="62%" y1="50%" x2="66%" y2="50%" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" strokeDasharray="4 4" />
            </svg>

            {/* Floating format badges for steps 3-4 */}
            {(step === 3 || step === 4) && (
              <div style={{
                display: "flex", flexDirection: "column", gap: 6,
                alignItems: "center",
                position: "absolute",
                left: step === 3 ? "50%" : "auto",
                right: step === 4 ? "12%" : "auto",
                top: "calc(100% + 14px)",
                transform: step === 3 ? "translateX(-50%)" : "none",
                transition: "all 0.6s cubic-bezier(0.22, 1, 0.36, 1)",
              }}>
                <FormatBadge label="SRT File" />
                <FormatBadge label="Alpha Channel" />
              </div>
            )}
          </div>

          {/* Step label — bottom left */}
          <div style={{
            maxWidth: 960, margin: "0 auto",
            marginTop: (step === 3 || step === 4) ? 80 : 28,
            transition: "margin-top 0.4s ease",
            minHeight: 24,
          }}>
            <span key={step} style={{
              fontSize: 15, fontWeight: 600, color: "#65d7a9",
              display: "inline-block",
              animation: "fadeIn 0.3s ease",
            }}>
              {stepLabels[step]}
            </span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @media (max-width: 768px) {
          .workflow-panels {
            grid-template-columns: 1fr !important;
            gap: 12px !important;
          }
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

  // Sync video playback and audio when toggling
  useEffect(() => {
    const raw = rawVideoRef.current;
    const enh = enhancedVideoRef.current;
    if (!raw || !enh) return;
    // Sync time
    const from = enhanced ? raw : enh;
    const to = enhanced ? enh : raw;
    to.currentTime = from.currentTime;
    to.play().catch(() => {});
    // Audio: only the active video is unmuted (after first interaction)
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
    <section style={{ padding: "80px 24px", maxWidth: 1100, margin: "0 auto" }}>
      <AnimSection>
        {/* Outer card */}
        <div style={{
          background: "rgba(21,21,21,0.7)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 24, padding: "56px 48px",
          display: "grid", gridTemplateColumns: "1fr 1fr",
          gap: 48, alignItems: "center",
        }}
          className="audio-card"
        >
          {/* LEFT — Text content */}
          <div>
            <h2 style={{
              fontSize: "clamp(30px, 4vw, 48px)", fontWeight: 800,
              letterSpacing: "-1.5px", lineHeight: 1.15, marginBottom: 28,
              fontFamily: "'DM Sans', sans-serif",
            }}>
              State of The Art
              <br />
              <span style={{ color: "#65d7a9" }}>Audio Enhancement!</span>
            </h2>

            <p style={{
              color: "var(--text-secondary)", fontSize: 16, lineHeight: 1.8,
              marginBottom: 36,
            }}>
              <strong style={{ color: "var(--text-primary)" }}>Kalakar</strong> offers{" "}
              <strong style={{ color: "var(--text-primary)" }}>Studio Grade Audio Enhancement</strong> using complex{" "}
              <strong style={{ color: "var(--text-primary)" }}>Algorithms & AI.</strong> Audio Enhancement has been tested for multiple
              Scenarios including Harsh Traffic, white noise, crowds, hiss or any
              other form of Noise Pattern.
            </p>

            {/* Feature pills — single row */}
            <div style={{ display: "flex", gap: 12, flexWrap: "nowrap" }}>
              {["Works in Seconds", "Realtime Playback", "Studio Quality"].map(label => (
                <div key={label} style={{
                  padding: "10px 22px", borderRadius: 999,
                  background: "transparent",
                  border: "1px solid rgba(72,166,128,0.25)",
                  fontSize: 14, fontWeight: 500, color: "#65d7a9",
                }}>
                  {label}
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT — Video with toggle */}
          <div style={{ position: "relative" }}>
            <div style={{
              width: "100%", aspectRatio: "4/5",
              borderRadius: 20, overflow: "hidden",
              border: "1px solid rgba(255,255,255,0.06)",
              position: "relative", background: "#000",
            }}>
              {/* Raw audio video — starts muted for autoplay, unmutes on toggle */}
              <video
                ref={rawVideoRef}
                autoPlay muted loop playsInline preload="auto"
                controlsList="nodownload nofullscreen noremoteplayback"
                disablePictureInPicture
                style={{
                  width: "100%", height: "100%", objectFit: "cover",
                  display: "block",
                  position: "absolute", inset: 0,
                  opacity: enhanced ? 0 : 1,
                  transition: "opacity 0.5s ease",
                  pointerEvents: "none",
                }}
              >
                <source src="https://kalakar-cdn.b-cdn.net/Audio%20Enhancement/Unprocessed%20Audio.mp4" type="video/mp4" />
              </video>
              {/* Enhanced audio video */}
              <video
                ref={enhancedVideoRef}
                autoPlay muted loop playsInline preload="auto"
                controlsList="nodownload nofullscreen noremoteplayback"
                disablePictureInPicture
                style={{
                  width: "100%", height: "100%", objectFit: "cover",
                  display: "block",
                  position: "absolute", inset: 0,
                  opacity: enhanced ? 1 : 0,
                  transition: "opacity 0.5s ease",
                  pointerEvents: "none",
                }}
              >
                <source src="https://kalakar-cdn.b-cdn.net/Audio%20Enhancement/Cleaned%20Audio.mp4" type="video/mp4" />
              </video>

              {/* Status badge — top right */}
              <div style={{
                position: "absolute", top: 14, right: 14,
                background: enhanced ? "rgba(72,166,128,0.85)" : "rgba(0,0,0,0.55)",
                backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
                borderRadius: 999, padding: "7px 16px",
                display: "flex", alignItems: "center", gap: 8,
                transition: "all 0.4s ease",
                border: enhanced ? "1px solid rgba(72,166,128,0.5)" : "1px solid rgba(255,255,255,0.1)",
              }}>
                <div style={{
                  width: 8, height: 8, borderRadius: "50%",
                  background: enhanced ? "#fff" : "#aaa",
                  transition: "all 0.3s ease",
                }} />
                <span style={{
                  fontSize: 13, fontWeight: 600,
                  color: enhanced ? "#fff" : "#ccc",
                  transition: "color 0.3s ease",
                }}>
                  {enhanced ? "AI Enhanced Audio" : "Raw Audio"}
                </span>
              </div>

              {/* Toggle switch — bottom center */}
              <div style={{
                position: "absolute", bottom: 20, left: "50%", transform: "translateX(-50%)",
              }}>
                <button
                  onClick={handleToggle}
                  style={{
                    width: 64, height: 34, borderRadius: 999,
                    background: enhanced ? "#48A680" : "rgba(80,80,80,0.8)",
                    border: "none", cursor: "pointer",
                    position: "relative",
                    transition: "background 0.3s ease",
                    padding: 0,
                  }}
                >
                  <div style={{
                    width: 28, height: 28, borderRadius: "50%",
                    background: "#fff",
                    position: "absolute", top: 3,
                    left: enhanced ? 33 : 3,
                    transition: "left 0.3s cubic-bezier(0.22, 1, 0.36, 1)",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
                  }} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </AnimSection>

      <style>{`
        @media (max-width: 768px) {
          .audio-card {
            grid-template-columns: 1fr !important;
            padding: 32px 24px !important;
            gap: 32px !important;
          }
        }
      `}</style>
    </section>
  );
}

// ——— PRICING ———
function PricingSection() {
  const [isYearly, setIsYearly] = useState(false);
  const [currency, setCurrency] = useState({ sym: "$", code: "USD" });

  // Detect currency from timezone/locale
  useEffect(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    const lang = navigator.language || "en-US";
    if (tz.includes("Kolkata") || lang.includes("IN")) setCurrency({ sym: "Rs", code: "INR" });
    else if (tz.includes("Karachi") || lang.includes("PK")) setCurrency({ sym: "Rs", code: "PKR" });
    else if (tz.includes("Dhaka") || lang.includes("BD")) setCurrency({ sym: "৳", code: "BDT" });
    else if (tz.includes("Kathmandu") || lang.includes("NP")) setCurrency({ sym: "Rs", code: "NPR" });
  }, []);

  // Plan icons (simple SVG representations)
  const PlanIcon = ({ type }) => {
    const s = { width: 40, height: 40, borderRadius: 12, background: "rgba(72,166,128,0.1)", border: "1px solid rgba(72,166,128,0.15)", display: "flex", alignItems: "center", justifyContent: "center" };
    const ic = { stroke: "#65d7a9", fill: "none", strokeWidth: 1.5, strokeLinecap: "round", strokeLinejoin: "round" };
    if (type === "free") return <div style={s}><svg width="20" height="20" viewBox="0 0 24 24" {...ic}><circle cx="12" cy="12" r="10" /><path d="M8 14s1.5 2 4 2 4-2 4-2" /><line x1="9" y1="9" x2="9.01" y2="9" /><line x1="15" y1="9" x2="15.01" y2="9" /></svg></div>;
    if (type === "editor") return <div style={s}><svg width="20" height="20" viewBox="0 0 24 24" {...ic}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg></div>;
    if (type === "creator") return <div style={{ ...s, background: "rgba(72,166,128,0.15)", border: "1px solid rgba(72,166,128,0.25)" }}><svg width="20" height="20" viewBox="0 0 24 24" {...ic} stroke="#48A680"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /><circle cx="12" cy="12" r="3" /></svg></div>;
    return <div style={s}><svg width="20" height="20" viewBox="0 0 24 24" {...ic}><rect x="2" y="7" width="20" height="15" rx="2" ry="2" /><polyline points="17 2 12 7 7 2" /></svg></div>;
  };

  const plans = [
    {
      name: "Free", type: "free", popular: false,
      monthly: { USD: "0.00", INR: "0.00", PKR: "0.00", BDT: "0.00", NPR: "0.00" },
      yearly: { USD: "0", INR: "0", PKR: "0", BDT: "0", NPR: "0" },
      yearlyStrike: null, save: null,
      featuresLabel: "Key Features",
      features: ["All Languages", "10 Minutes Free Testing\n( Full Templates)", "5 GB Cloud Storage", "Max Video Length 2 min", "3 Audio Enhancement Credits\n(1 Credit = 1 Video)"],
    },
    {
      name: "Editor Plan", type: "editor", popular: false,
      monthly: { USD: "6.99", INR: "1,950", PKR: "1,950", BDT: "1,200", NPR: "1,600" },
      yearly: { USD: "4.89", INR: "1,625", PKR: "1,625", BDT: "900", NPR: "1,100" },
      yearlyStrike: { USD: "6.99", INR: "2,333.33", PKR: "1,950", BDT: "1,200", NPR: "1,600" },
      save: "30%",
      featuresLabel: "Everything in Free, plus",
      features: ["2 Hours of Transcription", "20 GB Cloud Storage", "1080P Video Render", "Max Video Length 2 min", "50 Audio Enhancement Credits\n(1 Credit = 1 Video)", "Custom Font Upload"],
    },
    {
      name: "Creator Plan", type: "creator", popular: true,
      monthly: { USD: "9.99", INR: "2,800", PKR: "2,800", BDT: "1,800", NPR: "2,200" },
      yearly: { USD: "6.66", INR: "2,333.3", PKR: "2,333.3", BDT: "1,350", NPR: "1,650" },
      yearlyStrike: { USD: "9.99", INR: "3,500", PKR: "2,800", BDT: "1,800", NPR: "2,200" },
      save: "33%",
      featuresLabel: "Everything in Editor, plus",
      features: ["5 Hours of Transcription", "60 GB Cloud Storage", "4K Video Render", "Max Video Length 5 min", "Unlimited Audio Enhancement", "Alpha Channel Render", "SRT Render", "2 Hours of Translation (from\nany Desi Language to English)"],
    },
    {
      name: "Business Plan", type: "business", popular: false,
      monthly: { USD: "24.99", INR: "6,999", PKR: "6,999", BDT: "4,500", NPR: "5,500" },
      yearly: { USD: "20.83", INR: "5,832.5", PKR: "5,832.5", BDT: "3,750", NPR: "4,580" },
      yearlyStrike: { USD: "24.99", INR: "9,416.67", PKR: "6,999", BDT: "4,500", NPR: "5,500" },
      save: "17%",
      featuresLabel: "Everything in Creator, plus",
      features: ["12 Hours of Transcription", "150 GB Cloud Storage", "4K Video", "Max Video Length 30 min", "5 Hours of Translation (from\nany Desi Language to English)"],
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
    <section id="pricing" style={{ padding: "80px 24px", maxWidth: 1200, margin: "0 auto" }}>
      <AnimSection>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <h2 style={{
            fontSize: "clamp(32px, 5vw, 52px)", fontWeight: 800,
            letterSpacing: "-2px", marginBottom: 20,
            fontFamily: "'DM Sans', sans-serif",
          }}>
            <span style={{ color: "#65d7a9" }}>Unbeatable Pricing</span> Across Industry
          </h2>

          {/* "2 months free" badge */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            marginBottom: 20,
          }}>
            <span style={{ fontSize: 18, color: "#555", transform: "rotate(-15deg) scaleX(-1)", display: "inline-block" }}>↗</span>
            <div style={{
              padding: "6px 18px", borderRadius: 999,
              background: "rgba(72,166,128,0.12)", border: "1px solid rgba(72,166,128,0.25)",
              fontSize: 13, fontWeight: 600, color: "#65d7a9",
            }}>
              2 months free
            </div>
          </div>

          {/* Monthly / Yearly toggle */}
          <div style={{
            display: "inline-flex", background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 999, padding: 4,
          }}>
            <button onClick={() => setIsYearly(false)} style={{
              padding: "10px 28px", borderRadius: 999, border: "none",
              background: !isYearly ? "#fff" : "transparent",
              color: !isYearly ? "#0c0c0c" : "#888",
              fontSize: 14, fontWeight: 600, cursor: "pointer",
              fontFamily: "inherit", transition: "all 0.3s ease",
            }}>Monthly</button>
            <button onClick={() => setIsYearly(true)} style={{
              padding: "10px 28px", borderRadius: 999, border: "none",
              background: isYearly ? "#fff" : "transparent",
              color: isYearly ? "#0c0c0c" : "#888",
              fontSize: 14, fontWeight: 600, cursor: "pointer",
              fontFamily: "inherit", transition: "all 0.3s ease",
              display: "flex", alignItems: "center", gap: 8,
            }}>
              Yearly
              <span style={{
                padding: "2px 8px", borderRadius: 4,
                background: isYearly ? "#48A680" : "rgba(72,166,128,0.2)",
                color: isYearly ? "#fff" : "#65d7a9",
                fontSize: 10, fontWeight: 800,
                transition: "all 0.3s ease",
              }}>SAVE</span>
            </button>
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
                background: "rgba(18,18,20,0.7)",
                borderRadius: 20, padding: "32px 28px",
                border: plan.popular ? "1.5px solid rgba(72,166,128,0.3)" : "1px solid rgba(255,255,255,0.06)",
                position: "relative", height: "100%",
                display: "flex", flexDirection: "column",
                transition: "all 0.35s",
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.borderColor = plan.popular ? "rgba(72,166,128,0.5)" : "rgba(255,255,255,0.12)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.borderColor = plan.popular ? "rgba(72,166,128,0.3)" : "rgba(255,255,255,0.06)"; }}
              >
                {/* Icon + Most Popular badge */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                  <PlanIcon type={plan.type} />
                  {plan.popular && (
                    <div style={{
                      padding: "5px 14px", borderRadius: 8,
                      background: "rgba(72,166,128,0.1)", border: "1px solid rgba(72,166,128,0.2)",
                      fontSize: 11, fontWeight: 600, color: "#65d7a9",
                    }}>Most Popular</div>
                  )}
                </div>

                {/* Plan name */}
                <div style={{ fontSize: 16, fontWeight: 600, color: "#fff", marginBottom: 12 }}>{plan.name}</div>

                {/* Price */}
                <div style={{ marginBottom: 4 }}>
                  <span style={{ fontSize: 36, fontWeight: 800, color: "#fff", letterSpacing: "-1px" }}>
                    {currency.sym} {getPrice(plan)}
                  </span>
                  {strike && (
                    <span style={{
                      fontSize: 13, color: "#555", textDecoration: "line-through",
                      marginLeft: 8,
                    }}>
                      {currency.sym}{strike}
                    </span>
                  )}
                </div>

                {/* Period + save badge */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24 }}>
                  <span style={{ fontSize: 13, color: "#666" }}>
                    / {isYearly ? "month" : "per month"}
                  </span>
                  {isYearly && <span style={{ fontSize: 11, color: "#555" }}>(billed annually)</span>}
                  {isYearly && plan.save && (
                    <span style={{
                      padding: "3px 10px", borderRadius: 6,
                      background: "rgba(72,166,128,0.12)", border: "1px solid rgba(72,166,128,0.2)",
                      fontSize: 10, fontWeight: 700, color: "#65d7a9",
                    }}>Save {plan.save}</span>
                  )}
                </div>

                {/* CTA */}
                <a href="#" style={{
                  display: "block", textAlign: "center", padding: "13px",
                  borderRadius: 12, textDecoration: "none", fontWeight: 600, fontSize: 14,
                  background: plan.popular ? "#48A680" : "transparent",
                  color: plan.popular ? "#fff" : "#ccc",
                  border: plan.popular ? "none" : "1px solid rgba(255,255,255,0.1)",
                  marginBottom: 28, transition: "all 0.25s",
                }}
                  onMouseEnter={e => { if (!plan.popular) { e.target.style.borderColor = "rgba(255,255,255,0.2)"; e.target.style.background = "rgba(255,255,255,0.04)"; } else { e.target.style.background = "#3d9070"; } }}
                  onMouseLeave={e => { if (!plan.popular) { e.target.style.borderColor = "rgba(255,255,255,0.1)"; e.target.style.background = "transparent"; } else { e.target.style.background = "#48A680"; } }}
                >Get Started</a>

                {/* Divider */}
                <div style={{ height: 1, background: "rgba(255,255,255,0.06)", marginBottom: 24 }} />

                {/* Features label */}
                <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 16 }}>
                  {plan.featuresLabel}
                </div>

                {/* Features list */}
                <div style={{ flex: 1 }}>
                  {plan.features.map((f, fi) => (
                    <div key={fi} style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 12 }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#48A680" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}>
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                        <polyline points="22 4 12 14.01 9 11.01" />
                      </svg>
                      <span style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5, whiteSpace: "pre-line" }}>{f}</span>
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
  const textReviews = [
    { name: "Aarav", text: "I've been using Kalakaar recently & it's honestly super helpful. It supports multiple languages, generating Hindi captions used to be a real struggle, but with Kalakaar, the process is super smooth." },
    { name: "Zaryab Khan", text: "If you're an editor or creator from South Asia, this software is your only solution. It's got all the trendy captioning styles available like beast style, Iman Gadzi, Devin Jatho, Alex harmozi etc just one click away." },
    { name: "Ahsan Imran", text: "Kalakaar as a captioning software is one of the best out there. Its premade templates are really helpful & loading times are really quick. Overall as an editor it makes the captioning much more easier." },
  ];

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

  return (
    <section id="testimonials" style={{ padding: "80px 24px", overflow: "hidden" }}>
      <AnimSection>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <h2 style={{ fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 800, letterSpacing: "-1px" }}>
            Loved by Creators{" "}
            <span style={{ fontFamily: "'Instrument Serif', serif", fontStyle: "italic", color: "var(--accent-light)" }}>
              Across South Asia
            </span>
          </h2>
        </div>
      </AnimSection>

      <AnimSection delay="delay-1">
        <div className="testimonials-bento" style={{
          display: "grid",
          gridTemplateColumns: "1fr 1.1fr 1fr",
          gap: 20,
          maxWidth: 1200,
          margin: "0 auto",
        }}>
          {/* LEFT — Bhuwan Video */}
          <div style={{
            background: "var(--bg-card)", borderRadius: 20, border: "1px solid var(--border)",
            overflow: "hidden", display: "flex", flexDirection: "column", position: "relative",
          }}>
            <div style={{ flex: 1, position: "relative", minHeight: 0 }}>
              <video
                ref={bhuwanRef}
                src="https://kalakar-cdn.b-cdn.net/Testimonials/Bhuwan%20-%20India.mp4"
                playsInline
                preload="metadata"
                controls={playingVideo === "bhuwan"}
                onClick={() => handlePlay("bhuwan")}
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", cursor: "pointer" }}
              />
              {playingVideo !== "bhuwan" && (
                <div onClick={() => handlePlay("bhuwan")} style={{
                  position: "absolute", bottom: 20, left: 20,
                  width: 52, height: 52, borderRadius: "50%",
                  background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", transition: "transform 0.2s",
                }}
                  onMouseEnter={e => e.currentTarget.style.transform = "scale(1.1)"}
                  onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff"><path d="M8 5v14l11-7z"/></svg>
                </div>
              )}
            </div>
            <div style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 12, borderTop: "1px solid var(--border)" }}>
              <div style={{
                width: 40, height: 40, borderRadius: "50%",
                background: "hsl(150, 40%, 30%)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 700, fontSize: 16, color: "#fff",
              }}>B</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>Bhuwan</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>• India</div>
              </div>
            </div>
          </div>

          {/* CENTER — Text Reviews */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {textReviews.map((t, i) => (
              <div key={i} style={{
                flex: 1, background: "var(--bg-card)", borderRadius: 20,
                border: "1px solid var(--border)", padding: 28,
                display: "flex", flexDirection: "column", justifyContent: "space-between",
                transition: "all 0.3s",
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(72,166,128,0.4)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.transform = "none"; }}>
                <p style={{ fontSize: 15, color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: 20 }}>{t.text}</p>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: "50%",
                    background: `hsl(${150 + i * 30}, 40%, 30%)`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontWeight: 700, fontSize: 16, color: "#fff",
                  }}>{t.name[0]}</div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{t.name}</div>
                </div>
              </div>
            ))}
          </div>

          {/* RIGHT — Danyal Video */}
          <div style={{
            background: "var(--bg-card)", borderRadius: 20, border: "1px solid var(--border)",
            overflow: "hidden", display: "flex", flexDirection: "column", position: "relative",
          }}>
            <div style={{ flex: 1, position: "relative", minHeight: 0 }}>
              <video
                ref={danyalRef}
                src="https://kalakar-cdn.b-cdn.net/Testimonials/Danyal%20-%20Pakistan%20.mp4"
                playsInline
                preload="metadata"
                controls={playingVideo === "danyal"}
                onClick={() => handlePlay("danyal")}
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", cursor: "pointer" }}
              />
              {playingVideo !== "danyal" && (
                <div onClick={() => handlePlay("danyal")} style={{
                  position: "absolute", bottom: 20, left: 20,
                  width: 52, height: 52, borderRadius: "50%",
                  background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", transition: "transform 0.2s",
                }}
                  onMouseEnter={e => e.currentTarget.style.transform = "scale(1.1)"}
                  onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff"><path d="M8 5v14l11-7z"/></svg>
                </div>
              )}
            </div>
            <div style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 12, borderTop: "1px solid var(--border)" }}>
              <div style={{
                width: 40, height: 40, borderRadius: "50%",
                background: "hsl(190, 40%, 30%)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 700, fontSize: 16, color: "#fff",
              }}>D</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>Danyal</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>• Pakistan</div>
              </div>
            </div>
          </div>
        </div>
      </AnimSection>

      <style>{`
        @media (max-width: 900px) {
          .testimonials-bento {
            grid-template-columns: 1fr !important;
            max-width: 480px !important;
          }
          .testimonials-bento > div:first-child,
          .testimonials-bento > div:last-child {
            max-height: 500px;
          }
        }
      `}</style>
    </section>
  );
}

// ——— MAGIC TEXT (scroll-reveal word-by-word) ———
function MagicWord({ children, progress, range }) {
  const opacity = useTransform(progress, range, [0, 1]);
  return (
    <span style={{ position: "relative", marginTop: 12, marginRight: 6, fontSize: "clamp(20px, 3.2vw, 30px)", fontWeight: 600, lineHeight: 1.6 }}>
      <span style={{ opacity: 0.15 }}>{children}</span>
      <motion.span style={{ opacity, position: "absolute", left: 0, top: 0 }}>{children}</motion.span>
    </span>
  );
}

function MagicText({ text }) {
  const container = useRef(null);
  const { scrollYProgress } = useScroll({
    target: container,
    offset: ["start 0.9", "start 0.25"],
  });
  const words = text.split(" ");
  return (
    <p ref={container} style={{ display: "flex", flexWrap: "wrap", lineHeight: 0.5, padding: 16 }}>
      {words.map((word, i) => {
        const start = i / words.length;
        const end = start + 1 / words.length;
        return <MagicWord key={i} progress={scrollYProgress} range={[start, end]}>{word}</MagicWord>;
      })}
    </p>
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

  return (
    <section id="about" style={{ padding: "80px 24px", maxWidth: 860, margin: "0 auto" }}>
      <AnimSection>
        <h2 style={{
          fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 800,
          letterSpacing: "-1px", textAlign: "center", marginBottom: 48,
        }}>
          Why we Built{" "}
          <span style={{ fontFamily: "'Instrument Serif', serif", fontStyle: "italic", color: "var(--accent-light)" }}>
            Kalakar?
          </span>
        </h2>
      </AnimSection>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {paragraphs.map((p, i) => (
          <MagicText key={i} text={p} />
        ))}
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
    <section style={{ padding: "80px 24px", maxWidth: 760, margin: "0 auto" }}>
      <AnimSection>
        <h2 style={{
          fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 800,
          letterSpacing: "-1px", textAlign: "center", marginBottom: 48,
        }}>
          Frequently Asked{" "}
          <span style={{ fontFamily: "'Instrument Serif', serif", fontStyle: "italic", color: "var(--accent-light)" }}>
            Questions
          </span>
        </h2>
      </AnimSection>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {faqs.map((faq, i) => (
          <AnimSection key={i} delay={i < 4 ? `delay-${i + 1}` : ""}>
            <div style={{
              background: "var(--bg-card)", borderRadius: 14,
              border: `1px solid ${open === i ? "rgba(72,166,128,0.5)" : "var(--border)"}`,
              overflow: "hidden", transition: "all 0.3s",
            }}>
              <button onClick={() => setOpen(open === i ? null : i)} style={{
                width: "100%", display: "flex", alignItems: "center",
                justifyContent: "space-between", padding: "18px 22px",
                background: "none", border: "none", color: "var(--text-primary)",
                fontSize: 15, fontWeight: 600, cursor: "pointer",
                fontFamily: "inherit", textAlign: "left",
              }}>
                {faq.q}
                <span style={{
                  fontSize: 20, transition: "transform 0.3s",
                  transform: open === i ? "rotate(45deg)" : "none",
                  color: "var(--accent-light)", flexShrink: 0, marginLeft: 12,
                }}>+</span>
              </button>
              <div style={{
                maxHeight: open === i ? 200 : 0,
                overflow: "hidden", transition: "max-height 0.35s ease",
              }}>
                <p style={{ padding: "0 22px 18px", fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.7 }}>
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
      padding: "48px 24px", borderTop: "1px solid var(--border)",
      maxWidth: 1200, margin: "0 auto",
    }}>
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        flexWrap: "wrap", gap: 20,
      }}>
        <div>
          <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 12 }}>
            Still have a query? Drop your questions at our Support Email
          </p>
          <a href="mailto:support@kalakar.io" style={{
            color: "var(--accent-light)", textDecoration: "none",
            fontSize: 14, fontWeight: 600,
          }}>
            Email Us →
          </a>
        </div>
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
          {["Terms & Conditions", "Privacy Policy", "Instagram", "LinkedIn"].map(link => (
            <a key={link} href="#" style={{
              color: "var(--text-muted)", textDecoration: "none",
              fontSize: 13, transition: "color 0.2s",
            }}
              onMouseEnter={e => e.target.style.color = "var(--text-primary)"}
              onMouseLeave={e => e.target.style.color = "var(--text-muted)"}>
              {link}
            </a>
          ))}
        </div>
      </div>
      <div style={{ textAlign: "center", marginTop: 40, paddingTop: 24, borderTop: "1px solid var(--border)" }}>
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
      <Hero />
      <LanguageSection />
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
