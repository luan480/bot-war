/* ========================================================================
   ARQUIVO: commands/economy/roleta-russa.js
   DESCRIÇÃO: Sala de apostas multiplayer. O último sobrevivente leva tudo.
   ======================================================================== */
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const path = require('path');
const { safeReadJson, safeWriteJson } = require('../liga/utils/helpers.js');

const economyPath = path.join(__dirname, 'economy.json');

// Função de pausa
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

module.exports = {
    data: new SlashCommandBuilder()
        .setName('roleta-russa')
        .setDescription('🎰 Cria uma sala de aposta mortal multiplayer.')
        .addIntegerOption(option => 
            option.setName('entrada')
                .setDescription('Valor para entrar na sala')
                .setRequired(true)
        ),

    async execute(interaction) {
        const valorEntrada = interaction.options.getInteger('entrada');
        const host = interaction.user;

        if (valorEntrada < 100) return interaction.reply({ content: '❌ Aposta mínima de $100.', ephemeral: true });

        // Verifica se o Host tem dinheiro
        const economy = safeReadJson(economyPath);
        if ((economy[host.id] || 0) < valorEntrada) return interaction.reply({ content: '❌ Você não tem dinheiro para abrir essa sala.', ephemeral: true });

        let participantes = [host.id]; // Lista de IDs
        let poteTotal = valorEntrada;
        let jogoIniciado = false;

        // Botões de Lobby
        const rowLobby = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('entrar').setLabel(`ENTRAR ($${valorEntrada})`).setStyle(ButtonStyle.Success).setEmoji('💰'),
            new ButtonBuilder().setCustomId('iniciar').setLabel('GIRAR TAMBOR (Host)').setStyle(ButtonStyle.Danger).setEmoji('🔫')
        );

        const embedLobby = new EmbedBuilder()
            .setTitle('🎰 Roleta Russa Multiplayer')
            .setDescription(`**${host.username}** abriu uma sala!\n\n💰 **Entrada:** $${valorEntrada}\n👥 **Jogadores:** 1\n💵 **Pote Atual:** $${poteTotal}`)
            .setColor('#e74c3c')
            .setFooter({ text: 'Esperando jogadores...' });

        const msg = await interaction.reply({ embeds: [embedLobby], components: [rowLobby], fetchReply: true });

        // Coletor do Lobby (2 minutos para entrar)
        const collector = msg.createMessageComponentCollector({ componentType: ComponentType.Button, time: 120000 });

        collector.on('collect', async i => {
            if (jogoIniciado) return;

            // BOTÃO ENTRAR
            if (i.customId === 'entrar') {
                if (participantes.includes(i.user.id)) return i.reply({ content: 'Você já está na sala!', ephemeral: true });

                // Checa dinheiro
                const db = safeReadJson(economyPath);
                if ((db[i.user.id] || 0) < valorEntrada) return i.reply({ content: '❌ Você não tem dinheiro para entrar.', ephemeral: true });

                participantes.push(i.user.id);
                poteTotal += valorEntrada;

                // Atualiza Embed
                embedLobby.setDescription(`**${host.username}** abriu uma sala!\n\n💰 **Entrada:** $${valorEntrada}\n👥 **Jogadores:** ${participantes.length}\n💵 **Pote Atual:** $${poteTotal}\n\n*Último a entrar: ${i.user.username}*`);
                await i.update({ embeds: [embedLobby] });
            }

            // BOTÃO INICIAR (Só Host)
            if (i.customId === 'iniciar') {
                if (i.user.id !== host.id) return i.reply({ content: 'Apenas o Host pode iniciar.', ephemeral: true });
                if (participantes.length < 2) return i.reply({ content: 'Precisa de pelo menos 2 pessoas para jogar.', ephemeral: true });

                jogoIniciado = true;
                collector.stop(); // Para de aceitar gente

                // Cobra o dinheiro de todo mundo AGORA (Segurança)
                const dbFinal = safeReadJson(economyPath);
                const jogadoresValidos = [];
                
                for (const pid of participantes) {
                    if ((dbFinal[pid] || 0) >= valorEntrada) {
                        dbFinal[pid] -= valorEntrada;
                        jogadoresValidos.push(pid);
                    }
                }
                safeWriteJson(economyPath, dbFinal);
                
                // Atualiza Pote real (caso alguém tenha gastado o dinheiro enquanto esperava)
                poteTotal = jogadoresValidos.length * valorEntrada; 

                // Começa o Jogo
                await i.update({ components: [] }); // Remove botões

                let vivos = [...jogadoresValidos];
                const embedJogo = new EmbedBuilder().setTitle('🔫 O Jogo Começou!').setColor('#2c3e50');

                // Loop de Eliminação
                while (vivos.length > 1) {
                    // Escolhe uma vítima aleatória para morrer
                    const vitimaIndex = Math.floor(Math.random() * vivos.length);
                    const vitimaId = vivos[vitimaIndex];
                    const userVitima = await interaction.client.users.fetch(vitimaId);

                    embedJogo.setDescription(`🎲 Girando o tambor...\n\nApontando para **${userVitima.username}**... 😰`);
                    await msg.edit({ embeds: [embedJogo] });
                    await sleep(3000);

                    embedJogo.setDescription(`💥 **BANG!** ${userVitima.username} foi eliminado!`);
                    embedJogo.setColor('#e74c3c'); // Vermelho sangue
                    await msg.edit({ embeds: [embedJogo] });
                    await sleep(2000);

                    // Remove da lista de vivos
                    vivos.splice(vitimaIndex, 1);
                }

                // Vencedor
                const vencedorId = vivos[0];
                const vencedorUser = await interaction.client.users.fetch(vencedorId);
                
                // Paga o prêmio
                const dbPremio = safeReadJson(economyPath);
                dbPremio[vencedorId] = (dbPremio[vencedorId] || 0) + poteTotal;
                safeWriteJson(economyPath, dbPremio);

                const embedWin = new EmbedBuilder()
                    .setTitle('🏆 TEMOS UM SOBREVIVENTE!')
                    .setDescription(`🎉 **${vencedorUser}** sobreviveu e levou o pote todo!\n\n💰 **Prêmio:** $${poteTotal} WarCoins`)
                    .setColor('#f1c40f') // Dourado
                    .setThumbnail(vencedorUser.displayAvatarURL());

                await msg.edit({ embeds: [embedWin] });
            }
        });
    }
};