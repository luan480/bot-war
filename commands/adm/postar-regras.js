/* ========================================================================
   COMANDO /postar-regras (ATUALIZADO)
   
   - Embed 1 (Regras) mantido.
   - Embed 2 (Punições) REMOVIDO.
   - [NOVO] Adicionado Embed 2 (Tutorial do Bot), que lê
     automaticamente o arquivo 'perguntas.json'.
   ======================================================================== */

const { 
    SlashCommandBuilder, 
    PermissionFlagsBits, 
    EmbedBuilder, 
    ChannelType 
} = require('discord.js');
// [NOVO] Precisamos do 'fs' e 'path' para ler o arquivo de perguntas
const fs = require('fs');
const path = require('path');

module.exports = {
    // 1. Definição do Comando (sem mudanças)
    data: new SlashCommandBuilder()
        .setName('postar-regras')
        .setDescription('Envia os embeds de regras e tutorial da Liga para um canal.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addChannelOption(option =>
            option.setName('canal')
                .setDescription('O canal onde as regras serão enviadas.')
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(true)
        ),
    
    // 2. Lógica de Execução
    async execute(interaction) {
        
        const canal = interaction.options.getChannel('canal');
        await interaction.deferReply({ ephemeral: true });

        // --- EMBED 1: REGRAS (Sem mudanças) ---
        const embedRegras = new EmbedBuilder()
            .setColor('#9B59B6') // Roxo
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

        // --- [NOVO] EMBED 2: TUTORIAL DO BOT ---
        
        // 1. Carregar o 'perguntas.json'
        const perguntasPath = path.join(__dirname, '..', 'liga', 'perguntas.json');
        let perguntas = [];
        try {
            // Lê o arquivo de perguntas que está na pasta 'liga'
            perguntas = JSON.parse(fs.readFileSync(perguntasPath, 'utf8'));
        } catch (err) {
            console.error("Erro ao carregar perguntas.json:", err);
            return interaction.editReply({ content: '❌ Erro! Não consegui encontrar o arquivo `perguntas.json` para criar o tutorial.' });
        }

        // 2. Formatar as perguntas e pontos
        const perguntasTexto = perguntas.map(p => {
            if (p.type === 'combate') {
                return `• **${p.pergunta}**\n  *(${p.pontosGanhos} pts por abate / ${p.pontosPerdidos} pts por morte)*`;
            } else {
                return `• **${p.pergunta}**\n  *(${p.pontos > 0 ? '+' : ''}${p.pontos} pts${p.multi ? ' por jogador' : ''})*`;
            }
        }).join('\n\n'); // Adiciona uma linha em branco entre cada pergunta

        // 3. Construir o Embed do Tutorial
        const embedTutorial = new EmbedBuilder()
            .setColor('#3498DB') // Azul (cor de informação)
            .setTitle('🤖 Como Usar o Bot da Liga 🤖')
            .addFields(
                {
                    name: 'Como Registrar uma Partida',
                    value: (
                        '1. Vá ao canal <#1429504377395351854> (o canal do painel da liga).\n' +
                        '2. Clique no botão verde "▶️ Iniciar".\n' +
                        '3. O bot pedirá um print da tela de vitória. Envie a imagem no chat.\n' +
                        '4. O bot fará as perguntas abaixo, uma de cada vez. Responda-as no chat.'
                    )
                },
                {
                    name: 'Perguntas e Pontuação',
                    value: perguntasTexto // O texto que acabamos de formatar
                }
            )
            .setFooter({ text: 'Ao final, o bot postará um resumo. Se errar, use o botão "Reverter" em até 10 minutos.' });
            
        // --- FIM DO NOVO EMBED ---

        try {
            // Envia os dois embeds (Regras e Tutorial)
            await canal.send({ embeds: [embedRegras, embedTutorial] });
            
            // Avisa o admin que deu certo
            await interaction.editReply({
                content: `✅ Embeds de regras e tutorial enviados com sucesso para o canal ${canal}!`,
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