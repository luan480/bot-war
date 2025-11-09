/* commands/adm/carreiraButtonHandler.js (NOVO) */

const { EmbedBuilder } = require('discord.js');
const path = require('path');
const { safeReadJson } = require('../liga/utils/helpers.js');

const carreirasPath = path.join(__dirname, 'carreiras.json');
const progressaoPath = path.join(__dirname, 'progressao.json');

module.exports = async (interaction) => {
    // Responde ao usuário (só ele vê)
    await interaction.deferReply({ ephemeral: true });

    // Pega o ID do usuário a partir do ID do botão (ex: 'carreira_status_12345')
    const userId = interaction.customId.split('_')[2]; 

    // Busca o usuário no servidor (precisamos dos dados dele)
    const member = await interaction.guild.members.fetch(userId).catch(() => null);
    if (!member) {
        return interaction.editReply({ content: '❌ Erro: Não consegui encontrar o membro original desta promoção.' });
    }

    const carreirasConfig = safeReadJson(carreirasPath);
    const progressao = safeReadJson(progressaoPath);
    const userProgress = progressao[userId];

    if (!userProgress) {
        return interaction.editReply({ 
            content: '❌ Este usuário ainda não tem um registro de progresso.'
        });
    }

    const faccaoId = userProgress.factionId;
    const faccao = carreirasConfig.faccoes[faccaoId];

    if (!faccao) {
        return interaction.editReply({ content: '❌ Erro: Não consegui encontrar a facção deste usuário.' });
    }

    // --- Lógica do Status (A mesma do seu comando /carreira status) ---
    const totalWins = userProgress.totalWins;
    let currentRankName = "• Recruta";
    let nextRankName = "N/A";
    let progressString = "Patente Máxima Atingida! Parabéns!";
    let custoPatenteAtual = 0;

    if (userProgress.currentRankId) {
        const rankAtual = faccao.caminho.find(r => r.id === userProgress.currentRankId);
        currentRankName = rankAtual.nome;
        custoPatenteAtual = rankAtual.custo;
    }

    const rankAtualIndex = userProgress.currentRankId 
        ? faccao.caminho.findIndex(r => r.id === userProgress.currentRankId) 
        : -1; 
    
    if (rankAtualIndex < faccao.caminho.length - 1) {
        const proximoCargo = faccao.caminho[rankAtualIndex + 1];
        nextRankName = proximoCargo.nome;
        const winsNecessarias = proximoCargo.custo;
        const winsFaltando = winsNecessarias - totalWins;
        const custoPatenteProxima = proximoCargo.custo;
        const winsNestaEtapa = custoPatenteProxima - custoPatenteAtual;
        const winsAtuaisNestaEtapa = totalWins - custoPatenteAtual;
        let percent = 0;
        if (winsNestaEtapa > 0) {
            percent = Math.floor((winsAtuaisNestaEtapa / winsNestaEtapa) * 10);
        }
        if (percent > 10) percent = 10;
        
        const barra = '■'.repeat(percent) + '□'.repeat(10 - percent);
        progressString = `**${winsFaltando} vitórias** para a próxima patente.\n${barra} (${totalWins} / ${winsNecessarias} totais)`;
    }
    
    const embed = new EmbedBuilder()
        .setColor('#F1C40F') 
        .setAuthor({ name: `Status de Carreira: ${member.user.username}`, iconURL: member.user.displayAvatarURL() })
        .setThumbnail(interaction.guild.iconURL())
        .addFields(
            { name: "Facção", value: faccao.nome, inline: true },
            { name: "Patente Atual", value: currentRankName, inline: true },
            { name: "Total de Vitórias", value: `🏆 ${totalWins}`, inline: true },
            { name: "Próxima Meta", value: nextRankName, inline: false },
            { name: "Progresso", value: progressString, inline: false }
        )
        .setTimestamp();
    
    // Envia o embed de forma privada
    await interaction.editReply({
        content: `Este é o status atual de **${member.displayName}**:`,
        embeds: [embed]
    });
};