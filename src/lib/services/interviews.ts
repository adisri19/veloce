import { prisma, isSqlite } from "../db";
import { fromList, toList } from "../db-compat";
import { InterviewCreateInput, InterviewUpdateInput } from "../validations/interview";
import { Actor } from "../auth";
import { logAudit } from "./audit";
import { NotFoundError, ForbiddenError } from "../api";

export async function scheduleInterview(
  applicationId: string,
  input: InterviewCreateInput,
  actor: Actor
) {
  if (actor.role === "INTERVIEWER") {
    throw new ForbiddenError("Interviewers cannot schedule interview events");
  }

  const application = await prisma.application.findUnique({
    where: { id: applicationId },
  });

  if (!application) {
    throw new NotFoundError(`Application ${applicationId} not found`);
  }

  const start = new Date(input.startTime);
  const end = new Date(input.endTime);

  // Check conflicts for each interviewer
  const conflicts: { interviewerId: string; interviewerName: string; conflictingEventTitle: string }[] = [];

  const existingEvents = await prisma.interviewEvent.findMany({
    where: {
      status: "SCHEDULED",
      startTime: { lt: end },
      endTime: { gt: start },
    },
  });

  const allUsers = await prisma.user.findMany({
    where: { id: { in: input.interviewerIds } },
  });
  const userNameMap = new Map(allUsers.map((u) => [u.id, u.name]));

  for (const interviewerId of input.interviewerIds) {
    for (const ev of existingEvents) {
      const assigned = toList(ev.interviewerIds);
      if (assigned.includes(interviewerId)) {
        conflicts.push({
          interviewerId,
          interviewerName: userNameMap.get(interviewerId) || interviewerId,
          conflictingEventTitle: ev.title,
        });
        break;
      }
    }
  }

  const interview = await prisma.interviewEvent.create({
    data: {
      applicationId,
      title: input.title,
      stage: input.stage,
      startTime: start,
      endTime: end,
      meetingLink: input.meetingLink || null,
      interviewerIds: fromList(input.interviewerIds),
      status: input.status,
    },
  });

  await logAudit({
    entityType: "InterviewEvent",
    entityId: interview.id,
    action: "SCHEDULED",
    actorId: actor.id,
    metadata: {
      applicationId,
      title: interview.title,
      conflictsDetected: conflicts.length,
    },
  });

  return {
    interview: {
      ...interview,
      interviewerIds: toList(interview.interviewerIds),
    },
    warnings: conflicts.map(
      (c) => `Interviewer ${c.interviewerName} has an overlapping scheduled interview: "${c.conflictingEventTitle}"`
    ),
  };
}

export async function updateInterview(
  id: string,
  input: InterviewUpdateInput,
  actor: Actor
) {
  const existing = await prisma.interviewEvent.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new NotFoundError(`Interview event ${id} not found`);
  }

  const updated = await prisma.interviewEvent.update({
    where: { id },
    data: {
      ...(input.title ? { title: input.title } : {}),
      ...(input.stage ? { stage: input.stage } : {}),
      ...(input.startTime ? { startTime: new Date(input.startTime) } : {}),
      ...(input.endTime ? { endTime: new Date(input.endTime) } : {}),
      ...(input.meetingLink !== undefined ? { meetingLink: input.meetingLink || null } : {}),
      ...(input.interviewerIds ? { interviewerIds: fromList(input.interviewerIds) } : {}),
      ...(input.status ? { status: input.status } : {}),
    },
  });

  await logAudit({
    entityType: "InterviewEvent",
    entityId: id,
    action: input.status ? `STATUS_${input.status}` : "UPDATED",
    actorId: actor.id,
    metadata: { changes: Object.keys(input) },
  });

  return {
    ...updated,
    interviewerIds: toList(updated.interviewerIds),
  };
}
