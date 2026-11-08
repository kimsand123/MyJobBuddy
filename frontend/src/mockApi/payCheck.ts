import type { AgreementRuleSet } from "./agreements/agreementRuleSet";
import type {
  PayCheckCategoryDto,
  PayCheckCheckedDto,
  PayslipDto,
  PossibleErrorDto,
  ShiftDto,
} from "./apiTypes";

// Løntjek for ét job og én måned.
// Det forventede regnes ud fra vagterne og sammenlignes med lønsedlen i disse kategorier:
//  - "hours": timer i alt inkl. syge timer, til timeløn,
//  - én kategori pr. tillæg i regelsættet (aften, lørdag, søndag).
// Kun underbetaling bliver en mulig fejl: manglende minutter × sats.
// Forskellen i alt = forventet − udbetalt.

export type PayCheckSummary = Pick<
  PayCheckCheckedDto,
  | "expectedPayOere"
  | "paidPayOere"
  | "differenceOere"
  | "categories"
  | "possibleErrors"
  | "possibleErrorsTotalOere"
>;

const minutesPerHour = 60;

function amountForMinutes(minutes: number, rateOerePerHour: number): number {
  return Math.round((minutes * rateOerePerHour) / minutesPerHour);
}

function hoursCategory(
  shifts: readonly ShiftDto[],
  payslip: PayslipDto,
  ruleSet: AgreementRuleSet,
): PayCheckCategoryDto {
  const expectedMinutes = shifts.reduce((sum, shift) => sum + shift.paidMinutes, 0);
  return {
    category: "hours",
    expectedMinutes,
    paidMinutes: payslip.paidMinutes,
    differenceMinutes: expectedMinutes - payslip.paidMinutes,
    rateOerePerHour: ruleSet.hourlyWageOere,
    dates: [],
  };
}

function supplementCategories(
  shifts: readonly ShiftDto[],
  payslip: PayslipDto,
  ruleSet: AgreementRuleSet,
): PayCheckCategoryDto[] {
  return ruleSet.supplementRules.map((rule) => {
    let expectedMinutes = 0;
    const dates: string[] = [];
    for (const shift of shifts) {
      const line = shift.supplements.find((supplement) => supplement.kind === rule.kind);
      if (line === undefined) {
        continue;
      }
      expectedMinutes += line.minutes;
      dates.push(shift.date);
    }
    const paidMinutes = payslip.supplementMinutes[rule.kind];
    return {
      category: rule.kind,
      expectedMinutes,
      paidMinutes,
      differenceMinutes: expectedMinutes - paidMinutes,
      rateOerePerHour: rule.rateOerePerHour,
      dates: [...new Set(dates)].sort(),
    };
  });
}

function toPossibleError(category: PayCheckCategoryDto): PossibleErrorDto {
  return {
    category: category.category,
    missingMinutes: category.differenceMinutes,
    rateOerePerHour: category.rateOerePerHour,
    amountOere: amountForMinutes(category.differenceMinutes, category.rateOerePerHour),
    dates: category.dates,
  };
}

/** shifts skal være vagterne for samme job og måned som lønsedlen. */
export function calculatePayCheck(
  shifts: readonly ShiftDto[],
  payslip: PayslipDto,
  ruleSet: AgreementRuleSet,
): PayCheckSummary {
  const categories = [
    hoursCategory(shifts, payslip, ruleSet),
    ...supplementCategories(shifts, payslip, ruleSet),
  ];
  const possibleErrors = categories
    .filter((category) => category.differenceMinutes > 0)
    .map(toPossibleError);
  const expectedPayOere = shifts.reduce((sum, shift) => sum + shift.expectedPayOere, 0);

  return {
    expectedPayOere,
    paidPayOere: payslip.grossPayOere,
    differenceOere: expectedPayOere - payslip.grossPayOere,
    categories,
    possibleErrors,
    possibleErrorsTotalOere: possibleErrors.reduce((sum, error) => sum + error.amountOere, 0),
  };
}
