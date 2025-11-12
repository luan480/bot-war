/* commands/adm/catchUpPrintsHandler.js (V3 - Com Logs) */
const fs = require('fs');
const path = require('path');
// Importa a lógica de processamento
const { processPrintMessage } = require('./promotionHandler.js');
const serverDataPath = path.join(__dirname, 'server_data.json');

const catchUpPrintsHandler = async (client) => {
    let serverData = {};
    try {
        serverData = JSON.parse(fs.readFileSync(serverDataPath, 'utf8'));
    } catch (err) {
        console.error("Erro ao carregar server_data.json no catchUpHandler:", err);
        return;
    }

    console.log("[Catch-Up] Verificando prints perdidos...");

    // Itera por todos os servidores (guilds) onde o bot está
    for (const guild of client.guilds.cache.values()) {
        const config = serverData[guild.id];
        
        // Verifica se este servidor tem o sistema de prints configurado
        if (config && config.printsChannelId && config.printsRoleId) {
            console.log(`[Catch-Up] Verificando servidor: ${guild.name}`);
            try {
                const channel = await client.channels.fetch(config.printsChannelId);
                if (!channel || !channel.isTextBased()) {
                    console.warn(`[Catch-Up] Canal de prints (${config.printsChannelId}) não encontrado no servidor ${guild.name}.`);
                    continue;
                }
                console.log(`[Catch-Up] Lendo canal: #${channel.name}`);

                // Busca as últimas 100 mensagens no canal
                const messages = await channel.messages.fetch({ limit: 100 });
                console.log(`[Catch-Up] Encontradas ${messages.size} mensagens recentes para verificar.`);
                
                let processedCount = 0;

                // Itera por todas as mensagens encontradas
                for (const message of messages.values()) {
                    
                    const resultado = await processPrintMessage(message, config.printsChannelId, config.printsRoleId);
                    
                    // Se o resultado for "processado_com_sucesso", conta.
                    if (resultado === 'processado_com_sucesso') {
                        processedCount++;
                    } 
                    // Se for um motivo de "ignorar" que não seja 'ja_processado' ou 'sem_anexo', mostra no log
                    else if (resultado !== 'ignorado_ja_processado' && resultado !== 'ignorado_sem_anexo' && resultado !== 'ignorado_bot_ou_canal') {
                        console.log(`[Catch-Up] Mensagem ${message.id} ignorada. Motivo: ${resultado}`);
                    }
                }

                if (processedCount > 0) {
                    console.log(`[Catch-Up] SUCESSO: ${processedCount} prints perdidos foram processados no servidor ${guild.name}.`);
                } else {
                    console.log(`[Catch-Up] Nenhum print novo encontrado em #${channel.name}.`);
                }

            } catch (err) {
                console.error(`[Catch-Up] FALHA CRÍTICA ao verificar canal no servidor ${guild.name}: ${err.message}`);
                console.error("[Catch-Up] Isto pode ser uma PERMISSÃO EM FALTA (Ver Histórico) ou (Ver Canal).");
            }
        }
    }
    console.log("[Catch-Up] Verificação de prints perdidos concluída.");
};

module.exports = catchUpPrintsHandler;