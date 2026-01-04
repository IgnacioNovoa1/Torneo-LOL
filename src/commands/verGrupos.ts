import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, AttachmentBuilder } from 'discord.js';
import { Tournament } from '../models/Tournament';
import { imageGenerator } from '../services/imageGenerator';

export const data = new SlashCommandBuilder()
    .setName('ver-grupos')
    .setDescription('Muestra los grupos actuales');

export async function execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();

    try {
        const tournament = await Tournament.findOne({ status: { $in: ['grupos', 'eliminatorias'] } });

        if (!tournament || !tournament.groupStandings) {
            await interaction.editReply('No hay grupos generados.');
            return;
        }

        const imageBuffer = await imageGenerator.generateGroupsImage({
            A: tournament.groupStandings.A,
            B: tournament.groupStandings.B
        });

        const attachment = new AttachmentBuilder(imageBuffer, { name: 'grupos.png' });

        const embed = new EmbedBuilder()
            .setTitle('TABLA DE GRUPOS')
            .setColor(0x0099ff)
            .setImage('attachment://grupos.png')
            .setFooter({ text: 'Sistema Hextech v4.0' })
            .setTimestamp();

        await interaction.editReply({ embeds: [embed], files: [attachment] });

    } catch (error) {
        console.error(error);
        try {
            await interaction.editReply('Error mostrando grupos.');
        } catch { }
    }
}