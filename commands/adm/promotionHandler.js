/* ========================================================================
   ARQUIVO: commands/adm/promotionHandler.js (CORRIGIDO)
   
   - [CORREÇÃO] Lê 'promocao_config.json' (em vez de server_data.json).
   - [CORREÇÃO] Salva as vitórias em 'progressao.json' (em vez de pontuacao.json).
   - Isso resolve o conflito com o sistema da LIGA.
   ======================================================================== */

const { Events } = require('discord.js');
const path = require('path');
const { safeReadJson, safeWriteJson } = require('../liga/utils/helpers.js');

// [CAMINHOS CORRIGIDOS]
const configPath = path.join(__dirname, 'promocao_config.json');
const progressaoPath = path.join(__dirname, 'progressao.json'); // Arquivo de dados das patentes

const promotionVigia = (client) => {
    
    // Carrega a configuração UMA VEZ quando o bot liga
    const config = safeReadJson(configPath);
    if (!config.printsChannelId || !config.baseRoleId) {
        console.warn("[AVISO DE PROMOÇÃO] O sistema de promoção está desativado. Use /promocao-configurar.");
        return; // Para de executar se não estiver configurado
    }

    console.log(`[INFO Promoção] Vigia de patentes ATIVADO. Canal: ${config.printsChannelId}, Cargo: ${config.baseRoleId}`);

    client.on(Events.MessageCreate, async message => {
        // Verifica se a mensagem é no canal configurado
        if (message.channel.id !== config.printsChannelId) return;
        
        // Ignora bots (IMPORTANTE: Ignora os prints do bot da LIGA)
        if (message.author.bot) return;

        // Verifica se tem anexo
        if (message.attachments.size > 0) {
            const member = message.member;
            if (!member) return; // Membro não está no cache, ignora

            // Verifica se o membro tem o cargo base (ex: @Recruta)
            if (member.roles.cache.has(config.baseRoleId)) {
                
                try {
                    // 1. Reage à mensagem
                    await message.react('🔰'); // Reação de patente

                    // 2. Carrega a progressão
                    const progressao = safeReadJson(progressaoPath);

                    // 3. Adiciona a vitória
                    const userId = member.id;
                    
                    // Inicializa se for o primeiro registro
                    if (!progressao[userId]) {
                        progressao[userId] = {
                            factionId: null, // O usuário precisa escolher a facção
                            currentRankId: null,
                            totalWins: 0
                        };
                    }
                    
                    progressao[userId].totalWins = (progressao[userId].totalWins || 0) + 1;

                    // 4. Salva a progressão
                    safeWriteJson(progressaoPath, progressao);
                    
                    console.log(`[Promoção] +1 vitória de patente para ${member.user.tag}. Total: ${progressao[userId].totalWins}`);

                } catch (err) {
                    console.error(`Erro ao processar print de patente [${message.url}]: ${err.message}`);
                }
            }
        }
    });
};

module.exports = promotionVigia;