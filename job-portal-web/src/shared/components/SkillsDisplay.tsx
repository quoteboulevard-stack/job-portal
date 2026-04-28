import { useState } from "react";
import Badge from "./Badge";

type Props = { skills: string[]; editable?: boolean; onRemove?: (skill: string) => void; onAdd?: (skill: string) => void };
const options = ["React", "TypeScript", "Node.js", "SQL", "Figma", "Python"];

export default function SkillsDisplay({ skills, editable = false, onRemove, onAdd }: Props) {
  const [adding, setAdding] = useState(false), [value, setValue] = useState("");
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
      {skills.map((skill) => (
        <Badge key={skill} text={skill} variant="blue" removable={editable} onClick={editable ? () => onRemove?.(skill) : undefined} />
      ))}
      {editable && !adding && (
        <button type="button" onClick={() => setAdding(true)} style={{ padding: "4px 8px", border: "1px solid #BFDBFE", borderRadius: 6, background: "#EFF6FF", color: "#2563EB", fontSize: 12, fontWeight: 700 }}>
          + Add
        </button>
      )}
      {editable && adding && (
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <input
            aria-label="Add skill"
            list="skills-display-options"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Skill"
            style={{ padding: "6px 10px", border: "1px solid #E5E7EB", borderRadius: 6 }}
          />
          <datalist id="skills-display-options">{options.map((item) => <option key={item} value={item} />)}</datalist>
          <button type="button" onClick={() => { if (value) onAdd?.(value); setValue(""); setAdding(false); }} style={{ padding: "6px 10px", border: 0, borderRadius: 6, background: "#3B82F6", color: "#FFF" }}>
            Add
          </button>
        </div>
      )}
    </div>
  );
}
