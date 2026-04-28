import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/hooks/useAuth";
import { createJob } from "../../jobs/services/jobService";
import type { JobDraft, JobExperience, WorkMode, EmploymentType } from "../../jobs/types";
import Button from "../../../shared/components/Button";
import Input from "../../../shared/components/Input";
import "./EmployerPostJobPage.css";

export default function EmployerPostJobPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState<JobDraft>({
    title: "",
    company: user?.name ? `${user.name}'s Company` : "",
    location: "",
    workMode: "onsite",
    employmentType: "fulltime",
    salary: undefined,
    description: "",
    requirements: [],
    skills: [],
    experience: "mid",
    perks: [],
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = <K extends keyof JobDraft>(key: K, value: JobDraft[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!user) return;

    if (!form.title || !form.company || !form.location || !form.description) {
      setError("Title, company, location, and description are required.");
      return;
    }

    try {
      setSaving(true);
      setError(null);
      const jobId = await createJob(form);
      navigate(`/jobs/${jobId}`);
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Failed to create job."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="post-job-page">
      <div className="post-job-card">
        <h1>Post a job</h1>
        <p>
          Publish a real job document to Firestore so it appears in the seeker flow.
        </p>
      </div>

      <form onSubmit={submit} className="post-job-card post-job-form">
        <Input
          label="Job title"
          value={form.title}
          onChange={(event) => update("title", event.target.value)}
          placeholder="Senior Frontend Engineer"
        />
        <Input
          label="Company"
          value={form.company}
          onChange={(event) => update("company", event.target.value)}
          placeholder="Acme Labs"
        />
        <div className="post-job-grid">
          <Input
            label="Location"
            value={form.location}
            onChange={(event) => update("location", event.target.value)}
            placeholder="Remote or Bangalore"
          />
          <label className="post-job-label">
            <span className="post-job-label-text">Work Mode</span>
            <select
              value={form.workMode}
              onChange={(event) => update("workMode", event.target.value as WorkMode)}
              className="post-job-select"
            >
              <option value="onsite">On-site</option>
              <option value="hybrid">Hybrid</option>
              <option value="remote">Remote</option>
            </select>
          </label>
          <label className="post-job-label">
            <span className="post-job-label-text">Employment Type</span>
            <select
              value={form.employmentType}
              onChange={(event) => update("employmentType", event.target.value as EmploymentType)}
              className="post-job-select"
            >
              <option value="fulltime">Full-time</option>
              <option value="parttime">Part-time</option>
              <option value="contract">Contract</option>
              <option value="internship">Internship</option>
              <option value="freelance">Freelance</option>
            </select>
          </label>
          <label className="post-job-label">
            <span className="post-job-label-text">Experience</span>
            <select
              value={form.experience}
              onChange={(event) =>
                update("experience", event.target.value as JobExperience)
              }
              className="post-job-select"
            >
              <option value="entry">Entry</option>
              <option value="mid">Mid</option>
              <option value="senior">Senior</option>
            </select>
          </label>
          <Input
            label="Salary (annual USD)"
            type="number"
            value={form.salary ? String(form.salary) : ""}
            onChange={(event) =>
              update(
                "salary",
                event.target.value ? Number(event.target.value) : undefined
              )
            }
            placeholder="140000"
          />
        </div>
        <label className="post-job-label">
          <span className="post-job-label-text">Description</span>
          <textarea
            value={form.description}
            onChange={(event) => update("description", event.target.value)}
            rows={6}
            className="post-job-textarea"
          />
        </label>
        <Input
          label="Skills"
          value={form.skills.join(", ")}
          onChange={(event) =>
            update(
              "skills",
              event.target.value
                .split(",")
                .map((item) => item.trim())
                .filter(Boolean)
            )
          }
          placeholder="React, TypeScript, Firebase"
        />
        <Input
          label="Requirements"
          value={form.requirements.join(", ")}
          onChange={(event) =>
            update(
              "requirements",
              event.target.value
                .split(",")
                .map((item) => item.trim())
                .filter(Boolean)
            )
          }
          placeholder="5+ years, strong product sense"
        />
        <Input
          label="Perks"
          value={form.perks.join(", ")}
          onChange={(event) =>
            update(
              "perks",
              event.target.value
                .split(",")
                .map((item) => item.trim())
                .filter(Boolean)
            )
          }
          placeholder="Remote-first, learning budget"
        />
        {error ? <p className="post-job-error">{error}</p> : null}
        <div className="post-job-actions">
          <Button type="submit" loading={saving}>
            Publish job
          </Button>
        </div>
      </form>
    </section>
  );
}
