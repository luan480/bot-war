/* ========================================================================
   ARQUIVO commands/liga/painel.js (CORRIGIDO)
   
   - Corrigido o erro de sintaxe na linha .catch()
   - O restante do código foi preservado.
   ======================================================================== */

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');
// Importa a função de ajuda (que você confirmou já estar correta)
const { safeReadJson } = require('./utils/helpers.js'); 

module.exports = {
    // Este arquivo não é um comando de barra (/), é um 'módulo'
    // que o comando /liga usa.
    data: { name: 'painel' },

    /**
     * Cria ou atualiza o painel de controle da Liga em um canal específico.
     * @param {import('discord.js').Guild} guild - O servidor.
     * @param {string} canalId - O ID do canal de texto.
     */
    async criarPainelDashboard(guild, canalId) {
        
        // 1. Tenta encontrar o canal
        const canal = await guild.channels.fetch(canalId).catch(() => null);
        if (!canal || !canal.isTextBased()) {
            return console.log(`[Painel] ERRO: O canal de ID ${canalId} não foi encontrado ou não é um canal de texto.`);
        }

        // 2. Monta o Embed (a mensagem bonita)
        const painelEmbed = new EmbedBuilder()
            .setColor('#9B59B6')
            .setAuthor({ name: '🏆 LIGA DAS NAÇÕES 🏆' })
            .setTitle('🔥 A atenção, soldados! A Liga War Grow está chegando! Entre no campo de batalha, lute pela vitória e prove quem domina o mapa!')
            .setDescription(
                `📆 **Início:** 01/12 — **Fim:** 31/12\n` +
                `⚔️ **Só os fortes sobrevivem!**\n\n` +
                `__**PREMIAÇÃO POR COLOCAÇÃO:**__\n\n` +
                `🥇 **1º Lugar:** R$ 100,00 + <@&1429934221216186458>\n` +
                `🥈 **2º Lugar:** R$ 50,00 + <@&938174095470772305>\n` +
                `🥉 **3º Lugar:** <@&938174095470772305>\n\n` +
                `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
                `Prepare suas estratégias e convoque seus aliados para a maior competição de War do servidor. A glória e as recompensas esperam por você.`
            )
            .setImage('https://cdn.discordapp.com/attachments/1082774011676729365/1283426407313182803/WAR.gif')
            .setFooter({ text: 'Clique em "Iniciar" para registrar uma nova partida.' })
            .setTimestamp();

        // 3. Monta a fileira de botões
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('iniciar_contabilizacao')
                .setLabel('Iniciar')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('▶️'),
            new ButtonBuilder()
                .setCustomId('ver_ranking')
                .setLabel('Ver Ranking')
                .setStyle(ButtonStyle.Success)
                .setEmoji('🏆'),
            new ButtonBuilder()
                .setCustomId('ver_todos_competidores')
                .setLabel('Ver Jogadores')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('📜')
        );

        // 4. Lógica para Enviar ou Editar o painel
        const painelPath = path.join(__dirname, 'painel.json');
        const painelData = safeReadJson(painelPath);
        let painelMsg = null;

        // Se já temos um ID de painel salvo...
        if (painelData && painelData.messageId) {
            // ...tenta encontrar a mensagem antiga.
            // Se a mensagem foi apagada, o catch() retorna 'null' e evita que o bot quebre.
            painelMsg = await canal.messages.fetch(painelData.messageId).catch(() => null); // <-- LINHA CORRIGIDA
        }

        // Se encontrou a mensagem antiga, edita.
        if (painelMsg) {
            await painelMsg.edit({ embeds: [painelEmbed], components: [row] });
            console.log(`[Painel] Painel da Liga War atualizado no canal '${canal.name}'.`);
        } else {
            // Se não encontrou (ou é a primeira vez), envia uma nova.
            const novaMensagem = await canal.send({ embeds: [painelEmbed], components: [row] });
            // E salva o ID da nova mensagem no 'painel.json'
            fs.writeFileSync(painelPath, JSON.stringify({ messageId: novaMensagem.id, channelId: canal.id }, null, 2));
            console.log(`[Painel] Um novo painel da Liga War foi criado no canal '${canal.name}'.`);
        }
    }
};