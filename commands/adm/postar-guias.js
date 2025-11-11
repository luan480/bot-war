/* ========================================================================
   NOVO COMANDO: /postar-guias
   
   - Posta uma série de embeds com o guia básico
     e as Aulas 1, 2 e 3 de estratégia.
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
        .setName('postar-guias')
        .setDescription('Envia os guias de estratégia (Básico, Aulas 1, 2 e 3) para um canal.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator) // Só admins
        .addChannelOption(option =>
            option.setName('canal')
                .setDescription('O canal onde os guias serão enviados.')
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(true)
        ),
    
    // 2. Lógica de Execução
    async execute(interaction) {
        
        const canal = interaction.options.getChannel('canal');
        await interaction.deferReply({ ephemeral: true });

        // --- EMBED 1: GUIA BÁSICO ---
        const embedGuia = new EmbedBuilder()
            .setColor('#3498DB') // Azul
            .setTitle('🎖️ Como Jogar War: Do Recruta ao General (O Básico)')
            .setDescription('Seu objetivo é completar sua **"Carta de Objetivo"** secreta antes de todos.')
            .addFields(
                {
                    name: '1. A Preparação (Início do Jogo)',
                    value: (
                        '• **Receba seu Objetivo:** Você recebe uma carta de objetivo secreta.\n' +
                        '• **Divisão de Territórios:** O mapa é dividido entre os jogadores.\n' +
                        '• **Posicionamento:** Você posiciona suas tropas iniciais.'
                    )
                },
                {
                    name: '2. As 3 Fases do Seu Turno',
                    value: (
                        '**Fase 1: Receber Reforços**\n' +
                        'Você ganha exércitos de 3 fontes:\n' +
                        '1. **Territórios:** `(Total de territórios / 2)`.\n' +
                        '2. **Bônus de Continente:** Se possuir um continente inteiro.\n' +
                        '3. **Troca de Cartas:** Trocando 3 cartas (iguais ou diferentes).\n\n' +
                        '**Fase 2: Atacar (Opcional)**\n' +
                        '• O ataque usa no máximo 3 dados; a defesa também.\n' +
                        '• **Regra de Ouro:** No empate, a **DEFESA** vence.\n' +
                        '• Conquiste pelo menos 1 território para ganhar uma carta (máx. 1 por turno).\n\n' +
                        '**Fase 3: Remanejar (Fortalecer)**\n' +
                        '• Você pode mover exércitos de **um** território seu para **outro**, desde que estejam conectados.'
                    )
                },
                {
                    name: '3. A Vitória',
                    value: 'Você vence **imediatamente** ao completar seu objetivo secreto.'
                }
            );

        // --- EMBED 2: AULA 1 (ESTRATÉGIA) ---
        const embedAula1 = new EmbedBuilder()
            .setColor('#F1C40F') // Amarelo
            .setTitle('🎓 AULA 1: Estratégias Iniciais e Continentes')
            .addFields(
                {
                    name: 'Tipos de Estratégia Inicial',
                    value: (
                        '• **Coletiva:** Cada um fiscaliza um jogador para ninguém pegar bônus. (Difícil de coordenar).\n' +
                        '• **Individual:** Você foca apenas no seu continente e arredores.'
                    )
                },
                {
                    name: 'Pontos Chaves por Continente',
                    value: (
                        '• **Am. Sul:** Brasil, Venezuela, México. (Dica: Expanda para não ficar trancado).\n' +
                        '• **Am. Norte:** México, Alasca, Groenlândia. (Dica: Tire quem está no Sul).\n' +
                        '• **África:** Sudão, Argélia, Egito. (Dica: Pegue o bônus antes da Europa).\n' +
                        '• **Europa:** Inglaterra, Moscou, França. (Dica: Atrase a África).\n' +
                        '• **Oceania:** Austrália, China, Índia. (Dica: Defenda a Oceania enquanto briga na Ásia).\n' +
                        '• **Ásia:** China, Omsk, Vladvostok. (Dica: Tire os territórios da Oceania e Am. Sul primeiro).'
                    )
                },
                {
                    name: 'Counters de Continente',
                    value: (
                        '• **Am. Sul** é counterado por: Am. Norte, Europa, África.\n' +
                        '• **Am. Norte** é counterado por: Europa, Oceania, Am. Sul.\n' +
                        '• **África** é counterada por: Europa, Am. Sul.\n' +
                        '• **Europa** é counterada por: África, Am. Norte.\n' +
                        '• **Oceania** é counterada por: Am. Norte, Europa.'
                    )
                }
            );

        // --- EMBED 3: AULA 2 (DADOS) ---
        const embedAula2 = new EmbedBuilder()
            .setColor('#E74C3C') // Vermelho
            .setTitle('🎲 AULA 2: Dados e Probabilidade')
            .addFields(
                {
                    name: 'Regras da Defesa (Máx 3 Dados)',
                    value: (
                        '• **1 tropa:** Defende com 1 dado.\n' +
                        '• **2 tropas:** Defende com 2 dados.\n' +
                        '• **3+ tropas:** Defende com 3 dados.'
                    )
                },
                {
                    name: 'Regras do Ataque (Máx 3 Dados)',
                    value: (
                        '• **2 tropas:** Ataca com 1 dado.\n' +
                        '• **3 tropas:** Ataca com 2 dados.\n' +
                        '• **4+ tropas:** Ataca com 3 dados.'
                    )
                },
                {
                    name: 'Chances de Vitória',
                    value: 'Ataques com dados iguais têm 33% de chance de vitória. **Se os dados empatarem, a DEFESA ganha.** O ataque mais efetivo é 4+ (3 dados) contra 1 (1 dado). Estatisticamente, tenha o **triplo** de tropas para um ataque favorável.'
                },
                {
                    name: 'Defesa Eficiente (Tropas para quebrar)',
                    value: (
                        '• **1-3 tropas:** Quebra em 1 ataque.\n' +
                        '• **4-6 tropas:** Quebra em 2 ataques.\n' +
                        '• **7-9 tropas:** Quebra em 3 ataques.'
                    )
                }
            );

        // --- EMBED 4: AULA 3 (OBJETIVOS) ---
        const embedAula3 = new EmbedBuilder()
            .setColor('#2ECC71') // Verde
            .setTitle('🎯 AULA 3: Foco no Objetivo')
            .addFields(
                {
                    name: 'Estratégia de Objetivo',
                    value: 'Independente do seu objetivo, escolha o continente onde você está mais forte no início. Não fiscalize alguém longe de você, pois isso pode entregar seu objetivo (Exceção: Ásia).'
                },
                {
                    name: 'Quando NÃO Atacar seu Vizinho/Objetivo',
                    value: (
                        '• Se ele tiver **mais cartas** que você.\n' +
                        '• Se ele tiver **muito mais tropas** que você.\n' +
                        '• Se o seu ataque acabar **patrocinando outro jogador** (o "inimigo do seu inimigo").'
                    )
                },
                {
                    name: 'Dicas Rápidas por Objetivo',
                    value: (
                        '• **24 territórios:** Mantenha-se na Ásia.\n' +
                        '• **18 territórios com 2:** Jogue com cautela, mantendo muitas fronteiras.\n' +
                        '• **Abater alguém:** O inimigo do seu inimigo é seu amigo.'
                    )
                },
                {
                    name: 'Lista de Objetivos Possíveis',
                    value: '• 24 territórios\n• 18 territórios com 2 tropas\n• Abater um jogador (cor específica)\n• Europa, Oceania e +1 continente\n• Europa, Am. Sul e +1 continente\n• Am. Sul e Ásia\n• África e Ásia\n• Am. Norte e África\n• Am. Norte e Oceania'
                }
            );

        // --- Envio dos Embeds ---
        try {
            // Envia todos os embeds de uma vez no canal escolhido
            await canal.send({ embeds: [embedGuia, embedAula1, embedAula2, embedAula3] });
            
            await interaction.editReply({
                content: `✅ Guias de estratégia enviados com sucesso para o canal ${canal}!`,
                ephemeral: true
            });
        } catch (err) {
            console.error(err);
            await interaction.editReply({
                content: `❌ Erro ao enviar os guias. Verifique se eu tenho permissão para falar no canal ${canal}.`,
                ephemeral: true
            });
        }
    }
};