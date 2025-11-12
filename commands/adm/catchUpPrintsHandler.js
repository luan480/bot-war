/* commands/adm/catchUpPrintsHandler.js (V2 - Lógica Segura) */
const fs = require('fs');
const path = require('path');
// Importa a lógica de processamento que acabámos de separar
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
            try {
                const channel = await client.channels.fetch(config.printsChannelId);
                if (!channel || !channel.isTextBased()) {
                    console.warn(`[Catch-Up] Canal de prints (${config.printsChannelId}) não encontrado no servidor ${guild.name}.`);
                    continue;
                }

                // Busca as últimas 100 mensagens no canal
                const messages = await channel.messages.fetch({ limit: 100 });
                
                let processedCount = 0;

                // Itera por todas as mensagens encontradas
                for (const message of messages.values()) {
                    
                    // [MUDANÇA] Removemos a verificação de reação daqui.
                    // Apenas enviamos para a função de processar.
                    // Ela própria vai verificar se já reagiu ou não.
                    
                    // Só processa se tiver anexos
                    if (message.attachments.size > 0) {
                        const resultado = await processPrintMessage(message, config.printsChannelId, config.printsRoleId);
                        
                        // Se o resultado for "processado_com_sucesso", conta.
                        if (resultado === 'processado_com_sucesso') {
                            processedCount++;
                        }
                    }
                }

                if (processedCount > 0) {
                    console.log(`[Catch-Up] ${processedCount} prints perdidos foram processados no servidor ${guild.name}.`);
                }

            } catch (err) {
                console.error(`[Catch-Up] Falha ao verificar canal no servidor ${guild.name}: ${err.message}`);
            }
        }
    }
    console.log("[Catch-Up] Verificação de prints perdidos concluída.");
};

module.exports = catchUpPrintsHandler;