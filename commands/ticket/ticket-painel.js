/* commands/ticket/ticket-painel.js */

const { 
    SlashCommandBuilder, 
    PermissionFlagsBits, 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle,
    ChannelType
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

        const embed = new EmbedBuilder()
            .setColor('#3498DB')
            .setTitle('Fazer uma denúncia ou tirar dúvidas')
            .setDescription('Avisou alguma traição ou tem dúvidas sobre o campo de batalha?\n\nClique no botão abaixo para abrir um chamado privado e relatar a denúncia ou tirar sua dúvida. Nossos comandantes irão investigar e garantir a ordem!')
            .setImage('https://i.imgur.com/g8s9g9s.jpeg');

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('ticket_abrir_denuncia')
                .setLabel('Abrir Ticket')
                .setEmoji('📨')
                .setStyle(ButtonStyle.Success)
        );

        try {
            await canal.send({ embeds: [embed], components: [row] });
            await interaction.reply({
                content: `✅ Painel de tickets enviado para o canal ${canal}!`,
                ephemeral: true
            });
        } catch (err) {
            console.error(err);
            await interaction.reply({
                content: `❌ Erro ao enviar o painel. Verifique se eu tenho permissão para falar no canal ${canal}.`,
                ephemeral: true
            });
        }
    }
};