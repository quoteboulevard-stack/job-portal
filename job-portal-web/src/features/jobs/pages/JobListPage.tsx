import { useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import JobListLayout from "../components/JobListLayout";
import type { Filters } from "../components/FilterModal";
import { useJobs } from "../hooks/useJobs";
import "./JobListPage.css";

export default function JobListPage() {
  const { jobs, loading, loadingMore, hasMore, loadMore, error } = useJobs();
  const [params, setParams] = useSearchParams();
  const search = params.get("search") || "";
  const rawPage = Number(params.get("page") || "1");
  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
  const filtersOpen = params.get("filters") === "open";
  const clearPending = params.get("confirmClear") === "filters";
  const filters: Filters = {
    location: params.get("location") || "",
    workMode: params.getAll("workMode"),
    employmentType: params.getAll("employmentType"),
    salary: Number(params.get("salary") || "0"),
    experience: params.get("experience") || "entry",
    skills: params.getAll("skills"),
  };

  const updateParams = (
    next: Partial<Filters> & {
      search?: string;
      page?: number | string;
      filtersOpen?: boolean;
      clearPending?: boolean;
    }
  ) => {
    const nextParams = new URLSearchParams(params);
    const merged = { ...filters, search, page, filtersOpen, clearPending, ...next };

    nextParams.delete("workMode");
    nextParams.delete("employmentType");
    nextParams.delete("skills");
    ["search", "page", "location", "salary", "experience", "filters", "confirmClear"].forEach(
      (key) => nextParams.delete(key)
    );

    if (merged.search) nextParams.set("search", merged.search);
    if (String(merged.page) !== "1") nextParams.set("page", String(merged.page));
    if (merged.location) nextParams.set("location", merged.location);
    merged.workMode.forEach((m) => nextParams.append("workMode", m));
    merged.employmentType.forEach((t) => nextParams.append("employmentType", t));
    if (merged.salary > 0) nextParams.set("salary", String(merged.salary));
    if (merged.experience && merged.experience !== "entry") {
      nextParams.set("experience", merged.experience);
    }
    merged.skills.forEach((skill) => nextParams.append("skills", skill));
    if (merged.filtersOpen) nextParams.set("filters", "open");
    if (merged.clearPending) nextParams.set("confirmClear", "filters");
    setParams(nextParams);
  };

  const filtered = useMemo(() => {
    return jobs.filter((job) => {
      const haystack = [job.title, job.company, job.location, ...job.skills]
        .join(" ")
        .toLowerCase();
      const matchesSearch = haystack.includes(search.toLowerCase());
      const matchesLocation =
        !filters.location ||
        job.location.toLowerCase().includes(filters.location.toLowerCase());
      const matchesWorkMode = !filters.workMode.length || filters.workMode.includes(job.workMode);
      const matchesEmployment = !filters.employmentType.length || filters.employmentType.includes(job.employmentType);
      const matchesSalary = !job.salary || job.salary >= filters.salary * 1000;
      const matchesExperience =
        !filters.experience ||
        filters.experience === "entry" ||
        job.experience === filters.experience;
      const matchesSkills =
        !filters.skills.length ||
        filters.skills.every((skill) =>
          job.skills.some((item) => item.toLowerCase() === skill.toLowerCase())
        );

      return (
        matchesSearch &&
        matchesLocation &&
        matchesWorkMode &&
        matchesEmployment &&
        matchesSalary &&
        matchesExperience &&
        matchesSkills
      );
    });
  }, [filters.experience, filters.location, filters.workMode, filters.employmentType, filters.salary, filters.skills, jobs, search]);

  const pages = Math.max(1, Math.ceil(filtered.length / 6));
  const safePage = Math.min(page, pages);
  const visible = filtered.slice((safePage - 1) * 6, safePage * 6);

  // When the user pages to the last visible page and Firestore has more, fetch the next batch.
  useEffect(() => {
    if (safePage >= pages && hasMore && !loadingMore && !loading) {
      void loadMore();
    }
  }, [safePage, pages, hasMore, loadingMore, loading, loadMore]);

  const confirmClear = () => {
    const nextParams = new URLSearchParams(params);
    ["location", "salary", "experience", "confirmClear", "filters"].forEach((key) =>
      nextParams.delete(key)
    );
    nextParams.delete("workMode");
    nextParams.delete("employmentType");
    nextParams.delete("skills");
    setParams(nextParams);
  };

  return (
    <section className="job-list-page">
      {error ? (
        <div className="job-list-error">{error}</div>
      ) : null}
      <JobListLayout
        jobs={visible}
        loading={loading}
        loadingMore={loadingMore}
        page={safePage}
        pages={pages}
        search={search}
        filters={filters}
        filtersOpen={filtersOpen}
        clearPending={clearPending}
        onSearch={(value) => updateParams({ search: value, page: 1 })}
        onPage={(value) => updateParams({ page: value })}
        onFilters={(value) =>
          updateParams({ ...value, filtersOpen: false, clearPending: false, page: 1 })
        }
        onFiltersOpen={(value) => updateParams({ filtersOpen: value })}
        onRequestClear={() => updateParams({ clearPending: !clearPending })}
        onConfirmClear={confirmClear}
      />
    </section>
  );
}
