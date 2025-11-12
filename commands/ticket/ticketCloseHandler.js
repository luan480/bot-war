/* commands/ticket/ticketCloseHandler.js (V2 - HTML "Bonito") */

const { PermissionsBitField } = require('discord.js');
const discordTranscripts = require('discord-html-transcripts');

module.exports = async (interaction) => {
    const channel = interaction.channel;
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
        return interaction.reply({
            content: '❌ Apenas membros da Staff podem fechar o ticket usando o botão.',
            ephemeral: true
        });
    }
    const topic = channel.topic;
    if (!topic) {
        return interaction.reply({ content: '❌ Canal de ticket corrompido (sem tópico).', ephemeral: true });
    }
    const userIdMatch = topic.match(/ID: (\d+)/);
    if (!userIdMatch) {
        return interaction.reply({ content: '❌ Não foi possível identificar o criador deste ticket (ID não encontrado no tópico).', ephemeral: true });
    }
    const userId = userIdMatch[1];
    await interaction.reply({ content: `🔒 Fechando ticket...\nSalvando transcrição em HTML e enviando para o usuário. O canal será deletado em 5 segundos.` });

    try {
        const attachment = await discordTranscripts.createTranscript(channel, {
            filename: `transcricao-${channel.name}.html`,
            saveImages: true,
            poweredBy: false
        });
        const user = await interaction.client.users.fetch(userId);
        if (user) {
            await user.send({
                content: `Olá! A transcrição do seu ticket \`#${channel.name}\` no servidor **${interaction.guild.name}** está anexada.`,
                files: [attachment]
            }).catch(dmError => {
                console.warn(`[AVISO] Não foi possível enviar o DM para ${user.tag}. O usuário pode ter DMs fechadas.`);
                interaction.editReply(`🔒 Fechando ticket... Não foi possível enviar o DM para o usuário (DMs fechadas). O canal será deletado em 5 segundos.`);
            });
        }
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