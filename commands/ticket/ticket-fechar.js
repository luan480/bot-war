/* ========================================================================
   ARQUIVO: commands/ticket/ticket-fechar.js (V2 - HTML)
   
   - [MUDANÇA] Remove a função 'createTranscript' manual.
   - [MUDANÇA] Adiciona o pacote 'discord-html-transcripts'.
   - Agora envia um arquivo .html bonito.
   ======================================================================== */

const { SlashCommandBuilder, PermissionFlagsBits, AttachmentBuilder } = require('discord.js');
// [NOVO] Importa a nova biblioteca
const discordTranscripts = require('discord-html-transcripts');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('fechar-ticket')
        .setDescription('Fecha o canal de ticket atual e envia a transcrição para o DM do usuário.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels), // Só Staff
    
    async execute(interaction) {
        const channel = interaction.channel;

        if (!channel.name.startsWith('ticket-') || !channel.topic) {
            return interaction.reply({ 
                content: '❌ Este não parece ser um canal de ticket válido.', 
                ephemeral: true 
            });
        }

        const topic = channel.topic;
        const userIdMatch = topic.match(/ID: (\d+)/);

        if (!userIdMatch) {
            return interaction.reply({ 
                content: '❌ Não foi possível identificar o criador deste ticket (ID não encontrado no tópico).', 
                ephemeral: true 
            });
        }

        const userId = userIdMatch[1];
        await interaction.reply({ 
            content: `🔒 Fechando ticket...\nSalvando transcrição em HTML e enviando para o usuário. O canal será deletado em 5 segundos.` 
        });

        try {
            // [NOVO] Cria a transcrição em HTML
            const attachment = await discordTranscripts.createTranscript(channel, {
                filename: `transcricao-${channel.name}.html`, // Nome do arquivo
                saveImages: true, // Salva as imagens (bom para prints de denúncia)
                poweredBy: false // Remove o "powered by"
            });

            // 4. Envia o DM para o usuário
            const user = await interaction.client.users.fetch(userId);
            if (user) {
                await user.send({
                    content: `Olá! A transcrição do seu ticket \`#${channel.name}\` no servidor **${interaction.guild.name}** está anexada.`,
                    files: [attachment] // Envia o arquivo HTML
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
            console.error("Erro ao fechar ticket (Comando):", err);
            await interaction.editReply({ content: '❌ Ocorreu um erro ao salvar a transcrição.' });
        }
    }
};