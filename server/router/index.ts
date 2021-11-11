import combineRouters from "koa-combine-routers";
import billingRouter from "./billing";

const router = combineRouters(billingRouter);

export default router;
