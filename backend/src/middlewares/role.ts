import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth";
import { HTTP_STATUS } from "../constants";

export function checkRole(...allowedRoles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(HTTP_STATUS.UNAUTHORIZED).json({ error: "NOT_AUTHENTICATED" });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(HTTP_STATUS.FORBIDDEN).json({ error: "INSUFFICIENT_ROLE" });
      return;
    }

    next();
  };
}
