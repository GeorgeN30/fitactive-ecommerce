import { Request, Response, NextFunction } from "express";
import { authService } from "../services/auth";
import { HTTP_STATUS } from "../constants";
import { prisma } from "../config/prisma";

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    role: string;
    [key: string]: unknown;
  };
}

export function validateJWT(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  validateToken(req, res, next, false);
}

export function validateMfaPendingJWT(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  validateToken(req, res, next, true);
}

function validateToken(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
  allowMfaPending: boolean
): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(HTTP_STATUS.UNAUTHORIZED).json({ error: "NO_TOKEN" });
    return;
  }

  const token = authHeader.split(" ")[1];

  authService
    .verifyToken(token)
    .then(async (result) => {
      if (!result.valid) {
        res.status(HTTP_STATUS.UNAUTHORIZED).json({ error: "INVALID_TOKEN" });
        return;
      }

      const claims = result.claims;
      const extra = claims.extra as Record<string, unknown> | undefined;
      const isMfaPending = extra?.purpose === "mfa_pending";

      if (isMfaPending !== allowMfaPending) {
        res.status(HTTP_STATUS.UNAUTHORIZED).json({ error: "INVALID_TOKEN" });
        return;
      }

      const userId = claims.sub as string;

      const dbUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true, isActive: true },
      });

      if (!dbUser || !dbUser.isActive) {
        res.status(HTTP_STATUS.UNAUTHORIZED).json({ error: "USER_INACTIVE" });
        return;
      }

      req.user = {
        userId,
        role: dbUser.role,
      };

      next();
    })
    .catch(() => {
      res.status(HTTP_STATUS.UNAUTHORIZED).json({ error: "TOKEN_VERIFY_FAILED" });
    });
}
