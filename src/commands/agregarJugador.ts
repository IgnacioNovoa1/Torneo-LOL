import { SlashCommandBuilder, ChatInputCommandInteraction, GuildMember } from 'discord.js';
import { Team } from '../models/Team';

export const data = new SlashCommandBuilder()
    .setName('agregar-jugador')
    .setDescription('Agrega un miembro a tu equipo y asígnale el rol')
    .addUserOption(option => 
        option.setName('usuario')
            .setDescription('El usuario a agregar')
            .setRequired(true))
    .addStringOption(option =>
        option.setName('rol')
            .setDescription('Posición principal')
            .addChoices(
                { name: 'Top', value: 'TOP' },
                { name: 'Jungle', value: 'JUNGLE' },
                { name: 'Mid', value: 'MID' },
                { name: 'ADC', value: 'ADC' },
                { name: 'Support', value: 'SUPPORT' },
                { name: 'Suplente', value: 'SUB' }
            )
            .setRequired(true));

export async function execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) return;
    await interaction.deferReply();

    const targetUser = interaction.options.getUser('usuario', true);
    const targetMember = interaction.options.getMember('usuario') as GuildMember;
    const roleInGame = interaction.options.getString('rol', true);
    const captainId = interaction.user.id;

    try {
        const team = await Team.findOne({ captainId: captainId, active: true });

        if (!team) {
            await interaction.editReply('No eres capitán de ningún equipo activo.');
            return;
        }

        const alreadyIn = team.members.some(m => m.id === targetUser.id);
        if (alreadyIn) {
            await interaction.editReply('Este usuario ya está en tu equipo.');
            return;
        }

        if (team.members.length >= 7) {
            await interaction.editReply('Tu equipo ya está lleno (Máx 7 integrantes).');
            return;
        }

        team.members.push({ id: targetUser.id, name: targetUser.username, role: roleInGame });
        await team.save();

        if (team.roleId) {
            await targetMember.roles.add(team.roleId).catch(console.error);
        }

        await interaction.editReply(`**${targetUser.username}** agregado a **${team.name}** como **${roleInGame}**.\nRol asignado correctamente.`);

    } catch (error) {
        console.error(error);
        await interaction.editReply('Error al agregar jugador.');
    }
}