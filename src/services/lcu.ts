import WebSocket from 'ws';
const LcuConnector = require('lcu-connector');
interface LcuEvent {
    uri: string;
    eventType: 'Create' | 'Update' | 'Delete';
    data: any;
}

export class LeagueClientService {
    private connector: any;
    private ws: WebSocket | null = null;

    constructor() {
        this.connector = new LcuConnector();
        process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "0";
    }

    public start() {
        console.log('Buscando cliente de League of Legends...');

        this.connector.on('connect', (data: any) => {
            const { protocol, address, port, username, password } = data;

            console.log(`Cliente encontrado en puerto ${port}`);

            const wsUrl = `wss://${username}:${password}@${address}:${port}`;
            this.connectWebSocket(wsUrl);
        });

        this.connector.start();
    }

    private connectWebSocket(url: string) {
        this.ws = new WebSocket(url);

        this.ws.on('open', () => {
            console.log('Conectado al WebSocket del Cliente (Tiempo Real).');
            this.ws?.send(JSON.stringify([5, "OnJsonApiEvent_lol-champ-select_v1_session"]));
        });

        this.ws.on('message', (msg: any) => {
            try {
                if (!msg) return;

                const parsedMsg = JSON.parse(msg.toString());
                if (Array.isArray(parsedMsg) && parsedMsg[2]) {
                    const eventData = parsedMsg[2] as LcuEvent;

                    this.handleChampSelectUpdate(eventData.data);
                }

            } catch (error) {
                console.error("Error parseando mensaje LCU:", error);
            }
        });

        this.ws.on('error', (err) => {
            console.error('Error en WebSocket LCU:', err);
        });
    }

    private handleChampSelectUpdate(data: any) {
        if (!data) return;

        console.log("⚡ CAMBIO DETECTADO EN CHAMP SELECT:");
        const blueTeam = data.myTeam;
        const redTeam = data.theirTeam;
        const timer = data.timer?.adjustedTimeLeftInPhase;

        console.log(`⏱️ Tiempo restante: ${timer}`);
        console.log(`🔵 Equipo Azul (Picks): ${blueTeam?.length}`);
        console.log(`🔴 Equipo Rojo (Picks): ${redTeam?.length}`);
    }
}