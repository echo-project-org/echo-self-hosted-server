import { Socket } from 'socket.io';

class SocketConnection {
    public readonly id: string;
    public readonly address: string;
    public readonly userId: string;
    public readonly socket: Socket;

    constructor(socket: Socket) {
        this.socket = socket;
        this.id = socket.id;
        this.address = socket.handshake.address || '';
        //TODO extract userId from socket or token
        //this.userId = userId;
    }
}

export default SocketConnection;