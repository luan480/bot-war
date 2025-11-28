const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const path = require('path');
const fs = require('fs');

const itensPath = path.join(__dirname, 'itens.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('loja')
        .setDescription('🏪 Abre o mercado de cargos e patentes.'),

    async execute(interaction) {
        const itens = JSON.parse(fs.readFileSync(itensPath, 'utf8'));

        const embed = new EmbedBuilder()
            .setTitle('🏪 Mercado de Patentes - WorldWarBR')
            .setDescription('Use seus WarCoins para comprar acesso e status no servidor.')
            .setColor('#556b2f') // Verde Militar
            .setThumbnail('https://cdn-icons-png.flaticon.com/512/2435/2435281.png');

        if (itens.length === 0) {
            embed.setDescription('A loja está vazia no momento. Volte mais tarde!');
        } else {
            itens.forEach(item => {
                // Tenta pegar o nome real do cargo se possível, senão usa o do JSON
                const role = interaction.guild.roles.cache.get(item.roleId);
                const nomeExibicao = role ? role.name : item.nome;

                embed.addFields({
                    name: `${item.nome} — 💰 $${item.preco}`,
                    value: `📝 ${item.descricao}\n🆔 Comprar: \`/comprar item:${item.id}\``,
                    inline: false
                });
            });
        }

        await interaction.reply({ embeds: [embed] });
    }
};