/* ========================================================================
   ARQUIVO: commands/ticket/ticketCloseHandler.js (CORRIGIDO)
   
   - [CORREÇÃO] Agora lê o 'log_config.json' da pasta 'adm'
     para encontrar o canal de logs, em vez do 'server_data.json'.
   ======================================================================== */

const { AttachmentBuilder, EmbedBuilder, Colors } = require('discord.js');
const discordTranscripts = require('discord-html-transcripts');
const path = require('path');
const { safeReadJson } = require('../liga/utils/helpers.js'); // Usamos o helper de leitura

// [CAMINHO CORRIGIDO] Aponta para o arquivo de configuração de logs
const logConfigPath = path.join(__dirname, '../adm/log_config.json');

async function handleTicketClose(interaction) {
    const channel = interaction.channel;
    if (!channel.name.startsWith('ticket-')) {
        return interaction.reply({ content: '❌ Este não parece ser um canal de ticket válido.', ephemeral: true });
    }

    const topic = interaction.channel.topic;
    const userIdMatch = topic ? topic.match(/ID: (\d+)/) : null;
    const userId = userIdMatch ? userIdMatch[1] : null;

    if (!userId) {
        console.warn(`[AVISO] Ticket ${channel.name} fechado sem ID de usuário no tópico.`);
    }

    await interaction.reply({ content: `🔒 Fechando ticket...\nSalvando transcrição em HTML. O canal será deletado em 5 segundos.` });

    try {
        await channel.setName(`🔒-fechado`);
    } catch (renameErr) {
        console.error("Não foi possível renomear o canal do ticket:", renameErr);
    }

    let attachment;
    try {
        attachment = await discordTranscripts.createTranscript(channel, {
            filename: `transcricao-${channel.name}.html`,
            saveImages: true,
            poweredBy: false
        });
    } catch (transcriptErr) {
        console.error("Erro ao criar a transcrição:", transcriptErr);
        return interaction.editReply({ content: '❌ Ocorreu um erro ao salvar a transcrição. O canal não será deletado.' });
    }

    if (userId) {
        try {
            const user = await interaction.client.users.fetch(userId);
            const embedDM = new EmbedBuilder()
                .setColor(Colors.Blue)
                .setTitle('✅ Ticket Fechado')
                .setDescription(`Olá! Seu ticket no servidor **${interaction.guild.name}** foi fechado.\n\nEstamos enviando a transcrição completa da conversa em anexo para sua referência.`)
                .addFields(
                    { name: 'Servidor', value: interaction.guild.name, inline: true },
                    { name: 'Ticket', value: `\`#${channel.name}\``, inline: true }
                )
                .setFooter({
                    text: `Bot ${interaction.client.user.username}`,
                    iconURL: interaction.client.user.displayAvatarURL()
                })
                .setTimestamp();

            await user.send({
                embeds: [embedDM],
                files: [attachment]
            });

        } catch (dmError) {
            console.warn(`[AVISO] Não foi possível enviar o DM da transcrição para ${userId}.`);
            await interaction.editReply(`🔒 Ticket fechado. Não foi possível enviar o DM para o usuário (DMs fechadas). O canal será deletado em 5 segundos.`);
        }
    }

    // [LÓGICA CORRIGIDA] Envia a transcrição para o canal de logs correto
    const logConfig = safeReadJson(logConfigPath); // Lê o log_config.json
    const logChannelId = logConfig.logChannelId;   // Pega o ID de lá

    if (logChannelId && attachment) {
        try {
            const logChannel = await interaction.guild.channels.fetch(logChannelId);
            if (logChannel) {
                await logChannel.send({
                    content: `Transcrição do ticket \`#${channel.name}\` (fechado por ${interaction.user.tag}).`,
                    files: [attachment]
                });
            }
        } catch (logErr) {
            console.error("Não foi possível enviar a transcrição para o canal de logs:", logErr);
        }
    }

    setTimeout(() => {
        channel.delete().catch(err => {
            console.error("Não foi possível deletar o canal do ticket:", err);
        });
    }, 5000);
}

module.exports = handleTicketClose;