import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import { Tournament } from '../models/Tournament';

export const data = new SlashCommandBuilder()
    .setName('generar-playoffs')
    .setDescription('[ADMIN] Genera las llaves de eliminatorias con los 2 mejores de cada grupo')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();

    try {
        const tournament = await Tournament.findOne({ status: 'grupos' });

        if (!tournament) {
            await interaction.editReply('No hay un torneo en fase de grupos.');
            return;
        }

        const sortedA = tournament.groupStandings.A.sort((a, b) => b.wins - a.wins || a.losses - b.losses);
        const sortedB = tournament.groupStandings.B.sort((a, b) => b.wins - a.wins || a.losses - b.losses);

        if (sortedA.length < 2 || sortedB.length < 2) {
            await interaction.editReply('Cada grupo debe tener al menos 2 equipos.');
            return;
        }

        const firstA = sortedA[0].team;
        const secondA = sortedA[1].team;
        const firstB = sortedB[0].team;
        const secondB = sortedB[1].team;

        tournament.playoffs.semifinals = [
            { teamA: firstA, teamB: secondB, winner: null, scoreA: 0, scoreB: 0, played: false },
            { teamA: firstB, teamB: secondA, winner: null, scoreA: 0, scoreB: 0, played: false }
        ];

        tournament.playoffs.final = { teamA: 'TBD', teamB: 'TBD', winner: null, scoreA: 0, scoreB: 0, played: false };
        tournament.playoffs.thirdPlace = { teamA: 'TBD', teamB: 'TBD', winner: null, scoreA: 0, scoreB: 0, played: false };

        tournament.status = 'eliminatorias';
        await tournament.save();

        const embed = new EmbedBuilder()
            .setTitle('🏆 PLAYOFFS GENERADOS')
            .setColor(0xffd700)
            .setDescription('Las llaves de eliminación directa han sido creadas')
            .addFields(
                { name: '⚔️ SEMIFINAL 1', value: `${firstA} vs ${secondB}`, inline: false },
                { name: '⚔️ SEMIFINAL 2', value: `${firstB} vs ${secondA}`, inline: false },
                { name: '🏅 FINAL', value: 'Ganador SF1 vs Ganador SF2', inline: false },
                { name: '🥉 TERCER LUGAR', value: 'Perdedor SF1 vs Perdedor SF2', inline: false }
            )
            .setFooter({ text: 'Usa /ver-llave para consultar el estado actual' })
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });

    } catch (error) {
        console.error('Error generando playoffs:', error);
        await interaction.editReply('Error al generar playoffs.');
    }
}