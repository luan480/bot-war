/* ========================================================================
   ARQUIVO: commands/economy/banco.js (COM SUPORTE A 'ALL')
   ======================================================================== */
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const path = require('path');
const { safeReadJson, safeWriteJson } = require('../liga/utils/helpers.js');

const economyPath = path.join(__dirname, 'economy.json');
const bancoPath = path.join(__dirname, 'banco.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('banco')
        .setDescription('🏦 Gerencia sua conta no Banco Mundial.')
        .addSubcommand(sub => 
            sub.setName('info')
                .setDescription('Ver seu extrato bancário.')
        )
        .addSubcommand(sub => 
            sub.setName('depositar')
                .setDescription('Guardar dinheiro no cofre.')
                .addStringOption(op => op.setName('valor').setDescription('Quanto depositar? (Digite "all" para tudo)').setRequired(true))
        )
        .addSubcommand(sub => 
            sub.setName('sacar')
                .setDescription('Retirar dinheiro para a carteira.')
                .addStringOption(op => op.setName('valor').setDescription('Quanto sacar? (Digite "all" para tudo)').setRequired(true))
        ),

    async execute(interaction) {
        const sub = interaction.options.getSubcommand();
        const userId = interaction.user.id;
        const valorInput = interaction.options.getString('valor')?.toLowerCase();

        const economy = safeReadJson(economyPath);
        const banco = safeReadJson(bancoPath);

        // Garante a conta
        if (!banco[userId]) banco[userId] = { saldo: 0, ultimoJuros: Date.now() };

        const saldoMao = economy[userId] || 0;
        const saldoBanco = banco[userId].saldo;

        // --- ATUALIZA JUROS (1% ao dia) ---
        const agora = Date.now();
        if (agora - banco[userId].ultimoJuros >= 86400000) {
            const dias = Math.floor((agora - banco[userId].ultimoJuros) / 86400000);
            if (saldoBanco > 0 && dias > 0) {
                banco[userId].saldo += Math.floor(saldoBanco * 0.01 * dias);
            }
            banco[userId].ultimoJuros = agora;
            safeWriteJson(bancoPath, banco);
        }

        // --- INFO ---
        if (sub === 'info') {
            const total = saldoMao + banco[userId].saldo;
            const embed = new EmbedBuilder()
                .setTitle('🏦 Banco Mundial')
                .setDescription(`**Cliente:** ${interaction.user}`)
                .addFields(
                    { name: '💵 Carteira', value: `$${saldoMao.toLocaleString('pt-BR')}`, inline: true },
                    { name: '🏛️ Cofre', value: `$${banco[userId].saldo.toLocaleString('pt-BR')}`, inline: true },
                    { name: '💰 Patrimônio', value: `$${total.toLocaleString('pt-BR')}`, inline: false }
                )
                .setColor('Green')
                .setThumbnail('https://cdn-icons-png.flaticon.com/512/2830/2830284.png')
                .setFooter({ text: 'Rendimento da Poupança: 1% ao dia (Automático)' });
            return interaction.reply({ embeds: [embed] });
        }

        // --- LÓGICA DE VALOR (ALL/TUDO) ---
        let valorReal = 0;

        if (sub === 'depositar') {
            if (valorInput === 'all' || valorInput === 'tudo') {
                valorReal = saldoMao;
            } else {
                valorReal = parseInt(valorInput);
            }

            if (isNaN(valorReal) || valorReal <= 0) return interaction.reply({ content: '❌ Valor inválido.', ephemeral: true });
            if (saldoMao < valorReal) return interaction.reply({ content: `❌ Você só tem **$${saldoMao}** na mão.`, ephemeral: true });

            economy[userId] -= valorReal;
            banco[userId].saldo += valorReal;
            
            safeWriteJson(economyPath, economy);
            safeWriteJson(bancoPath, banco);

            return interaction.reply(`✅ **Depósito Confirmado!**\nVocê guardou **$${valorReal.toLocaleString('pt-BR')}** no banco.`);
        }

        if (sub === 'sacar') {
            if (valorInput === 'all' || valorInput === 'tudo') {
                valorReal = saldoBanco;
            } else {
                valorReal = parseInt(valorInput);
            }

            if (isNaN(valorReal) || valorReal <= 0) return interaction.reply({ content: '❌ Valor inválido.', ephemeral: true });
            if (saldoBanco < valorReal) return interaction.reply({ content: `❌ Você só tem **$${saldoBanco}** no banco.`, ephemeral: true });

            banco[userId].saldo -= valorReal;
            economy[userId] = (economy[userId] || 0) + valorReal;

            safeWriteJson(economyPath, economy);
            safeWriteJson(bancoPath, banco);

            return interaction.reply(`✅ **Saque Realizado!**\nVocê retirou **$${valorReal.toLocaleString('pt-BR')}** para a carteira.`);
        }
    }
};