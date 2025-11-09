const { SlashCommandBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');
// IMPORTAÇÃO ATUALIZADA: Agora usa o helper
const { safeWriteJson } = require('./utils/helpers.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('reset')
        .setDescription('Reseta TODA a pontuação da liga (pede confirmação).')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('confirmar_reset')
                .setLabel('Sim, resetar tudo')
                .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
                .setCustomId('cancelar_reset')
                .setLabel('Cancelar')
                .setStyle(ButtonStyle.Secondary)
        );

        const msg = await interaction.reply({
            content: '⚠️ **Você tem certeza?** Esta ação é irreversível e irá apagar **TODA** a pontuação da liga.',
            components: [row],
            ephemeral: true
        });

        const filter = (i) => i.user.id === interaction.user.id;
        try {
            const confirmation = await msg.awaitMessageComponent({ filter, time: 15000 });

            if (confirmation.customId === 'confirmar_reset') {
                const pontosPath = path.join(__dirname, 'pontuacao.json');
                // LÓGICA ATUALIZADA: Usa o helper para escrever um objeto vazio
                safeWriteJson(pontosPath, {});
                await confirmation.update({ content: '✅ **Ranking resetado!** Todas as pontuações foram zeradas.', components: [] });
            } else if (confirmation.customId === 'cancelar_reset') {
                await confirmation.update({ content: '❌ Ação cancelada.', components: [] });
            }
        } catch (e) {
            await interaction.editReply({ content: '⌛ Confirmação não recebida em 15 segundos. Ação cancelada.', components: [] });
        }
    }
};