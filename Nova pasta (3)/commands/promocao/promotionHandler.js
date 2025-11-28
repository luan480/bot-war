/* ========================================================================
   ARQUIVO: commands/promocao/promotionHandler.js (V-LIMPEZA TOTAL)
   
   - Inteligência de Cargos: ATIVADA
   - Economia (WarCoins): ATIVADA
   - Botão de Status: ATIVADO
   - [NOVO] Limpeza Blindada: Varre o chat para apagar mensagens antigas.
   ======================================================================== */
   
const { Events, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const path = require('path');
const { safeReadJson, safeWriteJson } = require('../liga/utils/helpers.js');

const carreirasPath = path.join(__dirname, 'carreiras.json');
const progressaoPath = path.join(__dirname, 'progressao.json');
// Ajuste o caminho da economia se necessário
const economyPath = path.join(__dirname, '../economy/economy.json'); 

module.exports = (client) => {
    
    client.on(Events.MessageCreate, async message => {
        const carreirasConfig = safeReadJson(carreirasPath);
        
        if (message.author.bot || message.channel.id !== carreirasConfig.canalDePrints) return;
        if (message.attachments.size === 0) return;

        try {
            const member = message.member;
            const userId = member.id;
            
            let faccaoId = null;
            for (const id of Object.keys(carreirasConfig.faccoes)) {
                if (member.roles.cache.has(id)) { faccaoId = id; break; }
            }
            if (!faccaoId) return; 

            const faccao = carreirasConfig.faccoes[faccaoId];
            const progressao = safeReadJson(progressaoPath);
            
            // Carrega Economia
            const economy = safeReadJson(economyPath);

            if (!progressao[userId]) {
                progressao[userId] = { factionId: faccaoId, currentRankId: null, totalWins: 0 };
            }

            // --- SMART SYNC ---
            let rankDiscordIndex = -1;
            let rankDiscordObj = null;
            let mensagemSync = "";

            for (let i = 0; i < faccao.caminho.length; i++) {
                const r = faccao.caminho[i];
                if (member.roles.cache.has(r.id)) {
                    rankDiscordIndex = i;
                    rankDiscordObj = r;
                }
            }

            let rankJsonIndex = -1;
            if (progressao[userId].currentRankId) {
                rankJsonIndex = faccao.caminho.findIndex(r => r.id === progressao[userId].currentRankId);
            }

            if (rankDiscordIndex > rankJsonIndex) {
                console.log(`[Sync] Atualizando ${member.displayName}`);
                progressao[userId].currentRankId = rankDiscordObj.id;
                if (progressao[userId].totalWins < rankDiscordObj.custo) {
                    progressao[userId].totalWins = rankDiscordObj.custo;
                }
                mensagemSync = `\n🔄 **Sync:** Patente atualizada para **${rankDiscordObj.nome}**!`;
            }

            // --- CONTABILIZAÇÃO ---
            progressao[userId].totalWins += 1;
            const totalWins = progressao[userId].totalWins;

            // 💰 [ECONOMIA] Prêmio por vitória
            const premioVitoria = 50;
            economy[userId] = (economy[userId] || 0) + premioVitoria;
            const novoSaldo = economy[userId];

            await message.react('✅'); 

            // --- Resposta ---
            const rankId = progressao[userId].currentRankId;
            let nomeRankAtual = "Recruta";
            let nomeProxima = "Topo";
            let faltaQuanto = 0;

            if (rankId) {
                const r = faccao.caminho.find(x => x.id === rankId);
                if (r) nomeRankAtual = r.nome;
                const idx = faccao.caminho.findIndex(x => x.id === rankId);
                if (idx < faccao.caminho.length - 1) {
                    const prox = faccao.caminho[idx + 1];
                    nomeProxima = prox.nome;
                    faltaQuanto = prox.custo - totalWins;
                }
            } else {
                nomeProxima = faccao.caminho[0].nome;
                faltaQuanto = faccao.caminho[0].custo - totalWins;
            }
            if (faltaQuanto < 0) faltaQuanto = 0;

            const embedStatus = new EmbedBuilder()
                .setColor('#2ecc71') 
                .setDescription(
                    `✅ **Vitória Confirmada!** (+${premioVitoria} 💰)${mensagemSync}\n\n` +
                    `👤 **Membro:** ${member}\n` +
                    `🎖️ **Patente:** ${nomeRankAtual}\n` +
                    `💰 **Saldo:** \`${novoSaldo} WarCoins\`\n` +
                    `🎯 **Meta:** Faltam \`${faltaQuanto}\` para **${nomeProxima}**`
                );

            const rowBotao = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('stt_btn_ver').setLabel('Ver Ficha').setEmoji('📋').setStyle(ButtonStyle.Secondary)
            );

            // =================================================================
            // 🧹 FAXINA AUTOMÁTICA (Lê o chat e apaga as velhas)
            // =================================================================
            try {
                // Busca as últimas 15 mensagens do canal
                const fetched = await message.channel.messages.fetch({ limit: 15 });
                
                // Filtra mensagens que são DO BOT e parecem ser confirmação de vitória
                const toDelete = fetched.filter(m => 
                    m.author.id === client.user.id && 
                    m.embeds.length > 0 && 
                    m.embeds[0].description && 
                    m.embeds[0].description.includes('Vitória Confirmada')
                );

                // Se achou alguma, apaga
                if (toDelete.size > 0) {
                    await message.channel.bulkDelete(toDelete).catch(err => {
                        // Se bulk falhar (msg muito antiga), deleta uma por uma
                        toDelete.forEach(msg => msg.delete().catch(() => {}));
                    });
                }
            } catch (error) {
                console.log("Erro na limpeza do chat:", error);
            }

            // Envia a nova
            await message.reply({ embeds: [embedStatus], components: [rowBotao] });
            // =================================================================

            // --- PROMOÇÃO ---
            const cargoAtualId = progressao[userId].currentRankId;
            let proximoCargo = null;

            if (!cargoAtualId) proximoCargo = faccao.caminho[0];
            else {
                const rankAtualIndex = faccao.caminho.findIndex(r => r.id === cargoAtualId);
                if (rankAtualIndex < faccao.caminho.length - 1) proximoCargo = faccao.caminho[rankAtualIndex + 1];
            }

            if (proximoCargo && totalWins >= proximoCargo.custo) {
                // 💰 Bônus de Promoção
                const bonusPromocao = 500;
                economy[userId] = (economy[userId] || 0) + bonusPromocao;

                const cargosAdd = [proximoCargo.id];
                const cargosRem = [carreirasConfig.cargoRecrutaId];
                if (cargoAtualId) cargosRem.push(cargoAtualId);

                await member.roles.add(cargosAdd).catch(console.error);
                await member.roles.remove(cargosRem.filter(id => member.roles.cache.has(id))).catch(console.error);

                progressao[userId].currentRankId = proximoCargo.id;
                
                const canalAnuncio = await client.channels.fetch(faccao.canalDeAnuncio).catch(() => null);
                if (canalAnuncio) {
                    const embedPromocao = new EmbedBuilder()
                        .setColor('#f1c40f')
                        .setTitle(`🏆 PROMOÇÃO 🏆`)
                        .setDescription(`Parabéns, ${member}! Você subiu para **${proximoCargo.nome}**!\n💰 **Bônus:** +${bonusPromocao} WarCoins`)
                        .setThumbnail(member.user.displayAvatarURL())
                        .setTimestamp();
                    await canalAnuncio.send({ embeds: [embedPromocao] });
                }
            }

            // Salva TUDO
            safeWriteJson(progressaoPath, progressao);
            safeWriteJson(economyPath, economy);

        } catch (err) {
            console.error("Erro no sistema de promoção:", err);
            await message.react('❌');
        }
    });
};