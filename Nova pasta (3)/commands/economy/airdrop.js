/* ========================================================================
   ARQUIVO: commands/economy/airdrop.js
   DESCRIÇÃO: Lança uma caixa de suprimentos. Primeiro a clicar ganha.
   ======================================================================== */
const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const path = require('path');
const { safeReadJson, safeWriteJson } = require('../liga/utils/helpers.js');

const economyPath = path.join(__dirname, 'economy.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('evento-airdrop')
        .setDescription('✈️ (Admin) Lança uma caixa de suprimentos no chat atual.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator) // Só admin usa
        .addIntegerOption(op => op.setName('valor').setDescription('Quanto vem na caixa?').setRequired(true)),

    async execute(interaction) {
        const valor = interaction.options.getInteger('valor');
        
        await interaction.reply({ content: '✈️ Airdrop lançado!', ephemeral: true });

        const botao = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('pegar_airdrop')
                .setLabel('PEGAR SUPRIMENTOS')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('📦')
        );

        const embed = new EmbedBuilder()
            .setTitle('✈️ AIRDROP NO AR!')
            .setDescription(`Um avião de carga derrubou uma caixa!\n\n💰 **Conteúdo:** $${valor} WarCoins\n⏱️ **Rápido! Clique abaixo!**`)
            .setColor('#3498db')
            .setImage('https://media.tenor.com/J99a2gXy3GgAAAAC/pubg-crate.gif'); // Gif de caixa caindo

        const msg = await interaction.channel.send({ content: '@here CAIXA CAINDO!', embeds: [embed], components: [botao] });

        // Cria coletor para o primeiro clique
        const filter = i => i.customId === 'pegar_airdrop';
        const collector = msg.createMessageComponentCollector({ filter, max: 1, time: 600000 }); // 10 min max

        collector.on('collect', async i => {
            const ganhador = i.user;

            // Entrega o prêmio
            const economy = safeReadJson(economyPath);
            economy[ganhador.id] = (economy[ganhador.id] || 0) + valor;
            safeWriteJson(economyPath, economy);

            const embedWin = new EmbedBuilder()
                .setTitle('📦 AIRDROP RESGATADO!')
                .setDescription(`🏆 **${ganhador.username}** foi mais rápido e pegou a caixa!\n💰 **Ganhou:** $${valor}`)
                .setColor('#2ecc71')
                .setTimestamp();

            await i.update({ embeds: [embedWin], components: [] });
        });
    }
};