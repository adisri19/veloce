import { RoleType } from "./validations/common";

export type ActionPermission =
  | "STAGE_MOVE"
  | "BULK_OPERATIONS"
  | "CANDIDATE_MUTATE"
  | "NOTE_CREATE"
  | "SCORECARD_SUBMIT"
  | "INTERVIEW_SCHEDULE"
  | "JOB_CREATE_EDIT"
  | "APPROVE_OFFER_HIRED"
  | "SEED_RESET";

export function hasPermission(
  role: RoleType,
  action: ActionPermission,
  context?: { isJobOwner?: boolean }
): boolean {
  if (role === "ADMIN") {
    return true;
  }

  switch (action) {
    case "SEED_RESET":
      return false; // ADMIN only

    case "APPROVE_OFFER_HIRED":
      if (role === "HIRING_MANAGER") {
        return context?.isJobOwner !== false;
      }
      return role === "RECRUITER";

    case "STAGE_MOVE":
    case "BULK_OPERATIONS":
    case "CANDIDATE_MUTATE":
    case "JOB_CREATE_EDIT":
      if (role === "RECRUITER") return true;
      if (role === "HIRING_MANAGER") return context?.isJobOwner !== false;
      return false;

    case "SCORECARD_SUBMIT":
      return true; // All roles can submit scorecards

    case "NOTE_CREATE":
      return true; // All roles can create notes

    case "INTERVIEW_SCHEDULE":
      return role === "RECRUITER" || role === "HIRING_MANAGER";

    default:
      return false;
  }
}
