/* ========================================================================
   ARQUIVO: commands/adm/carreira.js (VERSÃO ADMIN)
   
   - Adiciona comandos de admin:
     /carreira setar-vitorias
     /carreira adicionar-vitorias
     /carreira resetar
   ======================================================================== */

const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const path = require('path');
const { safeReadJson, safeWriteJson } = require('../liga/utils/helpers.js');

const carreirasPath = path.join(__dirname, 'carreiras.json');
const progressaoPath = path.join(__dirname, 'progressao.json');


/**
 * Função auxiliar para recalcular e aplicar o cargo de um membro com base em suas vitórias.
 * @param {import('discord.js').GuildMember} member - O membro do servidor.
 * @param {object} faccao - O objeto da facção do carreiras.json.
 * @param {object} userProgress - O objeto de progresso do progressao.json.
 * @param {string} cargoRecrutaId - O ID do cargo de Recruta.
 */
async function recalcularRank(member, faccao, userProgress, cargoRecrutaId) {
    const totalWins = userProgress.totalWins;
    let novoCargo = null; // O cargo mais alto que ele merece

    // Loop do mais alto para o mais baixo
    for (let i = faccao.caminho.length - 1; i >= 0; i--) {
        const rank = faccao.caminho[i];
        if (totalWins >= rank.custo) {
            novoCargo = rank;
            break; // Achamos o cargo mais alto
        }
    }

    const cargoAtualId = userProgress.currentRankId;

    if (novoCargo && cargoAtualId === novoCargo.id) {
        return; // Já está com o cargo correto
    }

    // Se ele não merece nenhum cargo (ex: 0 vitórias) e já tem um, remove.
    if (!novoCargo && cargoAtualId) {
        await member.roles.remove(cargoAtualId);
        userProgress.currentRankId = null;
        return;
    }
    
    // Se ele merece um novo cargo
    if (novoCargo) {
        const cargosParaRemover = [cargoRecrutaId];
        // Remove todos os outros cargos da facção (para o caso de um rebaixamento)
        for (const rank of faccao.caminho) {
            if (rank.id !== novoCargo.id) { // Não remove o cargo que ele vai ganhar
                cargosParaRemover.push(rank.id);
            }
        }
        
        await member.roles.remove(cargosParaRemover.filter(id => id && member.roles.cache.has(id)));
        await member.roles.add(novoCargo.id);
        
        userProgress.currentRankId = novoCargo.id;
    }
}


