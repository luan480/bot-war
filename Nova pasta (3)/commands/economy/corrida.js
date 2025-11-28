const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const path = require('path');
const { safeReadJson, safeWriteJson } = require('../liga/utils/helpers.js');

const economyPath = path.join(__dirname, 'economy.json');
const inventoryPath = path.join(__dirname, 'inventario.json');

// Função de pausa (delay)
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

module.exports = {
    data: new SlashCommandBuilder()
        .setName('corrida')
        .setDescription('🚜 Inicia uma corrida de tanques (Requer item Tanque).'),

    async execute(interaction) {
        const userId = interaction.user.id;
        
        // 1. Verifica se tem o TANQUE
        const inventory = safeReadJson(inventoryPath);
        const userInv = inventory[userId] || {};
        
        // ID do item na loja deve ser "tanque" ou "tanque_role" dependendo do seu json. Vamos assumir "tanque".
        // Se for o cargo, checamos o cargo. Se for item, checamos inventario.
        // Como você configurou como Cargo no último passo ("tanque_role"), vamos checar o cargo:
        const temTanque = interaction.member.roles.cache.some(role => role.name.includes('Tanque')); 
        // Ou checa o inventário se você tiver o item físico também.
        
        if (!temTanque && !userInv['tanque']) {
            return interaction.reply({ content: '❌ Você precisa comprar um **Tanque de Guerra** na `/loja` para organizar uma corrida!', ephemeral: true });
        }

        // 2. Configuração da Corrida
        let apostas = { 1: [], 2: [], 3: [] }; // { tanqueId: [ {user, valor} ] }
        let totalApostado = 0;

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('apostar_1').setLabel('Tanque 1 (🔴)').setStyle(ButtonStyle.Danger),
            new ButtonBuilder().setCustomId('apostar_2').setLabel('Tanque 2 (🔵)').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('apostar_3').setLabel('Tanque 3 (🟢)').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId('iniciar_corrida').setLabel('🏁 LARGADA').setStyle(ButtonStyle.Secondary)
        );

        const embedLobby = new EmbedBuilder()
            .setTitle('🚜🏁 GRANDE PRÊMIO WORLDWAR')
            .setDescription(`**${interaction.user.username}** organizou uma corrida!\n\nFaçam suas apostas nos botões abaixo.\n**Custo da Aposta:** $200 (Fixo)`)
            .addFields(
                { name: '🔴 Tanque 1', value: '0 apostas', inline: true },
                { name: '🔵 Tanque 2', value: '0 apostas', inline: true },
                { name: '🟢 Tanque 3', value: '0 apostas', inline: true }
            )
            .setColor('Orange');

        const msg = await interaction.reply({ embeds: [embedLobby], components: [row], fetchReply: true });

        const collector = msg.createMessageComponentCollector({ time: 120000 }); // 2 min para apostar

        collector.on('collect', async i => {
            if (i.customId === 'iniciar_corrida') {
                if (i.user.id !== userId) return i.reply({ content: 'Só o dono do tanque pode dar a largada!', ephemeral: true });
                collector.stop('iniciou');
                return;
            }

            // Lógica de Aposta
            const tanqueEscolhido = parseInt(i.customId.split('_')[1]);
            const valorAposta = 200;

            // Verifica se já apostou
            const jaApostou = [...apostas[1], ...apostas[2], ...apostas[3]].find(p => p.id === i.user.id);
            if (jaApostou) return i.reply({ content: '❌ Você já apostou em um tanque!', ephemeral: true });

            // Cobra dinheiro
            const economy = safeReadJson(economyPath);
            if ((economy[i.user.id] || 0) < valorAposta) return i.reply({ content: '❌ Sem dinheiro.', ephemeral: true });

            economy[i.user.id] -= valorAposta;
            safeWriteJson(economyPath, economy);

            // Registra
            apostas[tanqueEscolhido].push({ id: i.user.id, name: i.user.username });
            totalApostado += valorAposta;

            // Atualiza Embed
            embedLobby.setFields(
                { name: '🔴 Tanque 1', value: `${apostas[1].length} apostas`, inline: true },
                { name: '🔵 Tanque 2', value: `${apostas[2].length} apostas`, inline: true },
                { name: '🟢 Tanque 3', value: `${apostas[3].length} apostas`, inline: true }
            );
            await i.update({ embeds: [embedLobby] });
        });

        collector.on('end', async (collected, reason) => {
            if (reason !== 'iniciou') {
                return interaction.editReply({ content: '⏰ Tempo esgotado. Corrida cancelada.', components: [] });
            }

            // === A CORRIDA COMEÇA ===
            await interaction.editReply({ components: [] }); // Remove botões

            let t1 = 0, t2 = 0, t3 = 0;
            const meta = 15; // Tamanho da pista
            let vencedor = 0;

            const pistaEmbed = new EmbedBuilder().setTitle('🚜💨 CORRIDA EM ANDAMENTO!').setColor('Yellow');

            // Loop de Animação
            while (t1 < meta && t2 < meta && t3 < meta) {
                // Avança aleatoriamente (1 a 3 casas)
                t1 += Math.floor(Math.random() * 3);
                t2 += Math.floor(Math.random() * 3);
                t3 += Math.floor(Math.random() * 3);

                // Desenha a pista
                const linha1 = '🔴 |' + '-'.repeat(t1) + '🚜' + ' '.repeat(Math.max(0, meta - t1)) + '| 🏁';
                const linha2 = '🔵 |' + '-'.repeat(t2) + '🚜' + ' '.repeat(Math.max(0, meta - t2)) + '| 🏁';
                const linha3 = '🟢 |' + '-'.repeat(t3) + '🚜' + ' '.repeat(Math.max(0, meta - t3)) + '| 🏁';

                pistaEmbed.setDescription(`\`\`\`\n${linha1}\n${linha2}\n${linha3}\n\`\`\``);
                await interaction.editReply({ embeds: [pistaEmbed] });
                await sleep(1500); // Espera 1.5s para o próximo frame
            }

            // Define Vencedor
            if (t1 >= meta) vencedor = 1;
            else if (t2 >= meta) vencedor = 2;
            else vencedor = 3;

            // Pagamento
            const ganhadores = apostas[vencedor];
            let textoFinal = '';

            if (ganhadores.length > 0) {
                const premioPorPessoa = Math.floor(totalApostado / ganhadores.length);
                const economy = safeReadJson(economyPath);
                
                ganhadores.forEach(p => {
                    economy[p.id] = (economy[p.id] || 0) + premioPorPessoa;
                });
                safeWriteJson(economyPath, economy);

                textoFinal = `🎉 **Tanque ${vencedor} VENCEU!**\n💰 Apostadores ganharam **$${premioPorPessoa}** cada:\n${ganhadores.map(g => g.name).join(', ')}`;
            } else {
                textoFinal = `🎉 **Tanque ${vencedor} VENCEU!**\n...mas ninguém apostou nele. O dinheiro ficou pra casa!`;
            }

            pistaEmbed.setTitle('🏁 FIM DA CORRIDA!');
            pistaEmbed.setDescription(textoFinal);
            pistaEmbed.setColor('Green');
            
            await interaction.editReply({ embeds: [pistaEmbed] });
        });
    }
};