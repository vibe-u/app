// src/routes/quotes.js
import express from "express";
import fetch from "node-fetch";

const router = express.Router();

router.get("/frase", async (req, res) => {
    try {
        const response = await fetch("https://zenquotes.io/api/random");
        const data = await response.json();
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: "No se pudo obtener la frase" });
    }
});

export default router;
