/* ========================================================================
   HANDLER ATUALIZADO: commands/adm/autoResponderHandler.js (V3 - "Inteligente")
   
   - Agora entende 3 tipos de gatilho: Menção, Palavra-Chave e Exato.
   - Lê o novo 'auto_replies.json' estruturado.
   ======================================================================== */
   
const { Events } = require('discord.js');
const path = require('path');
const { safeReadJson } = require('../liga/utils/helpers.js');

const repliesPath = path.join(__dirname, 'auto_replies.json');

// Função para pegar uma resposta aleatória
function getRandomReply(replies) {
    if (!replies || replies.length === 0) return null;
    return replies[Math.floor(Math.random() * replies.length)];
}

module.exports = (client) => {

    client.on(Events.MessageCreate, async (message) => {
        if (!message.guild || message.author.bot) return;

        const content = message.content.toLowerCase();
        if (!content) return;

        try {
            const repliesConfig = safeReadJson(repliesPath);
            let replyMessage = null;

            // --- TIPO 1: GATILHO DE MENÇÃO ---
            // Se o bot foi mencionado
            if (message.mentions.has(client.user.id)) {
                for (const trigger in repliesConfig.mentionTriggers) {
                    // \b é "word boundary" - impede que "ola" pegue "bola"
                    const regex = new RegExp(`\\b${trigger}\\b`, 'i');
                    if (regex.test(content)) {
                        replyMessage = getRandomReply(repliesConfig.mentionTriggers[trigger]);
                        break;
                    }
                }
            }

            // --- TIPO 2: GATILHO DE PALAVRA-CHAVE ---
            // Se não foi uma menção, checa por palavras-chave
            if (!replyMessage) {
                for (const trigger in repliesConfig.keywordTriggers) {
                    const regex = new RegExp(`\\b${trigger}\\b`, 'i');
                    if (regex.test(content)) {
                        replyMessage = getRandomReply(repliesConfig.keywordTriggers[trigger]);
                        break;
                    }
                }
            }

            // --- TIPO 3: GATILHO EXATO ---
            // Se ainda não achou, checa por gatilho exato (só a palavra)
            if (!replyMessage) {
                const exactMatch = repliesConfig.exactTriggers[content];
                if (exactMatch) {
                    replyMessage = getRandomReply(exactMatch);
                }
            }
            
            // --- Resposta ---
            if (replyMessage) {
                await message.reply(replyMessage);
            }

        } catch (err) {
            console.error("Erro no Auto-Responder:", err);
        }
    });
};