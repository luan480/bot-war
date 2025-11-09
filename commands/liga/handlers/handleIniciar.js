const fs = require('fs');
const path = require('path');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
// O caminho para o config.json mudou (subimos 3 níveis: handlers -> liga -> commands -> root)
const config = require('../../../config.json');
const { safeReadJson, safeWriteJson, capitalize } = require('../utils/helpers.js');

/**
 * Função auxiliar que roda o processo de perguntas e respostas.
 * @param {import('discord.js').ButtonInteraction} interaction - A interação original.
 * @returns {Promise<{pontosDaPartida: object, respostas: Array<object>}>}
 */
async function runQuestionProcess(interaction) {
    // ... (Esta é a mesma função 'runQuestionProcess' do seu buttons.js original) ...
    // ... (Ela está movida para cá para manter o código organizado) ...
    const perguntasPath = path.join(__dirname, '..', 'perguntas.json'); // Ajuste de caminho
    const perguntas = JSON.parse(fs.readFileSync(perguntasPath));
    const respostas = [];

    for (const [i, p] of perguntas.entries()) {
        let pontosTexto = '';
        if (p.type === 'combate') pontosTexto = `(Ganha ${p.pontosGanhos} / Perde ${Math.abs(p.pontosPerdidos)})`;
        else if (p.pontos) pontosTexto = `(${p.pontos >= 0 ? '+' : ''}${p.pontos} pts)`;

        const perguntaMsg = await interaction.channel.send({ content: `**${p.pergunta}**\n${pontosTexto}\n\n*Aguardando resposta de ${interaction.user}...*` });
        const isLastQuestion = i === perguntas.length - 1;
        const timeLimit = isLastQuestion ? 20000 : 120000;

        try {
            const collected = await interaction.channel.awaitMessages({ filter: m => m.author.id === interaction.user.id, max: 1, time: timeLimit, errors: ['time'] });
            const userReply = collected.first();
            respostas.push({ resposta: userReply?.content || 'Sem resposta', pergunta: p });
            if (userReply) await userReply.delete().catch(() => {});
        } catch (err) {
            respostas.push({ resposta: 'Sem resposta', pergunta: p });
            await interaction.channel.send(`*Tempo esgotado para a pergunta.*`).then(msg => setTimeout(() => msg.delete(), 5000));
        } finally {
            await perguntaMsg.delete().catch(() => {});
        }
    }

    const pontosDaPartida = {};
    for (const resp of respostas) {
        const { pergunta, resposta } = resp;
        if (resposta === 'Sem resposta' || !resposta.trim()) continue;
        if (pergunta.type === 'combate') {
            const linhas = resposta.split('\n');
            const regexCombate = /(.+?)\s+matou\s+(.+)/i;
            for (const linha of linhas) {
                const match = linha.trim().match(regexCombate);
                if (match) {
                    const assassinoName = match[1].trim().toLowerCase();
                    const vitimasNomes = match[2].split(',').map(name => name.trim().toLowerCase());
                    pontosDaPartida[assassinoName] = (pontosDaPartida[assassinoName] || 0) + (pergunta.pontosGanhos * vitimasNomes.length);
                    for (const vitimaName of vitimasNomes) {
                        if (vitimaName) {
                            pontosDaPartida[vitimaName] = (pontosDaPartida[vitimaName] || 0) + pergunta.pontosPerdidos;
                        }
                    }
                }
            }
        } else if (pergunta.pontos) {
            let names = pergunta.multi ? resposta.split(',').map(name => name.trim()) : [resposta.trim()];
            for (const name of names) {
                if (name) {
                    const lowerCaseName = name.toLowerCase();
                    pontosDaPartida[lowerCaseName] = (pontosDaPartida[lowerCaseName] || 0) + pergunta.pontos;
                }
            }
        }
    }
    return { pontosDaPartida, respostas };
}

/**
 * Manipulador para o botão 'iniciar_contabilizacao'.
 * @param {import('discord.js').Client} client - O cliente do bot.
 * @param {import('discord.js').ButtonInteraction} interaction - A interação do botão.
 * @param {string} pontuacaoPath - O caminho para o arquivo pontuacao.json.
 * @param {string} partidasPath - O caminho para o arquivo partidas.json.
 */
