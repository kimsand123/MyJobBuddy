// ShiftForm og JobForm: synlige labels, fejltekst knyttet til feltet med aria-describedby,
// fokus på det felt, ViewModel beder om, og gem/annuller. JobForm: piletaster i radiogruppen
// åbner ikke "Ikke implementeret", mens "Kommer snart" gør ved aktivering.
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { JobForm, type JobFormProps } from "@/components/JobForm";
import { ShiftForm, type ShiftFormProps } from "@/components/ShiftForm";
import { da } from "@/texts/da";

afterEach(() => {
  cleanup();
});

function describedByText(element: HTMLElement): string {
  const ids = (element.getAttribute("aria-describedby") ?? "").split(" ").filter(Boolean);
  return ids.map((id) => document.getElementById(id)?.textContent ?? "").join(" ");
}

const shiftProps: ShiftFormProps = {
  values: { jobId: "job-1", date: "2026-10-19", start: "10:00", end: "14:00", pause: "30" },
  jobOptions: [
    { value: "job-1", label: "Torvebutikken" },
    { value: "job-2", label: "Testkiosken" },
  ],
  summary: { status: "ready", text: "4 t · 370,00 kr." },
  onChange: vi.fn(),
  onSubmit: vi.fn(),
  onCancel: vi.fn(),
};

function renderShiftForm(overrides?: Partial<ShiftFormProps>): ShiftFormProps {
  const props = {
    ...shiftProps,
    onChange: vi.fn(),
    onSubmit: vi.fn(),
    onCancel: vi.fn(),
    ...overrides,
  };
  render(<ShiftForm {...props} />);
  return props;
}

describe("ShiftForm", () => {
  it.each([da.shiftForm.date, da.shiftForm.start, da.shiftForm.end, da.shiftForm.pause])(
    "ShiftForm_Rendered_FieldHasVisibleLabel%s",
    (label) => {
      // Act
      renderShiftForm();

      // Assert
      expect(screen.getByLabelText(label)).toBeInTheDocument();
      expect(screen.getByText(label)).toBeVisible();
    },
  );

  it("ShiftForm_Rendered_JobFieldHasLabel", () => {
    // Act
    renderShiftForm();

    // Assert
    expect(screen.getByLabelText(da.shiftForm.job)).toBeInTheDocument();
  });

  it("ShiftForm_Values_ShownInFields", () => {
    // Act
    renderShiftForm();

    // Assert
    expect(screen.getByLabelText(da.shiftForm.date)).toHaveValue("2026-10-19");
    expect(screen.getByLabelText(da.shiftForm.start)).toHaveValue("10:00");
    expect(screen.getByLabelText(da.shiftForm.end)).toHaveValue("14:00");
  });

  it("ShiftForm_Summary_TextShown", () => {
    // Act
    renderShiftForm();

    // Assert
    expect(screen.getByText("4 t · 370,00 kr.")).toBeInTheDocument();
  });

  it("ShiftForm_ErrorOnEnd_ErrorTextDescribesEndFieldAndInvalid", () => {
    // Act
    renderShiftForm({ errors: { end: da.fieldErrors.endNotAfterStart } });

    // Assert
    const end = screen.getByLabelText(da.shiftForm.end);
    expect(end).toHaveAttribute("aria-invalid", "true");
    expect(describedByText(end)).toContain(da.fieldErrors.endNotAfterStart);
    expect(screen.getByLabelText(da.shiftForm.start)).not.toHaveAttribute("aria-invalid", "true");
  });

  it("ShiftForm_ErrorOnPause_ErrorTextDescribesPauseField", () => {
    // Act
    renderShiftForm({ errors: { pause: da.fieldErrors.pauseOutOfRange } });

    // Assert
    expect(describedByText(screen.getByLabelText(da.shiftForm.pause))).toContain(
      da.fieldErrors.pauseOutOfRange,
    );
  });

  it("ShiftForm_FormError_Shown", () => {
    // Act
    renderShiftForm({ formError: "Vagten kunne ikke gemmes." });

    // Assert
    expect(screen.getByText("Vagten kunne ikke gemmes.")).toBeInTheDocument();
  });

  it("ShiftForm_FocusRequestOnEnd_EndFieldFocused", () => {
    // Act
    renderShiftForm({ focusRequest: { field: "end", token: 1 } });

    // Assert
    expect(screen.getByLabelText(da.shiftForm.end)).toHaveFocus();
  });

  it("ShiftForm_NewFocusRequest_MovesFocus", () => {
    // Arrange
    const props = { ...shiftProps, focusRequest: { field: "end" as const, token: 1 } };
    const { rerender } = render(<ShiftForm {...props} />);

    // Act
    rerender(<ShiftForm {...props} focusRequest={{ field: "pause", token: 2 }} />);

    // Assert
    expect(screen.getByLabelText(da.shiftForm.pause)).toHaveFocus();
  });

  it("ShiftForm_ChangeStart_OnChangeWithNewValues", () => {
    // Arrange: starttid er et tidsfelt, som jsdom ikke kan skrive i tegn for tegn
    const props = renderShiftForm({
      values: { ...shiftProps.values, start: "" },
    });

    // Act
    fireEvent.change(screen.getByLabelText(da.shiftForm.start), { target: { value: "11:00" } });

    // Assert
    expect(props.onChange).toHaveBeenCalled();
    const lastCall = vi.mocked(props.onChange).mock.calls.at(-1)?.[0];
    expect(lastCall?.start).toBe("11:00");
    expect(lastCall?.date).toBe("2026-10-19");
    expect(lastCall?.end).toBe("14:00");
  });

  it("ShiftForm_SaveClicked_OnSubmit", async () => {
    // Arrange
    const user = userEvent.setup();
    const props = renderShiftForm();

    // Act
    await user.click(screen.getByRole("button", { name: da.shiftForm.save }));

    // Assert
    expect(props.onSubmit).toHaveBeenCalledTimes(1);
  });

  it("ShiftForm_CancelClicked_OnCancel", async () => {
    // Arrange
    const user = userEvent.setup();
    const props = renderShiftForm();

    // Act
    await user.click(screen.getByRole("button", { name: da.common.cancel }));

    // Assert
    expect(props.onCancel).toHaveBeenCalledTimes(1);
    expect(props.onSubmit).not.toHaveBeenCalled();
  });

  it("ShiftForm_Submitting_SaveDisabled", () => {
    // Act
    renderShiftForm({ submitting: true });

    // Assert
    const save = screen.getByRole("button", {
      name: new RegExp(`${da.shiftForm.save}|${da.common.saving}`),
    });
    expect(save).toBeDisabled();
  });
});

