import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { Tournament } from '../models/Tournament';

export const data = new SlashCommandBuilder()
    .setName('ver-llave')
    .setDescription('Muestra el estado actual de las eliminatorias');

export async function execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();

    try {
        const tournament = await Tournament.findOne({ status: { $in: ['eliminatorias', 'finalizado'] } });

        if (!tournament || !tournament.playoffs) {
            await interaction.editReply('Aún no se han generado las eliminatorias.');
            return;
        }

        const sf1 = tournament.playoffs.semifinals[0];
        const sf2 = tournament.playoffs.semifinals[1];
        const final = tournament.playoffs.final;
        const third = tournament.playoffs.thirdPlace;

        const formatMatch = (match: any) => {
            if (!match || !match.played) return `${match?.teamA || 'TBD'} vs ${match?.teamB || 'TBD'}`;
            return `~~${match.teamA} vs ${match.teamB}~~ → **${match.winner}**`;
        };

        const embed = new EmbedBuilder()
            .setTitle('🏆 LLAVE DE ELIMINATORIAS')
            .setColor(0xffd700)
            .addFields(
                { name: '⚔️ SEMIFINAL 1', value: formatMatch(sf1), inline: false },
                { name: '⚔️ SEMIFINAL 2', value: formatMatch(sf2), inline: false },
                { name: '🥉 TERCER LUGAR', value: formatMatch(third), inline: false },
                { name: '🏅 GRAN FINAL', value: formatMatch(final), inline: false }
            )
            .setFooter({ text: 'Actualizado en tiempo real' })
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });

    } catch (error) {
        console.error('Error mostrando llave:', error);
        await interaction.editReply('Error al mostrar llave.');
    }
}