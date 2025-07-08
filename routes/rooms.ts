import express from "express";
import { DatabaseSync } from 'node:sqlite';

const router = express.Router();

router.get("/", (req, res) => {
    let db: DatabaseSync = req.db;

    //get all rooms
    try {
        const stmt = db.prepare("SELECT * FROM rooms ORDER BY orderIndex");
        const rooms = stmt.all();
        //convert rooms img and bannerImg to base64 strings
        for (const room of rooms) {
            if (room.img) {
                room.img = Buffer.from(room.img).toString('base64');
            }
            if (room.bannerImg) {
                room.bannerImg = Buffer.from(room.bannerImg).toString('base64');
            }
        }
        res.json(rooms);
    } catch (error) {
        console.error("Error fetching rooms:", error);
        res.status(500).send("Internal Server Error");
    }
});

router.post("/create", (req, res) => {
    const name: string = req.body.name;
    const description: string = req.body.description;
    const maxUsers: number = req.body.maxUsers || 200;

    let db: DatabaseSync = req.db;
    try {
        const stmt = db.prepare("INSERT INTO rooms (name, description, maxUsers) VALUES (?, ?, ?)");
        stmt.run(name, description, maxUsers);
        res.status(201).send("Room created successfully");
    } catch (error) {
        console.error("Error creating room:", error);
        res.status(500).send("Internal Server Error");
    }
});

router.post("/update", (req, res) => {
    const roomId: number = req.body.roomId;
    const name: string = req.body.name;
    const description: string = req.body.description;
    const maxUsers: number = req.body.maxUsers || 200;

    let db: DatabaseSync = req.db;
    try {
        const stmt = db.prepare("UPDATE rooms SET name = ?, description = ?, maxUsers = ? WHERE id = ?");
        stmt.run(name, description, maxUsers, roomId);
        res.send("Room updated successfully");
    } catch (error) {
        console.error("Error updating room:", error);
        res.status(500).send("Internal Server Error");
    }
});

router.post("/img", (req, res) => {
    const roomId: number = req.body.roomId;
    // Assuming the image is sent as a base64 string
    const image: string = req.body.image;
    let db: DatabaseSync = req.db;
    try {
        // img should be a blob
        if (!image || typeof image !== "string") {
            res.status(400).send("Invalid image data");
            return;
        }
        let imageBuffer: Buffer;
        try {
            imageBuffer = Buffer.from(image, 'base64');
        } catch (e) {
            res.status(400).send("Failed to decode base64 image");
            return;
        }
        const stmt = db.prepare("UPDATE rooms SET img = ? WHERE id = ?");
        stmt.run(imageBuffer, roomId);
        res.send("Room image updated successfully");
    } catch (error) {
        console.error("Error updating room image:", error);
        res.status(500).send("Internal Server Error");
    }
});

router.post("/bannerImg", (req, res) => {
    const roomId: number = req.body.roomId;
    // Assuming the banner image is sent as a base64 string
    const bannerImage: string = req.body.bannerImage;
    let db: DatabaseSync = req.db;
    try {
        // bannerImg should be a blob
        if (!bannerImage || typeof bannerImage !== "string") {
            res.status(400).send("Invalid banner image data");
            return;
        }
        let bannerImageBuffer: Buffer;
        try {
            bannerImageBuffer = Buffer.from(bannerImage, 'base64');
        } catch (e) {
            res.status(400).send("Failed to decode base64 banner image");
            return;
        }
        const stmt = db.prepare("UPDATE rooms SET bannerImg = ? WHERE id = ?");
        stmt.run(bannerImageBuffer, roomId);
        res.send("Room banner image updated successfully");
    } catch (error) {
        console.error("Error updating room banner image:", error);
        res.status(500).send("Internal Server Error");
    }
});

router.post("/reorder", (req, res) => {
    const roomIds: number[] = req.body.roomIds;

    let db: DatabaseSync = req.db;
    try {
        const stmt = db.prepare("UPDATE rooms SET orderIndex = ? WHERE id = ?");
        for (let i = 0; i < roomIds.length; i++) {
            stmt.run(i, roomIds[i]);
        }
        res.send("Rooms reordered successfully");
    } catch (error) {
        console.error("Error reordering rooms:", error);
        res.status(500).send("Internal Server Error");
    }
});

router.post("/delete", (req, res) => {
    const roomId: number = req.body.roomId;

    let db: DatabaseSync = req.db;
    try {
        const stmt = db.prepare("DELETE FROM rooms WHERE id = ?");
        stmt.run(roomId);
        res.send("Room deleted successfully");
    } catch (error) {
        console.error("Error deleting room:", error);
        res.status(500).send("Internal Server Error");
    }
});

export default router;