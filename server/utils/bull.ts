import { syncDraftsAllStores } from "../controllers/drafts_controller";

const Queue = require("bull");
const draftQueue = new Queue("draft-sync", process.env.REDIS_URL);

export const createCrons = () => {
    // syncs all drafts for all stores
    // draftQueue.add('syncAll', {}, { repeat: {cron:"0/10 * * * * ?"} })
};

draftQueue.process("syncAll", async (job) => {
    console.log("hitting here");
    return await syncDraftsAllStores();
});
