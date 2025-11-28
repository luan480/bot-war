/* ========================================================================
   ARQUIVO: commands/adm/limpar.js
   DESCRIÇÃO: Limpa até 100 mensagens por vez, inclusive as antigas (+14 dias).
   ======================================================================== */

const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('limpar')
        .setDescription('🧹 Apaga mensagens do canal (Inclusive antigas).')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
        .addIntegerOption(option =>
            option.setName('quantidade')
                .setDescription('Quantas mensagens apagar? (Máx: 100)')
                .setMinValue(1)
                .setMaxValue(100)
                .setRequired(true)
        ),

    async execute(interaction) {
        const amount = interaction.options.getInteger('quantidade');
        const channel = interaction.channel;

        await interaction.deferReply({ ephemeral: true });

        try {
            // Busca as mensagens
            const messages = await channel.messages.fetch({ limit: amount });
            
            if (messages.size === 0) {
                return interaction.editReply('❌ Não há mensagens para apagar.');
            }

            // Separa as mensagens em RECENTES (< 14 dias) e ANTIGAS (> 14 dias)
            // O Discord só permite apagar em massa (bulk) as recentes.
            const catorzeDiasAtras = Date.now() - (14 * 24 * 60 * 60 * 1000);
            
            const recentes = messages.filter(m => m.createdTimestamp > catorzeDiasAtras);
            const antigas = messages.filter(m => m.createdTimestamp <= catorzeDiasAtras);

            let apagadasCount = 0;

            // 1. Apaga as recentes (Rápido)
            if (recentes.size > 0) {
                await channel.bulkDelete(recentes, true);
                apagadasCount += recentes.size;
            }

            // 2. Apaga as antigas (Uma por uma - Lento mas Funciona)
            if (antigas.size > 0) {
                // Avisa se tiver muitas antigas, pois demora 1 seg por mensagem (Limite da API)
                if (antigas.size > 5) {
                    await interaction.editReply(`⚠️ Apagando ${recentes.size} mensagens recentes e **${antigas.size} mensagens antigas**... Isso pode demorar um pouco.`);
                }

                for (const msg of antigas.values()) {
                    await msg.delete().catch(err => console.log(`Erro ao apagar msg antiga: ${err.message}`));
                    apagadasCount++;
                    // Pequena pausa para não tomar rate limit
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }

            // 3. Relatório Final
            const embed = new EmbedBuilder()
                .setTitle('🧹 Limpeza Concluída')
                .setDescription(`Foram apagadas **${apagadasCount}** mensagens.`)
                .setColor('#2ecc71') // Verde
                .addFields(
                    { name: '⚡ Recentes', value: `${recentes.size}`, inline: true },
                    { name: '🕰️ Antigas (+14 dias)', value: `${antigas.size}`, inline: true }
                );

            await interaction.editReply({ content: '', embeds: [embed] });

        } catch (error) {
            console.error(error);
            await interaction.editReply('❌ Ocorreu um erro ao tentar limpar as mensagens.');
        }
    }
};