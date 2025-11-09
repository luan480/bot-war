/* ========================================================================
   NOVO COMANDO: /postar-regras
   
   - Posta os embeds formatados das regras da Liga
     no canal especificado.
   ======================================================================== */

const { 
    SlashCommandBuilder, 
    PermissionFlagsBits, 
    EmbedBuilder, 
    ChannelType 
} = require('discord.js');

module.exports = {
    // 1. Definição do Comando
    data: new SlashCommandBuilder()
        .setName('postar-regras')
        .setDescription('Envia os embeds de regras da Liga para um canal.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator) // Só admins podem usar
        .addChannelOption(option =>
            option.setName('canal')
                .setDescription('O canal onde as regras serão enviadas.')
                .addChannelTypes(ChannelType.GuildText) // Só aceita canais de texto
                .setRequired(true)
        ),
    
    // 2. Lógica de Execução
    async execute(interaction) {
        
        const canal = interaction.options.getChannel('canal');

        // Responde ao admin (só ele vê)
        await interaction.deferReply({ ephemeral: true });

        // --- EMBED 1: REGRAS ---
        const embedRegras = new EmbedBuilder()
            .setColor('#9B59B6') // Roxo (cor da sua liga)
            .setTitle('🌎 Regras da Liga WorldWarBR 🌎')
            .setDescription('Nossas regras foram elaboradas para uma experiência de jogo madura e desafiadora.')
            .addFields(
                {
                    name: '📋 Requisitos Obrigatórios',
                    value: (
                        '• **Duração:** Máximo de 1 hora. \n' +
                        '  *(Obs: A partida só termina após a jogada do último jogador, mesmo se o tempo estourar)*\n' +
                        '• **Jogadores:** Mínimo de 5 participantes.\n' +
                        '• **Inscrição:** Todos devem ser membros do WorldWarBR.\n' +
                        '• **Limite:** Máximo de 50 partidas por jogador/mês.\n' +
                        '• **1ª Rodada (ONU):** Uso da ONU é obrigatório.\n' +
                        '• **1ª Rodada (Tropas):** Proibido alocar todas as tropas no mesmo continente.'
                    )
                },
                {
                    name: '⚖️ Regras de Anti-Jogo (PROIBIDO)',
                    value: (
                        '• **Bugs ou Cheats:** Explorar falhas ou usar hacks.\n' +
                        '• **Transmissão (Ghosting):** Dar dicas a quem está em call/live.\n' +
                        '• **Troca de Cartas (Farming):** Ceder territórios para gerar cartas.\n' +
                        '• **Retirada de Tropas:** Falsa trégua para atacar outro local.\n' +
                        '• **Perseguição:** Focar um jogador por motivos pessoais.\n' +
                        '• **Efeito Kamikaze:** Sacrificar tropas sem lógica para alterar o jogo.\n' +
                        '• **Aliança / Ataque Combinado:** Planejar ataques em conjunto ou se ajudar.\n' +
                        '• **Entregar Abate:** Facilitar sua eliminação ou a de outro jogador.'
                    )
                }
            );

        // --- EMBED 2: PUNIÇÕES ---
        const embedPunicoes = new EmbedBuilder()
            .setColor('#E74C3C') // Vermelho para punições
            .setTitle('🚫 Tabela de Punição da Liga 🚫')
            .setDescription(
                '• **Suspensão:** Partidas jogadas não serão contabilizadas.\n' +
                '• **Castigo:** O jogador não pode usar os canais de voz (call).'
            )
            .addFields(
                {
                    name: 'Tabela de Infrações',
                    value: (
                        '| Infração | Punição (Pontos) | Punição (Tempo/Status) |\n' +
                        '| :--- | :--- | :--- |\n' +
                        '| **Uso de Cheats** | - | **Expulsão da Liga** |\n' +
                        '| **Exploração de Bugs** | -200P | 2 semanas de suspensão |\n' +
                        '| **Troca de Cartas** | -30P | 1 dia de castigo |\n' +
                        '| **Ataque Combinado** | -30P | 3 dias de suspensão |\n' +
                        '| **Aliança** | -30P | 3 dias de suspensão |\n' +
                        '| **Efeito Kamikaze** | -25P | 1 dia de castigo |\n' +
                        '| **Retirada de Tropas** | -20P | 1 dia de castigo |\n' +
                        '| **Perseguição** | -20P | 1 dia de suspensão |\n' +
                        '| **Entregar um Abate** | -10P | - |'
                    )
                },
                {
                    name: '⚠️ Observações',
                    value: (
                        '• Punições podem variar conforme a gravidade e reincidência.\n' +
                        '• Decisões são tomadas pelo comitê disciplinar da liga.'
                    )
                }
            );

        try {
            // Envia os dois embeds no canal que o admin escolheu
            await canal.send({ embeds: [embedRegras, embedPunicoes] });
            
            // Avisa o admin que deu certo
            await interaction.editReply({
                content: `✅ Embeds de regras enviados com sucesso para o canal ${canal}!`,
                ephemeral: true
            });
        } catch (err) {
            console.error(err);
            await interaction.editReply({
                content: `❌ Erro ao enviar os embeds. Verifique se eu tenho permissão para falar no canal ${canal}.`,
                ephemeral: true
            });
        }
    }
};