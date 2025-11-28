/* ========================================================================
   ARQUIVO: commands/economy/duelar.js (COM REGISTRO DE VITÓRIAS)
   ======================================================================== */
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, MessageFlags } = require('discord.js');
const path = require('path');
const { safeReadJson, safeWriteJson } = require('../liga/utils/helpers.js');

const economyPath = path.join(__dirname, 'economy.json');
const statsPath = path.join(__dirname, 'stats.json');
const CANAL_MERCADO = '1441499321810813001';

// ... (Mantenha a const ESTILOS igual à anterior, ou eu copio aqui se preferir) ...
// Vou resumir os estilos para caber, mas você pode manter os seus 9 estilos!
const ESTILOS = {
    war: { nome: '🌍 Batalha WorldWar', cor: '#556b2f', frases: ['🗺️ Analisando o mapa...', '🎲 DADOS VERMELHOS rolando!', '💥 Tanques avançam!'] },
    dados: { nome: '🎲 Dados da Sorte', cor: '#f1c40f', frases: ['🎲 Chacoalhando...', '🎲 Rolando...', '🎲 Um dado parou...'] }
    // ... adicione os outros estilos aqui ...
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
function createBar(value, max = 100) { return '🟩'.repeat(Math.round((value / max) * 10)) + '⬛'.repeat(10 - Math.round((value / max) * 10)); }

module.exports = {
    data: new SlashCommandBuilder()
        .setName('duelar')
        .setDescription('⚔️ Desafie alguém para um duelo.')
        .addUserOption(o => o.setName('oponente').setRequired(true).setDescription('Oponente'))
        .addIntegerOption(o => o.setName('valor').setRequired(true).setDescription('Aposta'))
        .addStringOption(o => o.setName('estilo').setDescription('Estilo').addChoices({ name: '🌍 War', value: 'war' }, { name: '🎲 Dados', value: 'dados' })),

    async execute(interaction) {
        if (interaction.channel.id !== CANAL_MERCADO) return interaction.reply({ content: `❌ Use <#${CANAL_MERCADO}>.`, flags: MessageFlags.Ephemeral });
        const p1 = interaction.user;
        const p2 = interaction.options.getUser('oponente');
        const valor = interaction.options.getInteger('valor');
        const estiloKey = interaction.options.getString('estilo') || 'war';
        const estilo = ESTILOS[estiloKey] || ESTILOS['war'];

        if (p1.id === p2.id || p2.bot || valor <= 0) return interaction.reply({ content: '❌ Dados inválidos.', flags: MessageFlags.Ephemeral });

        const eco = safeReadJson(economyPath);
        if ((eco[p1.id] || 0) < valor || (eco[p2.id] || 0) < valor) return interaction.reply({ content: '❌ Sem dinheiro.', flags: MessageFlags.Ephemeral });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('aceitar').setLabel('ACEITAR').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId('recusar').setLabel('RECUSAR').setStyle(ButtonStyle.Danger)
        );

        const msg = await interaction.reply({ content: `${p2}`, embeds: [new EmbedBuilder().setTitle(estilo.nome).setDescription(`**${p1}** desafiou **${p2}** por **$${valor}**!`).setColor(estilo.cor)], components: [row] });

        const collector = msg.createMessageComponentCollector({ filter: i => i.user.id === p2.id, time: 60000, componentType: ComponentType.Button });

        collector.on('collect', async i => {
            if (i.customId === 'recusar') return i.update({ content: '🏃‍♂️ Recusado.', embeds: [], components: [] });

            const db = safeReadJson(economyPath);
            if ((db[p1.id] || 0) < valor || (db[p2.id] || 0) < valor) return i.update({ content: '❌ Dinheiro sumiu.', components: [] });

            await i.update({ components: [] });
            
            // Drama
            for (const frase of estilo.frases) {
                await msg.edit({ embeds: [new EmbedBuilder().setTitle(estilo.nome).setDescription(frase).setColor(estilo.cor)] });
                await sleep(2000);
            }

            const r1 = Math.floor(Math.random() * 100);
            const r2 = Math.floor(Math.random() * 100);
            let winId = null;

            if (r1 > r2) { winId = p1.id; db[p1.id] += valor; db[p2.id] -= valor; }
            else if (r2 > r1) { winId = p2.id; db[p2.id] += valor; db[p1.id] -= valor; }
            
            // SALVA STATS (VITÓRIAS)
            if (winId) {
                const stats = safeReadJson(statsPath);
                if (!stats[winId]) stats[winId] = { vitorias: 0 };
                stats[winId].vitorias++;
                safeWriteJson(statsPath, stats);
            }
            safeWriteJson(economyPath, db);

            const embed = new EmbedBuilder()
                .setTitle(winId ? `🏆 VITÓRIA DE ${(winId === p1.id ? p1 : p2).username.toUpperCase()}!` : '⚖️ EMPATE')
                .setDescription(`${p1}: **${r1}**\n${p2}: **${r2}**\n\n💰 Valor: $${valor}`)
                .setColor(winId ? 'Green' : 'Grey');
            
            await msg.edit({ embeds: [embed] });
        });
    }
};