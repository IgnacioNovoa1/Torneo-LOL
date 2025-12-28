import { SlashCommandBuilder, ChannelType, PermissionFlagsBits, ChatInputCommandInteraction, Guild } from 'discord.js';
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
    const safeName = teamName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-');
    try {
        const existingTeam = await Team.findOne({ name: teamName });
        if (existingTeam) {
            await interaction.editReply(`El equipo **${teamName}** ya está inscrito.`);
            return;
        }
    } catch (dbError) {
        console.error("Error conectando a BD:", dbError);
        await interaction.editReply("Error de conexión con la base de datos. Intenta nuevamente.");
        return;
    }

    let teamRole;
    let category;

    try {
        teamRole = await guild.roles.create({
            name: teamName,
            color: 'Blue',
            reason: `Inscripción automática por ${interaction.user.tag}`,
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
                {
                    id: guild.id,
                    deny: [PermissionFlagsBits.ViewChannel],
                },
                {
                    id: teamRole.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
                },
                {
                    id: captainUser.id,
                    allow: [
                        PermissionFlagsBits.ViewChannel,
                        PermissionFlagsBits.SendMessages,
                        PermissionFlagsBits.ManageChannels,
                    ],
                },
                {
                    id: interaction.client.user.id,
                    allow: [PermissionFlagsBits.ViewChannel], 
                }
            ],
        });
        await guild.channels.create({
            name: `Voz ${teamName}`,
            type: ChannelType.GuildVoice,
            parent: category.id,
            permissionOverwrites: [
                {
                    id: guild.id,
                    deny: [PermissionFlagsBits.ViewChannel],
                },
                {
                    id: teamRole.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect],
                }
            ],
        });
        const member = await guild.members.fetch(captainUser.id);
        await member.roles.add(teamRole);
        
        const newTeam = new Team({
            name: teamName,
            captainId: captainUser.id,
            captainName: captainUser.tag,
            roleId: teamRole.id,
            categoryId: category.id
        });

        await newTeam.save();

        console.log(`Equipo ${teamName} guardado en BD y Discord.`);

        await interaction.editReply(
            `**¡Éxito!** Equipo **${teamName}** registrado.\nCapitán: ${captainUser}.`
        );

    } catch (error) {
        console.error("Error creando equipo (Rollback iniciado):", error);
        if (teamRole) await teamRole.delete().catch(e => console.error("Error borrando rol:", e));
        if (category) {
            await category.delete().catch(e => console.error("Error borrando categoría:", e));
        }
        await interaction.editReply(
            '**Error crítico:** Hubo un fallo al registrar el equipo. Se han revertido los cambios en Discord (si fue posible).\nVerifica los permisos del Bot (debe estar arriba de los demás roles).'
        );
    }
}