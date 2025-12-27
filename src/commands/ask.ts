import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { consultAdminAI } from '../services/aiService';

export const data = new SlashCommandBuilder()
    .setName('duda')
    .setDescription('Consulta administrativa sobre el torneo (Horarios, Premios, Reglas)')
    .addStringOption(option =>
        option.setName('pregunta')
            .setDescription('Ej: ¿Cuándo es la final? / ¿Cuáles son los premios?')
            .setRequired(true));

export async function execute(interaction: ChatInputCommandInteraction) {
    try {
        await interaction.deferReply(); 
    
        const question = interaction.options.getString('pregunta', true);
        const answer = await consultAdminAI(question);
    
        await interaction.editReply(`**Pregunta:** ${question}\n\n**Respuesta:** ${answer}`);

    } catch (error) {
        console.error("Error en comando /duda:", error);
        if (interaction.deferred || interaction.replied){
            await interaction.editReply({ content: "Ocurrió un error al procesar tu pregunta."});
        } else {
            await interaction.reply({ content: "Ocurrió un error al procesar tu pregunta.", ephemeral: true});
        }
    }
}