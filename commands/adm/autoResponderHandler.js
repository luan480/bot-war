/* ========================================================================
   NOVO HANDLER: commands/adm/autoResponderHandler.js
   
   - Vigia o chat por palavras-gatilho (definidas no .json)
   - Responde o usuário com uma frase aleatória.
   ======================================================================== */
   
const { Events } = require('discord.js');
const path = require('path');
// Puxa o helper de ler JSON
const { safeReadJson } = require('../liga/utils/helpers.js');

// Caminho para o novo arquivo de respostas
const repliesPath = path.join(__dirname, 'auto_replies.json');

module.exports = (client) => {

    client.on(Events.MessageCreate, async (message) => {
        // 1. Ignora DMs, ignora outros bots (incluindo ele mesmo)
        if (!message.guild || message.author.bot) return;

        // 2. Pega o conteúdo da mensagem, em minúsculas e sem espaços
        const trigger = message.content.toLowerCase().trim();

        // Se a mensagem for vazia (só um anexo), ignora
        if (!trigger) return;

        try {
            // 3. Lê o nosso arquivo de respostas
            const repliesConfig = safeReadJson(repliesPath);

            // 4. Verifica se a MENSAGEM EXATA está no nosso arquivo
            //    (Ex: se o usuário digitou SÓ "coelho")
            if (repliesConfig[trigger]) {
                const replies = repliesConfig[trigger];
                
                // 5. Pega uma resposta aleatória da lista
                const randomReply = replies[Math.floor(Math.random() * replies.length)];

                // 6. Responde ao usuário (message.reply() marca o usuário)
                await message.reply(randomReply);
            }
        } catch (err) {
            console.error("Erro no Auto-Responder:", err);
        }
    });
};