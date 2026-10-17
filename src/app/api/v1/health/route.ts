import { withApi } from "@/lib/api";
import { prisma, isSqlite } from "@/lib/db";

export const GET = withApi(async () => {
  const userCount = await prisma.user.count();
  return {
    data: {
      status: "ok",
      database: isSqlite ? "sqlite" : "postgresql",
      userCount,
      timestamp: new Date().toISOString(),
    },
  };
});
