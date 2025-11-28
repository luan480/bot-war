const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const path = require('path');
const fs = require('fs');
const { safeReadJson } = require('../liga/utils/helpers.js');

const inventoryPath = path.join(__dirname, 'inventario.json');
const itensPath = path.join(__dirname, 'itens.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('inventario')
        .setDescription('🎒 Mostra seus itens adquiridos.')
        .addUserOption(op => op.setName('usuario').setDescription('Ver inventário de outro soldado?')),

    async execute(interaction) {
        const target = interaction.options.getUser('usuario') || interaction.user;
        const inventory = safeReadJson(inventoryPath);
        const itensDb = JSON.parse(fs.readFileSync(itensPath, 'utf8'));

        const userInv = inventory[target.id] || {};
        const itemIds = Object.keys(userInv);

        if (itemIds.length === 0) {
            return interaction.reply({ content: `🎒 **${target.username}** não possui nenhum item.`, ephemeral: true });
        }

        const lista = itemIds.map(id => {
            const qtd = userInv[id];
            if (qtd <= 0) return null;
            const info = itensDb.find(i => i.id === id);
            const nome = info ? info.nome : id; // Se achar o nome bonito usa, senão usa o ID
            return `**${qtd}x** ${nome}`;
        }).filter(x => x).join('\n');

        const embed = new EmbedBuilder()
            .setTitle(`🎒 Mochila de ${target.username}`)
            .setDescription(lista || "Mochila vazia.")
            .setColor('#3498db')
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};