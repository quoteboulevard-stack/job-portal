import type { Filters } from "../../features/jobs/components/FilterModal";

type Props = { filters: Filters; clearPending: boolean; onChange: (filters: Filters) => void; onRequestClear: () => void; onConfirmClear: () => void };
const workModes = ["remote", "hybrid", "onsite"];
const employmentTypes = ["fulltime", "parttime", "contract", "internship", "freelance"];
const levels = ["entry", "mid", "senior"];
const skillOptions = ["React", "TypeScript", "Node.js", "Figma"];

export default function Sidebar({ filters, clearPending, onChange, onRequestClear, onConfirmClear }: Props) {
  const toggleWorkMode = (value: string) => onChange({ ...filters, workMode: filters.workMode.includes(value) ? filters.workMode.filter((v) => v !== value) : [...filters.workMode, value] });
  const toggleEmploymentType = (value: string) => onChange({ ...filters, employmentType: filters.employmentType.includes(value) ? filters.employmentType.filter((v) => v !== value) : [...filters.employmentType, value] });
  const addSkill = (value: string) => value && !filters.skills.includes(value) && onChange({ ...filters, skills: [...filters.skills, value] });
  return (
    <aside className="grid w-[280px] gap-3 rounded-lg border border-border-gray bg-white p-4">
      <strong className="text-base text-gray-900">Filters</strong>
      <label className="text-sm text-gray-700">Location<input aria-label="Location" list="locations" name="location" autoComplete="off" value={filters.location} onChange={(e) => onChange({ ...filters, location: e.target.value })} placeholder={"Search location…"} className="mt-1 w-full rounded-lg border border-border-gray px-3 py-2 focus-visible:border-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200" /></label>
      <datalist id="locations"><option value="Bangalore" /><option value="Remote" /><option value="Mumbai" /></datalist>
      <fieldset className="m-0 border-0 p-0"><legend className="text-sm font-semibold">Work Mode</legend>{workModes.map((item) => <label key={item} className="block text-sm text-gray-700"><input type="checkbox" name="workMode" checked={filters.workMode.includes(item)} onChange={() => toggleWorkMode(item)} /> <span className="ml-2">{item}</span></label>)}</fieldset>
      <fieldset className="m-0 border-0 p-0"><legend className="text-sm font-semibold">Employment Type</legend>{employmentTypes.map((item) => <label key={item} className="block text-sm text-gray-700"><input type="checkbox" name="employmentType" checked={filters.employmentType.includes(item)} onChange={() => toggleEmploymentType(item)} /> <span className="ml-2">{item}</span></label>)}</fieldset>
      <label className="text-sm text-gray-700">Salary Range: ${filters.salary}k<input aria-label="Salary range" type="range" name="salary" min="0" max="50" value={filters.salary} onChange={(e) => onChange({ ...filters, salary: Number(e.target.value) })} className="mt-1 w-full" /></label>
      <fieldset className="m-0 border-0 p-0"><legend className="text-sm font-semibold">Experience Level</legend>{levels.map((item) => <label key={item} className="block text-sm text-gray-700"><input type="radio" name="experience" checked={filters.experience === item} onChange={() => onChange({ ...filters, experience: item })} /> <span className="ml-2">{item}</span></label>)}</fieldset>
      <label className="text-sm text-gray-700">Skills<select aria-label="Skills" name="skills" defaultValue="" onChange={(e) => addSkill(e.target.value)} className="mt-1 w-full rounded-lg border border-border-gray px-3 py-2 focus-visible:border-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200"><option value="">Add skill</option>{skillOptions.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
      <div className="flex flex-wrap gap-2">{filters.skills.map((item) => <button key={item} type="button" aria-label={`Remove ${item} skill`} onClick={() => onChange({ ...filters, skills: filters.skills.filter((v) => v !== item) })} className="rounded-md bg-blue-600 px-2 py-1 text-xs font-semibold text-white hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-blue">{item} x</button>)}</div>
      {clearPending && <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">Clear all filters? <button type="button" onClick={onConfirmClear} className="ml-2 rounded px-2 py-1 font-semibold text-yellow-900 underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500">Confirm</button></div>}
      <button type="button" onClick={onRequestClear} className="rounded-lg border border-border-gray bg-white px-3 py-2 text-gray-700 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-blue">Clear Filters</button>
    </aside>
  );
}
