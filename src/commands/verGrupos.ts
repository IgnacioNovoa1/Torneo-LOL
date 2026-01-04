import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, AttachmentBuilder } from 'discord.js';
import { Tournament } from '../models/Tournament';
import { imageGenerator } from '../services/imageGenerator';

export const data = new SlashCommandBuilder()
    .setName('ver-grupos')
    .setDescription('Muestra las tablas de posiciones actuales');

export async function execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();

    try {
        const tournament = await Tournament.findOne({ status: { $in: ['grupos', 'eliminatorias'] } });

        if (!tournament || !tournament.groupStandings) {
            await interaction.editReply('No hay una fase de grupos activa.');
            return;
        }

        const imageBuffer = await imageGenerator.generateGroupsImage({
            A: tournament.groupStandings.A,
            B: tournament.groupStandings.B
        });

        const attachment = new AttachmentBuilder(imageBuffer, { name: 'grupos.png' });

        const embed = new EmbedBuilder()
            .setTitle('TABLA DE POSICIONES')
            .setColor(0x0099ff)
            .setImage('attachment://grupos.png')
            .setFooter({ text: 'Sistema Hextech v3.0' })
            .setTimestamp();

        await interaction.editReply({ embeds: [embed], files: [attachment] });

    } catch (error) {
        console.error(error);
        await interaction.editReply('Error al obtener la tabla de grupos.');
    }
}