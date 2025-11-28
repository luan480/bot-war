/* ========================================================================
   ARQUIVO: commands/promocao/historicoHandler.js
   DESCRIÇÃO: Mostra o histórico baseado no botão clicado
   ======================================================================== */

const { EmbedBuilder, MessageFlags } = require('discord.js');
const path = require('path');
const { safeReadJson } = require('../liga/utils/helpers.js'); 

const historicoPath = path.join(__dirname, 'historico.json');

module.exports = async (interaction, client) => {
    const id = interaction.customId;
    
    // Verifica se é botão de histórico
    if (!id.startsWith('hist_')) return;

    const dados = safeReadJson(historicoPath);
    let titulo = "";
    let descricaoArray = [];
    let cor = "";

    if (id === 'hist_liga') {
        titulo = "🏆 HISTÓRICO DA LIGA";
        descricaoArray = dados.liga;
        cor = "#3498db"; // Azul
    } 
    else if (id === 'hist_imperador') {
        titulo = "👑 IMPERADORES DO MÊS";
        descricaoArray = dados.imperador;
        cor = "#f1c40f"; // Amarelo
    }
    else if (id === 'hist_eventos') {
        titulo = "⚔️ CAMPEÕES DE EVENTOS";
        descricaoArray = dados.eventos;
        cor = "#95a5a6"; // Cinza
    }
    else if (id === 'hist_records') {
        titulo = "📊 RECORDS DO SERVIDOR";
        descricaoArray = dados.records;
        cor = "#e74c3c"; // Vermelho
    }

    // Se tiver o destaque (campeão do 1º camp), adiciona no topo
    let textoFinal = "";
    if (dados.destaque && (id === 'hist_liga' || id === 'hist_records')) {
        textoFinal += `${dados.destaque}\n\n`;
    }
    
    textoFinal += descricaoArray.join('\n');

    const embed = new EmbedBuilder()
        .setTitle(titulo)
        .setDescription(textoFinal)
        .setColor(cor)
        .setFooter({ text: 'Histórico WarGrow', iconURL: interaction.guild.iconURL() });

    // Responde só para quem clicou (Ephemeral)
    await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
};