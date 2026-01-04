import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, EmbedBuilder, AttachmentBuilder } from 'discord.js';
import { Tournament } from '../models/Tournament';
import { Team } from '../models/Team';
import { imageGenerator } from '../services/imageGenerator';

export const data = new SlashCommandBuilder()
    .setName('generar-grupos')
    .setDescription('[ADMIN] Genera los grupos aleatoriamente')
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

        const imageBuffer = await imageGenerator.generateGroupsImage({
            A: tournament.groupStandings.A,
            B: tournament.groupStandings.B
        });

        const attachment = new AttachmentBuilder(imageBuffer, { name: 'grupos-cocoscup.png'});
        
        const embed = new EmbedBuilder()
            .setTitle('🏆 GRUPOS DEFINIDOS COCOSCUP')
            .setColor(0xC8AA6E)
            .setDescription('Sorteo oficial de la fase de grupos.')
            .setImage('attachment://grupos-cocoscup.png')
            .setFooter({ text: 'Sistema Hextech v2.0' })
            .setTimestamp();

        await interaction.editReply({ content: '', embeds: [embed], files: [attachment] });

    } catch (error) {
        console.error(error);
        try {
            await interaction.editReply('Error al generar grupos.');
        } catch (e) {}
    }
}