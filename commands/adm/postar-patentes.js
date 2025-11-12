/* ========================================================================
   NOVO COMANDO: /postar-patentes
   
   - Posta 4 embeds, um para cada facção (Exército, Marinha,
     Aeronáutica, Mercenários) com suas respectivas patentes
     e custos de vitória incrementais.
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
        .setName('postar-patentes')
        .setDescription('Envia os embeds com as patentes de todas as facções.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addChannelOption(option =>
            option.setName('canal')
                .setDescription('O canal onde as patentes serão enviadas.')
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(true)
        ),
    
    // 2. Lógica de Execução
    async execute(interaction) {
        
        const canal = interaction.options.getChannel('canal');
        await interaction.deferReply({ ephemeral: true });

        // --- EMBED 1: EXÉRCITO ---
        const embedExercito = new EmbedBuilder()
            .setColor('#027A2A') // Cor do cargo @• Exército
            .setTitle('🔰 Patentes do Exército 🔰')
            .setDescription(
                '**• Soldado** (Recruta + 1 vitória)\n' +
                '**• Taifeiro de 2ª classe** (+2 vitórias)\n' +
                '**• Taifeiro de 1ª Classe** (+2 vitórias)\n' +
                '**• Cabo** (+3 vitórias)\n' +
                '**• Taifeiro Mor** (+4 vitórias)\n' +
                '**• Terceiro Sargento** (+4 vitórias)\n' +
                '**• Segundo Sargento** (+5 vitórias)\n' +
                '**• Primeiro Sargento** (+6 vitórias)\n' +
                '**• Subtenente** (+6 vitórias)\n' +
                '**• Segundo Tenente** (+7 vitórias)\n' +
                '**• Primeiro Tenente** (+8 vitórias)\n' +
                '**• Capitão** (+8 vitórias)\n' +
                '**• Major** (+9 vitórias)\n' +
                '**• Tenente Coronel** (+10 vitórias)\n' +
                '**• General de Brigada** (+10 vitórias)\n' +
                '**• General de Divisão** (+11 vitórias)\n' +
                '**• General do Exército** (+12 vitórias)\n' +
                '**• Marechal** (+15 vitórias)'
            );

        // --- EMBED 2: MARINHA ---
        const embedMarinha = new EmbedBuilder()
            .setColor('#5EADF5') // Cor do cargo @• Marinha
            .setTitle('⚓ Patentes da Marinha ⚓')
            .setDescription(
                '**• Marinheiro** (Recruta + 1 vitória)\n' +
                '**• Cabo** (+2 vitórias)\n' +
                '**• Terceiro Sargento** (+2 vitórias)\n' +
                '**• Segundo Sargento** (+3 vitórias)\n' +
                '**• Primeiro Sargento** (+4 vitórias)\n' +
                '**• Guarda Marinha** (+4 vitórias)\n' +
                '**• Subtenente** (+5 vitórias)\n' +
                '**• Segundo Tenente** (+6 vitórias)\n' +
                '**• Primeiro Tenente** (+6 vitórias)\n' +
                '**• Capitão** (+7 vitórias)\n' +
                '**• Capitão Tenente** (+8 vitórias)\n' +
                '**• Capitão de Corveta** (+8 vitórias)\n' +
                '**• Capitão de Fragata** (+9 vitórias)\n' +
                '**• Capitão de Mar e Guerra** (+10 vitórias)\n' +
                '**• Contra Almirante** (+10 vitórias)\n' +
                '**• Vice Almirante** (+11 vitórias)\n' +
                '**• Almirante de Esquadra** (+12 vitórias)\n' +
                '**• Almirante** (+15 vitórias)'
            );
            
        // --- EMBED 3: AERONÁUTICA ---
        const embedAeronautica = new EmbedBuilder()
            .setColor('#D6FA28') // Cor do cargo @• Aeronáutica
            .setTitle('🚁 Patentes da Aeronáutica 🚁')
            .setDescription(
                '**• Taifeiro de 2ª Classe** (Recruta + 1 vitória)\n' +
                '**• Soldado 2ª Classe** (+2 vitórias)\n' +
                '**• Taifeiro de 1ª Classe** (+2 vitórias)\n' +
                '**• Soldado 1ª Classe** (+3 vitórias)\n' +
                '**• Taifeiro Mor** (+4 vitórias)\n' +
                '**• Cabo** (+4 vitórias)\n' +
                '**• Terceiro Sargento** (+5 vitórias)\n' +
                '**• Segundo Sargento** (+6 vitórias)\n' +
                '**• Primeiro Sargento** (+6 vitórias)\n' +
                '**• Segundo Tenente** (+7 vitórias)\n' +
                '**• Primeiro Tenente** (+8 vitórias)\n' +
                '**• Capitão** (+8 vitórias)\n' +
                '**• Major** (+9 vitórias)\n' +
                '**• Tenente Coronel** (+10 vitórias)\n' +
                '**• Coronel** (+10 vitórias)\n' +
                '**• Brigadeiro** (+11 vitórias)\n' +
                '**• Major Brigadeiro do Ar** (+12 vitórias)\n' +
                '**• Marechal do Ar** (+15 vitórias)'
            );
            
        // --- EMBED 4: MERCENÁRIOS ---
        const embedMercenarios = new EmbedBuilder()
            .setColor('#FA3838') // Cor do cargo @• Mercenários
            .setTitle('⚔️ Patentes dos Mercenários ⚔️')
            .setDescription(
                '**• Subalterno** (Recruta + 1 vitória)\n' +
                '**• Escudeiro** (+2 vitórias)\n' +
                '**• Aprendiz** (+2 vitórias)\n' +
                '**• Arqueiro** (+3 vitórias)\n' +
                '**• Soldado** (+4 vitórias)\n' +
                '**• Lanceiro** (+4 vitórias)\n' +
                '**• Guarda** (+5 vitórias)\n' +
                '**• Cavaleiro** (+6 vitórias)\n' +
                '**• Bárbaro** (+6 vitórias)\n' +
                '**• Assassino** (+7 vitórias)\n' +
                '**• Assassino de Elite** (+8 vitórias)\n' +
                '**• Cavaleiro Real** (+8 vitórias)\n' +
                '**• Guarda Real** (+9 vitórias)\n' +
                '**• Paladino** (+10 vitórias)\n' +
                '**• Comandante** (+10 vitórias)\n' +
                '**• Colíder de Guilda** (+11 vitórias)\n' +
                '**• Líder de Guilda** (+12 vitórias)\n' +
                '**• Rei Mercenário** (+15 vitórias)'
            );

        // --- Envio dos Embeds ---
        try {
            // Envia os 4 embeds de uma vez no canal escolhido
            await canal.send({ embeds: [embedExercito, embedMarinha, embedAeronautica, embedMercenarios] });
            
            await interaction.editReply({
                content: `✅ Embeds de patentes enviados com sucesso para o canal ${canal}!`,
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