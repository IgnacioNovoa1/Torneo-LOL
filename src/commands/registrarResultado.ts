import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import { Tournament } from '../models/Tournament';
import { Team } from '../models/Team';

export const data = new SlashCommandBuilder()
    .setName('registrar-resultado')
    .setDescription('[ADMIN] Registra el resultado de un partido de grupos')
    .addStringOption(option =>
        option.setName('grupo')
            .setDescription('Grupo del partido')
            .setRequired(true)
            .addChoices(
                { name: 'Grupo A', value: 'A' },
                { name: 'Grupo B', value: 'B' }
            ))
    .addStringOption(option =>
        option.setName('ganador')
            .setDescription('Nombre del equipo ganador')
            .setRequired(true))
    .addStringOption(option =>
        option.setName('perdedor')
            .setDescription('Nombre del equipo perdedor')
            .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();

    try {
        const group = interaction.options.getString('grupo', true) as 'A' | 'B';
        const winner = interaction.options.getString('ganador', true);
        const loser = interaction.options.getString('perdedor', true);

        const tournament = await Tournament.findOne({ status: 'grupos' });

        if (!tournament) {
            await interaction.editReply('No hay un torneo activo en fase de grupos.');
            return;
        }

        const standings = [...tournament.groupStandings[group]];
        const winnerStanding = standings.find(s => s.team === winner);
        const loserStanding = standings.find(s => s.team === loser);

        if (!winnerStanding || !loserStanding) {
            await interaction.editReply('Uno o ambos equipos no pertenecen a este grupo.');
            return;
        }

        winnerStanding.wins += 1;
        loserStanding.losses += 1;

        tournament.groupStandings[group] = standings as any;
        await tournament.save();

        const winnerTeam = await Team.findOne({ name: winner });
        const loserTeam = await Team.findOne({ name: loser });

        if (winnerTeam && winnerTeam.stats) {
            winnerTeam.stats.wins += 1;
            await winnerTeam.save();
        }

        if (loserTeam && loserTeam.stats) {
            loserTeam.stats.losses += 1;
            await loserTeam.save();
        }

        const embed = new EmbedBuilder()
            .setTitle('RESULTADO REGISTRADO')
            .setColor(0x00ff00)
            .setDescription(`**${winner}** derrotó a **${loser}**`)
            .addFields(
                { name: 'Grupo', value: `Grupo ${group}`, inline: true },
                { name: 'Record Ganador', value: `${winnerStanding.wins}V - ${winnerStanding.losses}D`, inline: true },
                { name: 'Record Perdedor', value: `${loserStanding.wins}V - ${loserStanding.losses}D`, inline: true }
            )
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });

    } catch (error) {
        console.error('Error registrando resultado:', error);
        await interaction.editReply('Error al registrar resultado.');
    }
}