/* commands/ticket/ticketCloseHandler.js (V2 - COM EMBED BONITO) */

// [MUDANÇA] Adicionamos EmbedBuilder e Colors
const { AttachmentBuilder, EmbedBuilder, Colors } = require('discord.js');
const discordTranscripts = require('discord-html-transcripts');
const fs = require('fs');
const path = require('path');

// Carrega os dados do servidor (para o canal de logs)
const serverDataPath = path.join(__dirname, '../adm/server_data.json');
let serverData = {};
try {
    serverData = JSON.parse(fs.readFileSync(serverDataPath, 'utf8'));
} catch (err) {
    console.error("Erro ao carregar server_data.json no ticketCloseHandler:", err);
}

async function handleTicketClose(interaction) {
    const channel = interaction.channel;
    if (!channel.name.startsWith('ticket-')) {
        return interaction.reply({ content: '❌ Este não parece ser um canal de ticket válido.', ephemeral: true });
    }

    // Tenta extrair o ID do usuário do tópico do canal
    const topic = interaction.channel.topic;
    const userIdMatch = topic ? topic.match(/ID: (\d+)/) : null;
    const userId = userIdMatch ? userIdMatch[1] : null;

    if (!userId) {
        console.warn(`[AVISO] Ticket ${channel.name} fechado sem ID de usuário no tópico.`);
    }

    await interaction.reply({ content: `🔒 Fechando ticket...\nSalvando transcrição em HTML. O canal será deletado em 5 segundos.` });

    // Renomeia o canal ANTES de salvar, para que o usuário veja a mudança
    try {
        await channel.setName(`🔒-fechado`);
    } catch (renameErr) {
        console.error("Não foi possível renomear o canal do ticket:", renameErr);
    }

    let attachment;
    try {
        // Gera a transcrição
        attachment = await discordTranscripts.createTranscript(channel, {
            filename: `transcricao-${channel.name}.html`,
            saveImages: true,
            poweredBy: false
        });
    } catch (transcriptErr) {
        console.error("Erro ao criar a transcrição:", transcriptErr);
        return interaction.editReply({ content: '❌ Ocorreu um erro ao salvar a transcrição. O canal não será deletado.' });
    }

    // Tenta enviar o DM para o usuário
    if (userId) {
        try {
            const user = await interaction.client.users.fetch(userId);

            // --- ✨ DM COM EMBED BONITO ---
            const embedDM = new EmbedBuilder()
                .setColor(Colors.Blue) // Cor azul informativa
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
                embeds: [embedDM], // Usa 'embeds' em vez de 'content'
                files: [attachment]
            });
            // --- FIM DA MUDANÇA ---

        } catch (dmError) {
            console.warn(`[AVISO] Não foi possível enviar o DM da transcrição para ${userId}.`);
            await interaction.editReply(`🔒 Ticket fechado. Não foi possível enviar o DM para o usuário (DMs fechadas). O canal será deletado em 5 segundos.`);
        }
    }

    // Envia a transcrição para o canal de logs (se configurado)
    const logChannelId = serverData[interaction.guild.id]?.logChannelId;
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

    // Deleta o canal
    setTimeout(() => {
        channel.delete().catch(err => {
            console.error("Não foi possível deletar o canal do ticket:", err);
        });
    }, 5000);
}

// Exporta a função diretamente
module.exports = handleTicketClose;