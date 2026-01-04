import mongoose from 'mongoose';
import { Team } from '../models/Team';
import { Tournament } from '../models/Tournament';
import { Client, GatewayIntentBits, Guild, ChannelType } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

async function resetTournament() {
    try {
        console.log('Iniciando reset del torneo...\n');

        await mongoose.connect(process.env.MONGO_URI || '');
        console.log('Conectado a MongoDB');

        const teams = await Team.find();
        console.log(`Encontrados ${teams.length} equipos para limpiar`);

        await client.login(process.env.DISCORD_TOKEN);
        console.log('Bot de Discord conectado');

        const guild = await client.guilds.fetch(process.env.GUILD_ID || '');
        console.log(`Servidor encontrado: ${guild.name}\n`);

        console.log('Limpiando Discord...');
        for (const team of teams) {
            try {
                if (team.roleId) {
                    const role = await guild.roles.fetch(team.roleId);
                    if (role) {
                        await role.delete();
                        console.log(`  ✓ Rol eliminado: ${team.name}`);
                    }
                }

                if (team.categoryId) {
                    const category = await guild.channels.fetch(team.categoryId);
                    if (category && category.type === ChannelType.GuildCategory) {
                        const channelsInCategory = guild.channels.cache.filter(
                            ch => ch.parentId === team.categoryId
                        );
                        
                        for (const [, channel] of channelsInCategory) {
                            await channel.delete();
                            console.log(`  ✓ Canal eliminado: ${channel.name}`);
                        }

                        await category.delete();
                        console.log(`  ✓ Categoría eliminada: ${team.name}`);
                    }
                }
            } catch (error) {
                console.log(` Error limpiando equipo ${team.name}:`, error);
            }
        }

        console.log('\nLimpiando base de datos...');
        const deletedTeams = await Team.deleteMany({});
        console.log(`  ✓ ${deletedTeams.deletedCount} equipos eliminados`);

        const deletedTournaments = await Tournament.deleteMany({});
        console.log(`  ✓ ${deletedTournaments.deletedCount} torneos eliminados`);

        await mongoose.connection.close();
        await client.destroy();

        console.log('\n¡RESET COMPLETO EXITOSO!');
        console.log('Puedes empezar de nuevo con /inscribir\n');

        process.exit(0);

    } catch (error) {
        console.error('Error durante el reset:', error);
        await mongoose.connection.close();
        await client.destroy();
        process.exit(1);
    }
}

console.log('¡ADVERTENCIA! Este script eliminará:');
console.log('  - Todos los equipos de la BD');
console.log('  - Todos los torneos de la BD');
console.log('  - Todos los roles de equipos en Discord');
console.log('  - Todas las categorías y canales de equipos en Discord\n');

const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
});

readline.question('¿Estás seguro? Escribe "SI" para continuar: ', (answer: string) => {
    readline.close();
    if (answer.toUpperCase() === 'SI') {
        resetTournament();
    } else {
        console.log('Operación cancelada');
        process.exit(0);
    }
});