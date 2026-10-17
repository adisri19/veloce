import { prisma } from "../db";
import { fromList, toList } from "../db-compat";
import { NoteCreateInput } from "../validations/note";
import { Actor } from "../auth";
import { logAudit } from "./audit";
import { NotFoundError } from "../api";

export async function createNote(
  applicationId: string,
  input: NoteCreateInput,
  actor: Actor
) {
  const application = await prisma.application.findUnique({
    where: { id: applicationId },
  });

  if (!application) {
    throw new NotFoundError(`Application ${applicationId} not found`);
  }

  const note = await prisma.candidateNote.create({
    data: {
      applicationId,
      authorId: actor.id,
      parentId: input.parentId || null,
      content: input.content,
      mentions: fromList(input.mentions || []),
      isPrivate: input.isPrivate || false,
    },
    include: {
      author: {
        select: { id: true, name: true, email: true, role: true, avatarUrl: true },
      },
    },
  });

  await logAudit({
    entityType: "CandidateNote",
    entityId: note.id,
    action: "CREATED",
    actorId: actor.id,
    metadata: {
      applicationId,
      isPrivate: note.isPrivate,
      isReply: Boolean(note.parentId),
    },
  });

  return {
    ...note,
    mentions: toList(note.mentions),
  };
}

export async function getNotes(applicationId: string, actor: Actor) {
  const canSeeAllPrivate = actor.role === "ADMIN" || actor.role === "RECRUITER";

  const notes = await prisma.candidateNote.findMany({
    where: {
      applicationId,
      ...(canSeeAllPrivate ? {} : { OR: [{ isPrivate: false }, { authorId: actor.id }] }),
    },
    include: {
      author: {
        select: { id: true, name: true, email: true, role: true, avatarUrl: true },
      },
      replies: {
        include: {
          author: {
            select: { id: true, name: true, email: true, role: true, avatarUrl: true },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return notes
    .filter((n) => !n.parentId)
    .map((n) => ({
      ...n,
      mentions: toList(n.mentions),
      replies: n.replies.map((r) => ({
        ...r,
        mentions: toList(r.mentions),
      })),
    }));
}
