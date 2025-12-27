import { SlashCommandBuilder, ChannelType, PermissionFlagsBits, ChatInputCommandInteraction, Guild } from 'discord.js';

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

    try {
        const teamRole = await guild.roles.create({
            name: teamName,
            color: 'Blue',
            reason: `Inscripción automática por ${interaction.user.tag}`,
        });

        const category = await guild.channels.create({
            name: `--- ${teamName} ---`,
            type: ChannelType.GuildCategory,
        });

        await guild.channels.create({
            name: `chat-${teamName.toLowerCase().replace(/\s+/g, '-')}`,
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

        await interaction.editReply(`**Éxito:** Equipo **${teamName}** creado.\n Capitán: ${captainUser}\n Canales privados configurados.`);

    } catch (error) {
        console.error("Error creando equipo:", error);
        await interaction.editReply('Error crítico: Asegúrate de que el rol del Bot esté por encima de los demás roles en la configuración del servidor.');
    }
}