const agreements = [
  { code: "hk-handel-butik", name: "HK Handel – Butik", isAvailable: true },
  { code: "test-lager", name: "Testoverenskomst Lager", isAvailable: false },
  { code: "test-kontor", name: "Testoverenskomst Kontor", isAvailable: false },
];

function renderJobForm(overrides?: Partial<JobFormProps>): JobFormProps {
  const props: JobFormProps = {
    values: { workplace: "", position: "", agreementCode: "" },
    agreements,
    onChange: vi.fn(),
    onUnavailableAgreement: vi.fn(),
    onSubmit: vi.fn(),
    onCancel: vi.fn(),
    ...overrides,
  };
  render(<JobForm {...props} />);
  return props;
}

function comingSoonButton(name: string): HTMLElement {
  const match = screen
    .getAllByRole("button")
    .find(
      (button) =>
        (button.textContent ?? "").includes(name) ||
        (button.getAttribute("aria-label") ?? "").includes(name),
    );
  if (match === undefined) {
    throw new Error(`Ingen knap for ${name}`);
  }
  return match;
}

describe("JobForm", () => {
  it.each([da.jobForm.workplace, da.jobForm.position])(
    "JobForm_Rendered_TextFieldHasVisibleLabel%s",
    (label) => {
      // Act
      renderJobForm();

      // Assert
      expect(screen.getByLabelText(label)).toBeInTheDocument();
      expect(screen.getByText(label)).toBeVisible();
    },
  );

  it("JobForm_Rendered_AvailableAgreementIsRadioInNamedGroup", () => {
    // Act
    renderJobForm();

    // Assert: en fieldset med legend giver rollen group med navnet "Overenskomst"
    const group = screen.getByRole("group", { name: da.jobForm.agreement });
    expect(within(group).getByRole("radio", { name: "HK Handel – Butik" })).toBeInTheDocument();
  });

  it("JobForm_Rendered_UnavailableAgreementsMarkedComingSoon", () => {
    // Act
    renderJobForm();

    // Assert
    for (const name of ["Testoverenskomst Lager", "Testoverenskomst Kontor"]) {
      const button = comingSoonButton(name);
      const accessibleText = `${button.textContent ?? ""} ${button.getAttribute("aria-label") ?? ""} ${describedByText(button)}`;
      expect(accessibleText).toContain(da.status.comingSoon);
    }
    expect(screen.queryByRole("radio", { name: /Testoverenskomst/ })).not.toBeInTheDocument();
  });

  it("JobForm_SelectAvailableAgreement_OnChangeWithCode", async () => {
    // Arrange
    const user = userEvent.setup();
    const props = renderJobForm();

    // Act
    await user.click(screen.getByRole("radio", { name: /HK Handel – Butik/ }));

    // Assert
    expect(props.onChange).toHaveBeenCalledWith(
      expect.objectContaining({ agreementCode: "hk-handel-butik" }),
    );
    expect(props.onUnavailableAgreement).not.toHaveBeenCalled();
  });

  it("JobForm_ArrowKeysInRadioGroup_DoNotOpenNotImplemented", async () => {
    // Arrange
    const user = userEvent.setup();
    const props = renderJobForm({
      values: { workplace: "", position: "", agreementCode: "hk-handel-butik" },
    });
    const radio = screen.getByRole("radio", { name: /HK Handel – Butik/ });
    radio.focus();

    // Act
    await user.keyboard("{ArrowDown}{ArrowDown}{ArrowUp}{ArrowRight}{ArrowLeft}");

    // Assert
    expect(props.onUnavailableAgreement).not.toHaveBeenCalled();
  });

  it("JobForm_ComingSoonClicked_OnUnavailableAgreementWithButton", async () => {
    // Arrange
    const user = userEvent.setup();
    const props = renderJobForm();
    const button = comingSoonButton("Testoverenskomst Lager");

    // Act
    await user.click(button);

    // Assert
    expect(props.onUnavailableAgreement).toHaveBeenCalledTimes(1);
    expect(props.onUnavailableAgreement).toHaveBeenCalledWith(button);
    expect(props.onChange).not.toHaveBeenCalledWith(
      expect.objectContaining({ agreementCode: "test-lager" }),
    );
  });

  it("JobForm_ComingSoonActivatedWithEnter_OnUnavailableAgreement", async () => {
    // Arrange
    const user = userEvent.setup();
    const props = renderJobForm();
    comingSoonButton("Testoverenskomst Kontor").focus();

    // Act
    await user.keyboard("{Enter}");

    // Assert
    expect(props.onUnavailableAgreement).toHaveBeenCalledTimes(1);
  });

  it("JobForm_ErrorOnWorkplace_ErrorTextDescribesField", () => {
    // Act
    renderJobForm({ errors: { workplace: da.fieldErrors.required } });

    // Assert
    const workplace = screen.getByLabelText(da.jobForm.workplace);
    expect(workplace).toHaveAttribute("aria-invalid", "true");
    expect(describedByText(workplace)).toContain(da.fieldErrors.required);
  });

  it("JobForm_ErrorOnAgreement_ErrorTextDescribesRadio", () => {
    // Act
    renderJobForm({ errors: { agreementCode: da.fieldErrors.required } });

    // Assert
    const radio = screen.getByRole("radio", { name: "HK Handel – Butik" });
    expect(describedByText(radio)).toContain(da.fieldErrors.required);
  });

  it("JobForm_FocusRequestOnPosition_PositionFocused", () => {
    // Act
    renderJobForm({ focusRequest: { field: "position", token: 1 } });

    // Assert
    expect(screen.getByLabelText(da.jobForm.position)).toHaveFocus();
  });

  it("JobForm_TypeWorkplace_OnChangeWithText", async () => {
    // Arrange
    const user = userEvent.setup();
    const props = renderJobForm();

    // Act
    await user.type(screen.getByLabelText(da.jobForm.workplace), "T");

    // Assert
    expect(props.onChange).toHaveBeenCalledWith(expect.objectContaining({ workplace: "T" }));
  });

  it("JobForm_SaveClicked_OnSubmit", async () => {
    // Arrange
    const user = userEvent.setup();
    const props = renderJobForm();

    // Act
    await user.click(screen.getByRole("button", { name: da.jobForm.save }));

    // Assert
    expect(props.onSubmit).toHaveBeenCalledTimes(1);
  });

  it("JobForm_CancelClicked_OnCancel", async () => {
    // Arrange
    const user = userEvent.setup();
    const props = renderJobForm();

    // Act
    await user.click(screen.getByRole("button", { name: da.common.cancel }));

    // Assert
    expect(props.onCancel).toHaveBeenCalledTimes(1);
  });
});
