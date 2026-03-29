import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

const API_URL = "http://localhost:5000/api";

// --- HELPERS ---
const formatArrivalTime = (minutesToAdd) => {
  const now = new Date();
  now.setMinutes(now.getMinutes() + minutesToAdd);
  return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

// --- WOW FACTOR LOGO COMPONENT ---
const SmartQLogo = () => (
  <motion.svg
    width="200"
    height="100"
    viewBox="0 0 300 100"
    initial="initial"
    animate="animate"
    style={{ margin: '0 auto 10px auto', display: 'block' }}
  >
    <defs>
      <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#38bdf8" />
        <stop offset="100%" stopColor="#c084fc" />
      </linearGradient>
      <filter id="glow">
        <feGaussianBlur stdDeviation="3.5" result="coloredBlur" />
        <feMerge>
          <feMergeNode in="coloredBlur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
    {[0, 1, 2, 3].map((index) => (
      <motion.rect
        key={index}
        x={70 + index * 40}
        y={30}
        width="30"
        height="40"
        rx="8"
        fill="url(#logoGradient)"
        filter="url(#glow)"
        custom={index}
        variants={{
          initial: { opacity: 0, x: -50 },
          animate: (i) => ({
            opacity: [0.3, 1, 0.3],
            x: 0,
            transition: {
              delay: i * 0.15,
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut"
            }
          })
        }}
      />
    ))}
  </motion.svg>
);

// --- GLOBAL STYLES ---
const GlobalStyles = () => (
  <style>{`
    @keyframes shimmer {
      0% { background-position: -200% center; }
      100% { background-position: 200% center; }
    }
    @keyframes pulse-glow {
      0%, 100% { opacity: 0.4; filter: blur(25px); }
      50% { opacity: 0.7; filter: blur(40px); }
    }
    .shimmer-text {
      background: linear-gradient(90deg, #38bdf8, #c084fc, #38bdf8);
      background-size: 200% auto;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      animation: shimmer 3s linear infinite;
    }
    .bg-glow {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 600px;
      height: 600px;
      background: radial-gradient(circle, rgba(56,189,248,0.15) 0%, rgba(0,0,0,0) 70%);
      z-index: -1;
      animation: pulse-glow 4s ease-in-out infinite;
    }
  `}</style>
);

const containerVar = {
  animate: { transition: { staggerChildren: 0.1 } }
};

const itemVar = {
  initial: { y: 30, opacity: 0 },
  animate: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 120 } },
  exit: { scale: 0.9, opacity: 0 }
};

