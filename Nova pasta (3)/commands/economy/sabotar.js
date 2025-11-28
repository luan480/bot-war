const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const path = require('path');
const { safeReadJson, safeWriteJson } = require('../liga/utils/helpers.js');

const economyPath = path.join(__dirname, 'economy.json');
const cooldownsPath = path.join(__dirname, 'cooldowns.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('sabotar')
        .setDescription('🔫 Tenta realizar um crime ou sabotagem (Risco alto!).'),

    async execute(interaction) {
        const userId = interaction.user.id;
        const agora = Date.now();
        const tempoEspera = 3 * 60 * 60 * 1000; // 3 Horas de espera

        const cooldowns = safeReadJson(cooldownsPath);
        const lastCrime = cooldowns[userId]?.crime || 0;

        // Verifica Cooldown
        if (agora - lastCrime < tempoEspera) {
            const restante = tempoEspera - (agora - lastCrime);
            const horas = Math.floor(restante / 3600000);
            const minutos = Math.floor((restante % 3600000) / 60000);
            
            return interaction.reply({ 
                content: `🚓 **A polícia está na cola!** Esconda-se por mais **${horas}h ${minutos}m** antes de tentar outro crime.`, 
                ephemeral: true 
            });
        }

        const economy = safeReadJson(economyPath);
        const saldo = economy[userId] || 0;

        if (saldo < 200) {
            return interaction.reply({ content: "❌ Você precisa de pelo menos **200 WC** para comprar equipamentos para o crime.", ephemeral: true });
        }

        // Salva Cooldown AGORA (Se der sucesso ou falha, o tempo conta igual)
        if (!cooldowns[userId]) cooldowns[userId] = {};
        cooldowns[userId].crime = agora;
        safeWriteJson(cooldownsPath, cooldowns);

        // Lógica de Sorte (40% de chance de sucesso)
        const sucesso = Math.random() < 0.4;

        if (sucesso) {
            const lucro = Math.floor(Math.random() * 800) + 400; // Ganha entre 400 e 1200
            economy[userId] = saldo + lucro;
            safeWriteJson(economyPath, economy);

            const embed = new EmbedBuilder()
                .setColor('#e74c3c')
                .setTitle('🔫 SUCE$$O!')
                .setDescription(`Você realizou uma sabotagem perfeita e lucrou **${lucro} WC**!`);
            
            return interaction.reply({ embeds: [embed] });

        } else {
            const multa = Math.floor(Math.random() * 200) + 200; // Perde entre 200 e 400
            economy[userId] = Math.max(0, saldo - multa);
            safeWriteJson(economyPath, economy);

            const embed = new EmbedBuilder()
                .setColor('#000000')
                .setTitle('👮 PRESO!')
                .setDescription(`A operação falhou! Você teve que subornar os guardas e perdeu **${multa} WC**.`);
            
            return interaction.reply({ embeds: [embed] });
        }
    }
};