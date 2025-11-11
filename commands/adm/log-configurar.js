
/* ========================================================================
   ARQUIVO: commands/adm/log-configurar.js (NOVO)
   
   - Este é o comando que faltava.
   - Define o canal onde o bot enviará todos os logs de moderação.
   - Salva a escolha em 'log_config.json'.
   ======================================================================== */

const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const path = require('path');
// Puxa o helper de salvar JSON (que já existe)
const { safeWriteJson } = require('../liga/utils/helpers.js');

// Caminho para o novo arquivo de configuração de log
const logConfigPath = path.join(__dirname, 'log_config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('log-configurar')
        .setDescription('Define o canal para onde os logs do servidor serão enviados.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addChannelOption(option =>
            option.setName('canal')
                .setDescription('O canal de texto para enviar os logs.')
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(true)
        ),
    
    async execute(interaction) {
        const canal = interaction.options.getChannel('canal');
        
        // Salva a configuração no JSON
        try {
            safeWriteJson(logConfigPath, { logChannelId: canal.id });
            
            await interaction.reply({
                content: `✅ Sucesso! O canal ${canal} foi definido como o novo canal de logs do servidor.`,
                ephemeral: true
            });
        } catch (err) {
            console.error("Erro ao salvar log_config.json:", err);
            await interaction.reply({
                content: '❌ Ocorreu um erro ao tentar salvar a configuração.',
                ephemeral: true
            });
        }
    }
};