const styles = {
  appBg: { minHeight: "100vh", background: "#020617", color: "#fff", display: "flex", justifyContent: "center", alignItems: "center", fontFamily: "'Plus Jakarta Sans', sans-serif", padding: "20px", overflowX: "hidden" },
  logoText: { fontSize: "clamp(3rem, 10vw, 5rem)", fontWeight: "900", textAlign: "center", marginBottom: "30px", letterSpacing: "-2px" },
  glassCard: { background: "rgba(15, 23, 42, 0.7)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.08)", padding: "40px", borderRadius: "40px", width: "100%", maxWidth: "420px", textAlign: "center", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)" },
  input: { width: "100%", padding: "14px", marginBottom: "12px", borderRadius: "14px", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "#fff", outline: "none" },
  select: { width: "100%", padding: "14px", marginBottom: "12px", borderRadius: "14px", background: "#1e293b", color: "#fff", border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer" },
  btnMain: { width: "100%", padding: "16px", background: "linear-gradient(135deg, #38bdf8, #818cf8)", color: "#fff", border: "none", borderRadius: "18px", fontWeight: "bold", cursor: "pointer", boxShadow: "0 10px 20px rgba(56, 189, 248, 0.3)" },
  shopCard: { background: "rgba(255, 255, 255, 0.03)", padding: "25px", borderRadius: "30px", border: "1px solid rgba(255,255,255,0.08)", position: "relative" },
  badge: { padding: "6px 14px", borderRadius: "100px", fontSize: "0.8rem", fontWeight: "600", marginRight: "8px", display: "inline-block" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "25px", width: "100%", maxWidth: "1200px" },
  timeInfo: { marginTop: "12px", fontSize: "0.85rem", color: "#38bdf8", fontWeight: "700" }
};

function App() {
  const [view, setView] = useState("loading");
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [user, setUser] = useState(null);
  const [providers, setProviders] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const refreshData = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/providers`);
      const data = await res.json();
      setProviders(Array.isArray(data) ? data : []);
      const saved = localStorage.getItem("smartq_user");
      if (saved) {
        const current = JSON.parse(saved);
        const me = data.find(p => p.providerId === current.providerId || p._id === current._id);
        if (me) setUser(me);
      }
    } catch (e) { console.error("Sync Error"); }
  }, []);

  useEffect(() => {
    refreshData().then(() => {
      const saved = localStorage.getItem("smartq_user");
      if (saved) {
        const p = JSON.parse(saved);
        setUser(p);
        setView(p.businessName ? "dashboardProvider" : "categorySelect");
      } else setView("landing");
    });
  }, [refreshData]);

  const handleAuth = async (e, role) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    const path = role === "provider" ? (isLoginMode ? "/provider/login" : "/provider/register") : (isLoginMode ? "/customer/login" : "/customer/register");
    try {
      const res = await fetch(`${API_URL}${path}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      const result = await res.json();
      if (res.ok) {
        localStorage.setItem("smartq_user", JSON.stringify(result));
        setUser(result);
        setView(result.businessName ? "dashboardProvider" : "categorySelect");
        refreshData();
      } else { alert(result.message); }
    } catch (err) { alert("Server Error"); }
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
    setView("landing");
  };

  if (view === "loading") return <div style={styles.appBg}>⚡ Powering Up Experience...</div>;

  return (
    <div style={styles.appBg}>
      <GlobalStyles />
      <div className="bg-glow" />
      
      <AnimatePresence mode="wait">
        {view === "landing" && (
          <motion.div key="l" variants={containerVar} initial="initial" animate="animate" exit="exit" style={{textAlign: 'center'}}>
            <motion.div variants={itemVar}><SmartQLogo /></motion.div>
            <motion.h1 variants={itemVar} className="shimmer-text" style={styles.logoText}>SmartQ</motion.h1>
            <motion.div variants={itemVar} style={{ display: "flex", gap: "20px", justifyContent: "center" }}>
              <motion.button whileHover={{ scale: 1.05 }} onClick={() => setView("authProvider")} style={styles.btnMain}>Business Portal</motion.button>
              <motion.button whileHover={{ scale: 1.05 }} onClick={() => setView("authCustomer")} style={{ ...styles.btnMain, background: "transparent", border: "2px solid #38bdf8" }}>Customer Portal</motion.button>
            </motion.div>
          </motion.div>
        )}

        {(view === "authProvider" || view === "authCustomer") && (
          <motion.div key="a" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={styles.glassCard}>
            <h2 style={{marginBottom: '25px', fontSize: '1.8rem'}}>{isLoginMode ? "Welcome Back" : "Create Account"}</h2>
            <form onSubmit={(e) => handleAuth(e, view === "authProvider" ? "provider" : "customer")}>
              <input name={view === "authProvider" ? "providerId" : "userId"} placeholder="Username" style={styles.input} required />
              <input name="password" type="password" placeholder="Password" style={styles.input} required />
              {!isLoginMode && (
                <div style={{ width: '100%' }}>
                  <input name="name" placeholder="Full Name" style={styles.input} required />
                  {view === "authProvider" && (
                    <>
                      <input name="businessName" placeholder="Business Name" style={styles.input} required />
                      <select name="type" style={styles.select}>
                        <option value="Restaurant">Restaurant</option>
                        <option value="Hospital">Hospital</option>
                        <option value="Salon">Salon</option>
                        <option value="Other">Other Business</option>
                      </select>
                      <input name="location" placeholder="City" style={styles.input} required />
                    </>
                  )}
                </div>
              )}
              <motion.button whileTap={{scale: 0.95}} style={styles.btnMain}>{isLoginMode ? "Sign In" : "Register Now"}</motion.button>
            </form>
            <p onClick={() => setIsLoginMode(!isLoginMode)} style={{ marginTop: "20px", cursor: "pointer", color: "#38bdf8" }}>{isLoginMode ? "New? Sign Up" : "Back to Login"}</p>
            <button onClick={() => setView("landing")} style={{ background: "none", border: "none", color: "#666", marginTop: "15px", cursor: 'pointer' }}>← Back</button>
          </motion.div>
        )}

        {view === "categorySelect" && (
          <motion.div key="c" variants={containerVar} initial="initial" animate="animate" style={{ width: "100%", maxWidth: "1000px" }}>
            <motion.h2 variants={itemVar} style={{ textAlign: "center", marginBottom: "40px", fontSize: '2.5rem' }}>Hello, {user?.name?.split(' ')[0]}!</motion.h2>
            <div style={styles.grid}>
              {[
                { n: "Restaurant", i: "🍔", c: "#f59e0b" },
                { n: "Hospital", i: "🏥", c: "#ef4444" },
                { n: "Salon", i: "✂️", c: "#c084fc" },
                { n: "Other", i: "🏪", c: "#10b981" }
              ].map((cat) => (
                <motion.div key={cat.n} variants={itemVar} whileHover={{ y: -15, borderColor: cat.c }} onClick={() => { setSelectedCategory(cat.n); setView("dashboardCustomer"); }} 
                  style={{ ...styles.shopCard, textAlign: "center", borderBottom: `4px solid ${cat.c}`, cursor: 'pointer' }}>
                  <div style={{ fontSize: "4rem", marginBottom: '10px' }}>{cat.i}</div>
                  <h3 style={{fontSize: '1.5rem'}}>{cat.n}s</h3>
                </motion.div>
              ))}
            </div>
            <center><button onClick={logout} style={{ marginTop: "50px", color: "#64748b", background: "none", border: "1px solid #334155", padding: "10px 25px", borderRadius: "15px", cursor: 'pointer' }}>Logout</button></center>
          </motion.div>
        )}

        {view === "dashboardCustomer" && (
          <motion.div key="dc" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ width: "100%", maxWidth: "1200px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "40px" }}>
              <h2 className="shimmer-text" style={{ fontSize: '2.5rem' }}>{selectedCategory}s</h2>
              <button onClick={() => setView("categorySelect")} style={{ background: "#1e293b", border: "none", color: "#fff", padding: "12px 25px", borderRadius: "15px", cursor: 'pointer' }}>Back</button>
            </div>
            <div style={styles.grid}>
              {providers.filter(p => p.type === selectedCategory).map(p => {
                const count = p.queue?.length || 0;
                const waitTime = count * (p.avgServiceTime || 20);
                const expectedTime = formatArrivalTime(waitTime);
                return (
                  <motion.div key={p._id} whileHover={{scale: 1.03}} style={{...styles.shopCard, background: 'rgba(15, 23, 42, 0.8)'}}>
                    <h3 style={{fontSize: '1.8rem'}}>{p.businessName}</h3>
                    <p style={{ opacity: 0.5, marginBottom: '20px' }}>📍 {p.location}</p>
                    <div style={{ marginBottom: "15px" }}>
                      <span style={{ ...styles.badge, background: "rgba(56,189,248,0.1)", color: "#38bdf8" }}>👥 {count} in line</span>
                      <span style={{ ...styles.badge, background: waitTime > 45 ? "rgba(239,68,68,0.1)" : "rgba(16,185,129,0.1)", color: waitTime > 45 ? "#f87171" : "#34d399" }}>
                        🕐 {waitTime === 0 ? "No Wait" : `${waitTime}m Wait`}
                      </span>
                    </div>
                    {waitTime > 0 && <div style={styles.timeInfo}>✨ Estimated arrival: {expectedTime}</div>}
                    <motion.button whileHover={{scale: 1.05}} whileTap={{scale: 0.95}} onClick={async () => {
                      await fetch(`${API_URL}/join/${p._id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ customerName: user?.name, mobile: user?.mobile }) });
                      alert(`Joined! Expected arrival: ${expectedTime}`); 
                      refreshData();
                    }} style={{...styles.btnMain, marginTop: '20px', background: '#10b981'}}>Join Queue Now</motion.button>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {view === "dashboardProvider" && (
          <motion.div key="dp" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ width: "100%", maxWidth: "800px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
              <h2 style={{fontSize: '2rem'}}>{user?.businessName}</h2>
              <button onClick={logout} style={{ color: "#ef4444", background: "none", border: "1px solid #ef4444", padding: "10px 20px", borderRadius: "12px", cursor: 'pointer' }}>Logout</button>
            </div>
            <div style={{...styles.glassCard, maxWidth: '100%', textAlign: 'left'}}>
              <h3 style={{ marginBottom: "25px", borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>Active Queue ({user?.queue?.length || 0})</h3>
              {user?.queue?.map((q, i) => (
                <motion.div key={i} layout initial={{x: -20, opacity: 0}} animate={{x: 0, opacity: 1}} style={{ display: "flex", justifyContent: "space-between", alignItems: 'center', padding: "20px", background: "rgba(255,255,255,0.04)", borderRadius: "18px", marginBottom: "12px" }}>
                  <div>
                    <span style={{color: '#38bdf8', fontWeight: '800', marginRight: '15px'}}>#{i + 1}</span>
                    <span style={{ fontSize: "1.2rem", fontWeight: '500' }}>{q.customerName}</span>
                  </div>
                  <motion.button whileHover={{scale: 1.1}} onClick={async () => {
                    await fetch(`${API_URL}/complete/${user._id}/${i}`, { method: "POST" });
                    refreshData();
                  }} style={{ background: "#38bdf8", border: "none", padding: "10px 20px", borderRadius: "12px", fontWeight: "bold", color: '#0f172a', cursor: 'pointer' }}>Complete</motion.button>
                </motion.div>
              ))}
              {(!user?.queue || user.queue.length === 0) && <p style={{opacity: 0.5, textAlign: 'center', padding: '40px'}}>Queue is empty.</p>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;