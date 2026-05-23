/**
 * Course Module Design Wizard
 *
 * A backwards design wizard that guides creators through:
 * Credential → SLTs → Assignment → Lessons → Introduction → Review
 */

export { ModuleWizard, useWizard } from "./module-wizard";
export { WizardStepper, WIZARD_STEPS } from "./wizard-stepper";
export { WizardStep, WizardStepContent, WizardStepTip, WizardStepHighlight } from "./wizard-step";
export { WizardNavigation, WizardHeader } from "./wizard-navigation";

// Types
export type {
  WizardStepId,
  StepStatus,
  WizardStepConfig,
  StepCompletion,
  WizardData,
  WizardContextValue,
  WizardStepProps,
} from "./types";
