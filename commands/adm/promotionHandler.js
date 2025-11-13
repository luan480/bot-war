/* ========================================================================
   ARQUIVO: commands/adm/promotionHandler.js (VERSÃO FINAL COM NOTIFICAÇÃO)
   
   - [A CORREÇÃO QUE FALTAVA] Agora o bot envia uma mensagem
     no canal de anúncios da facção quando o usuário é promovido.
   - [NOVO] Importa o 'EmbedBuilder' para criar a mensagem.
   ======================================================================== */

// [NOVO] Importamos o EmbedBuilder
const { Events, EmbedBuilder } = require('discord.js');
const path = require('path');
const { safeReadJson, safeWriteJson, recalcularRank } = require('./carreiraHelpers.js');

// Caminhos para os arquivos JSON
const progressaoPath = path.join(__dirname, 'progressao.json');
const carreirasPath = path.join(__dirname, 'carreiras.json');


const promotionVigia = (client) => {
    
    // Carrega as configurações UMA VEZ quando o bot liga
    const carreirasConfig = safeReadJson(carreirasPath);
    const canalDePrintsId = carreirasConfig.canalDePrints; 
    const cargoRecrutaId = carreirasConfig.cargoRecrutaId; 

    if (!canalDePrintsId) {
        console.warn("[AVISO DE PROMOÇÃO] O sistema de promoção está desativado. 'canalDePrints' não encontrado no carreiras.json.");
        return; 
    }
    if (!carreirasConfig || !carreirasConfig.faccoes || !cargoRecrutaId) {
        console.warn("[AVISO DE PROMOÇÃO] O arquivo 'carreiras.json' está mal formatado (falta 'faccoes' ou 'cargoRecrutaId').");
        return;
    }

    console.log(`[INFO Promoção] Vigia de patentes ATIVADO. Canal: ${canalDePrintsId}`);

    client.on(Events.MessageCreate, async message => {
        if (message.channel.id !== canalDePrintsId) return;
        if (message.author.bot) return;
        if (message.attachments.size === 0) return;

        const member = message.member;
        if (!member) return;
        
        let faccaoId = null;
        let faccao = null;
        for (const id of Object.keys(carreirasConfig.faccoes)) {
            if (member.roles.cache.has(id)) {
                faccaoId = id;
                faccao = carreirasConfig.faccoes[id];
                break;
            }
        }
        
        if (!faccaoId && !member.roles.cache.has(cargoRecrutaId)) {
            return;
        }

        try {
            const progressao = safeReadJson(progressaoPath);
            const userId = member.id;
            
            // --- Sincronização Automática ---
            if (!progressao[userId]) {
                if (!faccaoId) {
                    await message.reply({ content: `${member}, não consegui identificar sua facção. Você precisa pegar o cargo da sua facção (Exército, Marinha, etc.) antes de registrar sua primeira vitória.`});
                    return;
                }
                
                let cargoMaisAlto = null;
                let custoDoCargo = 0;
                for (let i = faccao.caminho.length - 1; i >= 0; i--) {
                    const rank = faccao.caminho[i];
                    if (member.roles.cache.has(rank.id)) {
                        cargoMaisAlto = rank;
                        custoDoCargo = rank.custo; 
                        break; 
                    }
                }

                progressao[userId] = {
                    factionId: faccaoId, 
                    currentRankId: cargoMaisAlto ? cargoMaisAlto.id : null,
                    totalWins: custoDoCargo 
                };
                
                console.log(`[Promoção] Usuário VETERANO ${member.user.tag} sincronizado. Começando com ${custoDoCargo} vitórias.`);
            }
            
            // Pega os dados
            const userProgress = progressao[userId];
            const faccaoDoUsuario = carreirasConfig.faccoes[userProgress.factionId];

            if (!faccaoDoUsuario) {
                 console.error(`[Promoção] Usuário ${member.user.tag} tem uma facção ID (${userProgress.factionId}) que não existe no carreiras.json.`);
                 return;
            }

            // ---- O CONTADOR ----
            
            // Guarda o cargo antigo ANTES de recalcular
            const cargoAntigoId = userProgress.currentRankId; 
            
            await message.react('🔰'); 
            userProgress.totalWins = userProgress.totalWins + 1;
            
            // ---- O AGENTE ----
            await recalcularRank(member, faccaoDoUsuario, userProgress, cargoRecrutaId);
            
            // ---- O SALVAMENTO ----
            safeWriteJson(progressaoPath, progressao);
            
            // Pega o cargo novo DEPOIS de recalcular
            const cargoNovoId = userProgress.currentRankId; 
            
            console.log(`[Promoção] +1 vitória para ${member.user.tag}. Total: ${userProgress.totalWins}. Cargo atual: ${cargoNovoId}`);

            /* ============================================================
               [A NOTIFICAÇÃO QUE FALTAVA]
               Se o cargo antigo for diferente do cargo novo,
               o bot envia a mensagem de promoção.
            ============================================================ */
            if (cargoAntigoId !== cargoNovoId) {
                const novoCargo = faccaoDoUsuario.caminho.find(r => r.id === cargoNovoId);
                const canalDeAnuncio = await client.channels.fetch(faccaoDoUsuario.canalDeAnuncio).catch(() => null);
                
                if (canalDeAnuncio && novoCargo) {
                    // (Este embed é baseado no seu comando /carreira status)
                    const embed = new EmbedBuilder()
                        .setColor('#F1C40F') 
                        .setAuthor({ name: `PROMOÇÃO: ${member.user.username}`, iconURL: member.user.displayAvatarURL() })
                        .setThumbnail(faccaoDoUsuario.nome.includes("Exército") ? "https://i.imgur.com/yBfXTrG.png" : faccaoDoUsuario.nome.includes("Marinha") ? "https://i.imgur.com/GjNlGDu.png" : faccaoDoUsuario.nome.includes("Aeronáutica") ? "https://i.imgur.com/4lGjYQx.png" : "https://i.imgur.com/3QGjGjB.png")
                        .addFields(
                            { name: "Facção", value: faccaoDoUsuario.nome, inline: true },
                            { name: "Nova Patente", value: `**${novoCargo.nome}**`, inline: true },
                            { name: "Total de Vitórias", value: `🏆 ${userProgress.totalWins}`, inline: true }
                        )
                        .setTimestamp();

                    await canalDeAnuncio.send({ 
                        content: `🎉 **PROMOÇÃO!** 🎉\nParabéns ${member}, você foi promovido!`, 
                        embeds: [embed] 
                    });
                }
            }

        } catch (err) {
            console.error(`Erro ao processar print de patente [${message.url}]: ${err.message}`);
        }
    });
};

module.exports = promotionVigia;