/* ========================================================================
   ARQUIVO: commands/promocao/sincronizar.js
   DESCRIÇÃO: Escaneia TODOS os membros do servidor e atualiza o JSON
              baseado nos cargos que eles já possuem.
   ======================================================================== */

const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const path = require('path');
const { safeReadJson, safeWriteJson } = require('../liga/utils/helpers.js');

const progressaoPath = path.join(__dirname, 'progressao.json');
const carreirasPath = path.join(__dirname, 'carreiras.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('sincronizar-tudo')
        .setDescription('🕵️ Escaneia o servidor e atualiza o JSON com os cargos atuais de todos.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true }); // Pode demorar, então usamos defer

        const guild = interaction.guild;
        const carreirasConfig = safeReadJson(carreirasPath);
        const progressao = safeReadJson(progressaoPath);
        
        let atualizados = 0;
        let novos = 0;
        let erros = 0;

        try {
            // Busca TODOS os membros do servidor (obrigatório para funcionar direito)
            await interaction.editReply("🔄 Baixando lista de membros... aguarde.");
            const members = await guild.members.fetch();

            await interaction.editReply(`🔄 Analisando ${members.size} membros...`);

            // Varre cada membro
            members.forEach(member => {
                if (member.user.bot) return; // Ignora bots

                const userId = member.id;
                let userData = progressao[userId];
                let changed = false;

                // 1. Tenta descobrir a facção do membro pelos cargos dele
                let faccaoIdFound = null;
                for (const id of Object.keys(carreirasConfig.faccoes)) {
                    if (member.roles.cache.has(id)) {
                        faccaoIdFound = id;
                        break;
                    }
                }

                // Se achou facção, procura o cargo (rank)
                if (faccaoIdFound) {
                    const faccao = carreirasConfig.faccoes[faccaoIdFound];
                    let rankDiscordIndex = -1;
                    let rankDiscordObj = null;

                    // Varre os ranks para achar o MAIOR que ele tem
                    for (let i = 0; i < faccao.caminho.length; i++) {
                        const r = faccao.caminho[i];
                        if (member.roles.cache.has(r.id)) {
                            rankDiscordIndex = i;
                            rankDiscordObj = r;
                            // Não damos break aqui porque queremos o de maior índice
                        }
                    }

                    // Se o usuário não existe no JSON, cria
                    if (!userData) {
                        userData = {
                            factionId: faccaoIdFound,
                            currentRankId: null,
                            totalWins: 0
                        };
                        progressao[userId] = userData;
                        novos++;
                        changed = true;
                    }

                    // Se achou um cargo no Discord
                    if (rankDiscordObj) {
                        // Compara com o do JSON
                        let rankJsonIndex = -1;
                        if (userData.currentRankId) {
                            rankJsonIndex = faccao.caminho.findIndex(r => r.id === userData.currentRankId);
                        }

                        // SE O CARGO NO DISCORD FOR MAIOR OU O USUÁRIO NÃO TIVER CARGO NO JSON
                        if (rankDiscordIndex > rankJsonIndex) {
                            userData.currentRankId = rankDiscordObj.id;
                            // Atualiza as vitórias para o mínimo daquele cargo
                            if (userData.totalWins < rankDiscordObj.custo) {
                                userData.totalWins = rankDiscordObj.custo;
                            }
                            progressao[userId] = userData; // Garante a gravação
                            atualizados++;
                            changed = true;
                        }
                    }
                }
            });

            // Salva tudo no final
            if (atualizados > 0 || novos > 0) {
                safeWriteJson(progressaoPath, progressao);
            }

            await interaction.editReply(
                `✅ **Sincronização Completa!**\n\n` +
                `👥 **Membros Analisados:** ${members.size}\n` +
                `🆕 **Novos Registros Criados:** ${novos}\n` +
                `🔄 **Patentes Atualizadas:** ${atualizados}`
            );

        } catch (err) {
            console.error(err);
            erros++;
            await interaction.editReply(`❌ Ocorreu um erro durante a sincronização: ${err.message}`);
        }
    }
};