/* ========================================================================
   ARQUIVO: commands/adm/postar-guia-servidor.js (CORRIGIDO)
   
   - Corrigido o SyntaxError (o ponto extra ' +.' )
     que estava quebrando o arquivo.
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
        .setName('postar-guia-servidor')
        .setDescription('Envia o Guia do Servidor em um único embed.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator) // Só admins
        .addChannelOption(option =>
            option.setName('canal')
                .setDescription('O canal onde o guia será enviado (ex: #guia).')
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(true)
        ),
    
    // 2. Lógica de Execução
    async execute(interaction) {
        
        const canal = interaction.options.getChannel('canal');
        await interaction.deferReply({ ephemeral: true });

        // --- Construção do Embed ---
        const embedGuia = new EmbedBuilder()
            .setColor('#2ECC71') // Verde
            .setTitle('🌎 Guia do Servidor WorldWarBR 🌎')
            .setDescription('Bem-vindo ao Quartel-General, soldado. Este é o seu manual de campo para entender como o servidor funciona.')
            .setThumbnail(interaction.guild.iconURL()) // Ícone do servidor
            .addFields(
                {
                    name: '1. O Início (Seus Primeiros Passos)',
                    value: (
                        '1. **Leia as Regras:** A sua primeira parada é o canal <#854365038911160420>.\n' +
                        '2. **Apresente-se:** Diga um "salve" no canal <#1324278999169368095>. Nosso bot irá te orientar.\n' +
                        '3. **Escolha sua Facção:** Vá em "Canais & Cargos" (no topo) e escolha sua facção para entrar no sistema de patentes.'
                    )
                },
                {
                    name: '2. O Campo de Batalha (Como Jogar)',
                    value: (
                        '• **Regras da Liga:** A Liga das Nações tem regras especiais. Leia-as em <#881960444070350919>.\n' +
                        '• **Guias de Estratégia:** Aprenda a jogar e táticas avançadas no canal <#1083224204306038815>.'
                    )
                },
                {
                    name: '3. Sistema de Patentes (Promoção Automática)',
                    value: (
                        '1. **Poste suas Vitórias:** Envie um print da sua vitória no canal <#1071976981924687912>.\n' +
                        '2. **Seja Promovido:** O bot irá contar sua vitória e te promover automaticamente.\n' +
                        '3. **Anúncios:** Sua promoção será anunciada no canal da sua facção (ex: <#1037496479666946218>).\n' +
                        '4. **Hierarquia:** Veja a lista completa de patentes em <#1090178120910389349>.'
                    )
                },
                {
                    name: '4. Competições (A Glória)',
                    value: (
                        '• **Liga das Nações:** Acompanhe o ranking oficial em <#1429504377395351854>.\n' +
                        '• **Ranking de Vitórias:** Veja o Top 10 de vitórias de patentes em <#990848345394278410>.\n' +
                        '• **Imperador do Mês:** O Top 1 do Ranking de Vitórias recebe a tag `@Imperador`.\n' +
                        '• **Guerra Civil:** Acompanhe em <#999372650612785192>.'
                    )
                },
                {
                    name: '5. ☎️ Suporte (QG)',
                    value: (
                        '• **Abrir um Ticket:** Para dúvidas ou denúncias, use o painel em <#874794069073739816>.\n' +
                        '• **Denúncias Graves:** Casos de infração grave podem ser postados na <#1428490308387082370>.\n' +
                        '• **Punições:** Verifique os logs de punições aplicadas em <#1428490457478070364>.'
                    )
                },
                {
                    name: '6. Outras Atividades (Descanso)',
                    value: (
                        '• **Cargos de Jogos:** Pegue cargos de bots (Mudae, Myuu) em <#1082774763853840471>.\n' +
                        // [CORREÇÃO AQUI] Removido o '.' extra
                        '• **Chat Geral:** Converse com outros membros em <#849696656730357762>.\n' + 
                        '• **Notícias:** Fique por dentro de tudo nos <#1228294929546219530> e <#1068044448128307230>.'
                    )
                }
            )
            .setFooter({ text: 'Explore, divirta-se e participe ativamente da comunidade!' });

        // --- Envio dos Embeds ---
        try {
            await canal.send({ embeds: [embedGuia] });
            
            await interaction.editReply({
                content: `✅ Guia do Servidor enviado com sucesso para o canal ${canal}!`,
                ephemeral: true
            });
        } catch (err) {
            console.error(err);
            await interaction.editReply({
                content: `❌ Erro ao enviar o guia. Verifique se eu tenho permissão para falar no canal ${canal}.`,
                ephemeral: true
            });
        }
    }
};