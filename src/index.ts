import { Client, GatewayIntentBits, Events, TextChannel } from 'discord.js';
import dotenv from 'dotenv';
import express from 'express';
import { Server, Socket } from 'socket.io';
import http from 'http';
import mongoose from 'mongoose';
import * as inscribirCommand from './commands/inscribir';
import * as askCommand from './commands/ask';
import * as generarGruposCommand from './commands/generarGrupos';
import * as verGruposCommand from './commands/verGrupos';
import * as registrarResultadoCommand from './commands/registrarResultado';
import * as generarPlayoffsCommand from './commands/generarPlayoffs';
import * as avanzarEquipoCommand from './commands/avanzarEquipo';
import * as verLlaveCommand from './commands/verLlave';
import path from 'path';
import { mapLcuToDraft } from './utils/draftMapper';

dotenv.config();

const PORT = process.env.PORT || 3000;
const SECRET_KEY = process.env.TOURNAMENT_SECRET;
const CHANNEL_ID_NOTIFICACIONES = process.env.DISCORD_ANNOUNCEMENT_CHANNEL;
const MONGO_URI = process.env.MONGO_URI || '';

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(express.static(path.join(__dirname, '../public')));

io.use((socket: Socket, next) => {
    const token = socket.handshake.auth.token;
    if (token === SECRET_KEY) {
        socket.data.role = 'ADMIN';
        return next();
    } else {
        socket.data.role = 'GUEST';
        return next();
    }
});

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

let isMatchLive = false;

io.on('connection', (socket) => {
    if (socket.data.role === 'ADMIN') {
        console.log(`Agente Local Conectado: ${socket.id}`);
    } else {
        console.log(`Espectador Web Conectado: ${socket.id}`);
        socket.join('web-room');
    }

    socket.on('champSelectUpdate', async (data) => {
        if (socket.data.role !== 'ADMIN') return;

        if (data && data.timer && !isMatchLive) {
            if (data.timer.phase === 'BAN_PICK' || data.timer.phase === 'PLANNING') {
                isMatchLive = true;
                console.log("DETECTADO INICIO DE DRAFT");

                if (CHANNEL_ID_NOTIFICACIONES) {
                    try {
                        const channel = await client.channels.fetch(CHANNEL_ID_NOTIFICACIONES) as TextChannel;
                        if (channel) await channel.send("**¡ATENCIÓN!** Comienza el Draft. 🔴 EN VIVO: https://kick.com/francocoss");
                    } catch (e) { console.error("Error Discord:", e); }
                }
            }
        }

        const webData = mapLcuToDraft(data);
        io.to('web-room').emit('web-update', webData);
    });

    socket.on('disconnect', () => {
        if (socket.data.role === 'ADMIN') {
            console.log('Agente Local desconectado');
            isMatchLive = false;
        }
    });
});

client.once(Events.ClientReady, c => console.log(`Bot conectado como: ${c.user.tag}`));

client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const { commandName } = interaction;

    try {
        if (commandName === 'inscribir') await inscribirCommand.execute(interaction);
        else if (commandName === 'duda') await askCommand.execute(interaction);
        else if (commandName === 'generar-grupos') await generarGruposCommand.execute(interaction);
        else if (commandName === 'ver-grupos') await verGruposCommand.execute(interaction);
        else if (commandName === 'registrar-resultado') await registrarResultadoCommand.execute(interaction);
        else if (commandName === 'generar-playoffs') await generarPlayoffsCommand.execute(interaction);
        else if (commandName === 'avanzar-equipo') await avanzarEquipoCommand.execute(interaction);
        else if (commandName === 'ver-llave') await verLlaveCommand.execute(interaction);
    } catch (error) {
        console.error(`Error ejecutando comando ${commandName}:`, error);
    }
});

const startServer = async () => {
    try {
        if (!MONGO_URI) throw new Error("Falta MONGO_URI");

        await mongoose.connect(MONGO_URI);
        console.log('MongoDB conectada');

        await client.login(process.env.DISCORD_TOKEN);

        server.listen(PORT, () => {
            console.log(`Sistema escuchando en puerto ${PORT}`);
        });
    } catch (error) {
        console.error('Error iniciando sistema:', error);
        process.exit(1);
    }
};

startServer();