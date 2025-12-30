import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, ButtonBuilder, ButtonStyle, ActionRowBuilder } from 'discord.js';
import { Team } from '../models/Team';
import { Tournament } from '../models/Tournament';

export const data = new SlashCommandBuilder()
    .setName('reset-torneo')
    .setDescription('[ADMIN] ⚠️ ELIMINA todos los datos del torneo actual')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction: ChatInputCommandInteraction) {
    const confirmButton = new ButtonBuilder()
        .setCustomId('confirm_reset')
        .setLabel('✅ SÍ, ELIMINAR TODO')
        .setStyle(ButtonStyle.Danger);

    const cancelButton = new ButtonBuilder()
        .setCustomId('cancel_reset')
        .setLabel('❌ Cancelar')
        .setStyle(ButtonStyle.Secondary);

    const row = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(cancelButton, confirmButton);

    await interaction.reply({
        content: '**ADVERTENCIA CRÍTICA**\n\n' +
            'Esto eliminará:\n' +
            '• Todos los equipos inscritos\n' +
            '• Todos los grupos y resultados\n' +
            '• Toda la llave de playoffs\n' +
            '• Todos los roles y canales de equipos\n\n' +
            '**Esta acción NO se puede deshacer.**',
        components: [row],
        ephemeral: true
    });

    const filter = (i: any) => i.user.id === interaction.user.id;
    const collector = interaction.channel?.createMessageComponentCollector({
        filter,
        time: 15000
    });

    collector?.on('collect', async (i) => {
        if (i.customId === 'confirm_reset') {
            await i.update({
                content: 'Eliminando datos del torneo...',
                components: []
            });

            try {
                const guild = interaction.guild;
                if (!guild) {
                    await i.editReply('No se pudo acceder al servidor.');
                    return;
                }

                const teams = await Team.find();

                for (const team of teams) {
                    try {
                        if (team.roleId) {
                            const role = await guild.roles.fetch(team.roleId);
                            if (role) await role.delete();
                        }

                        if (team.categoryId) {
                            const category = await guild.channels.fetch(team.categoryId);
                            if (category) {
                                const channels = guild.channels.cache.filter(
                                    ch => ch.parentId === team.categoryId
                                );
                                for (const [, channel] of channels) {
                                    await channel.delete();
                                }
                                await category.delete();
                            }
                        }
                    } catch (error) {
                        console.error(`Error limpiando equipo ${team.name}:`, error);
                    }
                }

                const deletedTeams = await Team.deleteMany({});
                const deletedTournaments = await Tournament.deleteMany({});

                await i.editReply(
                    `**RESET COMPLETO**\n\n` +
                    `• ${deletedTeams.deletedCount} equipos eliminados\n` +
                    `• ${deletedTournaments.deletedCount} torneos eliminados\n` +
                    `• ${teams.length} roles y categorías eliminados\n\n` +
                    `El torneo ha sido reiniciado completamente.`
                );

            } catch (error) {
                console.error('Error en reset:', error);
                await i.editReply('Error durante el reset. Revisa los logs.');
            }

        } else if (i.customId === 'cancel_reset') {
            await i.update({
                content: 'Reset cancelado. No se eliminó nada.',
                components: []
            });
        }
    });

    collector?.on('end', (collected) => {
        if (collected.size === 0) {
            interaction.editReply({
                content: 'Tiempo agotado. Reset cancelado.',
                components: []
            });
        }
    });
}