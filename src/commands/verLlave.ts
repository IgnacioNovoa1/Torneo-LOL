import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, AttachmentBuilder } from 'discord.js';
import { Tournament } from '../models/Tournament';
import { imageGenerator } from '../services/imageGenerator';

export const data = new SlashCommandBuilder()
    .setName('ver-llave')
    .setDescription('Muestra el estado actual de los Playoffs');

export async function execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();

    try {
        const tournament = await Tournament.findOne({ status: { $in: ['eliminatorias', 'finalizado'] } });

        if (!tournament || !tournament.playoffs) {
            await interaction.editReply('No hay eliminatorias activas.');
            return;
        }

        const imageBuffer = await imageGenerator.generatePlayoffsImage({
            semifinals: tournament.playoffs.semifinals,
            final: tournament.playoffs.final,
            thirdPlace: tournament.playoffs.thirdPlace
        });

        const attachment = new AttachmentBuilder(imageBuffer, { name: 'bracket.png' });

        const embed = new EmbedBuilder()
            .setTitle('🏆 BRACKET DE PLAYOFFS')
            .setColor(0xFFD700)
            .setImage('attachment://bracket.png')
            .setFooter({ text: 'Sistema Hextech v3.0' })
            .setTimestamp();

        await interaction.editReply({ embeds: [embed], files: [attachment] });

    } catch (error) {
        console.error(error);
        await interaction.editReply('Error al mostrar la llave.');
    }
}