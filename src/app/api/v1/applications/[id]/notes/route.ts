import { withApi } from "@/lib/api";
import { NoteCreateSchema } from "@/lib/validations/note";
import { getNotes, createNote } from "@/lib/services/notes";

export const GET = withApi(async ({ params, actor }) => {
  const notes = await getNotes(params.id!, actor);
  return { data: notes };
});

export const POST = withApi(
  async ({ params, body, actor }) => {
    const note = await createNote(params.id!, body, actor);
    return { data: note, status: 201 };
  },
  {
    schema: NoteCreateSchema,
  }
);
