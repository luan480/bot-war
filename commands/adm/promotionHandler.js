/* ========================================================================
   ARQUIVO: commands/adm/promotionHandler.js (VERSÃO 100% AUTOMÁTICA)
   
   - Este é o "Vigia de Prints".
   - [NOVO] Lógica de "Sincronização Automática" de veteranos.
   - [MUDANÇA] Importa TUDO que precisamos do helper local './carreiraHelpers.js'.
   - [MUDANÇA] Importa 'carreiras.json' para saber as regras de promoção.
   - [CORREÇÃO] Lê a config (canalDePrints) direto do 'carreiras.json'.
   - [CORREÇÃO] Salva as vitórias em 'progressao.json'.
   - [NOVO] CHAMA 'recalcularRank' DEPOIS de adicionar a vitória.
   ======================================================================== */

const { Events } = require('discord.js');
const path = require('path');
const { safeReadJson, safeWriteJson, recalcularRank } = require('./carreiraHelpers.js');

// Caminhos para os arquivos JSON
const progressaoPath = path.join(__dirname, 'progressao.json');
const carreirasPath = path.join(__dirname, 'carreiras.json');


const promotionVigia = (client) => {
    
    // Carrega as configurações UMA VEZ quando o bot liga
    const carreirasConfig = safeReadJson(carreirasPath);
    
    // Pega as configs direto do carreiras.json
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
        // Verifica se a mensagem é no canal configurado
        if (message.channel.id !== canalDePrintsId) return;
        
        // Ignora bots
        if (message.author.bot) return;

        // Verifica se tem anexo
        if (message.attachments.size === 0) return;

        const member = message.member;
        if (!member) return;
        
        // [LÓGICA DE FACÇÃO]
        let faccaoId = null;
        let faccao = null;
        for (const id of Object.keys(carreirasConfig.faccoes)) {
            if (member.roles.cache.has(id)) {
                faccaoId = id;
                faccao = carreirasConfig.faccoes[id];
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
            
            // --- A LÓGICA DE SINCRONIZAÇÃO AUTOMÁTICA QUE VOCÊ PEDIU ---
            // Se o usuário (veterano ou recruta) NÃO ESTÁ no progressao.json...
            if (!progressao[userId]) {
                
                // 1. Precisamos da facção dele.
                if (!faccaoId) {
                    await message.reply({ content: `${member}, não consegui identificar sua facção. Você precisa pegar o cargo da sua facção (Exército, Marinha, etc.) antes de registrar sua primeira vitória.`});
                    return;
                }
                
                // 2. Procuramos a patente mais alta que ele JÁ TEM
                let cargoMaisAlto = null;
                let custoDoCargo = 0;
                for (let i = faccao.caminho.length - 1; i >= 0; i--) {
                    const rank = faccao.caminho[i];
                    if (member.roles.cache.has(rank.id)) {
                        cargoMaisAlto = rank;
                        custoDoCargo = rank.custo; // Achamos o "custo" do cargo dele
                        break; 
                    }
                }

                // 3. Criamos o registro dele
                progressao[userId] = {
                    factionId: faccaoId, 
                    currentRankId: cargoMaisAlto ? cargoMaisAlto.id : null,
                    totalWins: custoDoCargo // Ele começa com as vitórias do cargo que ele já tinha
                };
                
                console.log(`[Promoção] Usuário VETERANO ${member.user.tag} sincronizado. Começando com ${custoDoCargo} vitórias.`);
            }
            
            // --- FIM DA LÓGICA DE SINCRONIZAÇÃO ---

            // Pega os dados do usuário (seja ele novo ou antigo)
            const userProgress = progressao[userId];
            // (Se ele era recruta e não tinha facção, ele foi barrado no 'if (!faccaoId)' acima)
            const faccaoDoUsuario = carreirasConfig.faccoes[userProgress.factionId];

            if (!faccaoDoUsuario) {
                 console.error(`[Promoção] Usuário ${member.user.tag} tem uma facção ID (${userProgress.factionId}) que não existe no carreiras.json.`);
                 return;
            }

            // ---- O CONTADOR ----
            await message.react('🔰'); // Reage para confirmar
            userProgress.totalWins = userProgress.totalWins + 1; // Adiciona a nova vitória
            
            // ---- A "PONTE" (O AGENTE) ----
            // Chama o Agente de Promoção para verificar se essa +1 vitória
            // resultou em uma promoção.
            
            await recalcularRank(member, faccaoDoUsuario, userProgress, cargoRecrutaId);
            
            // ---------------------------------------------
            
            // Salva o 'progressao.json'
            safeWriteJson(progressaoPath, progressao);
            
            console.log(`[Promoção] +1 vitória para ${member.user.tag}. Total: ${userProgress.totalWins}. Cargo atual: ${userProgress.currentRankId}`);

        } catch (err) {
            console.error(`Erro ao processar print de patente [${message.url}]: ${err.message}`);
        }
    });
};

module.exports = promotionVigia;