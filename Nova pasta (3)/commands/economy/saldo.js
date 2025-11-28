/* ========================================================================
   ARQUIVO: commands/economy/saldo.js (VERSÃO 2.0 - EXTRATO)
   ======================================================================== */
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const path = require('path');
const { safeReadJson } = require('../liga/utils/helpers.js');

const economyPath = path.join(__dirname, 'economy.json');
const bancoPath = path.join(__dirname, 'banco.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('saldo')
        .setDescription('🏦 Mostra seu extrato bancário completo.')
        .addUserOption(option => option.setName('usuario').setDescription('Ver saldo de outro soldado')),

    async execute(interaction) {
        const target = interaction.options.getUser('usuario') || interaction.user;
        
        const economy = safeReadJson(economyPath);
        const banco = safeReadJson(bancoPath); // Lê o arquivo do banco que criamos

        const naMao = economy[target.id] || 0;
        const noBanco = banco[target.id]?.saldo || 0;
        const total = naMao + noBanco;

        const embed = new EmbedBuilder()
            .setTitle(`🏦 Extrato Financeiro: ${target.username}`)
            .setColor('#FFD700') // Dourado
            .setThumbnail(target.displayAvatarURL())
            .addFields(
                { name: '💵 Carteira (Risco)', value: `$${naMao.toLocaleString('pt-BR')}`, inline: true },
                { name: '💳 Banco (Seguro)', value: `$${noBanco.toLocaleString('pt-BR')}`, inline: true },
                { name: '💰 Patrimônio Total', value: `**$${total.toLocaleString('pt-BR')}**`, inline: false }
            )
            .setFooter({ text: 'Use /banco depositar para proteger seu dinheiro de roubos!' });

        await interaction.reply({ embeds: [embed] });
    }
};