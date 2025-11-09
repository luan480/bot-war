const path = require('path');

// Importa os novos handlers (manipuladores)
const handleRanking = require('./handlers/handleRanking.js');
const handleReverter = require('./handlers/handleReverter.js');
const handleIniciar = require('./handlers/handleIniciar.js');

/**
 * Este é o arquivo principal que gerencia TODOS os botões.
 * Ele atua como um "roteador", identificando qual botão foi clicado
 * e chamando o arquivo de handler correto para executar a lógica.
 */
module.exports = async (client, interaction) => {
    
    // Define os caminhos principais para os arquivos JSON
    const ligaPath = path.join(__dirname);
    const pontuacaoPath = path.join(ligaPath, 'pontuacao.json');
    const partidasPath = path.join(ligaPath, 'partidas.json');

    try {
        // --- Roteador de Botões ---

        // Se for um dos botões de ranking
        if (interaction.customId === 'ver_ranking' || interaction.customId === 'ver_todos_competidores') {
            // Chama o handler de Ranking
            await handleRanking(interaction, pontuacaoPath);
        }
        // Se for o botão de reverter
        else if (interaction.customId.startsWith('edit_match_')) {
            // Chama o handler de Reverter
            await handleReverter(interaction, pontuacaoPath, partidasPath);
        }
        // Se for o botão de iniciar
        else if (interaction.customId === 'iniciar_contabilizacao') {
            // Chama o handler de Iniciar
            await handleIniciar(client, interaction, pontuacaoPath, partidasPath);
        }
        
    } catch (err) {
        // Um 'catch' geral para qualquer erro que possa acontecer nos handlers
        console.error("Erro fatal no roteador de botões:", err);
        if (interaction.deferred || interaction.replied) {
            await interaction.followUp({ content: '❌ Ocorreu um erro ao processar sua solicitação.', ephemeral: true });
        } else {
            await interaction.reply({ content: '❌ Ocorreu um erro ao processar sua solicitação.', ephemeral: true });
        }
    }
};