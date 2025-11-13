/* ========================================================================
   ARQUIVO: commands/adm/promocao-configurar.js (NOVO)
   
   - Comando para configurar o sistema de promoção de patentes.
   - Salva em 'promocao_config.json'.
   - [MUDANÇA] Remove a opção de 'cargo-base' pois já lemos
     isso do 'carreiras.json'.
   ======================================================================== */

const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const path = require('path');
// Importa o helper local de ADM
const { safeWriteJson } = require('./carreiraHelpers.js'); 

// Caminho para o novo arquivo de configuração de promoção
const promocaoConfigPath = path.join(__dirname, 'promocao_config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('promocao-configurar')
        .setDescription('Define o canal de prints para o sistema de patentes.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addChannelOption(option =>
            option.setName('canal-prints')
                .setDescription('O canal onde os prints de vitória são postados.')
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(true)
        ),
    
    async execute(interaction) {
        const canal = interaction.options.getChannel('canal-prints');
        
        const configData = {
            printsChannelId: canal.id
        };

        try {
            // Usa o helper local
            safeWriteJson(promocaoConfigPath, configData);
            
            await interaction.reply({
                content: `✅ Sucesso! O sistema de patentes foi configurado:\n` +
                         `• Canal de Prints: ${canal}\n`,
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