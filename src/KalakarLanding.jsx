import { useState, useEffect, useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";

// ——— CSS Keyframes & Global Styles ———
const globalStyles = `
  @import url('https://api.fontshare.com/v2/css?f[]=satoshi@300,400,500,600,700,800,900&display=swap');
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Instrument+Serif:ital@0;1&family=Space+Grotesk:wght@400;500;700&display=swap');

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
    .audio-card { grid-template-columns: 1fr !important; padding: 32px 20px !important; gap: 32px !important; }
    .export-layout { grid-template-columns: 1fr !important; text-align: center !important; }
    .export-layout .export-text { align-items: center !important; }
    .testimonials-grid { grid-template-columns: 1fr !important; max-width: 480px !important; margin: 0 auto !important; }
    .audio-pills { flex-wrap: wrap !important; }
    .hero-headline { font-size: clamp(32px, 8vw, 40px) !important; }
    .lang-grid { grid-template-columns: 1fr !important; }
    .lang-grid .lang-video { order: -1 !important; }
    .lang-grid .lang-video > div { max-width: 100% !important; border-radius: 0 !important; aspect-ratio: 9/12 !important; border: none !important; box-shadow: none !important; }
    .lang-grid .lang-picker { padding: 28px 20px 32px !important; }
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
          <a href="#" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: "linear-gradient(135deg, #03ffb2, #48ffcc)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 16, color: "#fff",
            }}>K</div>
            <span style={{
              fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18,
              color: "var(--text-primary)", letterSpacing: "-0.5px",
            }}>Kalakar</span>
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

// ——— HERO ———
function Hero() {
  return (
    <section style={{ paddingTop: 160, paddingBottom: 100, textAlign: "center", position: "relative", overflow: "hidden" }}>
      {/* Radial saffron glow */}
      <div style={{
        position: "absolute", top: "15%", left: "50%", transform: "translateX(-50%)",
        width: 1000, height: 700, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(3,255,178,0.08) 0%, rgba(72,255,204,0.03) 40%, transparent 70%)",
        pointerEvents: "none",
      }} />
      {/* Subtle secondary violet glow */}
      <div style={{
        position: "absolute", top: "30%", left: "30%", transform: "translateX(-50%)",
        width: 500, height: 400, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(124,58,237,0.04) 0%, transparent 60%)",
        pointerEvents: "none",
      }} />

      <div style={{ position: "relative", maxWidth: 900, margin: "0 auto", padding: "0 24px" }}>
        {/* Headline — staggered line reveal */}
        <h1 className="hero-headline" style={{
          fontSize: "clamp(40px, 5.5vw, 72px)", fontWeight: 800, lineHeight: 1.1,
          letterSpacing: "-2px", marginBottom: 28,
          fontFamily: "var(--font-display)",
        }}>
          <span style={{ display: "block", animation: "fadeInUp 0.7s 0.1s cubic-bezier(0.16, 1, 0.3, 1) both" }}>
            <span style={{ color: "var(--highlight)" }}>Captioning</span> Software,
          </span>
          <span style={{ display: "block", animation: "fadeInUp 0.7s 0.25s cubic-bezier(0.16, 1, 0.3, 1) both" }}>
            Made by Desi Creators,
          </span>
          <span style={{
            display: "block",
            animation: "fadeInUp 0.7s 0.4s cubic-bezier(0.16, 1, 0.3, 1) both",
            fontFamily: "var(--font-accent)", fontStyle: "italic",
            color: "var(--highlight)",
          }}>
            For Desi Creators
          </span>
        </h1>

        <p style={{
          fontSize: "clamp(15px, 1.8vw, 18px)", color: "var(--text-secondary)", maxWidth: 560,
          margin: "0 auto 40px", lineHeight: 1.7,
          animation: "fadeInUp 0.7s 0.55s cubic-bezier(0.16, 1, 0.3, 1) both",
          fontFamily: "var(--font-body)",
        }}>
          Auto-generate accurate captions in all major{" "}
          <strong style={{ color: "var(--text-primary)", fontWeight: 600 }}>desi languages</strong> in seconds
        </p>

        <div style={{ animation: "fadeInUp 0.7s 0.7s cubic-bezier(0.16, 1, 0.3, 1) both" }}>
          <a href="#pricing" style={{
            background: "var(--accent)", color: "#0a0a0a", padding: "16px 40px",
            borderRadius: 999, textDecoration: "none", fontSize: 16, fontWeight: 700,
            transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
            boxShadow: "0 0 30px rgba(3,255,178,0.3), 0 0 80px rgba(3,255,178,0.1)",
            display: "inline-flex", alignItems: "center", gap: 10,
            fontFamily: "var(--font-display)",
          }}
            onMouseEnter={e => { e.target.style.transform = "translateY(-2px)"; e.target.style.boxShadow = "0 0 40px rgba(3,255,178,0.45), 0 0 100px rgba(3,255,178,0.15)"; }}
            onMouseLeave={e => { e.target.style.transform = "none"; e.target.style.boxShadow = "0 0 30px rgba(3,255,178,0.3), 0 0 80px rgba(3,255,178,0.1)"; }}>
            Get started now
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="7" y1="17" x2="17" y2="7" /><polyline points="7 7 17 7 17 17" />
            </svg>
          </a>
        </div>

        {/* Trust indicators */}
        <div style={{ animation: "fadeIn 1s 0.9s ease both", marginTop: 44 }}>
          <p style={{
            fontSize: 14, color: "var(--text-secondary)", fontWeight: 500, marginBottom: 12,
            fontFamily: "var(--font-display)",
          }}>
            Trusted by over 30,000 Users
          </p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <div style={{ display: "flex", gap: 2 }}>
              {[...Array(5)].map((_, i) => (
                <svg key={i} width="16" height="16" viewBox="0 0 24 24" fill="var(--gold)" stroke="none">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              ))}
            </div>
            <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", fontFamily: "var(--font-display)" }}>4.9</span>
          </div>
        </div>
      </div>
    </section>
  );
}

// ——— LANGUAGE SELECTOR WITH VIDEOS ———
function LanguageSection() {
  const languages = [
    "Hindi", "English", "Nepali", "Urdu", "Tamil", "Malayalam", "Gujarati", "Bengali",
    "Punjabi", "Telugu", "Sindhi", "Marathi", "Kannada", "Pushto", "Malay",
  ];

  const getVideoUrl = (lang) => `https://kalakar-cdn.b-cdn.net/Captioned%20Languages/One%20Standard/${lang}.mp4`;

  const [selectedIdx, setSelectedIdx] = useState(0);
  const [videoOpacity, setVideoOpacity] = useState(1);
  const [currentSrc, setCurrentSrc] = useState(getVideoUrl(languages[0]));
  const videoRef = useRef(null);
  const targetSrc = getVideoUrl(languages[selectedIdx]);

  useEffect(() => {
    if (targetSrc === currentSrc) return;
    setVideoOpacity(0);
    const t = setTimeout(() => setCurrentSrc(targetSrc), 280);
    return () => clearTimeout(t);
  }, [targetSrc, currentSrc]);

  useEffect(() => {
    if (!videoRef.current) return;
    videoRef.current.load();
    videoRef.current.play().catch(() => {});
    const t = setTimeout(() => setVideoOpacity(1), 100);
    return () => clearTimeout(t);
  }, [currentSrc]);

  return (
    <section style={{ padding: "0 24px 100px", maxWidth: 1100, margin: "0 auto" }}>
      <AnimSection>
        <div style={{
          background: "rgba(20,20,20,0.6)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 24, overflow: "hidden",
        }}>
          <div className="lang-grid" style={{
            display: "grid", gridTemplateColumns: "1fr 1fr",
            alignItems: "center",
          }}>
            {/* Video Preview */}
            <div className="lang-video" style={{ padding: 40, display: "flex", justifyContent: "center" }}>
              {/* Phone mockup frame */}
              <div style={{
                width: "100%", maxWidth: 320,
                position: "relative",
                background: "#1a1a1a",
                borderRadius: 36,
                padding: "12px 10px",
                boxShadow: "0 30px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.08)",
              }}>
                {/* Notch */}
                <div style={{
                  position: "absolute", top: 12, left: "50%", transform: "translateX(-50%)",
                  width: 80, height: 6, borderRadius: 3, background: "#2a2a2a", zIndex: 2,
                }} />
                {/* Screen */}
                <div style={{
                  width: "100%", aspectRatio: "9/16",
                  borderRadius: 26, overflow: "hidden",
                  background: "#000",
                }}>
                  <video
                    ref={videoRef}
                    autoPlay muted loop playsInline preload="auto"
                    style={{
                      width: "100%", height: "100%", objectFit: "cover",
                      opacity: videoOpacity,
                      transition: "opacity 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
                      display: "block",
                    }}
                  >
                    <source src={currentSrc} type="video/mp4" />
                  </video>
                </div>
              </div>
            </div>

            {/* Language Picker */}
            <div className="lang-picker" style={{ padding: "48px 48px 48px 0" }}>
              <p style={{
                fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: "2px",
                color: "var(--highlight)", marginBottom: 12,
                fontFamily: "var(--font-display)",
              }}>Languages</p>
              <h2 style={{
                fontSize: "clamp(24px, 3vw, 36px)", fontWeight: 700, letterSpacing: "-0.5px",
                marginBottom: 32,
                fontFamily: "var(--font-display)",
              }}>
                Select your Language
              </h2>

              <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                {languages.map((lang, idx) => {
                  const isSelected = selectedIdx === idx;
                  return (
                    <button
                      key={lang}
                      onClick={() => setSelectedIdx(idx)}
                      style={{
                        background: isSelected
                          ? "linear-gradient(135deg, var(--accent), var(--accent-light))"
                          : "rgba(255,255,255,0.04)",
                        color: isSelected ? "#fff" : "var(--text-secondary)",
                        border: isSelected
                          ? "1px solid rgba(3,255,178,0.5)"
                          : "1px solid rgba(255,255,255,0.08)",
                        borderRadius: 999,
                        padding: "10px 20px",
                        fontSize: 14, fontWeight: 500,
                        cursor: "pointer",
                        transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
                        fontFamily: "var(--font-display)",
                        whiteSpace: "nowrap",
                      }}
                      onMouseEnter={e => { if (!isSelected) { e.currentTarget.style.borderColor = "rgba(3,255,178,0.3)"; e.currentTarget.style.color = "var(--text-primary)"; } }}
                      onMouseLeave={e => { if (!isSelected) { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "var(--text-secondary)"; } }}
                    >
                      {lang}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </AnimSection>
    </section>
  );
}

// ——— TEMPLATES MARQUEE ———
function TemplatesSection() {
  const templates = [
    { name: "Devin Jatho", tag: "Fully customizable", video: "https://kalakar-cdn.b-cdn.net/Creator%20Templates%20%20Styles/Devin%20Jatho%20(Fully%20customizable).mp4", hue: 20 },
    { name: "Editing Skool", tag: "Fully customizable", video: "https://kalakar-cdn.b-cdn.net/Creator%20Templates%20%20Styles/Editing%20Skool(Fully%20customizable).mp4", hue: 270 },
    { name: "Mr Beast", tag: "Fully customizable", video: "https://kalakar-cdn.b-cdn.net/Creator%20Templates%20%20Styles/Mr%20Beast%20(Fully%20customizable).mp4", hue: 220 },
    { name: "Ali Abdaal", tag: "Fully customizable", video: "https://kalakar-cdn.b-cdn.net/Creator%20Templates%20%20Styles/Ali%20Abdaal%20(Fully%20customizable).mp4", hue: 160 },
    { name: "Alex Hormozi", tag: "Partially customizable", video: "https://kalakar-cdn.b-cdn.net/Creator%20Templates%20%20Styles/Alex%20Hormozi%20(Partially%20customizable).mp4", hue: 40 },
    { name: "Iman Gadzhi", tag: "Fully customizable", video: "https://kalakar-cdn.b-cdn.net/Creator%20Templates%20%20Styles/Iman%20Gadzhi%20(Fully%20customizable).mp4", hue: 330 },
    { name: "Bubble Style", tag: "Fully customizable", video: "https://kalakar-cdn.b-cdn.net/Creator%20Templates%20%20Styles/Bubble%20Style%20(Fully%20customizable).mp4", hue: 190 },
  ];

  // Duplicate for seamless loop
  const row1 = [...templates, ...templates, ...templates];
  const row2 = [...templates.slice().reverse(), ...templates.slice().reverse(), ...templates.slice().reverse()];

  const TemplateCard = ({ t }) => (
    <div style={{
      width: 200, height: 340, flexShrink: 0,
      borderRadius: 20, overflow: "hidden",
      background: `linear-gradient(145deg, hsl(${t.hue}, 40%, 12%) 0%, hsl(${t.hue}, 30%, 8%) 100%)`,
      border: "1px solid rgba(255,255,255,0.06)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      gap: 16, padding: 24, cursor: "pointer",
      transition: "all 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
      position: "relative",
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.04)"; e.currentTarget.style.borderColor = `hsla(${t.hue}, 60%, 50%, 0.3)`; e.currentTarget.style.boxShadow = `0 20px 60px hsla(${t.hue}, 60%, 30%, 0.2)`; }}
      onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; e.currentTarget.style.boxShadow = "none"; }}
    >
      {/* Glow accent */}
      <div style={{
        position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)",
        width: "60%", height: 2,
        background: `linear-gradient(90deg, transparent, hsla(${t.hue}, 70%, 55%, 0.5), transparent)`,
      }} />
      {/* Initial circle */}
      <div style={{
        width: 64, height: 64, borderRadius: "50%",
        background: `linear-gradient(135deg, hsla(${t.hue}, 60%, 45%, 0.3), hsla(${t.hue}, 60%, 35%, 0.15))`,
        border: `1px solid hsla(${t.hue}, 60%, 50%, 0.2)`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 24, fontWeight: 800, color: `hsl(${t.hue}, 70%, 70%)`,
        fontFamily: "var(--font-display)",
      }}>{t.name[0]}</div>
      {/* Play icon */}
      <div style={{
        width: 36, height: 36, borderRadius: "50%",
        background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="rgba(255,255,255,0.7)"><path d="M8 5v14l11-7z"/></svg>
      </div>
      {/* Name + tag */}
      <div style={{ textAlign: "center" }}>
        <div style={{ fontWeight: 700, fontSize: 15, fontFamily: "var(--font-display)", marginBottom: 4 }}>{t.name}</div>
        <div style={{
          fontSize: 11, fontWeight: 500,
          color: t.tag === "Fully customizable" ? "var(--success)" : "var(--gold)",
          fontFamily: "var(--font-display)", textTransform: "uppercase", letterSpacing: "0.5px",
        }}>{t.tag}</div>
      </div>
    </div>
  );

  return (
    <section style={{ padding: "80px 0 100px", overflow: "hidden" }}>
      <AnimSection>
        <div style={{ textAlign: "center", marginBottom: 56, padding: "0 24px" }}>
          <p style={{
            fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: "2px",
            color: "var(--accent-secondary-light)", marginBottom: 12,
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
          <p style={{ color: "var(--text-secondary)", marginTop: 16, fontSize: 16, fontFamily: "var(--font-body)" }}>
            Dozens of fully <strong style={{ color: "var(--text-primary)" }}>customizable templates</strong> in all desi languages
          </p>
        </div>
      </AnimSection>

      {/* Marquee Row 1 — scrolling left */}
      <div className="marquee-track" style={{ overflow: "hidden", marginBottom: 16 }}>
        <div className="marquee-inner" style={{
          display: "flex", gap: 16, width: "max-content",
          animation: "marqueeLeft 60s linear infinite",
        }}>
          {row1.map((t, i) => <TemplateCard key={`r1-${i}`} t={t} />)}
        </div>
      </div>

      {/* Marquee Row 2 — scrolling right */}
      <div className="marquee-track" style={{ overflow: "hidden" }}>
        <div className="marquee-inner" style={{
          display: "flex", gap: 16, width: "max-content",
          animation: "marqueeRight 60s linear infinite",
        }}>
          {row2.map((t, i) => <TemplateCard key={`r2-${i}`} t={t} />)}
        </div>
      </div>
    </section>
  );
}

// ——— ACCURACY BANNER ———
function AccuracyBanner() {
  return (
    <section style={{
      padding: "120px 24px", position: "relative", overflow: "hidden",
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
            fontSize: "clamp(80px, 12vw, 160px)", fontWeight: 900,
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
  return (
    <section style={{ padding: "100px 24px", maxWidth: 1200, margin: "0 auto" }}>
      <AnimSection>
        <div className="export-layout" style={{
          display: "grid", gridTemplateColumns: "1fr 1fr",
          gap: 64, alignItems: "center",
        }}>
          {/* Text side */}
          <div className="export-text" style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
            <p style={{
              fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: "2px",
              color: "var(--accent-secondary-light)", marginBottom: 16,
              fontFamily: "var(--font-display)",
            }}>Pro Export</p>
            <h2 style={{
              fontSize: "clamp(30px, 4.5vw, 52px)", fontWeight: 800,
              letterSpacing: "-2px", lineHeight: 1.1, marginBottom: 24,
              fontFamily: "var(--font-display)",
            }}>
              Export in{" "}
              <span style={{ color: "var(--highlight)" }}>SRT</span> or{" "}
              <span style={{ color: "var(--highlight)" }}>Alpha Channel</span>
            </h2>
            <p style={{
              color: "var(--text-secondary)", fontSize: 16, lineHeight: 1.8,
              marginBottom: 36, maxWidth: 480,
            }}>
              For all the Pro-Editors, <strong style={{ color: "var(--text-primary)" }}>cross NLE support available</strong> to bring captions back locally in your own software of choice, both as Alpha channel or as an SRT File
            </p>

            {/* Format badges */}
            <div style={{ display: "flex", gap: 12, marginBottom: 36 }}>
              {["SRT File", "Alpha Channel"].map(label => (
                <div key={label} style={{
                  padding: "10px 22px", borderRadius: 10,
                  background: "rgba(72,166,128,0.08)", border: "1px solid rgba(72,166,128,0.2)",
                  fontSize: 14, fontWeight: 600, color: "var(--highlight)",
                  fontFamily: "var(--font-display)",
                }}>{label}</div>
              ))}
            </div>

            <a href="#pricing" style={{
              background: "var(--accent)", color: "#0a0a0a", padding: "14px 32px",
              borderRadius: 999, textDecoration: "none", fontSize: 15, fontWeight: 700,
              transition: "all 0.3s", fontFamily: "var(--font-display)",
              display: "inline-flex", alignItems: "center", gap: 10,
              boxShadow: "0 0 20px rgba(3,255,178,0.25)",
            }}
              onMouseEnter={e => { e.target.style.transform = "translateY(-2px)"; e.target.style.boxShadow = "0 0 30px rgba(3,255,178,0.4)"; }}
              onMouseLeave={e => { e.target.style.transform = "none"; e.target.style.boxShadow = "0 0 20px rgba(3,255,178,0.25)"; }}
            >
              Join now
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="7" y1="17" x2="17" y2="7" /><polyline points="7 7 17 7 17 17" />
              </svg>
            </a>
          </div>

          {/* Visual side — NLE cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* NLE logos card */}
            <div style={{
              background: "rgba(20,20,20,0.6)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 20, padding: "40px 36px",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 24,
            }}>
              <p style={{
                fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: "1.5px",
                color: "var(--text-muted)", fontFamily: "var(--font-display)",
              }}>Compatible with</p>
              <NLELogos size={64} />
              <div style={{ display: "flex", gap: 20 }}>
                {["Premiere Pro", "Final Cut", "DaVinci"].map(name => (
                  <span key={name} style={{
                    fontSize: 12, color: "var(--text-muted)", fontFamily: "var(--font-display)",
                    fontWeight: 500,
                  }}>{name}</span>
                ))}
              </div>
            </div>

            {/* Workflow mini */}
            <div style={{
              display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12,
            }}>
              {[
                { icon: "↑", label: "Export from NLE", desc: "Upload your video" },
                { icon: "✦", label: "Generate Captions", desc: "AI-powered accuracy" },
                { icon: "⚡", label: "Render", desc: "SRT or Alpha Channel" },
                { icon: "↓", label: "Import Back", desc: "Into your NLE" },
              ].map((step, i) => (
                <div key={i} style={{
                  background: "rgba(20,20,20,0.6)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: 14, padding: "20px 18px",
                  transition: "all 0.25s",
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(3,255,178,0.2)"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; }}
                >
                  <span style={{ fontSize: 20, marginBottom: 8, display: "block" }}>{step.icon}</span>
                  <div style={{ fontSize: 13, fontWeight: 700, fontFamily: "var(--font-display)", marginBottom: 2 }}>{step.label}</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{step.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </AnimSection>
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
    <section style={{ padding: "80px 24px", maxWidth: 1100, margin: "0 auto" }}>
      <AnimSection>
        <div className="audio-card" style={{
          background: "rgba(20,20,20,0.6)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 24, padding: "56px 48px",
          display: "grid", gridTemplateColumns: "1fr 1fr",
          gap: 48, alignItems: "center",
        }}>
          {/* Text content */}
          <div>
            <p style={{
              fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: "2px",
              color: "var(--accent-secondary-light)", marginBottom: 16,
              fontFamily: "var(--font-display)",
            }}>Audio AI</p>
            <h2 style={{
              fontSize: "clamp(28px, 3.5vw, 44px)", fontWeight: 800,
              letterSpacing: "-1.5px", lineHeight: 1.15, marginBottom: 28,
              fontFamily: "var(--font-display)",
            }}>
              State of The Art
              <br />
              <span style={{ color: "var(--highlight)" }}>Audio Enhancement!</span>
            </h2>

            <p style={{
              color: "var(--text-secondary)", fontSize: 16, lineHeight: 1.8, marginBottom: 36,
            }}>
              <strong style={{ color: "var(--text-primary)" }}>Kalakar</strong> offers{" "}
              <strong style={{ color: "var(--text-primary)" }}>Studio Grade Audio Enhancement</strong> using complex{" "}
              Algorithms & AI. Tested for Harsh Traffic, white noise, crowds, hiss or any other Noise Pattern.
            </p>

            <div className="audio-pills" style={{ display: "flex", gap: 12 }}>
              {[
                { icon: "⏱", label: "Works in Seconds" },
                { icon: "▶", label: "Realtime Playback" },
                { icon: "✦", label: "Studio Quality" },
              ].map(({ icon, label }) => (
                <div key={label} style={{
                  padding: "10px 18px", borderRadius: 999,
                  background: "rgba(124,58,237,0.06)",
                  border: "1px solid rgba(124,58,237,0.15)",
                  fontSize: 13, fontWeight: 500, color: "var(--accent-secondary-light)",
                  fontFamily: "var(--font-display)",
                  display: "flex", alignItems: "center", gap: 6,
                }}>
                  <span style={{ fontSize: 12 }}>{icon}</span> {label}
                </div>
              ))}
            </div>
          </div>

          {/* Video with toggle */}
          <div style={{ position: "relative" }}>
            <div style={{
              width: "100%", aspectRatio: "4/5",
              borderRadius: 20, overflow: "hidden",
              border: "1px solid rgba(255,255,255,0.06)",
              position: "relative", background: "#000",
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
    <section id="pricing" style={{ padding: "100px 24px", maxWidth: 1200, margin: "0 auto" }}>
      <AnimSection>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <p style={{
            fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: "2px",
            color: "var(--highlight)", marginBottom: 12, fontFamily: "var(--font-display)",
          }}>Pricing</p>
          <h2 style={{
            fontSize: "clamp(32px, 5vw, 52px)", fontWeight: 800,
            letterSpacing: "-2px", marginBottom: 24,
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
                borderRadius: 20, padding: "32px 28px",
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
                  fontSize: 18, fontWeight: 700, color: "var(--text-primary)", marginBottom: 16,
                  fontFamily: "var(--font-display)",
                }}>{plan.name}</div>

                {/* Price */}
                <div style={{ marginBottom: 4 }}>
                  <span style={{
                    fontSize: "clamp(32px, 4vw, 40px)", fontWeight: 800,
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
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 28 }}>
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
                    display: "block", textAlign: "center", padding: "14px",
                    borderRadius: 12, textDecoration: "none", fontWeight: 600, fontSize: 14,
                    fontFamily: "var(--font-display)",
                    background: plan.popular ? "var(--accent)" : "transparent",
                    color: plan.popular ? "#0a0a0a" : "var(--text-secondary)",
                    border: plan.popular ? "none" : "1px solid rgba(255,255,255,0.1)",
                    marginBottom: 28, transition: "all 0.25s",
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
                <div style={{ height: 1, background: "rgba(255,255,255,0.06)", marginBottom: 24 }} />

                {/* Features label */}
                <div style={{
                  fontSize: 12, fontWeight: 700, color: "var(--text-muted)", marginBottom: 16,
                  textTransform: "uppercase", letterSpacing: "1px",
                  fontFamily: "var(--font-display)",
                }}>{plan.featuresLabel}</div>

                {/* Features list */}
                <div style={{ flex: 1 }}>
                  {plan.features.map((f, fi) => (
                    <div key={fi} style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 12 }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}>
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <span style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5 }}>{f}</span>
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
      <div style={{ flex: 1, position: "relative", minHeight: 280 }}>
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
      padding: 28, display: "flex", flexDirection: "column", justifyContent: "space-between",
      transition: "all 0.3s", ...cardStyle,
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(3,255,178,0.2)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; e.currentTarget.style.transform = "none"; }}
    >
      <div>
        <StarRow />
        {text && <p style={{ fontSize: 15, color: "var(--text-secondary)", lineHeight: 1.7, marginTop: 14 }}>{text}</p>}
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
    <section id="reviews" style={{ padding: "100px 24px", overflow: "hidden" }}>
      <AnimSection>
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <p style={{
            fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: "2px",
            color: "var(--gold)", marginBottom: 12, fontFamily: "var(--font-display)",
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

// ——— MAGIC TEXT (scroll-reveal word-by-word) ———
function MagicWord({ children, progress, range }) {
  const opacity = useTransform(progress, range, [0, 1]);
  return (
    <span style={{
      position: "relative", marginTop: 12, marginRight: 6,
      fontSize: "clamp(18px, 2.8vw, 28px)", fontWeight: 500, lineHeight: 1.8,
      fontFamily: "var(--font-body)",
    }}>
      <span style={{ opacity: 0.12 }}>{children}</span>
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
    <p ref={container} style={{ display: "flex", flexWrap: "wrap", lineHeight: 0.5, padding: "8px 0" }}>
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
    <section id="why" style={{ padding: "100px 24px", maxWidth: 800, margin: "0 auto" }}>
      <AnimSection>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
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
      <div style={{
        background: "rgba(20,20,20,0.4)",
        border: "1px solid rgba(255,255,255,0.04)",
        borderRadius: 24, padding: "48px 40px",
        borderLeft: "3px solid var(--highlight)",
      }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {paragraphs.map((p, i) => (
            <MagicText key={i} text={p} />
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
    <section style={{ padding: "100px 24px", maxWidth: 760, margin: "0 auto" }}>
      <AnimSection>
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <p style={{
            fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: "2px",
            color: "var(--accent-secondary-light)", marginBottom: 12, fontFamily: "var(--font-display)",
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

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
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
                justifyContent: "space-between", padding: "20px 24px",
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
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 7,
              background: "linear-gradient(135deg, var(--accent), var(--accent-light))",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 14, color: "#fff",
            }}>K</div>
            <span style={{
              fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 16,
              color: "var(--text-primary)",
            }}>Kalakar</span>
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
