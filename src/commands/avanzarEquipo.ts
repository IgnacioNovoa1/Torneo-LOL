import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import { Tournament } from '../models/Tournament';
import { Team } from '../models/Team';

export const data = new SlashCommandBuilder()
    .setName('avanzar-equipo')
    .setDescription('[ADMIN] Registra el ganador de una semifinal y avanza automáticamente')
    .addIntegerOption(option =>
        option.setName('semifinal')
            .setDescription('Número de semifinal')
            .setRequired(true)
            .addChoices(
                { name: 'Semifinal 1', value: 1 },
                { name: 'Semifinal 2', value: 2 }
            ))
    .addStringOption(option =>
        option.setName('ganador')
            .setDescription('Nombre del equipo ganador')
            .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();

    try {
        const semifinalNum = interaction.options.getInteger('semifinal', true);
        const winner = interaction.options.getString('ganador', true);

        const tournament = await Tournament.findOne({ status: 'eliminatorias' });

        if (!tournament || !tournament.playoffs) {
            await interaction.editReply('No hay un torneo activo en fase de eliminatorias.');
            return;
        }

        const semifinal = tournament.playoffs.semifinals[semifinalNum - 1];

        if (!semifinal || semifinal.played) {
            await interaction.editReply('Esta semifinal no existe o ya fue jugada.');
            return;
        }

        if (winner !== semifinal.teamA && winner !== semifinal.teamB) {
            await interaction.editReply(`El ganador debe ser **${semifinal.teamA}** o **${semifinal.teamB}**.`);
            return;
        }

        const loser = winner === semifinal.teamA ? semifinal.teamB : semifinal.teamA;

        semifinal.winner = winner;
        semifinal.played = true;

        if (tournament.playoffs.final && tournament.playoffs.thirdPlace) {
            if (semifinalNum === 1) {
                tournament.playoffs.final.teamA = winner;
                tournament.playoffs.thirdPlace.teamA = loser;
            } else {
                tournament.playoffs.final.teamB = winner;
                tournament.playoffs.thirdPlace.teamB = loser;
            }
        }

        await tournament.save();

        const winnerTeam = await Team.findOne({ name: winner });
        const loserTeam = await Team.findOne({ name: loser });

        if (winnerTeam && winnerTeam.stats) {
            winnerTeam.stats.wins += 1;
            await winnerTeam.save();
        }

        if (loserTeam && loserTeam.stats) {
            loserTeam.stats.losses += 1;
            await loserTeam.save();
        }

        const embed = new EmbedBuilder()
            .setTitle('SEMIFINAL FINALIZADA')
            .setColor(0x00ff00)
            .setDescription(`**${winner}** avanza a la final`)
            .addFields(
                { name: 'Ganador', value: winner, inline: true },
                { name: 'Eliminado', value: loser, inline: true },
                { name: 'Siguiente Partido', value: `${loser} jugará por el tercer lugar`, inline: false }
            )
            .setFooter({ text: 'Usa /ver-llave para ver la llave actualizada' })
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });

    } catch (error) {
        console.error('Error avanzando equipo:', error);
        await interaction.editReply('Error al avanzar equipo.');
    }
}