/* commands/ticket/ticket-painel.js (CORRIGIDO) */

const { 
    SlashCommandBuilder, 
    PermissionFlagsBits, 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle,
    ChannelType,
    MessageFlags // [NOVO] Importa o 'MessageFlags'
} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ticket-painel')
        .setDescription('Posta o painel de abertura de tickets.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addChannelOption(option => 
            option.setName('canal')
                .setDescription('O canal onde o painel será enviado.')
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(true)
        ),
    
    async execute(interaction) {
        const canal = interaction.options.getChannel('canal');

        // [MUDANÇA] Trocamos 'ephemeral: true' por 'flags: MessageFlags.Ephemeral'
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const embed = new EmbedBuilder()
            .setColor('#3498DB')
            .setTitle('Fazer uma denúncia ou tirar dúvidas')
            .setDescription('Avisou alguma traição ou tem dúvidas sobre o campo de batalha?\n\nClique no botão abaixo para abrir um chamado privado e relatar a denúncia ou tirar sua dúvida. Nossos comandantes irão investigar e garantir a ordem!')
            .setImage('https://i.imgur.com/g8s9g9s.jpeg'); // Lembre-se que esta imagem está quebrada!

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('ticket_abrir_denuncia')
                .setLabel('Abrir Ticket')
                .setEmoji('📨')
                .setStyle(ButtonStyle.Success)
        );

        try {
            await canal.send({ embeds: [embed], components: [row] });
            
            // [MUDANÇA] Trocamos 'ephemeral: true' por 'flags'
            await interaction.editReply({
                content: `✅ Painel de tickets enviado para o canal ${canal}!`
                // Não precisa de 'flags' no 'editReply' de um 'deferReply' efêmero
            });
        } catch (err) {
            console.error(err);
            await interaction.editReply({
                content: `❌ Erro ao enviar o painel. Verifique se eu tenho permissão para falar no canal ${canal}.`
            });
        }
    }
};