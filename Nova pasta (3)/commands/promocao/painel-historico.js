/* ========================================================================
   ARQUIVO: commands/promocao/painel-historico.js
   DESCRIÇÃO: Cria o Painel do Hall da Fama
   ======================================================================== */

const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('painel-historico')
        .setDescription('Cria o mural do Hall da Fama (Histórico de Vencedores).')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setTitle('🏛️ HALL DA FAMA - WARGROW')
            .setDescription(
                'Bem-vindo ao museu dos campeões.\n' +
                'Aqui estão eternizados os nomes daqueles que fizeram história.\n\n' +
                '🔎 **Selecione uma categoria abaixo:**'
            )
            .setColor('#b9bbbe') // Prata
            .setImage('https://i.imgur.com/XFv0Hl7.png'); // Use a sua imagem aqui se quiser

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('hist_liga').setLabel('🏆 Liga').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('hist_imperador').setLabel('👑 Imperador').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId('hist_eventos').setLabel('⚔️ Eventos').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('hist_records').setLabel('📊 Records').setStyle(ButtonStyle.Danger)
        );

        await interaction.reply({ embeds: [embed], components: [row] });
    }
};