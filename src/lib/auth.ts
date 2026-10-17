import { prisma } from "./db";
import { RoleType } from "./validations/common";

export interface Actor {
  id: string;
  name: string;
  email: string;
  role: RoleType;
  department: string;
  avatarUrl?: string | null;
}

export const FALLBACK_RECRUITER_EMAIL = "elena.sokolova@veloce.dev";

export async function getActor(req?: Request): Promise<Actor> {
  let userId: string | null = null;

  if (req) {
    // 1. Check header x-user-id
    userId = req.headers.get("x-user-id");

    // 2. Check veloce_uid cookie
    if (!userId) {
      const cookieHeader = req.headers.get("cookie");
      if (cookieHeader) {
        const match = cookieHeader.match(/veloce_uid=([^;]+)/);
        if (match && match[1]) {
          userId = decodeURIComponent(match[1]);
        }
      }
    }
  }

  // Find user by id if provided
  if (userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (user && user.isActive) {
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role as RoleType,
        department: user.department,
        avatarUrl: user.avatarUrl,
      };
    }
  }

  // Fallback to Technical Recruiter Elena Sokolova
  const defaultRecruiter = await prisma.user.findFirst({
    where: { email: FALLBACK_RECRUITER_EMAIL },
  });

  if (defaultRecruiter) {
    return {
      id: defaultRecruiter.id,
      name: defaultRecruiter.name,
      email: defaultRecruiter.email,
      role: defaultRecruiter.role as RoleType,
      department: defaultRecruiter.department,
      avatarUrl: defaultRecruiter.avatarUrl,
    };
  }

  // Absolute fallback in case DB is completely empty (e.g. before initial seed)
  return {
    id: "system-actor-default",
    name: "Elena Sokolova (Default)",
    email: FALLBACK_RECRUITER_EMAIL,
    role: "RECRUITER",
    department: "Talent Acquisition",
    avatarUrl: null,
  };
}
