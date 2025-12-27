import { REST, Routes } from 'discord.js';
import dotenv from 'dotenv';
import * as inscribirCommand from './commands/inscribir';

dotenv.config();
const { DISCORD_TOKEN, CLIENT_ID, GUILD_ID } = process.env;

if (!DISCORD_TOKEN || !CLIENT_ID || !GUILD_ID) {
    throw new Error('Faltan variables en el archivo .env');
}

const commands = [
    inscribirCommand.data.toJSON(),
];

const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);

(async () => {
    try {
        console.log(`Registrando ${commands.length} comandos en el servidor...`);

        await rest.put(
            Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
            { body: commands },
        );

        console.log('¡Comandos registrados exitosamente!');
    } catch (error) {
        console.error(error);
    }
})();