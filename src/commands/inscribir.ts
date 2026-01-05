import { SlashCommandBuilder, ChannelType, PermissionFlagsBits, ChatInputCommandInteraction, GuildMember } from 'discord.js';
import { Team } from '../models/Team';

export const data = new SlashCommandBuilder()
    .setName('inscribir')
    .setDescription('Registra un equipo y crea su entorno privado')
    .addStringOption(option =>
        option.setName('nombre_equipo')
            .setDescription('Nombre del equipo (Ej: T1, G2 Esports)')
            .setRequired(true))
    .addUserOption(option =>
        option.setName('capitan')
            .setDescription('Usuario capitán del equipo')
            .setRequired(true));

export async function execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) {
        await interaction.reply('Este comando solo funciona en servidores.');
        return;
    }
    
    await interaction.deferReply({ ephemeral: false });

    const teamName = interaction.options.getString('nombre_equipo', true);
    const captainUser = interaction.options.getUser('capitan', true);
    const guild = interaction.guild;
    
    const executorMember = interaction.member as GuildMember;
    const isAdmin = executorMember.permissions.has(PermissionFlagsBits.Administrator);

    const safeName = teamName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-');

    try {
        const existingName = await Team.findOne({ 
            name: { $regex: new RegExp(`^${teamName}$`, 'i') } 
        });
        
        if (existingName) {
            await interaction.editReply(`El nombre de equipo **${existingName.name}** ya está ocupado.`);
            return;
        }

        const existingCaptain = await Team.findOne({ captainId: captainUser.id, active: true });
        
        if (existingCaptain) {
            if (isAdmin) {
                await interaction.followUp({ 
                    content: `**Aviso de Admin:** El usuario ${captainUser} ya lidera el equipo **${existingCaptain.name}**, pero se permite la creación por tus permisos.`, 
                    ephemeral: true 
                });
            } else {
                await interaction.editReply(`El usuario ${captainUser} ya es capitán del equipo **${existingCaptain.name}**. Solo se permite un equipo por capitán.`);
                return;
            }
        }

        let teamRole;
        let category;

        try {
            teamRole = await guild.roles.create({
                name: teamName,
                color: 'Blue',
                reason: `Inscripción por ${interaction.user.tag}`,
            });
            
            category = await guild.channels.create({
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
            
            const member = await guild.members.fetch(captainUser.id);
            await member.roles.add(teamRole);
            
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

            console.log(`Equipo ${teamName} creado.`);

            await interaction.editReply(
                `**¡Equipo ${teamName} registrado!**\n👤 **Capitán:** ${captainUser}\n**Estado:** Pendiente de pago ($10.000).`
            );

        } catch (discordError) {
            console.error("Error Discord:", discordError);
            if (teamRole) await teamRole.delete().catch(() => {});
            if (category) await category.delete().catch(() => {});
            await interaction.editReply('Error crítico creando roles/canales en Discord.');
        }

    } catch (dbError) {
        console.error("Error BD:", dbError);
        await interaction.editReply("Error de conexión con la base de datos.");
    }
}