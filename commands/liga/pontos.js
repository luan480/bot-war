const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');
// IMPORTAÇÃO ATUALIZADA: Agora usa o helper
const { safeReadJson, safeWriteJson } = require('./utils/helpers.js');

// REMOVIDO: A função 'safeReadWriteJson' foi removida daqui
// pois agora usamos as funções do 'helpers.js'

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pontos')
        .setDescription('Gerencia os pontos dos competidores pelo nome.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(subcommand =>
            subcommand.setName('adicionar').setDescription('Adiciona pontos a um jogador.')
                .addStringOption(opt => opt.setName('nome').setDescription('Nome do jogador').setRequired(true))
                .addIntegerOption(opt => opt.setName('quantidade').setDescription('Pontos a adicionar').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand.setName('remover').setDescription('Remove pontos de um jogador.')
                .addStringOption(opt => opt.setName('nome').setDescription('Nome do jogador').setRequired(true))
                .addIntegerOption(opt => opt.setName('quantidade').setDescription('Pontos a remover').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand.setName('definir').setDescription('Define o total de pontos de um jogador.')
                .addStringOption(opt => opt.setName('nome').setDescription('Nome do jogador').setRequired(true))
                .addIntegerOption(opt => opt.setName('quantidade').setDescription('Total de pontos').setRequired(true))
        ),
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const nomeJogador = interaction.options.getString('nome').toLowerCase();
        const quantidade = interaction.options.getInteger('quantidade');
        const pontosPath = path.join(__dirname, 'pontuacao.json');

        // LÓGICA ATUALIZADA: Lê o arquivo
        const ranking = safeReadJson(pontosPath);
        if (ranking === null) {
            return interaction.reply({ content: '❌ Erro ao ler o arquivo de pontuação.', ephemeral: true });
        }

        const pontosAtuais = ranking[nomeJogador] || 0;
        let novoTotal;
        let replyMessage;

        // Capitaliza o nome apenas para a resposta
        const nomeCapitalizado = nomeJogador.charAt(0).toUpperCase() + nomeJogador.slice(1);

        if (subcommand === 'adicionar') {
            novoTotal = pontosAtuais + quantidade;
            replyMessage = `✅ **${quantidade}** pontos adicionados para **${nomeCapitalizado}**. Novo total: **${novoTotal}** pts.`;
        } else if (subcommand === 'remover') {
            novoTotal = pontosAtuais - quantidade;
            replyMessage = `✅ **${quantidade}** pontos removidos de **${nomeCapitalizado}**. Novo total: **${novoTotal}** pts.`;
        } else if (subcommand === 'definir') {
            novoTotal = quantidade;
            replyMessage = `✅ Pontos de **${nomeCapitalizado}** definidos para **${novoTotal}** pts.`;
        }

        ranking[nomeJogador] = novoTotal;

        // LÓGICA ATUALIZADA: Escreve no arquivo
        try {
            safeWriteJson(pontosPath, ranking);
            await interaction.reply({ content: replyMessage, ephemeral: false });
        } catch (err) {
            console.error("Erro ao salvar pontuação:", err);
            await interaction.reply({ content: '❌ Erro ao salvar o arquivo de pontuação.', ephemeral: true });
        }
    }
};