const { EmbedBuilder } = require('discord.js');
const path = require('path');
// Importa as funções de ajuda do novo arquivo de helpers
const { safeReadJson, capitalize } = require('../utils/helpers.js');

/**
 * Manipulador para os botões 'ver_ranking' e 'ver_todos_competidores'.
 * @param {import('discord.js').ButtonInteraction} interaction - A interação do botão.
 * @param {string} pontuacaoPath - O caminho para o arquivo pontuacao.json.
 */
module.exports = async (interaction, pontuacaoPath) => {
    // Responde ao usuário (apenas ele verá a resposta)
    await interaction.deferReply({ ephemeral: true });

    // Lê o ranking do arquivo JSON
    const ranking = safeReadJson(pontuacaoPath);
    const rankingArray = Object.entries(ranking); // Transforma { "nome": 10 } em [ ["nome", 10] ]

    // Lógica do 'ver_ranking' (TOP 10)
    if (interaction.customId === 'ver_ranking') {
        // Ordena o array do maior para o menor ponto
        const sorted = rankingArray.sort(([, a], [, b]) => b - a);
        
        // Mapeia o array para uma string formatada, pegando apenas os 10 primeiros
        const top10 = sorted.slice(0, 10)
            .map(([name, p], i) => `**${i + 1}.** ${capitalize(name)} — ${p} pts`)
            .join('\n');

        const embed = new EmbedBuilder()
            .setTitle('🏆 Top 10 do Ranking')
            .setDescription(top10 || 'Nenhum competidor.') // '||' caso o ranking esteja vazio
            .setColor('Gold');
            
        return interaction.editReply({ embeds: [embed] });
    }

    // Lógica do 'ver_todos_competidores'
    if (interaction.customId === 'ver_todos_competidores') {
        // Mapeia o array *completo* para uma string formatada
        const lista = rankingArray
            .map(([name, p]) => `${capitalize(name)} — ${p} pts`)
            .join('\n');
            
        const embed = new EmbedBuilder()
            .setTitle('📜 Todos os Competidores')
            .setDescription(lista || 'Nenhum competidor.')
            .setColor('Blue');

        return interaction.editReply({ embeds: [embed] });
    }
};