const express = require("express");
const cors = require("cors");
const db = require("./db");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// Endpoint to record a color detection
app.post("/api/detections", async (req, res) => {
  try {
    const { color, hsv_values } = req.body;

    if (!color) {
      return res.status(400).json({ error: "Color name is required" });
    }

    const [result] = await db.query(
      "INSERT INTO color_detections (color, hsv_values) VALUES (?, ?)",
      [color, JSON.stringify(hsv_values)]
    );

    res.status(201).json({
      message: "Color detection recorded",
      id: result.insertId,
    });
  } catch (error) {
    console.error("Error recording detection:", error);
    res.status(500).json({ error: "Failed to record detection" });
  }
});

// Endpoint to get all detections
app.get("/api/detections", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        color, 
        DATE_FORMAT(detected_at, '%Y-%m-%d %H:%i') as timestamp,
        COUNT(*) as count
      FROM color_detections 
      GROUP BY color, DATE_FORMAT(detected_at, '%Y-%m-%d %H:%i')
      ORDER BY detected_at DESC
      `);
    res.json(rows);
  } catch (error) {
    console.error("Error fetching detections:", error);
    res.status(500).json({ error: "Failed to fetch detections" });
  }
});

// Get detections for a specific color
app.get("/api/detections/:color", async (req, res) => {
  try {
    const [rows] = await db.query(
      `
      SELECT 
        color,
        DATE_FORMAT(detected_at, '%Y-%m-%d %H:%i') as timestamp,
        COUNT(*) as count
      FROM color_detections 
      WHERE color = ?
      GROUP BY color, DATE_FORMAT(detected_at, '%Y-%m-%d %H:%i')
      ORDER BY detected_at DESC
      LIMIT 50
    `,
      [req.params.color]
    );
    res.json(rows);
  } catch (error) {
    console.error("Error fetching color detections:", error);
    res.status(500).json({ error: "Failed to fetch color detections" });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
