/* commands/ticket/ticketCloseHandler.js (ATUALIZADO COM TRANSCRIÇÃO) */

const { PermissionsBitField, AttachmentBuilder } = require('discord.js');

/**
 * Coleta as mensagens do canal e formata em texto.
 * @param {import('discord.js').TextChannel} channel
 * @returns {Promise<string>} A transcrição formatada.
 */
async function createTranscript(channel) {
    let transcript = `Transcrição do Ticket #${channel.name}\n\n`;
    const messages = await channel.messages.fetch({ limit: 100 });
    const sortedMessages = [...messages.values()].reverse();

    for (const msg of sortedMessages) {
        const timestamp = msg.createdAt.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
        transcript += `[${timestamp}] ${msg.author.tag}:\n`;
        if (msg.content) {
            transcript += `${msg.content}\n`;
        }
        if (msg.attachments.size > 0) {
            transcript += `[Anexo: ${msg.attachments.first().url}]\n`;
        }
        transcript += `\n`;
    }
    return transcript;
}

module.exports = async (interaction) => {
    const channel = interaction.channel;

    // 1. Verifica se é Staff (só Staff pode usar o botão de fechar)
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
        return interaction.reply({
            content: '❌ Apenas membros da Staff podem fechar o ticket usando o botão.',
            ephemeral: true
        });
    }

    // 2. Pega o ID do usuário do Tópico
    const topic = channel.topic;
    if (!topic) {
        return interaction.reply({ content: '❌ Canal de ticket corrompido (sem tópico).', ephemeral: true });
    }
    
    const userIdMatch = topic.match(/ID: (\d+)/);
    if (!userIdMatch) {
        return interaction.reply({ 
            content: '❌ Não foi possível identificar o criador deste ticket (ID não encontrado no tópico).', 
            ephemeral: true 
        });
    }

    const userId = userIdMatch[1];
    await interaction.reply({ 
        content: `🔒 Fechando ticket...\nSalvando transcrição e enviando para o usuário (ID: ${userId}). O canal será deletado em 5 segundos.` 
    });

    try {
        // 3. Cria a transcrição
        const transcriptText = await createTranscript(channel);
        const transcriptFile = new AttachmentBuilder(Buffer.from(transcriptText, 'utf-8'), {
            name: `transcricao-${channel.name}.txt`
        });

        // 4. Envia o DM para o usuário
        const user = await interaction.client.users.fetch(userId);
        if (user) {
            await user.send({
                content: `Olá! A transcrição do seu ticket \`#${channel.name}\` no servidor **${interaction.guild.name}** está anexada.`,
                files: [transcriptFile]
            }).catch(dmError => {
                console.warn(`[AVISO] Não foi possível enviar o DM para ${user.tag}. O usuário pode ter DMs fechadas.`);
                interaction.editReply(`🔒 Fechando ticket... Não foi possível enviar o DM para o usuário (DMs fechadas). O canal será deletado em 5 segundos.`);
            });
        }

        // 5. Deleta o canal
        setTimeout(() => {
            channel.delete().catch(err => {
                console.error("Não foi possível deletar o canal do ticket:", err);
            });
        }, 5000);

    } catch (err) {
        console.error("Erro ao fechar ticket (Botão):", err);
        await interaction.editReply({ content: '❌ Ocorreu um erro ao salvar a transcrição.' });
    }
};