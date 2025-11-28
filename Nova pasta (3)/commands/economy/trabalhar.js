const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const path = require('path');
const { safeReadJson, safeWriteJson } = require('../liga/utils/helpers.js');

const economyPath = path.join(__dirname, 'economy.json');
const cooldownsPath = path.join(__dirname, 'cooldowns.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('trabalhar')
        .setDescription('🔨 Trabalha para ganhar alguns trocados honestos.'),

    async execute(interaction) {
        const userId = interaction.user.id;
        const agora = Date.now();
        const tempoEspera = 60 * 60 * 1000; // 1 Hora

        const cooldowns = safeReadJson(cooldownsPath);
        const lastWork = cooldowns[userId]?.trabalho || 0;

        // Verifica Cooldown
        if (agora - lastWork < tempoEspera) {
            const restante = tempoEspera - (agora - lastWork);
            const minutos = Math.floor(restante / 60000);
            const segundos = Math.floor((restante % 60000) / 1000);
            
            return interaction.reply({ 
                content: `⏳ **Descance um pouco!** Você poderá trabalhar novamente em **${minutos}m ${segundos}s**.`, 
                ephemeral: true 
            });
        }

        // Trabalhos Aleatórios
        const trabalhos = [
            { texto: "ajudou a carregar caixas de munição", valor: 150 },
            { texto: "limpou o convés do porta-aviões", valor: 120 },
            { texto: "consertou o rádio da base", valor: 200 },
            { texto: "cozinhou para o batalhão", valor: 180 },
            { texto: "fez patrulha noturna", valor: 250 },
            { texto: "engraxou as botas do general", valor: 100 }
        ];

        const trampo = trabalhos[Math.floor(Math.random() * trabalhos.length)];
        
        // Salva Cooldown
        if (!cooldowns[userId]) cooldowns[userId] = {};
        cooldowns[userId].trabalho = agora;
        safeWriteJson(cooldownsPath, cooldowns);

        // Paga
        const economy = safeReadJson(economyPath);
        economy[userId] = (economy[userId] || 0) + trampo.valor;
        safeWriteJson(economyPath, economy);

        const embed = new EmbedBuilder()
            .setColor('#3498db')
            .setDescription(`🔨 Você **${trampo.texto}** e recebeu **${trampo.valor} WC**.`);

        await interaction.reply({ embeds: [embed] });
    }
};