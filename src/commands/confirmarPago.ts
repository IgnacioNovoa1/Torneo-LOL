import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits } from 'discord.js';
import { Team } from '../models/Team';

export const data = new SlashCommandBuilder()
    .setName('confirmar-pago')
    .setDescription('[ADMIN] Confirma el pago de inscripción de un equipo')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(option => 
        option.setName('equipo')
            .setDescription('Nombre exacto del equipo')
            .setRequired(true));

export async function execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();
    const teamName = interaction.options.getString('equipo', true);

    try {
        const team = await Team.findOne({ name: teamName });

        if (!team) {
            await interaction.editReply(`No encontré el equipo "${teamName}".`);
            return;
        }

        if (team.paid) {
            await interaction.editReply(`El equipo **${team.name}** ya estaba marcado como pagado.`);
            return;
        }

        team.paid = true;
        await team.save();

        await interaction.editReply(`**¡PAGO CONFIRMADO!**\nEl equipo **${team.name}** ahora está oficialmente inscrito en el torneo.`);

    } catch (error) {
        console.error(error);
        await interaction.editReply('Error al confirmar pago.');
    }
}