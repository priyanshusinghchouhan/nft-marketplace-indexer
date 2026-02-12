import { Router } from "express";
import { getActiveListing } from "../services/listing.service";

const router = Router();

router.get("/listings", async(req, res) => {
    try {
        const listings = await getActiveListing();

        return res.json({
            count: listings.length,
            listings
        })
    }catch(e) {
        console.log("Failed to fetch listings", e);
        return res.status(500).json({ e : "Internal server error" });
    }
});

export default router;