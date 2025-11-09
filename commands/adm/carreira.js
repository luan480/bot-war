/* ========================================================================
   NOVO COMANDO: /carreira status
   
   - Este comando permite ao jogador postar seu status
     (patente, vitórias, próxima patente) no canal de
     anúncio da sua facção.
   ======================================================================== */

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const path = require('path');
// Precisamos do 'safeReadJson' da sua pasta de utils.
// O caminho é: sai da 'adm' (..), entra na 'liga', 'utils', 'helpers.js'
const { safeReadJson } = require('../liga/utils/helpers.js');

// Define os caminhos para nossos arquivos de dados
const carreirasPath = path.join(__dirname, 'carreiras.json');
const progressaoPath = path.join(__dirname, 'progressao.json');

module.exports = {
    // 1. Definição do Comando
    data: new SlashCommandBuilder()
        .setName('carreira')
        .setDescription('Comandos do sistema de progressão de carreira.')
        .addSubcommand(subcommand =>
            subcommand
                .setName('status')
                .setDescription('Posta seu status de vitórias e patente no canal da sua facção.')
        ),
    
    // 2. Lógica de Execução
    async execute(interaction) {
        
        if (interaction.options.getSubcommand() === 'status') {
            
            // Responde ao usuário "estou pensando..." (só ele vê)
            await interaction.deferReply({ ephemeral: true });

            const userId = interaction.user.id;
            const member = interaction.member;

            // 3. Carrega nossos arquivos de dados
            const carreirasConfig = safeReadJson(carreirasPath);
            const progressao = safeReadJson(progressaoPath);

            // 4. Acha o progresso do usuário no 'progressao.json'
            const userProgress = progressao[userId];

            // 5. Se o usuário não existe no arquivo (nunca postou print)
            if (!userProgress) {
                return interaction.editReply({ 
                    content: '❌ Você ainda não registrou nenhuma vitória. Poste seu primeiro print no canal 📸・prints para começar!',
                    ephemeral: true 
                });
            }

            // 6. Acha as regras da facção do usuário
            const faccaoId = userProgress.factionId;
            const faccao = carreirasConfig.faccoes[faccaoId];

            if (!faccao) {
                return interaction.editReply({ content: '❌ Erro: Não consegui encontrar sua facção no sistema. Contate um admin.', ephemeral: true });
            }

            // 7. Acha o canal de destino (o canal de anúncio da facção)
            const canalDeAnuncio = await interaction.client.channels.fetch(faccao.canalDeAnuncio).catch(() => null);
            if (!canalDeAnuncio) {
                return interaction.editReply({ content: `❌ Erro: Não encontrei o canal de status da sua facção (${faccao.nome}).`, ephemeral: true });
            }

            // 8. Prepara as informações para o "Card de Status"
            const totalWins = userProgress.totalWins;
            let currentRankName = "• Recruta"; // Padrão
            let nextRankName = "N/A";
            let progressString = "Patente Máxima Atingida!"; // Padrão se ele for o último nível

            // Se o usuário já tem uma patente...
            if (userProgress.currentRankId) {
                const rankAtual = faccao.caminho.find(r => r.id === userProgress.currentRankId);
                currentRankName = rankAtual.nome;

                // Acha a próxima patente na lista
                const rankAtualIndex = faccao.caminho.findIndex(r => r.id === userProgress.currentRankId);
                
                // Se ele NÃO for a patente máxima
                if (rankAtualIndex < faccao.caminho.length - 1) {
                    const proximoCargo = faccao.caminho[rankAtualIndex + 1];
                    nextRankName = proximoCargo.nome;
                    const winsNeeded = proximoCargo.custo;
                    const winsRemaining = winsNeeded - totalWins;
                    progressString = `Faltam ${winsRemaining} vitórias para a próxima patente. (${totalWins} / ${winsNeeded})`;
                }
            } else { 
                // Se ele não tem patente (ainda é Recruta), o próximo é o primeiro
                const proximoCargo = faccao.caminho[0];
                nextRankName = proximoCargo.nome;
                const winsNeeded = proximoCargo.custo;
                const winsRemaining = winsNeeded - totalWins;
                progressString = `Faltam ${winsRemaining} vitórias para a próxima patente. (${totalWins} / ${winsNeeded})`;
            }
            
            // 9. Constrói o Embed (a mensagem bonita)
            const embed = new EmbedBuilder()
                .setColor('#F1C40F') // Amarelo Dourado
                .setAuthor({ name: `Status de Carreira: ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() })
                .setThumbnail(interaction.guild.iconURL()) // Ícone do servidor
                .addFields(
                    { name: "Facção", value: faccao.nome, inline: true },
                    { name: "Patente Atual", value: currentRankName, inline: true },
                    { name: "Total de Vitórias", value: `🏆 ${totalWins}`, inline: true },
                    { name: "Próxima Patente", value: nextRankName, inline: false },
                    { name: "Progresso", value: progressString, inline: false }
                )
                .setTimestamp();
            
            // 10. Envia o Embed no canal público (o canal da facção)
            await canalDeAnuncio.send({
                content: `📊 ${interaction.user}, aqui está seu status de carreira!`, // Marcando o usuário
                embeds: [embed]
            });

            // 11. Avisa o usuário (na resposta temporária) que deu certo
            await interaction.editReply({
                content: `✅ Seu status foi postado com sucesso no canal ${canalDeAnuncio}!`,
                ephemeral: true
            });
        }
    }
};