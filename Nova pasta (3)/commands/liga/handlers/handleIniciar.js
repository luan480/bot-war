/* comandos/liga/handlers/handleIniciar.js (ATUALIZADO: ID FIXO + 3 MINUTOS) */

const fs = require('fs');
const path = require('path');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
// const config = require('../../../config.json'); // Usamos process.env
const { safeReadJson, safeWriteJson, capitalize } = require('../utils/helpers.js');

// Função auxiliar para processar perguntas
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
        } catch (erro) {
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

                    for (const vitimaNome of vitimasNomes) {
                        if (vitimaNome) {
                            pontosDaPartida[vitimaNome] = (pontosDaPartida[vitimaNome] || 0) + pergunta.pontosPerdidos;
                        }
                    }
                }
            }
        } else if (pergunta.pontos) {
            let nomes = pergunta.multi ? resposta.split(',').map(name => name.trim()) : [resposta.trim()];
            for (const nome of nomes) {
                if (nome) {
                    const lowerCaseName = nome.toLowerCase();
                    pontosDaPartida[lowerCaseName] = (pontosDaPartida[lowerCaseName] || 0) + pergunta.pontos;
                }
            }
        }
    }
    return { pontosDaPartida, respostas };
}

// O módulo principal
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

                // Download da imagem
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

                const initialMessage = await interaction.channel.send({ content: '✅ Print recebido e salvo! Iniciando a contabilização...', fetchReply: true });
                
                const { pontosDaPartida, respostas } = await runQuestionProcess(interaction);

                // Atualiza Ranking
                const rankingGeral = safeReadJson(pontuacaoPath);
                for (const nome in pontosDaPartida) {
                    rankingGeral[nome] = (rankingGeral[nome] || 0) + pontosDaPartida[nome];
                }
                safeWriteJson(pontuacaoPath, rankingGeral);

                // Cria Embed Final
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

                const resumoPontos = Object.entries(pontosDaPartida).map(([nome, p]) => `**${capitalize(nome)}**: ${p >= 0 ? '+' : ''}${p} pts`).join('\n') || 'Nenhuma pontuação foi alterada.';
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

                // Salva log da partida
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
                   TIMER DE 3 MINUTOS PARA APAGAR O RESUMO
                   ================================================================== */
                setTimeout(() => {
                    summaryMessage.delete().catch(err => {
                        console.warn(`[AVISO] Não foi possível apagar a msg de resumo ${summaryMessage.id}. Talvez já tenha sido revertida.`, err);
                    });
                }, 180000); // 180.000 ms = 3 minutos

                // Envia o Print para o Canal de Logs (ID FIXO)
                const canalPrintsId = '1441450173137031198'; // ID fixo inserido
                
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
                // Limpa arquivo temporário
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

    } catch (erro) {
        console.error('Erro em iniciar_contabilizacao:', erro);
    }
};