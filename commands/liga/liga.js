const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
// Ele agora vai importar o 'painel.js' atualizado, mas este arquivo não precisa mudar
const painel = require('./painel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('liga')
        .setDescription('Comandos de gerenciamento da Liga.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(subcommand =>
            subcommand
                .setName('painel')
                .setDescription('Cria ou atualiza o painel de controle da Liga.')
                .addChannelOption(option =>
                    option.setName('canal')
                        .setDescription('O canal onde o painel será criado.')
                        .addChannelTypes(ChannelType.GuildText)
                        .setRequired(true)
                )
        ),
    async execute(interaction) {
        if (interaction.options.getSubcommand() === 'painel') {
            const canal = interaction.options.getChannel('canal');
            await interaction.deferReply({ ephemeral: true });

            try {
                // Chama a função que está no 'painel.js'
                await painel.criarPainelDashboard(interaction.guild, canal.id);
                await interaction.editReply(`✅ Painel criado com sucesso no canal ${canal}!`);
            } catch (err) {
                console.error('Erro ao criar painel via comando:', err);
                await interaction.editReply('❌ Ocorreu um erro ao tentar criar o painel. Verifique se tenho permissões para ver e enviar mensagens no canal de destino.');
            }
        }
    }
};