import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, AttachmentBuilder } from 'discord.js';
import { Tournament } from '../models/Tournament';
import { imageGenerator } from '../services/imageGenerator';

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

        const imageBuffer = await imageGenerator.generateGroupsImage({
            A: tournament.groupStandings.A,
            B: tournament.groupStandings.B
        });

        const attachment = new AttachmentBuilder(imageBuffer, { name: 'grupos-actualizados.png' });

        const embed = new EmbedBuilder()
            .setTitle('FASE DE GRUPOS')
            .setColor(0x0099ff)
            .setDescription('Posiciones actualizadas')
            .setImage('attachment://grupos-actualizados.png')
            .setFooter({ text: 'Los 2 mejores de cada grupo clasifican a semifinales' })
            .setTimestamp();

        await interaction.editReply({ embeds: [embed], files: [attachment] });

    } catch (error) {
        console.error('Error mostrando grupos:', error);
        await interaction.editReply('Error al mostrar grupos.');
    }
}