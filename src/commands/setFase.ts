import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits } from 'discord.js';
import { Tournament, ITournament } from '../models/Tournament';

export const data = new SlashCommandBuilder()
    .setName('set-fase')
    .setDescription('[ADMIN] Cambia la fase del torneo')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(option =>
        option.setName('fase')
            .setDescription('Nueva fase del torneo')
            .addChoices(
                { name: 'Inscripciones Abiertas', value: 'inscripciones' },
                { name: 'Preparación de Grupos', value: 'preparacion' },
                { name: 'Fase de Grupos', value: 'grupos' },
                { name: 'Playoffs', value: 'playoffs' },
                { name: 'Finalizado', value: 'finalizado' }
            )
            .setRequired(true));

export async function execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();
    const newStatus = interaction.options.getString('fase', true) as ITournament['status'];

    try {
        let tournament = await Tournament.findOne({});
        
        if (!tournament) {
            tournament = new Tournament({ season: '2025', status: 'inscripciones' });
        }

        tournament.status = newStatus;
        await tournament.save();

        await interaction.editReply(`Fase actualizada a: **${newStatus.toUpperCase()}**.`);

    } catch (error) {
        console.error(error);
        await interaction.editReply('Error al actualizar fase.');
    }
}