import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../auth/hooks/useAuth";
import { createApplication } from "../../applications/services/applicationService";
import ApplyModal from "../components/ApplyModal";
import JobDetailLayout from "../components/JobDetailLayout";
import { useJobDetail } from "../hooks/useJobDetail";
import "./JobDetailPage.css";

export default function JobDetailPage() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { job, loading, error } = useJobDetail(jobId);
  const [applyOpen, setApplyOpen] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const resumes = useMemo(() => {
    if (!user) return ["Default resume"];
    return [`${user.name} resume`];
  }, [user]);

  if (loading) {
    return <PageState title="Loading job" body="Fetching the latest job details." />;
  }

  if (error || !job) {
    return <PageState title="Job unavailable" body={error || "This job could not be found."} />;
  }

  const apply = async () => {
    if (!user) {
      navigate("/login");
      return;
    }

    if (user.role !== "job_seeker") {
      setStatus("Only job seekers can apply to jobs.");
      return;
    }

    setApplyOpen(true);
  };

  const submitApplication = async () => {
    if (!user) return;

    try {
      await createApplication({ jobId: job.id });
      setStatus("Application submitted. You can track it from Applications.");
      setApplyOpen(false);
    } catch (submitError) {
      setStatus(
        submitError instanceof Error
          ? submitError.message
          : "Failed to submit application."
      );
    }
  };

  const share = async () => {
    const shareUrl = window.location.href;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        setStatus("Job link copied to clipboard.");
      } else {
        setStatus(shareUrl);
      }
    } catch {
      setStatus("Could not copy the link. You can copy the URL from the browser.");
    }
  };

  return (
    <>
      {status ? (
        <div className="job-detail-status">{status}</div>
      ) : null}
      <JobDetailLayout
        job={{
          title: job.title,
          company: job.company,
          salary: job.salaryText,
          description: job.description,
          requirements: job.requirements.length ? job.requirements : job.skills,
          experience: job.experienceText,
          perks: job.perks,
          fitScore: job.fitScore,
        }}
        isJobSeeker={user?.role !== "employer"}
        onApply={apply}
        onShare={() => void share()}
        primaryActionLabel={
          user?.role === "employer" ? "Employer view" : "Apply now"
        }
      />
      <ApplyModal
        open={applyOpen}
        jobTitle={job.title}
        resumes={resumes}
        onClose={() => setApplyOpen(false)}
        onSubmit={() => void submitApplication()}
      />
    </>
  );
}

function PageState({ title, body }: { title: string; body: string }) {
  return (
    <section className="job-detail-page-state">
      <div className="job-detail-page-state-card">
        <h1>{title}</h1>
        <p>{body}</p>
      </div>
    </section>
  );
}
