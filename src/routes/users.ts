import { Router } from "express";
import { getNFTsByOwner } from "../services/nft.service";

const router = Router();

router.get("/:wallet/nfts", async(req, res) => {
    try{
        const { wallet } = req.params;
        console.log("Current User's wallet: ", wallet);
        const nfts = await getNFTsByOwner(wallet);

        return res.json({
            wallet: wallet.toLowerCase(),
            count: nfts.length,
            nfts
        })
    }catch(e){
        console.log("Failed to fetch nfts", e);
        return res.status(500).json({ e : "Internal server error" });
    }
});

export default router;