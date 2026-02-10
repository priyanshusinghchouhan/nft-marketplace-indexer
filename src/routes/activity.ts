import { Router } from "express";
import { getRecentActivity } from "../services/activity.service";

const router = Router();

router.get("/recent", async(req, res) => {
    try{
        const wallet = req.query.wallet as string | undefined;
        const limit = Number(req.query.limit) || 20;

        const activities = await getRecentActivity(wallet, limit);

        return res.json({
            count: activities.length,
            activities,
        });
        
    }catch(e) {
        console.error("Failed to fetch activity", e);
        return res.status(500).json({ error: "Internal server error" });
    }
});

export default router;