/* ========================================================================
   ARQUIVO: commands/ticket/ticket-painel.js
   
   - Título e Descrição do Embed atualizados para um
     tom mais profissional e temático (militar).
   ======================================================================== */

const { 
    SlashCommandBuilder, 
    PermissionFlagsBits, 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle,
    ChannelType,
    MessageFlags 
} = require('discord.js');

module.exports = {
    // 1. Definição do Comando
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
    
    // 2. Lógica de Execução
    async execute(interaction) {
        const canal = interaction.options.getChannel('canal');
        
        await interaction.deferReply({ flags: MessageFlags.Ephemeral }); 

        // --- [TEXTO ATUALIZADO AQUI] ---
        const embed = new EmbedBuilder()
            .setColor('#3498DB') // Azul
            .setTitle('Quartel-General: Central de Suporte') // TÍTULO NOVO
            .setDescription(
                '**Presenciou uma infração ou precisa de suporte tático?**\n\n' + // DESCRIÇÃO NOVA
                'A comunicação é vital para a ordem no campo de batalha. Clique no botão abaixo para abrir um canal privado e direto com o Comando para:\n\n' +
                '• Fazer denúncias (anti-jogo, traição)\n' +
                '• Tirar dúvidas sobre estratégias ou regras\n' +
                '• Solicitar assistência da Staff'
            )
            .setImage('https://cdn.discordapp.com/attachments/1082774011676729365/1437909813899038860/ABS2GSlQGvPWahu9B-uTjqrQapfh1qrnWrBCjy1iZNN0WsAaLjOid6kZCzl_MiC-pZsbBwmP0nennpEP9A_wrqYaEQ5gp1cyT9zYzy1uaBZzhnzoGPFvcpBx4ItibdfpmoTWV0zxhPvidab19NbpAOMo6aS3all8zpkpbNXyIW-hlF3Q_YyUsAs1024-rj.png?ex=6914f55e&is=6913a3de&hm=70a1229da286ba5e23dbef227a143a53fcd1973ec34b75e6d8371d133d896a11&'); 

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('ticket_abrir_denuncia')
                .setLabel('Abrir Chamado') // Texto do botão atualizado
                .setEmoji('📨')
                .setStyle(ButtonStyle.Success)
        );

        try {
            await canal.send({ embeds: [embed], components: [row] });
            await interaction.editReply({
                content: `✅ Painel de tickets enviado para o canal ${canal}!`
            });
        } catch (err) {
            console.error(err);
            await interaction.editReply({
                content: `❌ Erro ao enviar o painel. Verifique se eu tenho permissão para falar no canal ${canal}.`
            });
        }
    }
};