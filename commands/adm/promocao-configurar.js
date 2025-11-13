/* ========================================================================
   ARQUIVO: commands/adm/promocao-configurar.js (NOVO)
   
   - Comando para configurar o sistema de promoção de patentes.
   - Salva em 'promocao_config.json'.
   ======================================================================== */

const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, RoleSelectMenuBuilder, ActionRowBuilder, ComponentType } = require('discord.js');
const path = require('path');
const { safeWriteJson } = require('../liga/utils/helpers.js'); // Usamos o helper

// Caminho para o novo arquivo de configuração de promoção
const promocaoConfigPath = path.join(__dirname, 'promocao_config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('promocao-configurar')
        .setDescription('Define o canal de prints e o cargo necessário para o sistema de patentes.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addChannelOption(option =>
            option.setName('canal-prints')
                .setDescription('O canal onde os prints de vitória são postados.')
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(true)
        )
        .addRoleOption(option =>
            option.setName('cargo-base')
                .setDescription('O cargo que o membro deve ter para ganhar pontos (ex: @Recruta).')
                .setRequired(true)
        ),
    
    async execute(interaction) {
        const canal = interaction.options.getChannel('canal-prints');
        const cargo = interaction.options.getRole('cargo-base');
        
        const configData = {
            printsChannelId: canal.id,
            baseRoleId: cargo.id 
        };

        try {
            safeWriteJson(promocaoConfigPath, configData);
            
            await interaction.reply({
                content: `✅ Sucesso! O sistema de patentes foi configurado:\n` +
                         `• Canal de Prints: ${canal}\n` +
                         `• Cargo Base: ${cargo}`,
                ephemeral: true
            });
        } catch (err) {
            console.error("Erro ao salvar promocao_config.json:", err);
            await interaction.reply({
                content: '❌ Ocorreu um erro ao tentar salvar a configuração.',
                ephemeral: true
            });
        }
    }
};