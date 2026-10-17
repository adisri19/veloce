import { Stage, TERMINAL_STAGES, DEFAULT_SLA_DAYS } from "./validations/common";

export type SlaState = "OK" | "WARNING" | "BREACHED";

export interface SlaCalculationResult {
  slaDays: number;
  daysInStage: number;
  hoursInStage: number;
  slaState: SlaState;
  overByDays: number;
  timeLeftFormatted: string;
}

export function computeSlaStatus(
  currentStage: Stage,
  stageEnteredAt: Date | string,
  slaDaysPerStage?: Record<string, number> | null,
  now: Date = new Date()
): SlaCalculationResult {
  const entered = new Date(stageEnteredAt);
  const diffMs = Math.max(0, now.getTime() - entered.getTime());
  const hoursInStage = diffMs / (1000 * 60 * 60);
  const daysInStage = hoursInStage / 24;

  const slaDays =
    (slaDaysPerStage && slaDaysPerStage[currentStage] !== undefined
      ? slaDaysPerStage[currentStage]
      : DEFAULT_SLA_DAYS[currentStage]) ?? 5;

  // Terminal stages never breach
  if (TERMINAL_STAGES.includes(currentStage) || slaDays === 0) {
    return {
      slaDays: 0,
      daysInStage: Math.round(daysInStage * 10) / 10,
      hoursInStage: Math.round(hoursInStage),
      slaState: "OK",
      overByDays: 0,
      timeLeftFormatted: "Completed",
    };
  }

  const slaHours = slaDays * 24;
  const remainingHours = slaHours - hoursInStage;

  let slaState: SlaState = "OK";
  let overByDays = 0;

  if (hoursInStage > slaHours) {
    slaState = "BREACHED";
    overByDays = Math.round(((hoursInStage - slaHours) / 24) * 10) / 10;
  } else if (hoursInStage >= 0.75 * slaHours) {
    slaState = "WARNING";
  }

  // Format human readable countdown or overdue
  let timeLeftFormatted = "";
  if (slaState === "BREACHED") {
    const overdueHours = Math.abs(remainingHours);
    const d = Math.floor(overdueHours / 24);
    const h = Math.floor(overdueHours % 24);
    timeLeftFormatted = d > 0 ? `${d}d ${h}h over` : `${h}h over`;
  } else {
    const d = Math.floor(remainingHours / 24);
    const h = Math.floor(remainingHours % 24);
    timeLeftFormatted = d > 0 ? `${d}d ${h}h left` : `${h}h left`;
  }

  return {
    slaDays,
    daysInStage: Math.round(daysInStage * 10) / 10,
    hoursInStage: Math.round(hoursInStage),
    slaState,
    overByDays,
    timeLeftFormatted,
  };
}
