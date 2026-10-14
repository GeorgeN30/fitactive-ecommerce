import { Response } from "express";
import { AuthRequest } from "../middlewares/auth";
import { returnService } from "../services/returns";
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function error(res: Response, err: unknown) {
  const code = err instanceof Error ? err.message : "RETURN_FAILED";
  const known = ["ORDER_NOT_FOUND", "RETURN_NOT_FOUND", "ORDER_NOT_DELIVERED", "INVALID_RETURN_DATA", "INVALID_RETURN_DECISION", "RETURN_QUANTITY_EXCEEDED", "RETURN_ALREADY_RESOLVED", "RETURN_NOT_APPROVED", "RETURN_NOT_RECEIVED", "PAYMENT_NOT_REFUNDABLE", "REFUND_IN_PROGRESS", "MERCADO_PAGO_NOT_CONFIGURED", "REFUND_NOT_CONFIRMED"];
  res.status(code.includes("NOT_FOUND") ? 404 : code.startsWith("INVALID_") ? 400 : known.includes(code) ? 409 : 502).json({ error: known.includes(code) ? code : "RETURN_FAILED" });
}
export const returnController = {
  async list(req: AuthRequest, res: Response) { try { res.json({ requests: await returnService.list(req.user?.role === "admin" ? undefined : req.user!.userId) }); } catch (err) { error(res, err); } },
  async create(req: AuthRequest, res: Response) {
    if (!uuid.test(req.body?.orderId || "")) { res.status(400).json({ error: "INVALID_RETURN_DATA" }); return; }
    try { res.status(201).json({ request: await returnService.create(req.user!.userId, req.body) }); } catch (err) { error(res, err); }
  },
  async action(req: AuthRequest, res: Response) {
    if (!uuid.test(req.params.id)) { res.status(400).json({ error: "INVALID_RETURN_DATA" }); return; }
    try {
      const action = req.params.action;
      const request = action === "review" ? await returnService.review(req.params.id, req.user!.userId, req.body?.decision, req.body?.comment)
        : action === "receive" ? await returnService.receive(req.params.id, req.user!.userId)
        : action === "refund" ? await returnService.refund(req.params.id) : null;
      if (!request) { res.status(400).json({ error: "INVALID_RETURN_DECISION" }); return; }
      res.json({ request });
    } catch (err) { error(res, err); }
  },
};
