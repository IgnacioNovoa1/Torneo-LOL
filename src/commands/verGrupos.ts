import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { Tournament } from '../models/Tournament';

export const data = new SlashCommandBuilder()
    .setName('ver-grupos')
    .setDescription('Muestra los grupos y sus posiciones actuales');

export async function execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();

    try {
        const tournament = await Tournament.findOne({ status: { $in: ['grupos', 'eliminatorias'] } });

        if (!tournament || tournament.groups.A.length === 0) {
            await interaction.editReply('Aún no se han generado los grupos.');
            return;
        }

        const formatStandings = (standings: any[]) => {
            return standings
                .sort((a, b) => b.wins - a.wins || a.losses - b.losses)
                .map((s, i) => `${i + 1}. **${s.team}** - ${s.wins}V / ${s.losses}D`)
                .join('\n') || 'Sin partidos jugados';
        };

        const embed = new EmbedBuilder()
            .setTitle('📊 FASE DE GRUPOS')
            .setColor(0x0099ff)
            .addFields(
                { name: '🔵 GRUPO A', value: formatStandings([...tournament.groupStandings.A]), inline: true },
                { name: '🔴 GRUPO B', value: formatStandings([...tournament.groupStandings.B]), inline: true }
            )
            .setFooter({ text: 'Los 2 mejores de cada grupo clasifican a semifinales' })
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });

    } catch (error) {
        console.error('Error mostrando grupos:', error);
        await interaction.editReply('Error al mostrar grupos.');
    }
}