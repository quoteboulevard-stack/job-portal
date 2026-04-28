import Sidebar from "../../../shared/components/Sidebar";
import FilterModal, { type Filters } from "./FilterModal";
import JobCard from "./JobCard";

type Job = { id: string; title: string; company: string; location: string; workMode: string; employmentType: string; salary?: number; skills: string[]; fitScore?: number };
type Props = { jobs: Job[]; loading?: boolean; loadingMore?: boolean; search: string; page: number; pages: number; filters: Filters; filtersOpen: boolean; clearPending: boolean; onSearch: (value: string) => void; onPage: (value: number) => void; onFilters: (value: Filters) => void; onFiltersOpen: (value: boolean) => void; onRequestClear: () => void; onConfirmClear: () => void };

export default function JobListLayout({ jobs, loading = false, loadingMore = false, search, page, pages, filters, filtersOpen, clearPending, onSearch, onPage, onFilters, onFiltersOpen, onRequestClear, onConfirmClear }: Props) {
  return (
    <section id="main-content" className="px-4 py-4 lg:grid lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-4">
      <aside className="hidden lg:block"><Sidebar filters={filters} clearPending={clearPending} onChange={onFilters} onRequestClear={onRequestClear} onConfirmClear={onConfirmClear} /></aside>
      <div className="grid gap-4">
        <div className="flex items-center justify-between gap-3 lg:hidden">
          <button type="button" aria-label="Open filters" onClick={() => onFiltersOpen(true)} className="inline-flex h-11 items-center rounded-lg border border-border-gray bg-bg-white px-4 text-sm font-semibold text-secondary-gray focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-blue">Filters</button>
        </div>
        <div className="mb-2">
          <label htmlFor="job-search" className="mb-2 block text-sm font-medium text-gray-700">Search Jobs</label>
          <input id="job-search" type="search" name="search" aria-label="Search jobs by title, company, or skills" value={search} onChange={(e) => onSearch(e.target.value)} placeholder={"Search by title, company, skills\u2026"} className="w-full rounded-lg border-2 border-gray-300 px-4 py-2 text-base focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 md:text-lg" />
        </div>
        {loading ? <div className="grid gap-3">{[1, 2, 3].map((i) => <div key={i} className="h-[140px] rounded-lg border border-border-gray bg-[#F3F4F6]" />)}</div> : jobs.length ? <div className="grid gap-3">{jobs.map((job) => <JobCard key={job.id} job={job} isJobSeeker />)}</div> : <div className="grid min-h-[240px] place-items-center gap-2 rounded-lg border border-border-gray text-secondary-gray"><div className="h-[72px] w-[72px] rounded-full bg-border-gray" /><p className="m-0">No jobs matched your search.</p></div>}
        {loadingMore && <p className="text-sm text-secondary-gray">Loading more jobs…</p>}
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => onPage(Math.max(1, page - 1))} disabled={page === 1} className="rounded-lg border border-border-gray bg-bg-white px-3 py-2 text-sm text-secondary-gray disabled:opacity-50">Prev</button>
          {Array.from({ length: pages }, (_, i) => i + 1).map((n) => <button key={n} type="button" onClick={() => onPage(n)} aria-current={n === page} className="rounded-lg border border-border-gray bg-bg-white px-3 py-2 text-sm text-secondary-gray aria-[current=true]:border-primary-blue aria-[current=true]:text-primary-blue">{n}</button>)}
          <button type="button" onClick={() => onPage(Math.min(pages, page + 1))} disabled={page === pages} className="rounded-lg border border-border-gray bg-bg-white px-3 py-2 text-sm text-secondary-gray disabled:opacity-50">Next</button>
        </div>
      </div>
      <FilterModal open={filtersOpen} initialFilters={filters} clearPending={clearPending} onClose={() => onFiltersOpen(false)} onApply={(value) => { onFilters(value); onFiltersOpen(false); }} onRequestClear={onRequestClear} onConfirmClear={onConfirmClear} />
    </section>
  );
}