module.exports = {
    // 1. Definição do Comando
    data: new SlashCommandBuilder()
        .setName('carreira')
        .setDescription('Comandos do sistema de progressão de carreira.')
        
        // --- COMANDO PÚBLICO ---
        .addSubcommand(subcommand =>
            subcommand
                .setName('status')
                .setDescription('Posta seu status de vitórias e patente no canal da sua facção.')
        )

        // --- COMANDOS DE ADMIN ---
        .addSubcommand(subcommand =>
            subcommand
                .setName('setar-vitorias')
                .setDescription('[ADMIN] Define o total de vitórias de um jogador e corrige sua patente.')
                .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
                .addUserOption(option => option.setName('usuario').setDescription('O membro que você quer modificar.').setRequired(true))
                .addIntegerOption(option => option.setName('quantidade').setDescription('O número total de vitórias.').setRequired(true).setMinValue(0))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('adicionar-vitorias')
                .setDescription('[ADMIN] Adiciona vitórias (bônus) a um jogador e o promove se necessário.')
                .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
                .addUserOption(option => option.setName('usuario').setDescription('O membro que você quer modificar.').setRequired(true))
                .addIntegerOption(option => option.setName('quantidade').setDescription('O número de vitórias para adicionar.').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('resetar')
                .setDescription('[ADMIN] Zera o progresso (vitórias e patente) de um jogador.')
                .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
                .addUserOption(option => option.setName('usuario').setDescription('O membro que você quer resetar.').setRequired(true))
        ),
    
    // 2. Lógica de Execução
    async execute(interaction) {
        
        const subcommand = interaction.options.getSubcommand();
        const carreirasConfig = safeReadJson(carreirasPath);
        const progressao = safeReadJson(progressaoPath);

        // --- LÓGICA DO /carreira status (Público) ---
        if (subcommand === 'status') {
            await interaction.deferReply({ ephemeral: true });
            const userId = interaction.user.id;
            const member = interaction.member;
            const userProgress = progressao[userId];
            if (!userProgress) {
                return interaction.editReply({ content: '❌ Você ainda não registrou nenhuma vitória. Poste seu primeiro print no canal 📸・prints para começar!', ephemeral: true });
            }
            const faccaoId = userProgress.factionId;
            const faccao = carreirasConfig.faccoes[faccaoId];
            if (!faccao) {
                return interaction.editReply({ content: '❌ Erro: Não consegui encontrar sua facção no sistema.', ephemeral: true });
            }
            const canalDeAnuncio = await interaction.client.channels.fetch(faccao.canalDeAnuncio).catch(() => null);
            if (!canalDeAnuncio) {
                return interaction.editReply({ content: `❌ Erro: Não encontrei o canal de status da sua facção (${faccao.nome}).`, ephemeral: true });
            }
            const totalWins = userProgress.totalWins;
            let currentRankName = "• Recruta"; let nextRankName = "N/A";
            let progressString = "Patente Máxima Atingida! Parabéns!"; let custoPatenteAtual = 0;
            if (userProgress.currentRankId) {
                const rankAtual = faccao.caminho.find(r => r.id === userProgress.currentRankId);
                currentRankName = rankAtual.nome; custoPatenteAtual = rankAtual.custo;
            }
            const rankAtualIndex = userProgress.currentRankId ? faccao.caminho.findIndex(r => r.id === userProgress.currentRankId) : -1; 
            if (rankAtualIndex < faccao.caminho.length - 1) {
                const proximoCargo = faccao.caminho[rankAtualIndex + 1];
                nextRankName = proximoCargo.nome; const winsNecessarias = proximoCargo.custo;
                const winsFaltando = winsNecessarias - totalWins; const custoPatenteProxima = proximoCargo.custo;
                const winsNestaEtapa = custoPatenteProxima - custoPatenteAtual; const winsAtuaisNestaEtapa = totalWins - custoPatenteAtual;
                let percent = 0; if (winsNestaEtapa > 0) { percent = Math.floor((winsAtuaisNestaEtapa / winsNestaEtapa) * 10); }
                if (percent > 10) percent = 10; const barra = '■'.repeat(percent) + '□'.repeat(10 - percent);
                progressString = `**${winsFaltando} vitórias** para a próxima patente.\n${barra} (${totalWins} / ${winsNecessarias} totais)`;
            }
            const embed = new EmbedBuilder()
                .setColor('#F1C40F').setAuthor({ name: `Status de Carreira: ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() })
                .setThumbnail(interaction.guild.iconURL())
                .addFields(
                    { name: "Facção", value: faccao.nome, inline: true }, { name: "Patente Atual", value: currentRankName, inline: true },
                    { name: "Total de Vitórias", value: `🏆 ${totalWins}`, inline: true }, { name: "Próxima Meta", value: nextRankName, inline: false },
                    { name: "Progresso", value: progressString, inline: false }
                ).setTimestamp();
            await canalDeAnuncio.send({ content: `📊 ${interaction.user}, aqui está seu status de carreira!`, embeds: [embed] });
            await interaction.editReply({ content: `✅ Seu status foi postado com sucesso no canal ${canalDeAnuncio}!`, ephemeral: true });
            return;
        }

        /* ==================================================================
           LÓGICA DOS COMANDOS DE ADMIN
           ================================================================== */
        
        await interaction.deferReply({ ephemeral: true });
        const targetUser = interaction.options.getUser('usuario');
        const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
        const quantidade = interaction.options.getInteger('quantidade');
        
        if (!targetMember) {
            return interaction.editReply({ content: '❌ Não foi possível encontrar este membro no servidor.' });
        }
        
        const userId = targetUser.id;
        
        // --- LÓGICA /carreira resetar ---
        if (subcommand === 'resetar') {
            if (!progressao[userId]) {
                return interaction.editReply({ content: 'ℹ️ Este usuário não possui nenhum progresso para resetar.' });
            }
            
            const faccaoId = progressao[userId].factionId;
            const faccao = carreirasConfig.faccoes[faccaoId];
            
            // Remove todas as patentes da facção
            const cargosParaRemover = faccao.caminho.map(rank => rank.id);
            await targetMember.roles.remove(cargosParaRemover.filter(id => id && targetMember.roles.cache.has(id)));
            
            // Adiciona o cargo Recruta de volta
            await targetMember.roles.add(carreirasConfig.cargoRecrutaId);
            
            // Deleta o registro do usuário
            delete progressao[userId];
            safeWriteJson(progressaoPath, progressao);
            
            return interaction.editReply({ content: `✅ Sucesso! O progresso de ${targetUser} foi resetado. Ele foi movido de volta para Recruta.` });
        }

        // --- LÓGICA /carreira setar-vitorias e adicionar-vitorias ---
        if (subcommand === 'setar-vitorias' || subcommand === 'adicionar-vitorias') {
            
            // Verifica se o usuário tem um registro. Se não, cria um.
            if (!progressao[userId]) {
                let faccaoId = null;
                for (const id of Object.keys(carreirasConfig.faccoes)) {
                    if (targetMember.roles.cache.has(id)) {
                        faccaoId = id;
                        break;
                    }
                }
                if (!faccaoId) {
                    return interaction.editReply({ content: `❌ Falha! O usuário ${targetUser} não tem um cargo de facção (Marinha, Exército, etc.) para que eu possa definir suas vitórias.` });
                }
                progressao[userId] = { factionId: faccaoId, currentRankId: null, totalWins: 0 };
            }

            const userProgress = progressao[userId];
            const faccao = carreirasConfig.faccoes[userProgress.factionId];
            let newTotalWins = 0;

            if (subcommand === 'setar-vitorias') {
                newTotalWins = quantidade;
                userProgress.totalWins = newTotalWins;
            } else { // adicionar-vitorias
                newTotalWins = userProgress.totalWins + quantidade;
                userProgress.totalWins = newTotalWins;
            }

            // Recalcula o rank
            await recalcularRank(targetMember, faccao, userProgress, carreirasConfig.cargoRecrutaId);
            
            // Salva as mudanças
            safeWriteJson(progressaoPath, progressao);

            const newRank = userProgress.currentRankId ? faccao.caminho.find(r => r.id === userProgress.currentRankId).nome : "Recruta";
            return interaction.editReply({ content: `✅ Sucesso! O total de vitórias de ${targetUser} foi definido para **${newTotalWins}**. Sua patente foi corrigida para **${newRank}**.` });
        }
    }
}