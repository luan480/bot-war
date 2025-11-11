/* ========================================================================
   NOVO HANDLER: commands/adm/welcomeHandler.js
   
   - Vigia o servidor por novos membros (guildMemberAdd)
   - Posta uma mensagem de boas-vindas no canal #recrutas
   ======================================================================== */
   
const { Events, EmbedBuilder } = require('discord.js');

// --- IDs dos Canais (do seu server_data.json) ---
// Canal de Boas-Vindas
const CANAL_RECRUTAS = '1324278999169368095'; 
// Canal de Regras
const CANAL_CONDUTA = '854365038911160420'; 
// Canal de "Apply"
const CANAL_SEJA_STAFF = '880892229558865960'; 

// Imagem de boas-vindas (pode trocar o link se quiser)
const BEMVINDO_IMG = 'https://cdn.discordapp.com/attachments/1082774011676729365/1437909813899038860/ABS2GSlQGvPWahu9B-uTjqrQapfh1qrnWrBCjy1iZNN0WsAaLjOid6kZCzl_MiC-pZsbBwmP0nennpEP9A_wrqYaEQ5gp1cyT9zYzy1uaBZzhnzoGPFvcpBx4ItibdfpmoTWV0zxhPvidab19NbpAOMo6aS3all8zpkpbNXyIW-hlF3Q_YyUsAs1024-rj.png?ex=6914f55e&is=6913a3de&hm=70a1229da286ba5e23dbef227a143a53fcd1973ec34b75e6d8371d133d896a11&';

module.exports = (client) => {

    // Ouve o evento de "Membro Entrou"
    client.on(Events.GuildMemberAdd, async (member) => {
        // Ignora se o evento não for do seu servidor principal
        if (member.guild.id !== process.env.GUILD_ID) return;

        // 1. Acha o canal de #recrutas
        const channel = await client.channels.fetch(CANAL_RECRUTAS).catch(() => null);
        if (!channel) {
            console.error(`[ERRO] O canal de boas-vindas (ID: ${CANAL_RECRUTAS}) não foi encontrado.`);
            return;
        }

        // 2. Monta o Embed de Boas-Vindas
        const embed = new EmbedBuilder()
            .setColor('#2ECC71') // Verde
            .setTitle('BEM-VINDO(A)!')
            .setDescription('TROPAS A POSTOS NO SERVIDOR!')
            .setImage(BEMVINDO_IMG)
            .setThumbnail(member.user.displayAvatarURL()) // Pega o avatar do novo membro
            .setTimestamp();

        // 3. Monta a Mensagem (com os links)
        const message = `👋 Seja bem-vindo ao servidor, ${member.user}!\n\n` +
                        `Não se esqueça de checar as regras em <#${CANAL_CONDUTA}> ` +
                        `e, se quiser ajudar, veja o <#${CANAL_SEJA_STAFF}>.`;

        // 4. Envia a mensagem no canal #recrutas
        try {
            await channel.send({
                content: message,
                embeds: [embed]
            });
        } catch (err) {
            console.error("Erro ao enviar mensagem de boas-vindas:", err);
        }
    });
};