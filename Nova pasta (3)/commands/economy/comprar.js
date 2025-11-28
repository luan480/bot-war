const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const path = require('path');
const fs = require('fs');
const { safeReadJson, safeWriteJson } = require('../liga/utils/helpers.js');

const economyPath = path.join(__dirname, 'economy.json');
const inventoryPath = path.join(__dirname, 'inventario.json'); // Novo arquivo de inventário
const itensPath = path.join(__dirname, 'itens.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('comprar')
        .setDescription('🛒 Compra um item da loja.')
        .addStringOption(option => 
            option.setName('item')
                .setDescription('O ID do item (veja na /loja)')
                .setRequired(true)
        ),

    async execute(interaction) {
        const itemId = interaction.options.getString('item').toLowerCase();
        const userId = interaction.user.id;

        // Carrega dados
        const itens = JSON.parse(fs.readFileSync(itensPath, 'utf8'));
        const economy = safeReadJson(economyPath);
        const inventory = safeReadJson(inventoryPath);

        // 1. Verifica se o item existe
        const itemAlvo = itens.find(i => i.id === itemId);
        if (!itemAlvo) {
            return interaction.reply({ content: '❌ Item não encontrado. Verifique o ID na `/loja`.', ephemeral: true });
        }

        // 2. Verifica saldo
        const saldoAtual = economy[userId] || 0;
        if (saldoAtual < itemAlvo.preco) {
            return interaction.reply({ content: `❌ Você não tem WarCoins suficientes. Faltam **$${itemAlvo.preco - saldoAtual}**.`, ephemeral: true });
        }

        // 3. Processa a Compra (Atomicamente, graças ao helpers.js)
        // Retira dinheiro
        economy[userId] -= itemAlvo.preco;
        
        // Adiciona ao inventário
        if (!inventory[userId]) inventory[userId] = {};
        inventory[userId][itemId] = (inventory[userId][itemId] || 0) + 1;

        // Salva tudo
        safeWriteJson(economyPath, economy);
        safeWriteJson(inventoryPath, inventory);

        const embed = new EmbedBuilder()
            .setTitle('✅ Compra Realizada!')
            .setDescription(`Você comprou **${itemAlvo.nome}** por **$${itemAlvo.preco}**.`)
            .setColor('#2ecc71')
            .setFooter({ text: `Novo saldo: $${economy[userId]}` });

        await interaction.reply({ embeds: [embed] });
    }
};