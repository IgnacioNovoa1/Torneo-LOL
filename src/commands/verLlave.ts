import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, AttachmentBuilder } from 'discord.js';
import { Tournament } from '../models/Tournament';
import { imageGenerator } from '../services/imageGenerator';

export const data = new SlashCommandBuilder()
    .setName('ver-llave')
    .setDescription('Muestra la llave de playoffs');

export async function execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();

    try {
        const tournament = await Tournament.findOne({ status: { $in: ['eliminatorias', 'finalizado'] } });

        if (!tournament || !tournament.playoffs) {
            await interaction.editReply('No hay eliminatorias generadas.');
            return;
        }

        const imageBuffer = await imageGenerator.generatePlayoffsImage({
            semifinals: tournament.playoffs.semifinals,
            final: tournament.playoffs.final,
            thirdPlace: tournament.playoffs.thirdPlace
        });

        const attachment = new AttachmentBuilder(imageBuffer, { name: 'bracket.png' });

        const embed = new EmbedBuilder()
            .setTitle('BRACKET ACTUAL')
            .setColor(0xFFD700)
            .setImage('attachment://bracket.png')
            .setTimestamp();

        await interaction.editReply({ embeds: [embed], files: [attachment] });

    } catch (error) {
        console.error(error);
        await interaction.editReply('Error mostrando la llave.');
    }
}