import { Link } from "react-router-dom";
import Badge from "../../../shared/components/Badge";
import "./JobCard.css";

type Props = { job: { id: string; title: string; company: string; location: string; workMode: string; employmentType: string; salary?: number | string; skills: string[]; fitScore?: number }; isJobSeeker?: boolean };

export default function JobCard({ job, isJobSeeker = false }: Props) {
  const salary = typeof job.salary === "number" ? new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(job.salary) : job.salary;
  return (
    <Link
      to={`/jobs/${job.id}`}
      aria-label={`Job: ${job.title} at ${job.company}`}
      className="block w-full rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-blue job-card"
    >
      <div className="job-card-body">
        <div>
          <h3 className="job-card-title">{job.title}</h3>
          <p className="job-card-company">{job.company}</p>
        </div>
        <div className="job-card-badges">
          <Badge text={job.location} variant="gray" />
          <Badge text={job.workMode} variant="blue" />
          <Badge text={job.employmentType} variant="blue" />
        </div>
        {salary && <p className="job-card-salary">{salary}</p>}
        <div className="job-card-badges">
          {job.skills.slice(0, 3).map((skill) => <Badge key={skill} text={skill} variant="blue" />)}
        </div>
        {isJobSeeker && typeof job.fitScore === "number" && (
          <div className="job-card-fit">
            <span className="job-card-fit-label">Fit Score {job.fitScore}%</span>
            <progress
              className="job-card-fit-bar"
              max={100}
              value={job.fitScore}
              aria-label="Fit score progress"
            />
          </div>
        )}
      </div>
    </Link>
  );
}
