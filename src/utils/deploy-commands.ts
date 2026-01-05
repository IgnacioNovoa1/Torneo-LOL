import { REST, Routes } from 'discord.js';
import dotenv from 'dotenv';
import * as inscribirCommand from '../commands/inscribir';
import * as askCommand from '../commands/ask';
import * as generarGruposCommand from '../commands/generarGrupos';
import * as verGruposCommand from '../commands/verGrupos';
import * as registrarResultadoCommand from '../commands/registrarResultado';
import * as generarPlayoffsCommand from '../commands/generarPlayoffs';
import * as avanzarEquipoCommand from '../commands/avanzarEquipo';
import * as verLlaveCommand from '../commands/verLlave';
import * as resetTorneo from '../commands/resetTorneo';
import * as agregarJugador from '../commands/agregarJugador';
import * as confirmarPago from '../commands/confirmarPago';
import * as setFase from '../commands/setFase';

dotenv.config();

const { DISCORD_TOKEN, CLIENT_ID, GUILD_ID } = process.env;

if (!DISCORD_TOKEN || !CLIENT_ID || !GUILD_ID) {
    throw new Error('Faltan variables en el archivo .env');
}

const commands = [
    inscribirCommand.data.toJSON(),
    askCommand.data.toJSON(),
    generarGruposCommand.data.toJSON(),
    verGruposCommand.data.toJSON(),
    registrarResultadoCommand.data.toJSON(),
    generarPlayoffsCommand.data.toJSON(),
    avanzarEquipoCommand.data.toJSON(),
    verLlaveCommand.data.toJSON(),
    resetTorneo.data.toJSON(),
    agregarJugador.data.toJSON(),
    confirmarPago.data.toJSON(),
    setFase.data.toJSON()
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