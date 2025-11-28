/* ========================================================================
   ARQUIVO: commands/promocao/painel-ranking.js (VERSÃO V5 - MÚLTIPLOS RANKINGS)
   ======================================================================== */

const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('painel-ranking')
        .setDescription('Cria o mural fixo com Ranking Global e por Facção.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const embed = new EmbedBuilder()
            .setTitle('🏆 MURAL DA FAMA - WARGROW')
            .setDescription(
                'Quem são os maiores guerreiros da nossa história?\n' +
                'Selecione uma categoria abaixo para visualizar o **Top 10** atualizado.\n\n' +
                '🌎 **Global:** Os melhores de todo o servidor.\n' +
                '🏴 **Por Facção:** Os melhores de cada exército.'
            )
            .setColor('#FFD700') // Dourado
            .setImage('https://media.discordapp.net/attachments/1082774011676729365/1145038735486980227/line_1.gif') // Linha divisória animada
            .setFooter({ text: 'Sistema de Competição WarGrow' });

        // Linha 1: Ranking Global (Destaque)
        const row1 = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('rank_global')
                .setLabel('🏆 Top 10 Global')
                .setStyle(ButtonStyle.Success) // Verde para destaque
        );

        // Linha 2: Facções (Cores temáticas)
        const row2 = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('rank_marinha').setLabel('⚓ Marinha').setStyle(ButtonStyle.Primary), // Azul
            new ButtonBuilder().setCustomId('rank_exercito').setLabel('🪖 Exército').setStyle(ButtonStyle.Success), // Verde (usando Success como verde escuro)
            new ButtonBuilder().setCustomId('rank_aeronautica').setLabel('✈️ Aeronáutica').setStyle(ButtonStyle.Secondary), // Cinza
            new ButtonBuilder().setCustomId('rank_mercenarios').setLabel('💰 Mercenários').setStyle(ButtonStyle.Danger) // Vermelho
        );

        await interaction.deleteReply(); // Apaga o "pensando..."
        await interaction.channel.send({ embeds: [embed], components: [row1, row2] });
    }
};