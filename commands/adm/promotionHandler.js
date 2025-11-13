/* ========================================================================
   ARQUIVO: commands/adm/promotionHandler.js (VERSÃO FINAL CORRIGIDA)
   
   - [MUDANÇA] Importa TUDO que precisamos do helper local './carreiraHelpers.js'.
   - [MUDANÇA] Importa 'carreiras.json' para saber as regras de promoção.
   - [CORREÇÃO] Lê 'promocao_config.json' (em vez de server_data.json).
   - [CORREÇÃO] Salva as vitórias em 'progressao.json' (em vez de pontuacao.json).
   - [NOVO] CHAMA 'recalcularRank' DEPOIS de adicionar a vitória,
     promovendo o usuário automaticamente.
   ======================================================================== */

const { Events } = require('discord.js');
const path = require('path');
// [MUDANÇA] Importa TUDO que precisamos do helper local
const { safeReadJson, safeWriteJson, recalcularRank } = require('./carreiraHelpers.js');

// Caminhos para os arquivos JSON (agora todos corretos)
const configPath = path.join(__dirname, 'promocao_config.json'); // O arquivo que vamos criar
const progressaoPath = path.join(__dirname, 'progressao.json');
const carreirasPath = path.join(__dirname, 'carreiras.json'); // O seu arquivo de patentes


const promotionVigia = (client) => {
    
    // Carrega as configurações UMA VEZ quando o bot liga
    const config = safeReadJson(configPath);
    const carreirasConfig = safeReadJson(carreirasPath); // Carrega as regras de patente
    
    // Pega o ID do cargo Recruta do carreiras.json
    const cargoRecrutaId = carreirasConfig.cargoRecrutaId; 

    if (!config.printsChannelId) {
        console.warn("[AVISO DE PROMOÇÃO] O sistema de promoção está desativado. Use /promocao-configurar.");
        return; 
    }
    if (!carreirasConfig || !carreirasConfig.faccoes || !cargoRecrutaId) {
        console.warn("[AVISO DE PROMOÇÃO] O arquivo 'carreiras.json' não foi encontrado ou está mal formatado (falta 'faccoes' ou 'cargoRecrutaId').");
        return;
    }

    console.log(`[INFO Promoção] Vigia de patentes ATIVADO. Canal: ${config.printsChannelId}`);

    client.on(Events.MessageCreate, async message => {
        // Verifica se a mensagem é no canal configurado
        if (message.channel.id !== config.printsChannelId) return;
        
        // Ignora bots (IMPORTANTE: Ignora os prints do bot da LIGA)
        if (message.author.bot) return;

        // Verifica se tem anexo
        if (message.attachments.size === 0) return;

        const member = message.member;
        if (!member) return;
        
        // [LÓGICA DE FACÇÃO]
        // Verifica se o membro tem um cargo de facção.
        let faccaoId = null;
        for (const id of Object.keys(carreirasConfig.faccoes)) {
            // Verifica se o ID do cargo da facção (a chave) está nos cargos do membro
            if (member.roles.cache.has(id)) {
                faccaoId = id;
                break;
            }
        }
        
        // Se ele não tem facção E não é um @Recruta, ele não pode postar.
        if (!faccaoId && !member.roles.cache.has(cargoRecrutaId)) {
            return;
        }

        try {
            const progressao = safeReadJson(progressaoPath);
            const userId = member.id;
            
            // Se for o primeiro print do usuário
            if (!progressao[userId]) {
                // E ele ainda não tem uma facção (é só recruta)
                if (!faccaoId) {
                    await message.reply({ content: `${member}, não consegui identificar sua facção. Você precisa pegar o cargo da sua facção (Exército, Marinha, etc.) antes de registrar sua primeira vitória.`});
                    return;
                }
                
                // Primeiro registro no 'progressao.json'
                progressao[userId] = {
                    factionId: faccaoId, 
                    currentRankId: null, // Começa como recruta
                    totalWins: 0
                };
            }
            
            // Pega os dados do usuário
            const userProgress = progressao[userId];
            const faccao = carreirasConfig.faccoes[userProgress.factionId];

            if (!faccao) {
                 console.error(`[Promoção] Usuário ${member.user.tag} tem uma facção ID (${userProgress.factionId}) que não existe no carreiras.json.`);
                 return;
            }

            // ---- O CONTADOR ----
            await message.react('🔰'); // Reage primeiro para o usuário ver
            userProgress.totalWins = (userProgress.totalWins || 0) + 1;
            
            // ---- A "PONTE" (O AGENTE) ----
            // Agora, chama o Agente de Promoção para verificar
            // se essa +1 vitória resultou em uma promoção.
            
            await recalcularRank(member, faccao, userProgress, cargoRecrutaId);
            
            // ---------------------------------------------
            
            // Salva o 'progressao.json' (agora com +1 vitória E o cargoId atualizado)
            safeWriteJson(progressaoPath, progressao);
            
            console.log(`[Promoção] +1 vitória para ${member.user.tag}. Total: ${userProgress.totalWins}. Cargo atual: ${userProgress.currentRankId}`);

        } catch (err) {
            console.error(`Erro ao processar print de patente [${message.url}]: ${err.message}`);
        }
    });
};

module.exports = promotionVigia;