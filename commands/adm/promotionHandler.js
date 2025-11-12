/* commands/adm/promotionHandler.js (Refatorado para Catch-Up) */
const fs = require('fs');
const path = require('path');
const { Events } = require('discord.js');

// Caminhos para os JSONs
const pontuacaoPath = path.join(__dirname, '../liga/pontuacao.json');
const serverDataPath = path.join(__dirname, 'server_data.json');

/**
 * Esta é a lógica central para processar um print.
 * Ela agora está separada para que possa ser usada em tempo real E no catch-up.
 */
async function processPrintMessage(message, printsChannelId, printsRoleId) {
    // Ignora bots e mensagens fora do canal de prints
    if (message.author.bot || message.channel.id !== printsChannelId) {
        return;
    }

    try {
        // Verifica se a mensagem tem um anexo (print)
        if (message.attachments.size > 0) {
            const member = message.member || await message.guild.members.fetch(message.author.id);
            if (!member) return;

            // Verifica se o membro tem o cargo necessário
            if (member.roles.cache.has(printsRoleId)) {
                
                // --- IMPORTANTE: Verifica se o bot já reagiu com ✅ ---
                // Se já reagiu, significa que esta mensagem já foi processada (no catch-up ou antes)
                const hasBotReaction = message.reactions.cache.get('✅')?.me;
                if (hasBotReaction) {
                    return; 
                }
                // --- Fim da verificação ---

                // 1. Reage à mensagem para marcar como processada
                await message.react('✅');

                // 2. Carrega a pontuação
                let pontuacao = {};
                try {
                    pontuacao = JSON.parse(fs.readFileSync(pontuacaoPath, 'utf8'));
                } catch (e) {
                    console.error("Erro ao ler pontuacao.json para promotion:", e);
                    // Continua mesmo se o ficheiro não existir, pois será criado
                }

                // 3. Adiciona o ponto
                const userId = member.id;
                pontuacao[userId] = (pontuacao[userId] || 0) + 1; // +1 ponto por print

                // 4. Salva a pontuação
                fs.writeFileSync(pontuacaoPath, JSON.stringify(pontuacao, null, 2));
                console.log(`[Promoção] +1 ponto para ${member.user.tag} por print.`);
            }
        }
    } catch (err) {
        console.error(`Erro ao processar print [${message.url}]: ${err.message}`);
    }
}

// Esta é a função original (o vigia) que fica ouvindo por novas mensagens
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

        // Se o servidor tem a configuração, chama a lógica de processamento
        if (config && config.printsChannelId && config.printsRoleId) {
            await processPrintMessage(message, config.printsChannelId, config.printsRoleId);
        }
    });
};

// Exporta o vigia (para o index.js)
module.exports = promotionVigia;
// Exporta a lógica (para o catch-up usar)
module.exports.processPrintMessage = processPrintMessage;