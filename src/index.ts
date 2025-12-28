import { Client, GatewayIntentBits, Events, TextChannel } from 'discord.js';
import dotenv from 'dotenv';
import express from 'express';
import { Server } from 'socket.io';
import http from 'http';
import mongoose from 'mongoose';
import * as inscribirCommand from './commands/inscribir';
import * as askCommand from './commands/ask';

dotenv.config();

const PORT = process.env.PORT || 3000;
const SECRET_KEY = process.env.TOURNAMENT_SECRET;
const CHANNEL_ID_NOTIFICACIONES = process.env.DISCORD_ANNOUNCEMENT_CHANNEL;
const MONGO_URI = process.env.MONGO_URI || ''; 

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.get('/', (req, res) => {
    res.send('Admin Bot Online. Sistema administrativo activo.');
});

io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (token === SECRET_KEY) next();
    else next(new Error("Acceso Denegado"));
});

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

let isMatchLive = false;
io.on('connection', (socket) => {
    console.log(`Agente Local Conectado: ${socket.id}`);

    socket.on('champSelectUpdate', async (data) => {
        if (data && data.timer && !isMatchLive) {
            
            if (data.timer.phase === 'BAN_PICK' || data.timer.phase === 'PLANNING') {
                isMatchLive = true;
                console.log("DETECTADO INICIO DE DRAFT");

                if (CHANNEL_ID_NOTIFICACIONES) {
                    const channel = await client.channels.fetch(CHANNEL_ID_NOTIFICACIONES) as TextChannel;
                    if (channel) {
                        await channel.send("**¡ATENCIÓN!** Ha comenzado una nueva fase de Selección y Bloqueos. ¡Conéctense al Stream! https://kick.com/francocoss");
                    }
                }
            }
        }
    });

    socket.on('disconnect', () => {
        console.log('Agente Local desconectado');
        isMatchLive = false;
    });
});


client.once(Events.ClientReady, c => {
    console.log(`Bot conectado a Discord como: ${c.user.tag}`);
});

client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'inscribir') {
        await inscribirCommand.execute(interaction);
    } else if (interaction.commandName === 'duda') {
        await askCommand.execute(interaction);
    }
});

const startServer = async () => {
    try {
        if (!MONGO_URI) {
            throw new Error("Falta la variable MONGO_URI en el archivo .env");
        }
        await mongoose.connect(MONGO_URI);
        console.log('Base de datos MongoDB conectada con éxito');
        await client.login(process.env.DISCORD_TOKEN);
        server.listen(PORT, () => {
            console.log(`Sistema Administrativo escuchando en puerto ${PORT}`);
        });

    } catch (error) {
        console.error('Error CRÍTICO iniciando el sistema:', error);
        process.exit(1); 
    }
};
startServer();