import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, AttachmentBuilder } from 'discord.js';
import { Tournament } from '../models/Tournament';
import { imageGenerator } from '../services/imageGenerator';

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

        const imageBuffer = await imageGenerator.generatePlayoffsImage({
            semifinals: tournament.playoffs.semifinals,
            final: tournament.playoffs.final,
            thirdPlace: tournament.playoffs.thirdPlace
        });

        const attachment = new AttachmentBuilder(imageBuffer, { name: 'playoffs-actualizados.png' });

        const embed = new EmbedBuilder()
            .setTitle('🏆 LLAVE DE ELIMINATORIAS')
            .setColor(0xffd700)
            .setDescription('Estado actual del torneo')
            .setImage('attachment://playoffs-actualizados.png')
            .setFooter({ text: 'Actualizado en tiempo real' })
            .setTimestamp();

        await interaction.editReply({ embeds: [embed], files: [attachment] });

    } catch (error) {
        console.error('Error mostrando llave:', error);
        await interaction.editReply('Error al mostrar llave.');
    }
}