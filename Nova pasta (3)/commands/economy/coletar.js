/* ========================================================================
   ARQUIVO: commands/economy/coletar.js (ATUALIZADO E SEGURO)
   ======================================================================== */
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const path = require('path');
// Importa suas funções de leitura segura
const { safeReadJson, safeWriteJson } = require('../liga/utils/helpers.js'); 

const economyPath = path.join(__dirname, 'economy.json');
const cooldownsPath = path.join(__dirname, 'cooldowns.json');
const progressaoPath = path.join(__dirname, '../promocao/progressao.json');
const carreirasPath = path.join(__dirname, '../promocao/carreiras.json');

const CANAL_MERCADO = '1441499321810813001'; 

module.exports = {
    data: new SlashCommandBuilder()
        .setName('coletar')
        .setDescription('📅 Recebe seu pagamento diário militar.'),

    async execute(interaction) {
        // 1. Verifica Canal
        if (CANAL_MERCADO && interaction.channel.id !== CANAL_MERCADO) {
            return interaction.reply({ 
                content: `❌ **Local errado!** Vá para <#${CANAL_MERCADO}>.`, 
                ephemeral: true 
            });
        }

        const userId = interaction.user.id;
        
        // 2. Leitura dos Dados
        // safeReadJson usa fs.readFileSync, que é síncrono e evita erros de leitura
        const cooldowns = safeReadJson(cooldownsPath);
        const lastDaily = cooldowns[userId]?.diario || 0;
        const agora = Date.now();
        const tempoEspera = 24 * 60 * 60 * 1000;

        // 3. Verifica Tempo
        if (agora - lastDaily < tempoEspera) {
            const restante = tempoEspera - (agora - lastDaily);
            const horas = Math.floor(restante / 3600000);
            const minutos = Math.floor((restante % 3600000) / 60000);
            const segundos = Math.floor((restante % 60000) / 1000);
            
            return interaction.reply({ 
                content: `⏳ **Já recebeu!** Volte em: **${horas}h ${minutos}m ${segundos}s**.`, 
                ephemeral: true 
            });
        }

        // 4. Salva o Cooldown PRIMEIRO (Antes de tudo)
        if (!cooldowns[userId]) cooldowns[userId] = {};
        cooldowns[userId].diario = agora;
        safeWriteJson(cooldownsPath, cooldowns);

        // 5. Calcula o Salário
        const progressao = safeReadJson(progressaoPath);
        const carreiras = safeReadJson(carreirasPath);
        
        let salario = 500; 
        let nomePatente = "Recruta";

        const userProg = progressao[userId];
        if (userProg && userProg.factionId && userProg.currentRankId) {
            const faccao = carreiras.faccoes[userProg.factionId];
            if (faccao) {
                const rankObj = faccao.caminho.find(r => r.id === userProg.currentRankId);
                if (rankObj) {
                    nomePatente = rankObj.nome;
                    salario = 500 + (rankObj.custo * 50);
                }
            }
        }

        // 6. Entrega o Dinheiro
        // Relê a economia para garantir que não sobrescrevemos transações recentes
        const economy = safeReadJson(economyPath);
        economy[userId] = (economy[userId] || 0) + salario;
        safeWriteJson(economyPath, economy);

        const embed = new EmbedBuilder()
            .setColor('#2ecc71')
            .setTitle('💸 PAGAMENTO RECEBIDO')
            .setDescription(
                `🎖️ **Patente:** ${nomePatente}\n` +
                `💰 **Valor:** \`${salario} WC\`\n` +
                `🏦 **Novo Saldo:** \`${economy[userId]} WC\``
            )
            .setFooter({ text: 'Volte amanhã!', iconURL: interaction.user.displayAvatarURL() });

        await interaction.reply({ embeds: [embed] });
    }
};