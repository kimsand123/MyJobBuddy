import { Briefcase, FileUp, Pencil, Plus, Trash2 } from "lucide-react";
import type { ReactElement } from "react";
import { useNotImplemented } from "@/app/notImplemented/useNotImplemented";
import { AppButton } from "@/components/AppButton";
import { BottomSheet } from "@/components/BottomSheet";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { JobForm } from "@/components/JobForm";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { useReturnFocus } from "@/shared/useReturnFocus";
import { da } from "@/texts/da";
import { useJobsWidget } from "./useJobsWidget";

// View: job og overenskomster med "Tilføj job". Upload kontrakt, ret og slet job er ikke bygget.

export function JobsWidget(): ReactElement {
  const jobs = useJobsWidget();
  const showNotImplemented = useNotImplemented();
  const formFocus = useReturnFocus();

  if (jobs.status === "loading") {
    return <LoadingSkeleton variant="list" rows={1} label={da.me.loadingJobs} />;
  }
  if (jobs.status === "error") {
    return <ErrorState error={jobs.error} onRetry={jobs.retry} />;
  }

  return (
    <div className="flex flex-col gap-3">
      {jobs.jobs.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title={da.me.noJobs.title}
          text={da.me.noJobs.text}
          headingLevel={3}
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {jobs.jobs.map((job) => (
            <li key={job.id} className="flex flex-col gap-3 rounded-lg bg-card p-4 shadow-card">
              <div>
                <h3 className="text-title-3">{job.workplace}</h3>
                <p className="text-body-sm text-muted-foreground">{job.description}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <AppButton
                  variant="secondary"
                  size="sm"
                  icon={FileUp}
                  aria-label={da.me.jobActionLabel(da.me.uploadContract, job.workplace)}
                  onClick={showNotImplemented}
                >
                  {da.me.uploadContract}
                </AppButton>
                <AppButton
                  variant="ghost"
                  size="sm"
                  icon={Pencil}
                  aria-label={da.me.jobActionLabel(da.me.editJob, job.workplace)}
                  onClick={showNotImplemented}
                >
                  {da.me.editJob}
                </AppButton>
                <AppButton
                  variant="ghost"
                  size="sm"
                  icon={Trash2}
                  aria-label={da.me.jobActionLabel(da.me.deleteJob, job.workplace)}
                  onClick={showNotImplemented}
                >
                  {da.me.deleteJob}
                </AppButton>
              </div>
            </li>
          ))}
        </ul>
      )}

      <p role="status" className="text-body-sm text-success empty:sr-only">
        {jobs.statusMessage}
      </p>

      <AppButton
        variant="outline"
        block
        icon={Plus}
        onClick={(event) => {
          formFocus.remember(event.currentTarget);
          jobs.openForm();
        }}
      >
        {da.me.addJob}
      </AppButton>

      <BottomSheet
        open={jobs.form.open}
        onOpenChange={jobs.setFormOpen}
        title={da.jobForm.title}
        description={da.jobForm.description}
        onCloseAutoFocus={formFocus.restore}
      >
        <JobForm
          key={jobs.form.key}
          values={jobs.form.values}
          agreements={jobs.form.agreements}
          errors={jobs.form.errors}
          submitting={jobs.form.submitting}
          focusRequest={jobs.form.focusRequest}
          onChange={jobs.changeForm}
          onUnavailableAgreement={showNotImplemented}
          onSubmit={jobs.submitForm}
          onCancel={() => {
            jobs.setFormOpen(false);
          }}
        />
        {jobs.form.formError !== undefined && (
          <p role="alert" className="mt-3 text-label text-danger">
            {jobs.form.formError}
          </p>
        )}
      </BottomSheet>
    </div>
  );
}
