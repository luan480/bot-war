const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const path = require('path');
const { safeReadJson } = require('../liga/utils/helpers.js');

const carreirasPath = path.join(__dirname, 'carreiras.json');
const economyPath = path.join(__dirname, '..', 'economy', 'economy.json');
const statsPath = path.join(__dirname, '..', 'economy', 'stats.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('painel-status')
        .setDescription('📈 Vê sua ficha militar e medalhas.'),

    async execute(interaction) {
        const userId = interaction.user.id;
        const member = interaction.member;

        const carreiras = safeReadJson(carreirasPath);
        const economy = safeReadJson(economyPath);
        const stats = safeReadJson(statsPath);

        const dados = carreiras[userId] || { xp: 0, patente: "Recruta" };
        const saldo = economy[userId] || 0;
        const vitorias = stats[userId]?.vitorias || 0;

        // === LÓGICA DE MEDALHAS ===
        let medalhas = [];

        // 1. Veterano (1 Ano de servidor)
        const umAno = 365 * 24 * 60 * 60 * 1000;
        if (Date.now() - member.joinedTimestamp > umAno) {
            medalhas.push("👴 **Veterano de Guerra** (1+ Ano)");
        }

        // 2. Milionário (1 Milhão de WarCoins)
        if (saldo >= 1000000) {
            medalhas.push("💎 **Magnata de Guerra** (Milionário)");
        }

        // 3. Duelista (50 Vitórias)
        if (vitorias >= 50) {
            medalhas.push("⚔️ **Mestre das Armas** (50+ Vitórias)");
        }

        const listaMedalhas = medalhas.length > 0 ? medalhas.join('\n') : "*Nenhuma condecoração ainda.*";

        const embed = new EmbedBuilder()
            .setTitle(`🪖 Ficha Militar: ${interaction.user.username}`)
            .setColor('#556b2f')
            .setThumbnail(interaction.user.displayAvatarURL())
            .addFields(
                { name: '🎖️ Patente', value: dados.patente, inline: true },
                { name: '⭐ XP', value: `${dados.xp}`, inline: true },
                { name: '💰 Fortuna', value: `$${saldo}`, inline: true },
                { name: '⚔️ Duelos Vencidos', value: `${vitorias}`, inline: true },
                { name: '🎖️ Condecorações', value: listaMedalhas, inline: false }
            )
            .setFooter({ text: `Entrou no batalhão em: ${member.joinedAt.toLocaleDateString('pt-BR')}` });

        await interaction.reply({ embeds: [embed] });
    }
};