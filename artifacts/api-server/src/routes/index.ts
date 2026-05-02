import { Router, type IRouter } from "express";
import healthRouter from "./health";
import formsRouter from "./forms";
import sessionsRouter from "./sessions";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/forms", formsRouter);
router.use("/sessions", sessionsRouter);

export default router;
