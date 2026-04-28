import { useState } from "react";

type Data = { personal: { name: string; email: string; phone: string }; experience: { company: string; role: string; duration: string; description: string }; education: { school: string; degree: string; year: string }; skills: string[] };
const skillOptions = ["React", "TypeScript", "Node.js", "SQL", "Figma"];

export default function ResumeEditor() {
  const [open, setOpen] = useState("personal"), [skillInput, setSkillInput] = useState(""), [errors, setErrors] = useState<Record<string, string>>({});
  const [data, setData] = useState<Data>({ personal: { name: "", email: "", phone: "" }, experience: { company: "", role: "", duration: "", description: "" }, education: { school: "", degree: "", year: "" }, skills: [] });
  const save = (section: keyof Data) => {
    const value = data[section], invalid = Object.values(section === "skills" ? { skills: data.skills.length ? "ok" : "" } : value as Record<string, string>).some((v) => !v);
    setErrors((s) => ({ ...s, [section]: invalid ? "Please complete all fields." : "" }));
    if (!invalid) setOpen("");
  };
  const section = (key: keyof Data, title: string, body: React.ReactNode) => (
    <div style={{ border: "1px solid #E5E7EB", borderRadius: 8, padding: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><strong>{title}</strong><button type="button" onClick={() => setOpen(open === key ? "" : key)}>{open === key ? "Close" : "Edit"}</button></div>
      {open === key && <div style={{ display: "grid", gap: 8, marginTop: 12 }}>{body}<button type="button" onClick={() => save(key)}>Save</button>{errors[key] && <span style={{ color: "#EF4444", fontSize: 14 }}>{errors[key]}</span>}</div>}
    </div>
  );
  return (
    <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: 16, padding: 16 }}>
      <div style={{ display: "grid", gap: 12 }}>
        {section("personal", "Personal", <>
          <input aria-label="Name" value={data.personal.name} onChange={(e) => setData({ ...data, personal: { ...data.personal, name: e.target.value } })} placeholder="Name" />
          <input aria-label="Email" value={data.personal.email} onChange={(e) => setData({ ...data, personal: { ...data.personal, email: e.target.value } })} placeholder="Email" />
          <input aria-label="Phone" value={data.personal.phone} onChange={(e) => setData({ ...data, personal: { ...data.personal, phone: e.target.value } })} placeholder="Phone" />
        </>)}
        {section("experience", "Experience", <>
          <input aria-label="Company" value={data.experience.company} onChange={(e) => setData({ ...data, experience: { ...data.experience, company: e.target.value } })} placeholder="Company" />
          <input aria-label="Role" value={data.experience.role} onChange={(e) => setData({ ...data, experience: { ...data.experience, role: e.target.value } })} placeholder="Role" />
          <input aria-label="Duration" value={data.experience.duration} onChange={(e) => setData({ ...data, experience: { ...data.experience, duration: e.target.value } })} placeholder="Duration" />
          <textarea aria-label="Experience description" value={data.experience.description} onChange={(e) => setData({ ...data, experience: { ...data.experience, description: e.target.value } })} placeholder="Description" />
        </>)}
        {section("education", "Education", <>
          <input aria-label="School" value={data.education.school} onChange={(e) => setData({ ...data, education: { ...data.education, school: e.target.value } })} placeholder="School" />
          <input aria-label="Degree" value={data.education.degree} onChange={(e) => setData({ ...data, education: { ...data.education, degree: e.target.value } })} placeholder="Degree" />
          <input aria-label="Year" value={data.education.year} onChange={(e) => setData({ ...data, education: { ...data.education, year: e.target.value } })} placeholder="Year" />
        </>)}
        {section("skills", "Skills", <>
          <input aria-label="Skills autocomplete" list="skills-list" value={skillInput} onChange={(e) => setSkillInput(e.target.value)} placeholder="Add a skill" />
          <datalist id="skills-list">{skillOptions.map((item) => <option key={item} value={item} />)}</datalist>
          <button type="button" onClick={() => { if (skillInput && !data.skills.includes(skillInput)) setData({ ...data, skills: [...data.skills, skillInput] }); setSkillInput(""); }}>Add Skill</button>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{data.skills.map((item) => <button key={item} type="button" onClick={() => setData({ ...data, skills: data.skills.filter((v) => v !== item) })}>{item} x</button>)}</div>
        </>)}
      </div>
      <aside style={{ border: "1px solid #E5E7EB", borderRadius: 8, padding: 16, background: "#FFF" }}>
        <h2 style={{ marginTop: 0 }}>Resume Preview</h2>
        <p style={{ margin: "0 0 8px" }}><strong>{data.personal.name || "Your Name"}</strong></p>
        <p style={{ margin: "0 0 12px", color: "#6B7280" }}>{data.personal.email || "email@example.com"} {data.personal.phone && `| ${data.personal.phone}`}</p>
        <p style={{ margin: "0 0 8px" }}><strong>{data.experience.role || "Role"}</strong> {data.experience.company && `at ${data.experience.company}`}</p>
        <p style={{ margin: "0 0 12px", color: "#6B7280" }}>{data.experience.duration}</p>
        <p style={{ margin: "0 0 12px" }}>{data.experience.description}</p>
        <p style={{ margin: "0 0 8px" }}><strong>{data.education.degree || "Degree"}</strong> {data.education.school && `- ${data.education.school}`}</p>
        <p style={{ margin: "0 0 12px", color: "#6B7280" }}>{data.education.year}</p>
        <p style={{ margin: 0 }}><strong>Skills:</strong> {data.skills.join(", ") || "Add skills"}</p>
      </aside>
    </section>
  );
}
