/* ========================================================================
   NOVO COMANDO: /limpar
   
   - Modo Rápido: Apaga até 100 mensagens com < 14 dias.
   - Modo Lento: Apaga mensagens com > 14 dias, uma por uma,
     com delay para evitar rate limit.
   ======================================================================== */

const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

// Função de delay (espera)
const wait = require('node:timers/promises').setTimeout;

module.exports = {
    // 1. Definição do Comando
    data: new SlashCommandBuilder()
        .setName('limpar')
        .setDescription('Apaga uma quantidade de mensagens do canal.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages) // Só quem pode "Gerenciar Mensagens"
        .addIntegerOption(option =>
            option.setName('quantidade')
                .setDescription('O número de mensagens para apagar (Máx 100).')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(100)
        )
        .addBooleanOption(option =>
            option.setName('antigas')
                .setDescription('Apagar mensagens com MAIS de 14 dias? (Modo Lento)')
                .setRequired(true)
        ),
    
    // 2. Lógica de Execução
    async execute(interaction) {
        
        const quantidade = interaction.options.getInteger('quantidade');
        const antigas = interaction.options.getBoolean('antigas');

        // Responde ao usuário (só ele vê)
        await interaction.deferReply({ ephemeral: true });

        // --- LÓGICA DO MODO RÁPIDO (< 14 DIAS) ---
        if (antigas === false) {
            try {
                // bulkDelete (true) filtra mensagens com mais de 14 dias
                const { size } = await interaction.channel.bulkDelete(quantidade, true);
                
                await interaction.editReply({
                    content: `✅ Sucesso! ${size} mensagens (com menos de 14 dias) foram apagadas.`
                });

            } catch (err) {
                console.error("Erro no /limpar (Modo Rápido):", err);
                if (err.code === 50034) { // Erro 50034 = "You can only bulk delete messages that are under 14 days old."
                     await interaction.editReply({
                        content: '❌ **Falha!** Você tentou apagar mensagens com mais de 14 dias. Use a opção `antigas: Sim` para ativar o modo lento.'
                    });
                } else {
                    await interaction.editReply({
                        content: '❌ Ocorreu um erro ao tentar apagar as mensagens.'
                    });
                }
            }
        
        // --- LÓGICA DO MODO LENTO (> 14 DIAS) ---
        } else {
            await interaction.editReply({
                content: `⚠️ Iniciando modo de exclusão LENTA para ${quantidade} mensagens antigas...\nEste processo será demorado (cerca de 1.5s por mensagem) para evitar limites da API. Por favor, aguarde.`
            });

            let count = 0;
            try {
                // 1. Busca as mensagens
                const messages = await interaction.channel.messages.fetch({ limit: quantidade });

                // 2. Transforma em um array e inverte (para apagar da mais antiga para a mais nova)
                const messagesToDelete = Array.from(messages.values()).reverse();
                
                // 3. Deleta uma por uma com delay
                for (const msg of messagesToDelete) {
                    await msg.delete();
                    await wait(1500); // Espera 1.5 segundos
                    count++;
                }

                // 4. Resposta final (privada)
                await interaction.followUp({
                    content: `✅ Processo lento concluído! ${count} mensagens antigas foram apagadas.`,
                    ephemeral: true
                });

            } catch (err) {
                console.error("Erro no /limpar (Modo Lento):", err);
                await interaction.followUp({
                    content: `❌ Ocorreu um erro durante o processo lento após apagar ${count} mensagens.`,
                    ephemeral: true
                });
            }
        }
    }
};