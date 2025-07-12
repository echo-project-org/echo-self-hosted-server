import { Socket, Server as SocketIoServer } from 'socket.io';
import { Server } from 'node:http';
import { Logger } from '../classes/Logger.ts';
import { Namespace } from 'socket.io';
import SocketConnection from './SocketConnection.ts';

/**
 * WebSocket wrapper class for managing Socket.IO connections.
 * Also handles Mediasoup rooms and connections.
 */
class WsWrapper {
    //#region Static Properties
    private static config: any;
    //#endregion
    //#region Instance Properties
    private io: SocketIoServer;
    private connectedClients: Map<string, SocketConnection>;
    private logger: Logger;
    private roomsNamespace: Namespace
    //#endregion
    
    /**
     * Initializes the WebSocket server.
     * @param httpServer - The HTTP server to attach the WebSocket server to.
     * @param config - Configuration object for the WebSocket server.
    */
    public constructor(httpServer: Server, config: any) {
        WsWrapper.config = config;
        this.logger = new Logger();
        this.connectedClients = new Map<string, SocketConnection>();

        this.logger.info("Initializing SocketIO server...");
        this.io = new SocketIoServer(httpServer);

        // Bind methods to preserve 'this' context
        this.handleAuth = this.handleAuth.bind(this);
        this.handleGlobalEvents = this.handleGlobalEvents.bind(this);
        this.handleRoomEvents = this.handleRoomEvents.bind(this);
    }

    /**
     * Initializes the SocketIO server.
     * @returns {Promise<void>}
    */
    public async Init(): Promise<void> {
        this.logger.debug("Adding auth middleware to SocketIO server...");
        this.io.use(this.handleAuth);

        this.logger.debug("Setting up main connection...");
        this.io.on('connection', this.handleGlobalEvents);

        this.logger.debug("Setting up rooms namespace...");
        this.roomsNamespace = this.io.of(/^\/room-\d+$/).on("connection", this.handleRoomEvents);
    }

    /**
     * Handles authentication for WebSocket connections.
     * This method checks for a valid token in the request headers.
     * @param socket - The Socket.IO socket instance.
     * @param next - The callback function to call after authentication.
     * @return {void}
    */
    private handleAuth(socket: Socket, next: (err?: Error | undefined) => void): void {
        const req = socket.request;
        const token: string = req.headers['authorization']?.split(' ')[1] || "";

        if (!token) {
            this.logger.warn("No token provided for WebSocket connection");
            return next(new Error("Authentication error"));
        }

        next();
    }

    /**
     * Main namespace for the SocketIO server.
     * Handles updates like new connections, disconnections, room layout changes.
     * Basically broadcasts all events to all connected clients.
     * @param socket - The Socket.IO socket instance.
     * @returns {Promise<void>}
    */
    private async handleGlobalEvents(socket: Socket): Promise<void> {
        const req = socket.request;
        const address: string = req.headers['x-forwarded-for']?.at(0) || socket.handshake.address;
        this.logger.info(`New connection from ${address} - Socket ID: ${socket.id}`);

        const userId: string = "ciao";
        let connection = new SocketConnection(socket);

        this.connectedClients.set(userId, connection);
    }

    /**
     * Dynamic namespace for rooms.
     * This namespace is created dynamically for each room. 
     * I love Socket.IO
     * @param socket - The Socket.IO socket instance.
     * @returns {Promise<void>}
    */
    private async handleRoomEvents(socket: Socket): Promise<void> {
        const newNamespace = socket.nsp; // newNamespace.name === "/dynamic-101"
        const req = socket.request;
        const address: string = req.headers['x-forwarded-for']?.at(0) || socket.handshake.address;

        this.logger.info(`New connection to room ${newNamespace.name} from ${address} - Socket ID: ${socket.id}`);

        // broadcast to all clients in the given sub-namespace
        newNamespace.emit("UserJoined", "ciaone");
    }
}

export default WsWrapper;