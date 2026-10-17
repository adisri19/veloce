import { withApi } from "@/lib/api";
import { prisma } from "@/lib/db";

export const GET = withApi(async () => {
  const users = await prisma.user.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      email: true,
      avatarUrl: true,
      role: true,
      department: true,
    },
    orderBy: { name: "asc" },
  });

  return { data: users };
});
