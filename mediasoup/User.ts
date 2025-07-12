import { Consumer, Producer } from 'mediasoup/types';
import { Socket, Namespace } from 'socket.io';

class User {
    public readonly id: string;
    public readonly address: string;
    public readonly userId: string;
    public globalSocket: Socket;
    public roomNamespace: Namespace | undefined;

    //#region Mediasoup Properties
    public audioProducer: Producer | undefined;
    public videoProducer: Producer | undefined;
    public audioConsumer: Consumer | undefined;
    public videoConsumer: Consumer | undefined;
    //#endregion

    constructor(globalSocket: Socket) {
        this.globalSocket = globalSocket;
        this.id = globalSocket.id;
        this.address = globalSocket.handshake.address || '';
        //TODO extract userId from socket or token
        //this.userId = userId;
    }

    public setRoomNamespace(namespace: Namespace): void {
        this.roomNamespace = namespace;
    }

    public setAudioProducer(producer: Producer): void {
        this.audioProducer = producer;
    }

    public setVideoProducer(producer: Producer): void {
        this.videoProducer = producer;
    }

    public setAudioConsumer(consumer: Consumer): void {
        this.audioConsumer = consumer;
    }

    public setVideoConsumer(consumer: Consumer): void {
        this.videoConsumer = consumer;
    }
}

export default User;