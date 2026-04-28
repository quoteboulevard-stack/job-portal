import { useEffect, useState } from "react";
import { useFocusTrap } from "../../../shared/hooks/useFocusTrap";

export type Filters = { location: string; workMode: string[]; employmentType: string[]; salary: number; experience: string; skills: string[] };
type Props = { open: boolean; initialFilters: Filters; clearPending: boolean; onClose: () => void; onApply: (filters: Filters) => void; onRequestClear: () => void; onConfirmClear: () => void };

const workModes = ["remote", "hybrid", "onsite"];
const employmentTypes = ["fulltime", "parttime", "contract", "internship", "freelance"];
const levels = ["entry", "mid", "senior"];
const skillOptions = ["React", "TypeScript", "Node.js", "Figma"];

export default function FilterModal({ open, initialFilters, clearPending, onClose, onApply, onRequestClear, onConfirmClear }: Props) {
  const [filters, setFilters] = useState(initialFilters);
  const { ref } = useFocusTrap(open, onClose);
  useEffect(() => setFilters(initialFilters), [initialFilters]);
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);
  if (!open) return null;
  const toggleWorkMode = (value: string) => setFilters((s) => ({ ...s, workMode: s.workMode.includes(value) ? s.workMode.filter((v) => v !== value) : [...s.workMode, value] }));
  const toggleEmploymentType = (value: string) => setFilters((s) => ({ ...s, employmentType: s.employmentType.includes(value) ? s.employmentType.filter((v) => v !== value) : [...s.employmentType, value] }));
  return (
    <div className="fixed inset-0 z-[100] grid items-end bg-black/30 md:items-center md:justify-end">
      <div ref={ref} role="dialog" aria-modal="true" aria-labelledby="filter-title" tabIndex={-1} className="grid max-h-[90vh] w-full gap-4 overflow-y-auto rounded-t-lg bg-white p-6 overscroll-contain md:w-96">
        <div className="flex items-center justify-between">
          <h2 id="filter-title" className="m-0 text-xl font-bold">Filters</h2>
          <button type="button" aria-label="Close filters" onClick={onClose} className="rounded-lg px-2 py-1 text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-blue">X</button>
        </div>
        <div>
          <label htmlFor="filter-location" className="mb-2 block text-sm font-semibold text-gray-700">Location</label>
          <input id="filter-location" name="location" type="text" autoComplete="off" value={filters.location} onChange={(e) => setFilters({ ...filters, location: e.target.value })} placeholder="e.g., Bangalore, Remote" className="w-full rounded-lg border-2 border-gray-300 px-3 py-2.5 focus-visible:border-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200" />
        </div>
        <fieldset className="m-0 border-0 p-0">
          <legend className="mb-2 text-sm font-semibold text-gray-700">Work Mode</legend>
          {workModes.map((item) => <label key={item} className="block text-sm text-gray-700"><input type="checkbox" name="workMode" checked={filters.workMode.includes(item)} onChange={() => toggleWorkMode(item)} /> <span className="ml-2">{item}</span></label>)}
        </fieldset>
        <fieldset className="m-0 border-0 p-0">
          <legend className="mb-2 text-sm font-semibold text-gray-700">Employment Type</legend>
          {employmentTypes.map((item) => <label key={item} className="block text-sm text-gray-700"><input type="checkbox" name="employmentType" checked={filters.employmentType.includes(item)} onChange={() => toggleEmploymentType(item)} /> <span className="ml-2">{item}</span></label>)}
        </fieldset>
        <fieldset className="m-0 border-0 p-0">
          <legend className="mb-2 text-sm font-semibold text-gray-700">Salary Range</legend>
          <label htmlFor="salary-range" className="mb-1 block text-xs text-secondary-gray">Salary: ${filters.salary}k</label>
          <input id="salary-range" name="salary" aria-label="Salary range" type="range" min="0" max="50" value={filters.salary} onChange={(e) => setFilters({ ...filters, salary: Number(e.target.value) })} className="w-full" />
        </fieldset>
        <fieldset className="m-0 border-0 p-0"><legend className="mb-2 text-sm font-semibold text-gray-700">Experience</legend>{levels.map((item) => <label key={item} className="block text-sm text-gray-700"><input type="radio" name="experience" checked={filters.experience === item} onChange={() => setFilters({ ...filters, experience: item })} /> <span className="ml-2">{item}</span></label>)}</fieldset>
        <div>
          <label htmlFor="filter-skills" className="mb-2 block text-sm font-semibold text-gray-700">Skills (Optional)</label>
          <select id="filter-skills" name="skills" defaultValue="" onChange={(e) => e.target.value && !filters.skills.includes(e.target.value) && setFilters({ ...filters, skills: [...filters.skills, e.target.value] })} className="w-full rounded-lg border-2 border-gray-300 px-3 py-2.5 focus-visible:border-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200"><option value="">Add skill</option>{skillOptions.map((item) => <option key={item} value={item}>{item}</option>)}</select>
        </div>
        <div className="flex flex-wrap gap-2">{filters.skills.map((item) => <button key={item} type="button" aria-label={`Remove ${item} skill`} onClick={() => setFilters({ ...filters, skills: filters.skills.filter((v) => v !== item) })} className="rounded-md bg-blue-600 px-2 py-1 text-xs font-semibold text-white hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-blue">{item} x</button>)}</div>
        {clearPending && <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">Clear all filters? <button type="button" onClick={onConfirmClear} className="ml-2 rounded px-2 py-1 font-semibold text-yellow-900 underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500">Confirm</button></div>}
        <div className="flex gap-3">
          <button type="button" onClick={onRequestClear} className="flex-1 rounded-lg border border-border-gray bg-gray-100 px-4 py-2.5 text-secondary-gray hover:bg-gray-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-blue">Clear All</button>
          <button type="button" onClick={() => onApply(filters)} className="flex-1 rounded-lg bg-green-500 px-4 py-2.5 text-white hover:bg-green-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500">Apply Filters</button>
        </div>
      </div>
    </div>
  );
}
