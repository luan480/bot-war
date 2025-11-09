/* commands/liga/handlers/handleIniciar.js (ATUALIZADO COM TIMER) */

const fs = require('fs');
const path = require('path');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
// const config = require('../../../config.json'); // Usamos process.env
const { safeReadJson, safeWriteJson, capitalize } = require('../utils/helpers.js');

// (Esta função não muda)
async function runQuestionProcess(interaction) {
    const perguntasPath = path.join(__dirname, '..', 'perguntas.json');
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

// (O módulo principal)
module.exports = async (client, interaction, pontuacaoPath, partidasPath) => {
    try {
        await interaction.deferUpdate();
        let localPrintPath = null;
        const promptMsg = await interaction.channel.send({ content: `${interaction.user}, por favor, envie o print da tela de vitória da partida.\n*Você tem 2 minutos para enviar.*` });
        const collector = interaction.channel.createMessageCollector({ filter: msg => msg.author.id === interaction.user.id, time: 120000, max: 1 });

        collector.on('collect', async collectedMessage => {
            let tempPath = null;
            try {
                const attachment = collectedMessage.attachments.first();
                if (!attachment || !attachment.contentType?.startsWith('image/')) {
                    await interaction.followUp({ content: '❌ Você não enviou uma imagem. Por favor, clique em "Iniciar" novamente.', ephemeral: true });
                    await collectedMessage.delete().catch(() => {});
                    await promptMsg.delete().catch(() => {});
                    return;
                }
                const response = await fetch(attachment.url);
                const imageBuffer = Buffer.from(await response.arrayBuffer());
                const tempDir = path.join(__dirname, '..', '..', '..', 'temp_prints');
                if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
                const fileName = `${Date.now()}-${attachment.name}`;
                tempPath = path.join(tempDir, fileName);
                fs.writeFileSync(tempPath, imageBuffer);
                localPrintPath = tempPath;
                await collectedMessage.delete().catch(() => {});
                await promptMsg.delete().catch(() => {});
                const initialMessage = await interaction.channel.send({ content: '✅ Print recebido e salvo! Iniciando a contabilização...', fetch: true });
                const { pontosDaPartida, respostas } = await runQuestionProcess(interaction);
                const rankingGeral = safeReadJson(pontuacaoPath);
                for (const name in pontosDaPartida) { 
                    rankingGeral[name] = (rankingGeral[name] || 0) + pontosDaPartida[name]; 
                }
                safeWriteJson(pontuacaoPath, rankingGeral);
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
                const tempMsg = await interaction.channel.send({ embeds: [embedFinal], components: [] });
                const summaryRow = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId(`edit_match_${tempMsg.id}`)
                        .setLabel('Reverter')
                        .setStyle(ButtonStyle.Danger)
                        .setEmoji('↩️')
                );
                const summaryMessage = await tempMsg.edit({ components: [summaryRow] });
                const partidas = safeReadJson(partidasPath);
                partidas[summaryMessage.id] = {
                    adminId: interaction.user.id,
                    pontos: pontosDaPartida
                };
                safeWriteJson(partidasPath, partidas);
                
                // Apaga a msg "Iniciando contabilização"
                setTimeout(() => {
                    initialMessage.delete().catch(() => {});
                }, 15000); 

                /* ==================================================================
                   [NOVO] TIMER DE 10 MINUTOS PARA APAGAR O RESUMO
                   ================================================================== */
                setTimeout(() => {
                    // Tenta apagar a mensagem de resumo
                    summaryMessage.delete().catch(err => {
                        // Se der erro (ex: msg já foi revertida/apagada), só avisa no console
                        console.warn(`[AVISO] Não foi possível apagar a msg de resumo ${summaryMessage.id}. Talvez já tenha sido revertida.`, err);
                    });
                }, 600000); // 10 minutos = 600.000 milissegundos
                /* ==================================================================
                   FIM DA MUDANÇA
                   ================================================================== */

                // Envia o Print para o Canal de Logs
                const canalPrintsId = process.env.CANAL_PRINTS_ID;
                if (canalPrintsId && canalPrintsId !== interaction.channel.id) {
                    const canalPrints = await client.channels.fetch(canalPrintsId).catch(() => null);
                    if (canalPrints) {
                        await canalPrints.send({
                            embeds: [embedFinal],
                            files: localPrintPath ? [localPrintPath] : []
                        });
                    }
                }
            } finally {
                if (localPrintPath && fs.existsSync(localPrintPath)) {
                    fs.unlinkSync(localPrintPath);
                }
            }
        });
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