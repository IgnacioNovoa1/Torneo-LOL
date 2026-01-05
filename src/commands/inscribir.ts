import { SlashCommandBuilder, ChannelType, PermissionFlagsBits, ChatInputCommandInteraction, GuildMember } from 'discord.js';
import { Team } from '../models/Team';

export const data = new SlashCommandBuilder()
    .setName('inscribir')
    .setDescription('Registra un equipo (Crea canales y rol)')
    .addStringOption(option =>
        option.setName('nombre_equipo')
            .setDescription('Nombre del equipo')
            .setRequired(true))
    .addUserOption(option =>
        option.setName('capitan')
            .setDescription('Usuario capitán del equipo')
            .setRequired(true));

export async function execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) return;
    await interaction.deferReply();

    const teamName = interaction.options.getString('nombre_equipo', true);
    const captainUser = interaction.options.getUser('capitan', true);
    const guild = interaction.guild;
    const member = await guild.members.fetch(interaction.user.id);
    const isAdmin = member.permissions.has(PermissionFlagsBits.Administrator);

    const safeName = teamName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');

    try {
        if (!isAdmin) {
            const existingCaptain = await Team.findOne({ captainId: captainUser.id, active: true });
            if (existingCaptain) {
                await interaction.editReply(`El usuario ${captainUser} ya es capitán del equipo **${existingCaptain.name}**. Solo se permite un equipo por capitán.`);
                return;
            }
        }

        const nameTaken = await Team.findOne({ name: teamName });
        if (nameTaken) {
            await interaction.editReply(`El nombre **${teamName}** ya está ocupado.`);
            return;
        }

        const teamRole = await guild.roles.create({
            name: teamName,
            color: 'Blue',
            reason: `Inscripción CocosCup por ${interaction.user.tag}`,
        });

        const category = await guild.channels.create({
            name: `--- ${teamName} ---`,
            type: ChannelType.GuildCategory,
        });

        await guild.channels.create({
            name: `chat-${safeName}`,
            type: ChannelType.GuildText,
            parent: category.id,
            permissionOverwrites: [
                { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
                { id: teamRole.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
                { id: captainUser.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels] },
                { id: interaction.client.user.id, allow: [PermissionFlagsBits.ViewChannel] }
            ],
        });

        await guild.channels.create({
            name: `Voz ${teamName}`,
            type: ChannelType.GuildVoice,
            parent: category.id,
            permissionOverwrites: [
                { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
                { id: teamRole.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect] }
            ],
        });

        const captainMember = await guild.members.fetch(captainUser.id);
        await captainMember.roles.add(teamRole);

        const newTeam = new Team({
            name: teamName,
            captainId: captainUser.id,
            captainName: captainUser.tag,
            roleId: teamRole.id,
            categoryId: category.id,
            paid: false,
            members: [{ id: captainUser.id, name: captainUser.username, role: 'CAPTAIN' }]
        });

        await newTeam.save();

        await interaction.editReply(`**Equipo ${teamName} registrado.**\n👤 Capitán: ${captainUser}\n⚠️ **Estado:** Pendiente de pago ($10.000). El capitán puede usar \`/agregar-jugador\` para sumar integrantes.`);

    } catch (error) {
        console.error(error);
        await interaction.editReply('Error crítico al crear el equipo.');
    }
}