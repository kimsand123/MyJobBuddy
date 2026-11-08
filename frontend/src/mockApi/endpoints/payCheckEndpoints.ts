import { ok, type Result } from "@/shared/result";
import type { PayCheckDto, PayslipDto } from "../apiTypes";
import { calculatePayCheck } from "../payCheck";
import type { PayslipRecord } from "../storeTypes";
import {
  findJob,
  requireMonth,
  requirePathParam,
  ruleSetForJob,
  shiftsForJobAndMonth,
  toShiftDto,
} from "./endpointHelpers";
import type { MockRequestContext } from "./mockRequest";

// GET /jobs/:jobId/pay-check?month=ÅÅÅÅ-MM.
// Uden lønseddel for måneden svares { status: "noPayslip" } (ikke en fejl).

function toPayslipDto(payslip: PayslipRecord): PayslipDto {
  return {
    id: payslip.id,
    month: payslip.month,
    employerName: payslip.employerName,
    cprMasked: payslip.cprMasked,
    accountNumberMasked: payslip.accountNumberMasked,
    paidMinutes: payslip.paidMinutes,
    supplementMinutes: { ...payslip.supplementMinutes },
    grossPayOere: payslip.grossPayOere,
  };
}

export function getPayCheck({ store, pathParams, query }: MockRequestContext): Result<PayCheckDto> {
  const jobId = requirePathParam(pathParams, "jobId");
  if (!jobId.success) {
    return jobId;
  }
  const job = findJob(store, jobId.data);
  if (!job.success) {
    return job;
  }
  const month = requireMonth(query);
  if (!month.success) {
    return month;
  }
  const ruleSet = ruleSetForJob(job.data);
  if (!ruleSet.success) {
    return ruleSet;
  }

  const payslip = store.payslips.find(
    (candidate) => candidate.jobId === job.data.id && candidate.month === month.data,
  );
  if (payslip === undefined) {
    return ok({ status: "noPayslip", jobId: job.data.id, month: month.data });
  }

  const payslipDto = toPayslipDto(payslip);
  const shifts = shiftsForJobAndMonth(store, job.data.id, month.data).map((shift) =>
    toShiftDto(shift, ruleSet.data),
  );
  return ok({
    status: "checked",
    jobId: job.data.id,
    month: month.data,
    payslip: payslipDto,
    ...calculatePayCheck(shifts, payslipDto, ruleSet.data),
  });
}