module.exports = async (client, interaction, pontuacaoPath, partidasPath) => {
    // ... (Este é o mesmo código do 'iniciar_contabilizacao' do seu buttons.js original) ...
    try {
        await interaction.deferUpdate(); // Confirma o clique no botão
        let localPrintPath = null;

        // 1. Pede o Print
        const promptMsg = await interaction.channel.send({ content: `${interaction.user}, por favor, envie o print da tela de vitória da partida.\n*Você tem 2 minutos para enviar.*` });
        const collector = interaction.channel.createMessageCollector({ filter: msg => msg.author.id === interaction.user.id, time: 120000, max: 1 });

        // 2. Quando o usuário envia o print
        collector.on('collect', async collectedMessage => {
            let tempPath = null;
            try {
                const attachment = collectedMessage.attachments.first();
                // Validação se é uma imagem
                if (!attachment || !attachment.contentType?.startsWith('image/')) {
                    await interaction.followUp({ content: '❌ Você não enviou uma imagem. Por favor, clique em "Iniciar" novamente.', ephemeral: true });
                    await collectedMessage.delete().catch(() => {});
                    await promptMsg.delete().catch(() => {});
                    return;
                }

                // Salva a imagem temporariamente
                const response = await fetch(attachment.url);
                const imageBuffer = Buffer.from(await response.arrayBuffer());
                const tempDir = path.join(__dirname, '..', '..', '..', 'temp_prints'); // Caminho para a pasta temp_prints na raiz
                if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
                const fileName = `${Date.now()}-${attachment.name}`;
                tempPath = path.join(tempDir, fileName);
                fs.writeFileSync(tempPath, imageBuffer);
                localPrintPath = tempPath;
                
                await collectedMessage.delete().catch(() => {});
                await promptMsg.delete().catch(() => {});

                // 3. Inicia o Processo de Perguntas
                const initialMessage = await interaction.channel.send({ content: '✅ Print recebido e salvo! Iniciando a contabilização...', fetch: true });
                // Chama a função auxiliar que faz as perguntas
                const { pontosDaPartida, respostas } = await runQuestionProcess(interaction);

                // 4. Salva os Pontos
                const rankingGeral = safeReadJson(pontuacaoPath);
                for (const name in pontosDaPartida) { 
                    rankingGeral[name] = (rankingGeral[name] || 0) + pontosDaPartida[name]; 
                }
                safeWriteJson(pontuacaoPath, rankingGeral); // Salva no ranking geral

                // 5. Cria o Resumo
                const embedFinal = new EmbedBuilder()
                    .setTitle('🏆 Resumo da Partida 🏆')
                    .setDescription(`Partida registrada por **${interaction.user.username}**. O ranking foi atualizado.`)
                    .setColor('Green')
                    .setTimestamp();

                respostas.forEach(resp => {
                    if (resp.resposta && resp.resposta !== 'Sem resposta') {
                        embedFinal.addFields({ name: resp.pergunta.pergunta, value: resp.resposta });
                    }
                });

                const resumoPontos = Object.entries(pontosDaPartida).map(([name, p]) => `**${capitalize(name)}**: ${p >= 0 ? '+' : ''}${p} pts`).join('\n') || 'Nenhuma pontuação foi alterada.';
                embedFinal.addFields({ name: '📊 Resumo Final dos Pontos', value: resumoPontos });

                // 6. Envia o Resumo e o Botão de Reverter
                const tempMsg = await interaction.channel.send({ embeds: [embedFinal], components: [] });
                const summaryRow = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId(`edit_match_${tempMsg.id}`) // O ID da mensagem vira o ID da partida
                        .setLabel('Reverter')
                        .setStyle(ButtonStyle.Danger)
                        .setEmoji('↩️')
                );
                const summaryMessage = await tempMsg.edit({ components: [row] });

                // 7. Salva os dados da Partida (para futura reversão)
                const partidas = safeReadJson(partidasPath);
                partidas[summaryMessage.id] = {
                    adminId: interaction.user.id, // Salva quem registrou
                    pontos: pontosDaPartida      // Salva os pontos exatos desta partida
                };
                safeWriteJson(partidasPath, partidas);
                
                // Apaga a msg "Iniciando contabilização"
                setTimeout(() => {
                    initialMessage.delete().catch(() => {});
                }, 15000); 

                // 8. Envia o Print para o Canal de Logs
                if (config.canalPrintsId && config.canalPrintsId !== interaction.channel.id) {
                    const canalPrints = await client.channels.fetch(config.canalPrintsId).catch(() => null);
                    if (canalPrints) {
                        await canalPrints.send({
                            embeds: [embedFinal],
                            files: localPrintPath ? [localPrintPath] : []
                        });
                    }
                }

            } finally {
                // 9. Limpa o arquivo de print temporário
                if (localPrintPath && fs.existsSync(localPrintPath)) {
                    fs.unlinkSync(localPrintPath);
                }
            }
        });

        // 10. Lida com o tempo esgotado para enviar o print
        collector.on('end', async (collected, reason) => {
            if (reason === 'time' && collected.size === 0) {
                await promptMsg.edit({ content: '⌛ O tempo para enviar o print esgotou. O processo foi cancelado.' }).catch(()=>{});
                setTimeout(() => promptMsg.delete().catch(() => {}), 10000);
            }
        });

    } catch (error) {
        console.error('Erro em iniciar_contabilizacao:', error);
    }
};