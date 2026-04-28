import { useEffect, useState } from "react";

const links = ["About", "Privacy", "Terms", "Contact", "Blog"];
const social = ["public", "alternate_email", "work", "share"];
const icon = { fontFamily: '"Material Symbols Outlined","Material Icons",sans-serif', fontSize: 18, lineHeight: 1 };

export default function Footer() {
  const [mobile, setMobile] = useState(typeof window !== "undefined" ? window.innerWidth < 768 : false);
  useEffect(() => {
    const onResize = () => setMobile(window.innerWidth < 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return (
    <footer style={{ background: "#F3F4F6", borderTop: "1px solid #E5E7EB", padding: 16 }}>
      <div style={{ display: "flex", flexDirection: mobile ? "column" : "row", gap: 12, alignItems: mobile ? "flex-start" : "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
          {links.map((item) => <a key={item} href="#" style={{ color: "#4B5563", textDecoration: "none", fontSize: 14 }}>{item}</a>)}
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          {social.map((item) => <a key={item} href="#" aria-label={item} style={{ color: "#6B7280", textDecoration: "none" }}><span aria-hidden="true" style={icon}>{item}</span></a>)}
        </div>
      </div>
      <p style={{ margin: "12px 0 0", color: "#6B7280", fontSize: 14 }}>Copyright 2026 JobPortal. All rights reserved.</p>
    </footer>
  );
}
