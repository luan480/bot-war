/* ========================================================================
   ARQUIVO: commands/adm/carreira.js (COMPLETO E ATUALIZADO)
   
   - [NOVO] Adicionado o sub-comando /carreira sicronizar.
   - [MUDANÇA] Agora importa as funções do './carreiraHelpers.js' local.
   - [CORREÇÃO] A função 'recalcularRank' foi removida daqui.
   ======================================================================== */

const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const path = require('path');
// [MUDANÇA] Importa do helper local que vamos criar
const { safeReadJson, safeWriteJson, recalcularRank } = require('./carreiraHelpers.js'); 

const carreirasPath = path.join(__dirname, 'carreiras.json');
const progressaoPath = path.join(__dirname, 'progressao.json');

// [REMOVIDO] A função 'recalcularRank' não fica mais aqui.
// Ela será movida para 'carreiraHelpers.js'

module.exports = {
    // 1. Definição do Comando (Completa)
    data: new SlashCommandBuilder()
        .setName('carreira')
        .setDescription('Comandos do sistema de progressão de carreira.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator) 
        
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
                .addUserOption(option => option.setName('usuario').setDescription('O membro que você quer modificar.').setRequired(true))
                .addIntegerOption(option => option.setName('quantidade').setDescription('O número total de vitórias.').setRequired(true).setMinValue(0))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('adicionar-vitorias')
                .setDescription('[ADMIN] Adiciona vitórias (bônus) a um jogador e o promove se necessário.')
                .addUserOption(option => option.setName('usuario').setDescription('O membro que você quer modificar.').setRequired(true))
                .addIntegerOption(option => option.setName('quantidade').setDescription('O número de vitórias para adicionar.').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('resetar')
                .setDescription('[ADMIN] Zera o progresso (vitórias e patente) de um jogador.')
                .addUserOption(option => option.setName('usuario').setDescription('O membro que você quer resetar.').setRequired(true))
        )
        // --- [NOVO] O COMANDO DE SINCRONIZAÇÃO ---
        .addSubcommand(subcommand =>
            subcommand
                .setName('sicronizar')
                .setDescription('[ADMIN] Sincroniza um membro antigo com o sistema de progressão.')
                .addUserOption(option => option.setName('usuario').setDescription('O membro que você quer sicronizar.').setRequired(true))
        ),
    
    // 2. Lógica de Execução (Completa)
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const carreirasConfig = safeReadJson(carreirasPath);
        const progressao = safeReadJson(progressaoPath);

        // --- Lógica do /carreira status ---
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

        // --- [NOVO] Lógica do /carreira sicronizar ---
        if (subcommand === 'sicronizar') {
            await interaction.deferReply({ ephemeral: true });
            const targetUser = interaction.options.getUser('usuario');
            const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
            
            if (!targetMember) {
                return interaction.editReply({ content: '❌ Membro não encontrado.' });
            }
            
            const userId = targetUser.id;

            // 1. Verifica se ele já está no sistema
            if (progressao[userId]) {
                return interaction.editReply({ 
                    content: `ℹ️ **Atenção!** O usuário ${targetUser} já está no sistema com **${progressao[userId].totalWins}** vitórias. Não é necessário sincronizar.` 
                });
            }

            // 2. Encontra a facção dele
            let faccaoId = null;
            let faccao = null;
            for (const id of Object.keys(carreirasConfig.faccoes)) {
                if (targetMember.roles.cache.has(id)) {
                    faccaoId = id;
                    faccao = carreirasConfig.faccoes[id];
                    break;
                }
            }

            if (!faccao) {
                return interaction.editReply({ content: `❌ **Falha!** O usuário ${targetUser} não tem um cargo de facção (Exército, Marinha, etc.) para eu poder sincronizar.` });
            }

            // 3. Encontra o cargo (patente) mais alto que ele tem
            let cargoMaisAlto = null;
            let custoDoCargo = 0;

            // Itera do rank mais alto (fim da lista) para o mais baixo
            for (let i = faccao.caminho.length - 1; i >= 0; i--) {
                const rank = faccao.caminho[i];
                if (targetMember.roles.cache.has(rank.id)) {
                    cargoMaisAlto = rank;       // ex: { nome: "• General...", id: "...", custo: 85 }
                    custoDoCargo = rank.custo;  // ex: 85
                    break; // Para assim que encontrar o mais alto
                }
            }
            
            // 4. Se ele não tem patente (é só @Recruta)
            if (!cargoMaisAlto) {
                progressao[userId] = {
                    factionId: faccaoId,
                    currentRankId: null, // Ele é Recruta
                    totalWins: 0
                };
                safeWriteJson(progressaoPath, progressao);
                return interaction.editReply({ content: `✅ **Sincronizado!** O usuário ${targetUser} é um Recruta e foi registrado no sistema com **0 vitórias**.` });
            }

            // 5. Se ele tem uma patente, registra ela
            progressao[userId] = {
                factionId: faccaoId,
                currentRankId: cargoMaisAlto.id, // Salva o ID do cargo atual dele
                totalWins: custoDoCargo          // Salva o "custo" do cargo como suas vitórias
            };
            safeWriteJson(progressaoPath, progressao);

            return interaction.editReply({
                content: `✅ **Sincronizado com Sucesso!**\n` +
                         `O bot detectou que ${targetUser} tem o cargo **${cargoMaisAlto.nome}**.\n` +
                         `Ele foi registrado no sistema com **${custoDoCargo} vitórias** e agora pode começar a progredir a partir daí.`
            });
        }
        
        // --- Lógica dos comandos de ADMIN (/setar, /adicionar, /resetar) ---
        await interaction.deferReply({ ephemeral: true });
        const targetUser = interaction.options.getUser('usuario');
        const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
        const quantidade = interaction.options.getInteger('quantidade');
        
        if (!targetMember) {
            return interaction.editReply({ content: '❌ Não foi possível encontrar este membro no servidor.' });
        }
        
        const userId = targetUser.id;
        
        if (subcommand === 'resetar') {
            if (!progressao[userId]) {
                return interaction.editReply({ content: 'ℹ️ Este usuário não possui nenhum progresso para resetar.' });
            }
            const faccaoId = progressao[userId].factionId;
            const faccao = carreirasConfig.faccoes[faccaoId];
            const cargosParaRemover = faccao.caminho.map(rank => rank.id);
            await targetMember.roles.remove(cargosParaRemover.filter(id => id && targetMember.roles.cache.has(id)));
            await targetMember.roles.add(carreirasConfig.cargoRecrutaId);
            delete progressao[userId];
            safeWriteJson(progressaoPath, progressao);
            return interaction.editReply({ content: `✅ Sucesso! O progresso de ${targetUser} foi resetado. Ele foi movido de volta para Recruta.` });
        }

        if (subcommand === 'setar-vitorias' || subcommand === 'adicionar-vitorias') {
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
            // Chama a função importada
            await recalcularRank(targetMember, faccao, userProgress, carreirasConfig.cargoRecrutaId);
            
            safeWriteJson(progressaoPath, progressao);
            const newRank = userProgress.currentRankId ? faccao.caminho.find(r => r.id === userProgress.currentRankId).nome : "Recruta";
            return interaction.editReply({ content: `✅ Sucesso! O total de vitórias de ${targetUser} foi definido para **${newTotalWins}**. Sua patente foi corrigida para **${newRank}**.` });
        }
    }
};