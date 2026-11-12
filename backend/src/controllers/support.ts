import { Response } from "express";
import { prisma } from "../config/prisma";
import { AuthRequest } from "../middlewares/auth";

export const supportController = {
  async list(req: AuthRequest, res: Response) {
    try { res.json({ tickets: await prisma.support_tickets.findMany({ where: req.user?.role === "admin" ? undefined : { user_id: req.user!.userId }, orderBy: { created_at: "desc" }, take: 100 }) }); }
    catch { res.status(500).json({ error: "SUPPORT_LIST_FAILED" }); }
  },
  async create(req: AuthRequest, res: Response) {
    const { subject, message } = req.body || {};
    if (typeof subject !== "string" || subject.trim().length < 3 || subject.length > 150 || typeof message !== "string" || message.trim().length < 10 || message.length > 2000) { res.status(400).json({ error: "INVALID_SUPPORT_MESSAGE" }); return; }
    try { const ticket = await prisma.support_tickets.create({ data: { user_id: req.user!.userId, subject: subject.trim(), message: message.trim() } }); res.status(201).json({ ticket }); }
    catch { res.status(500).json({ error: "SUPPORT_CREATE_FAILED" }); }
  },
  async respond(req: AuthRequest, res: Response) {
    const { response, status } = req.body || {};
    if (!["ANSWERED", "CLOSED"].includes(status) || typeof response !== "string" || !response.trim() || response.length > 2000) { res.status(400).json({ error: "INVALID_SUPPORT_RESPONSE" }); return; }
    try {
      const updated = await prisma.support_tickets.updateMany({ where: { id: req.params.id }, data: { response: response.trim(), status, responded_by: req.user!.userId } });
      if (!updated.count) { res.status(404).json({ error: "TICKET_NOT_FOUND" }); return; }
      res.json({ message: "SUPPORT_UPDATED" });
    } catch { res.status(500).json({ error: "SUPPORT_UPDATE_FAILED" }); }
  },
};
