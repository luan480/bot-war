const { safeReadJson, safeWriteJson, capitalize } = require('../utils/helpers.js');

/**
 * Manipulador para o botão 'edit_match_' (Reverter Partida).
 * @param {import('discord.js').ButtonInteraction} interaction - A interação do botão.
 * @param {string} pontuacaoPath - O caminho para o arquivo pontuacao.json.
 * @param {string} partidasPath - O caminho para o arquivo partidas.json.
 */
module.exports = async (interaction, pontuacaoPath, partidasPath) => {
    // Responde ao usuário (apenas ele verá a resposta)
    await interaction.deferReply({ ephemeral: true });

    // O ID da partida está no customId do botão (ex: 'edit_match_123456')
    const messageId = interaction.customId.split('_')[2];

    // Lê os arquivos de partidas e o ranking geral
    const partidas = safeReadJson(partidasPath);
    const partidaParaReverter = partidas[messageId];

    // 1. VERIFICAÇÃO: A partida existe?
    if (!partidaParaReverter) {
        await interaction.editReply({ content: '❌ **Erro:** Partida não encontrada. Talvez ela já tenha sido revertida.' });
        // Se a partida não existe no JSON, apagamos a mensagem do Discord
        return interaction.message.delete().catch(() => {});
    }

    // 2. VERIFICAÇÃO: O usuário tem permissão?
    // Compara o ID do usuário que clicou com o ID salvo na partida
    if (partidaParaReverter.adminId !== interaction.user.id) {
        return interaction.editReply({ content: '❌ **Acesso Negado!** Apenas o administrador que registrou esta partida pode revertê-la.' });
    }

    // 3. LÓGICA DE REVERSÃO:
    const rankingGeral = safeReadJson(pontuacaoPath);
    let pontosRevertidosLog = []; // Apenas para mostrar ao admin o que foi feito

    // Itera sobre cada [nome, pontos] da partida salva
    for (const [nome, pontos] of Object.entries(partidaParaReverter.pontos)) {
        // Verifica se o nome existe no ranking geral
        if (rankingGeral[nome] !== undefined) {
            // REVERTE OS PONTOS (subtrai o que foi somado)
            rankingGeral[nome] -= pontos;
            // Adiciona ao log
            pontosRevertidosLog.push(`${capitalize(nome)}: ${pontos >= 0 ? '-' : '+'}${Math.abs(pontos)} pts`);
        }
    }

    // 4. SALVAR E LIMPAR:
    
    // Salva o ranking geral (agora com pontos revertidos)
    safeWriteJson(pontuacaoPath, rankingGeral);

    // Remove a partida do histórico (partidas.json)
    delete partidas[messageId];
    safeWriteJson(partidasPath, partidas);

    // Deleta a mensagem de resumo da partida do Discord
    await interaction.message.delete().catch(err => {
        console.warn(`Não foi possível apagar a mensagem da partida ${messageId}.`, err);
    });

    // 5. MENSAGEM DE SUCESSO:
    const logReversao = pontosRevertidosLog.join('\n') || 'Nenhum ponto foi alterado.';
    
    await interaction.editReply({ 
        content: `✅ **Partida Revertida com Sucesso!**\n\nOs seguintes pontos foram desfeitos:\n${logReversao}\n\nO ranking foi atualizado. Você pode iniciar a contabilização novamente.`
    });
    
    return;
};