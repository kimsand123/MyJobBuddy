import { ok, type Result } from "@/shared/result";
import type { JobDto } from "../apiTypes";
import { nextId } from "../mockStore";
import type { JobRecord } from "../storeTypes";
import { validateJob } from "../validation/jobValidation";
import { toJobDto } from "./endpointHelpers";
import type { MockRequestContext } from "./mockRequest";

// GET /jobs og POST /jobs.

export function getJobs({ store }: MockRequestContext): Result<JobDto[]> {
  return ok(store.jobs.map((job) => toJobDto(store, job)));
}

export function createJob({ store, body }: MockRequestContext): Result<JobDto> {
  const validation = validateJob(store, body);
  if (!validation.success) {
    return validation;
  }

  const job: JobRecord = {
    id: nextId(store, "job"),
    workplace: validation.data.workplace,
    position: validation.data.position,
    agreementCode: validation.data.agreementCode,
  };
  store.jobs.push(job);
  return ok(toJobDto(store, job));
}
