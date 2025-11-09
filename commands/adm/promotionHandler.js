/* commands/adm/promotionHandler.js (ATUALIZADO COM BOTÃO) */

const { Events, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const path = require('path');
const { safeReadJson, safeWriteJson } = require('../liga/utils/helpers.js');

const carreirasPath = path.join(__dirname, 'carreiras.json');
const progressaoPath = path.join(__dirname, 'progressao.json');

module.exports = (client) => {
    
    client.on(Events.MessageCreate, async message => {
        const carreirasConfig = safeReadJson(carreirasPath);
        if (message.author.bot || message.channel.id !== carreirasConfig.canalDePrints) {
            return;
        }
        if (message.attachments.size === 0) {
            return;
        }

        try {
            const member = message.member;
            const userId = member.id;
            const guild = message.guild; 
            
            let faccaoId = null;
            for (const id of Object.keys(carreirasConfig.faccoes)) {
                if (member.roles.cache.has(id)) {
                    faccaoId = id;
                    break;
                }
            }
            if (!faccaoId) {
                console.log(`[Prints] ${member.displayName} postou, mas não tem cargo de facção. Ignorando.`);
                return;
            }

            const faccao = carreirasConfig.faccoes[faccaoId];
            const progressao = safeReadJson(progressaoPath);
            
            if (!progressao[userId]) {
                console.log(`[Prints] Novo usuário detectado: ${member.displayName}. Verificando cargos...`);
                let currentRankId = null;
                let totalWins = 0;
                for (let i = faccao.caminho.length - 1; i >= 0; i--) {
                    const rank = faccao.caminho[i];
                    if (member.roles.cache.has(rank.id)) {
                        currentRankId = rank.id;
                        totalWins = rank.custo; 
                        console.log(`[Prints] Usuário já tem o cargo: ${rank.nome}. Definindo vitórias como: ${totalWins}`);
                        break; 
                    }
                }
                progressao[userId] = { factionId: faccaoId, currentRankId: currentRankId, totalWins: totalWins };
            }

            progressao[userId].totalWins += 1;
            const totalWins = progressao[userId].totalWins;

            await message.react('✅');

            const cargoAtualId = progressao[userId].currentRankId;
            let proximoCargo = null;

            if (!cargoAtualId) {
                proximoCargo = faccao.caminho[0];
            } else {
                const rankAtualIndex = faccao.caminho.findIndex(r => r.id === cargoAtualId);
                if (rankAtualIndex < faccao.caminho.length - 1) { 
                    proximoCargo = faccao.caminho[rankAtualIndex + 1];
                }
            }

            if (!proximoCargo || totalWins < proximoCargo.custo) {
                safeWriteJson(progressaoPath, progressao);
                return;
            }

            // PROMOÇÃO!
            const cargosParaAdicionar = [proximoCargo.id];
            const cargosParaRemover = [carreirasConfig.cargoRecrutaId]; 
            if (cargoAtualId) {
                cargosParaRemover.push(cargoAtualId); 
            }

            await member.roles.add(cargosParaAdicionar);
            await member.roles.remove(cargosParaRemover.filter(id => id && member.roles.cache.has(id))); 

            progressao[userId].currentRankId = proximoCargo.id;
            safeWriteJson(progressaoPath, progressao);

            // Anuncia a promoção
            const canalDeAnuncio = await client.channels.fetch(faccao.canalDeAnuncio).catch(() => null);
            if (canalDeAnuncio) {

                // --- [LÓGICA DO EMBED (A mesma de antes)] ---
                let cargoAntigoNome = "• Recruta";
                let custoPatenteAnterior = 0; 
                if (cargoAtualId) { 
                    const cargoAntigo = faccao.caminho.find(r => r.id === cargoAtualId);
                    if (cargoAntigo) {
                        cargoAntigoNome = cargoAntigo.nome;
                        custoPatenteAnterior = cargoAntigo.custo;
                    }
                }
                let proximaMetaNome = "Patente Máxima";
                let proximaMetaProgresso = "Você atingiu o topo da sua carreira! Parabéns!";
                const rankAtualIndex = faccao.caminho.findIndex(r => r.id === proximoCargo.id); 
                if (rankAtualIndex < faccao.caminho.length - 1) { 
                    const proximaMetaCargo = faccao.caminho[rankAtualIndex + 1];
                    proximaMetaNome = proximaMetaCargo.nome;
                    const winsNecessarias = proximaMetaCargo.custo;
                    const winsFaltando = winsNecessarias - totalWins;
                    const custoPatenteProxima = proximaMetaCargo.custo;
                    const winsNestaEtapa = custoPatenteProxima - custoPatenteAnterior;
                    const winsAtuaisNestaEtapa = totalWins - custoPatenteAnterior; 
                    let percent = 0;
                    if (winsNestaEtapa > 0) {
                         percent = Math.floor((winsAtuaisNestaEtapa / winsNestaEtapa) * 10);
                    }
                    if (percent > 10) percent = 10;
                    const barra = '■'.repeat(percent) + '□'.repeat(10 - percent); 
                    proximaMetaProgresso = `**${winsFaltando} vitórias** para a próxima patente.\n${barra} (${totalWins} / ${winsNecessarias} totais)`;
                }
                
                const embed = new EmbedBuilder()
                    .setColor('#f1c40f')
                    .setAuthor({ name: "SISTEMA DE PROMOÇÃO", iconURL: guild.iconURL() }) 
                    .setTitle(`🏆 PROMOÇÃO DE ${faccao.nome.toUpperCase()} 🏆`)
                    .setDescription(`Parabéns, ${member.user}! Você subiu na carreira!`) 
                    .addFields(
                        { name: "Patente Anterior", value: `~~${cargoAntigoNome}~~`, inline: true },
                        { name: "Nova Patente", value: `**${proximoCargo.nome}**`, inline: true },
                        { name: "Total de Vitórias", value: `🏆 ${totalWins}`, inline: true },
                        { name: "Próxima Meta", value: proximaMetaNome, inline: false },
                        { name: "Progresso para a Próxima Meta", value: proximaMetaProgresso, inline: false }
                    )
                    .setThumbnail(member.user.displayAvatarURL())
                    .setFooter({ text: `Confira todas as patentes no canal 🛡・patentes` })
                    .setTimestamp();
                
                // --- [NOVO] Adiciona o Botão de Status ---
                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        // O ID do botão agora inclui o ID do usuário promovido
                        .setCustomId(`carreira_status_${member.id}`) 
                        .setLabel(`Ver Status de ${member.displayName}`)
                        .setEmoji('📊')
                        .setStyle(ButtonStyle.Success)
                );
                
                await canalDeAnuncio.send({ 
                    content: `${member}`, // O ping
                    embeds: [embed],
                    components: [row] // Adiciona o botão
                });
            }
            // --- [FIM DA LÓGICA DO EMBED] ---

            console.log(`[PROMOÇÃO] ${member.displayName} foi promovido para ${proximoCargo.nome} com ${totalWins} vitórias.`);

        } catch (err)
        {
            console.error("Erro no sistema de promoção:", err);
            await message.react('❌');
        }
    });
};