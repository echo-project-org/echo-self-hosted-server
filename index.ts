import express from "express";
import bodyParser from "body-parser";
import { createServer } from "node:http";
import cors from "npm:cors";
import { Logger } from "./classes/Logger.ts";
import ConfigLoader from "./classes/ConfigLoader.ts";

const config = new ConfigLoader().getCfg();

const logger = new Logger();
logger.info("Starting Echo Self-Hosted Server...");

const app = express();
logger.info("Creating Express app...");

app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));
app.use(bodyParser.json({ limit: "50mb" }));

app.use(cors());

logger.info("Setting up middleware for API requests...");
app.use((req, res, next) => {
    logger.info("Got api request - Query:", req.url, "Method:", req.method);
    res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    res.setHeader("Access-Control-Expose-Headers", "Authorization");
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

    next();
});

const httpServer = createServer(app);
logger.info("Creating HTTP server...");

httpServer.listen(config.port, () => {
    logger.info(`HTTP Server is running on port ${config.port}`);
});


