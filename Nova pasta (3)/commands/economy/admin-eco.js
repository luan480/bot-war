/* ========================================================================
   ARQUIVO: commands/economy/admin-eco.js (CORRIGIDO E SINCRONIZADO)
   DESCRIÇÃO: Gerencia a economia (Admin) usando o sistema unificado.
   ======================================================================== */
const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const path = require('path');
const { safeReadJson, safeWriteJson } = require('../liga/utils/helpers.js');

// Usa o MESMO caminho do economyTextHandler.js
const economyPath = path.join(__dirname, 'economy.json'); 

module.exports = {
    data: new SlashCommandBuilder()
        .setName('admin-eco')
        .setDescription('🔧 Gerenciar dinheiro dos usuários (Staff).')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(sub =>
            sub.setName('adicionar')
                .setDescription('Dá dinheiro a um usuário.')
                .addUserOption(op => op.setName('usuario').setDescription('Alvo').setRequired(true))
                .addIntegerOption(op => op.setName('valor').setDescription('Quanto?').setRequired(true))
        )
        .addSubcommand(sub =>
            sub.setName('remover')
                .setDescription('Remove dinheiro de um usuário.')
                .addUserOption(op => op.setName('usuario').setDescription('Alvo').setRequired(true))
                .addIntegerOption(op => op.setName('valor').setDescription('Quanto?').setRequired(true))
        )
        .addSubcommand(sub =>
            sub.setName('definir')
                .setDescription('Define o saldo exato de um usuário.')
                .addUserOption(op => op.setName('usuario').setDescription('Alvo').setRequired(true))
                .addIntegerOption(op => op.setName('valor').setDescription('Valor exato').setRequired(true))
        )
        .addSubcommand(sub =>
            sub.setName('ver')
                .setDescription('Vê o saldo de um usuário (Admin spy).')
                .addUserOption(op => op.setName('usuario').setDescription('Alvo').setRequired(true))
        ),

    async execute(interaction) {
        const sub = interaction.options.getSubcommand();
        const target = interaction.options.getUser('usuario');
        const valor = interaction.options.getInteger('valor');
        
        // Lê o banco de dados usando o helper seguro
        const economy = safeReadJson(economyPath);
        const saldoAtual = economy[target.id] || 0;

        let novoSaldo = saldoAtual;

        if (sub === 'ver') {
             const embed = new EmbedBuilder()
                .setTitle(`🔍 Espionagem: ${target.username}`)
                .setDescription(`💰 **Saldo Atual:** $${saldoAtual}`)
                .setColor('Blue');
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        if (sub === 'adicionar') novoSaldo = saldoAtual + valor;
        if (sub === 'remover') novoSaldo = Math.max(0, saldoAtual - valor);
        if (sub === 'definir') novoSaldo = valor;

        // Salva usando o helper seguro (Garante que o %saldo vai ver a mudança)
        economy[target.id] = novoSaldo;
        safeWriteJson(economyPath, economy);

        const embed = new EmbedBuilder()
            .setTitle('🔧 Economia Atualizada')
            .setDescription(`**Alvo:** ${target}\n**Ação:** ${sub.toUpperCase()}\n**Valor:** $${valor}\n**Novo Saldo:** $${novoSaldo}`)
            .setColor('Green')
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};