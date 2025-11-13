/* commands/adm/promotionHandler.js (O TEU CÓDIGO ORIGINAL RESTAURADO) */
const fs = require('fs');
const path = require('path');
const { Events } = require('discord.js');

// Caminhos para os JSONs
const pontuacaoPath = path.join(__dirname, '../liga/pontuacao.json');
const serverDataPath = path.join(__dirname, 'server_data.json');

const promotionVigia = (client) => {
    let serverData = {};
    try {
        serverData = JSON.parse(fs.readFileSync(serverDataPath, 'utf8'));
    } catch (err) {
        console.error("Erro ao carregar server_data.json no promotionHandler:", err);
        return;
    }

    client.on(Events.MessageCreate, async message => {
        if (!message.guild) return;

        const guildId = message.guild.id;
        const config = serverData[guildId];

        // Verifica se este servidor tem a configuração
        if (config && config.printsChannelId && config.printsRoleId) {
            
            // Ignora bots
            if (message.author.bot) return;

            // Verifica se a mensagem está no canal de prints
            if (message.channel.id === config.printsChannelId) {
                
                // Verifica se tem anexo
                if (message.attachments.size > 0) {
                    const member = message.member;
                    
                    // Verifica se o membro tem o cargo de prints
                    // (Esta era a tua lógica original)
                    if (member.roles.cache.has(config.printsRoleId)) {
                        
                        try {
                            // 1. Reage à mensagem
                            await message.react('✅');

                            // 2. Carrega a pontuação
                            let pontuacao = {};
                            try {
                                pontuacao = JSON.parse(fs.readFileSync(pontuacaoPath, 'utf8'));
                            } catch (e) {
                                // Ficheiro não existe ou está vazio
                            }

                            // 3. Adiciona o ponto
                            const userId = member.id;
                            pontuacao[userId] = (pontuacao[userId] || 0) + 1; // +1 ponto por print

                            // 4. Salva a pontuação
                            fs.writeFileSync(pontuacaoPath, JSON.stringify(pontuacao, null, 2));
                            console.log(`[Promoção] +1 ponto para ${member.user.tag} por print.`);

                        } catch (err) {
                            console.error(`Erro ao processar print [${message.url}]: ${err.message}`);
                        }
                    }
                }
            }
        }
    });
};

// (NÃO SE ESQUEÇA DESTA LINHA!)
module.exports = promotionVigia;