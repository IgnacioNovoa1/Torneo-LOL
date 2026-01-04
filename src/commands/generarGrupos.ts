import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, EmbedBuilder, Attachment, AttachmentBuilder } from 'discord.js';
import { Tournament } from '../models/Tournament';
import { Team } from '../models/Team';
import { imageGenerator } from '../services/imageGenerator';

export const data = new SlashCommandBuilder()
    .setName('generar-grupos')
    .setDescription('[ADMIN] Genera los grupos de la fase de grupos aleatoriamente')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();

    try {
        const teams = await Team.find({ active: true });

        if (teams.length < 4) {
            await interaction.editReply('Se necesitan al menos 4 equipos inscritos para generar grupos.');
            return;
        }

        if (teams.length % 4 !== 0) {
            await interaction.editReply(`La cantidad de equipos debe ser múltiplo de 4. Actualmente hay ${teams.length} equipos.`);
            return;
        }

        const shuffled = teams.sort(() => Math.random() - 0.5);
        const teamsPerGroup = teams.length / 2;

        const groupA = shuffled.slice(0, teamsPerGroup).map(t => t.name);
        const groupB = shuffled.slice(teamsPerGroup).map(t => t.name);

        let tournament = await Tournament.findOne({ status: { $in: ['inscripciones', 'grupos'] } });

        if (tournament) {
            tournament.groups.A = groupA;
            tournament.groups.B = groupB;
            tournament.groupStandings.A = groupA.map(team => ({ team, wins: 0, losses: 0 })) as any;
            tournament.groupStandings.B = groupB.map(team => ({ team, wins: 0, losses: 0 })) as any;
            tournament.status = 'grupos';
            await tournament.save();
        } else {
            tournament = new Tournament({
                season: `Temporada ${new Date().getFullYear()}`,
                status: 'grupos',
                groups: { A: groupA, B: groupB },
                groupStandings: {
                    A: groupA.map(team => ({ team, wins: 0, losses: 0 })),
                    B: groupB.map(team => ({ team, wins: 0, losses: 0 }))
                }
            });
            await tournament.save();
        }

        await interaction.editReply('Generando imagen de grupo...');
        const imageBuffer = await imageGenerator.generateGroupsImage({
            A: tournament.groupStandings.A,
            B: tournament.groupStandings.B
        });
        const attachment = new AttachmentBuilder(imageBuffer, { name: 'grupos.png'});
        const embed = new EmbedBuilder()
            .setTitle('FASE DE GRUPOS GENERADA')
            .setColor(0x00ff00)
            .addFields(
                { name: '🔵 GRUPO A', value: groupA.map((t, i) => `${i + 1}. ${t}`).join('\n'), inline: true },
                { name: '🔴 GRUPO B', value: groupB.map((t, i) => `${i + 1}. ${t}`).join('\n'), inline: true }
            )
            .setImage('attachment://grupos.png')
            .setFooter({ text: 'Usa /ver-grupos para consultar los grupos' })
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });

    } catch (error) {
        console.error('Error generando grupos:', error);
        await interaction.editReply('Error al generar grupos.');
    }
}