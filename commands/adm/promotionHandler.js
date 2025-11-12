/* commands/adm/promotionHandler.js (Refatorado V4 - Mais Logs) */
const fs = require('fs');
const path = require('path');
const { Events, DiscordjsErrorCodes } = require('discord.js');

// Caminhos para os JSONs
const pontuacaoPath = path.join(__dirname, '../liga/pontuacao.json');
const serverDataPath = path.join(__dirname, 'server_data.json');

/**
 * Lógica central para processar um print.
 */
async function processPrintMessage(message, printsChannelId, printsRoleId) {
    // Adiciona log para sabermos que cargo ele está a procurar
    // console.log(`[Debug] Processando msg ${message.id}. Procurando cargo ID: ${printsRoleId}`);

    // Ignora bots e mensagens fora do canal de prints
    if (message.author.bot || message.channel.id !== printsChannelId) {
        return 'ignorado_bot_ou_canal';
    }

    try {
        // Verifica se a mensagem tem um anexo (print)
        if (message.attachments.size === 0) {
            return 'ignorado_sem_anexo';
        }

        const member = message.member || await message.guild.members.fetch(message.author.id);
        if (!member) {
            return 'ignorado_membro_nao_encontrado';
        }

        // Verifica se o membro tem o cargo necessário
        if (!member.roles.cache.has(printsRoleId)) {
            // console.log(`[Debug] Membro ${member.user.tag} não tem o cargo ${printsRoleId}.`);
            return 'ignorado_sem_cargo';
        }
        
        // 1. TENTA REAGIR à mensagem para marcar como processada
        try {
            await message.react('✅');
        } catch (reactError) {
            // Se der erro, verifica se é porque o bot JÁ REAGIU
            if (reactError.code === DiscordjsErrorCodes.ReactionAlreadyAdded) {
                // O bot já processou esta mensagem. Ignora.
                return 'ignorado_ja_processado';
            }
            // Se for outro erro (Ex: mensagem apagada, sem permissão), regista e ignora.
            console.error(`[Promoção] Falha ao reagir na msg ${message.id}: ${reactError.message}`);
            return 'ignorado_erro_react';
        }

        // 2. Carrega a pontuação
        let pontuacao = {};
        try {
            pontuacao = JSON.parse(fs.readFileSync(pontuacaoPath, 'utf8'));
        } catch (e) {
            console.log("Aviso: Ficheiro pontuacao.json não encontrado ou vazio. Criando um novo.");
        }

        // 3. Adiciona o ponto (SÓ ADICIONA SE A REAÇÃO FOI BEM SUCEDIDA)
        const userId = member.id;
        pontuacao[userId] = (pontuacao[userId] || 0) + 1; // +1 ponto por print

        // 4. Salva a pontuação
        try {
            fs.writeFileSync(pontuacaoPath, JSON.stringify(pontuacao, null, 2));
        } catch (saveError) {
            console.error(`[Promoção] FALHA CRÍTICA AO GUARDAR PONTOS: ${saveError.message}`);
            return 'ignorado_erro_guardar_json';
        }

        console.log(`[Promoção] +1 ponto para ${member.user.tag} por print.`);
        return 'processado_com_sucesso';

    } catch (err) {
        console.error(`Erro ao processar print [${message.url}]: ${err.message}`);
        return 'ignorado_erro_geral';
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