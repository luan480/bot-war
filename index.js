/* ========================================================================
   ARQUIVO index.js (COM CORREÇÃO DO ERRO DE SINTAXE 'name:Grave:')
   
   - Corrigido o erro de digitação na 'statusList' (Linha 75).
   ======================================================================== */
   
require('dotenv').config(); 
const { Client, GatewayIntentBits, Collection, Events, ActivityType } = require('discord.js'); 
const fs = require('fs');
const path = require('path');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildBans, 
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildModeration
    ],
});

// --- Carregador de Comandos ---
client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(commandsPath).filter(folder => 
    fs.statSync(path.join(commandsPath, folder)).isDirectory()
);
for (const folder of commandFolders) {
    const folderPath = path.join(commandsPath, folder);
    const commandFiles = fs.readdirSync(folderPath).filter(f => f.endsWith('.js'));
    for (const file of commandFiles) {
        const filePath = path.join(folderPath, file);
        try {
            if (file.endsWith('Handler.js')) {
                console.log(`[INFO] Módulo handler encontrado: ${file}`);
                continue; 
            }
            const command = require(filePath);
            if (command.data && command.data.toJSON && command.execute) {
                client.commands.set(command.data.name, command);
            }
        } catch (err) {
            console.error(`[AVISO] Não foi possível carregar o arquivo ${filePath}: ${err.message}`);
        }
    }
}

// --- Carregadores de Módulos (Vigias e Handlers) ---
const ligaButtonHandler = require('./commands/liga/buttons.js');
const carreiraButtonHandler = require('./commands/adm/carreiraButtonHandler.js');
const promotionVigia = require('./commands/adm/promotionHandler.js');
const ticketOpenHandler = require('./commands/ticket/ticketOpenHandler.js');
const ticketCloseHandler = require('./commands/ticket/ticketCloseHandler.js');
const logHandler = require('./commands/adm/logHandler.js'); 
const welcomeHandler = require('./commands/adm/welcomeHandler.js');
const autoResponderHandler = require('./commands/adm/autoResponderHandler.js'); 

// --- Evento de Bot Pronto ---
client.once(Events.ClientReady, async c => {
    console.log(`🤖 ${c.user.tag} está online!`);
    
    // --- Sistema de Status Rotativo ---
    const statusList = [
        { name: '🎮 War', type: ActivityType.Playing },
        { name: '🏆 a Liga das Nações', type: ActivityType.Competing },
        { name: '📺 o campo de batalha', type: ActivityType.Watching },
        { name: '🎵 hinos de guerra', type: ActivityType.Listening },
        { name: '🧠 planos de ataque', type: ActivityType.Playing },
        { name: '📈 as vitórias da Liga', type: ActivityType.Watching },
        { name: '🛡️ as patentes dos soldados', type: ActivityType.Watching },
        { name: '📝 as regras do QG', type: ActivityType.Playing },
        { name: '👀 o canal 📸・prints', type: ActivityType.Watching },
        { name: '📨 tickets de suporte', type: ActivityType.Watching },
        { name: '🧐 o Registro de Auditoria', type: ActivityType.Watching },
        { name: '👻 caçando Ghost Pings', type: ActivityType.Playing },
        { name: '👋 os novos Recrutas', type: ActivityType.Watching },
        { name: '🗺️ o mapa-múndi', type: ActivityType.Playing },
        { name: '🎖️ polindo as medalhas', type: ActivityType.Playing },
        { name: '💤 descansando no quartel', type: ActivityType.Playing },
        { name: '☕ um café com o General', type: ActivityType.Playing },
        { name: '🎯 um objetivo secreto', type: ActivityType.Competing },
        { name: '🎲 os dados de combate', type: ActivityType.Playing },
        { name: '🚁 a Aeronáutica', type: ActivityType.Watching },
        { name: '⚓ a Marinha', type: ActivityType.Watching },
        { name: '🔰 o Exército', type: ActivityType.Watching },
        // [CORREÇÃO AQUI] Removido o "Grave:" que estava sobrando
        { name: '⚔️ os Mercenários', type: ActivityType.Watching }, { name: '📜 os guias de estratégia', type: ActivityType.Watching },
        { name: '📣 um /anuncio', type: ActivityType.Playing }, { name: '🔨 banindo cheaters', type: ActivityType.Playing },
        { name: '📁 organizando os logs', type: ActivityType.Watching }, { name: '🧑‍✈️ o Almirante', type: ActivityType.Listening },
        { name: '💥 preparando o /nuke', type: ActivityType.Playing }, { name: '💂 Vigiando... sempre vigiando.', type: ActivityType.Watching }
    ];
    const updateStatus = () => {
        const randomStatus = statusList[Math.floor(Math.random() * statusList.length)];
        client.user.setActivity(randomStatus.name, { type: randomStatus.type });
        console.log(`[Status] Status atualizado para: ${ActivityType[randomStatus.type]} ${randomStatus.name}`);
    };
    updateStatus();
    setInterval(updateStatus, 3600000); // 1 hora

    // --- Ativa os Vigias ---
    try {
        promotionVigia(client); 
        console.log("✅ Sistema de Promoção (vigia de prints) ativado.");
    } catch (err) {
        console.error("❌ Falha ao ativar o Sistema de Promoção:", err);
    }
    try {
        logHandler(client); 
        console.log("✅ Sistema de Logs (Poderoso) ativado.");
    } catch (err) {
        console.error("❌ Falha ao ativar o Sistema de Logs:", err);
    }
    try {
        welcomeHandler(client); 
        console.log("✅ Sistema de Boas-Vindas ativado.");
    } catch (err) {
        console.error("❌ Falha ao ativar o Sistema de Boas-Vindas:", err);
    }
    try {
        autoResponderHandler(client); 
        console.log("✅ Sistema de Auto-Responder (Chatbot) ativado.");
    } catch (err) {
        console.error("❌ Falha ao ativar o Auto-Responder:", err);
    }
});

// --- Evento de Interação ---
client.on(Events.InteractionCreate, async interaction => {
    // (O seu roteador de comandos e botões continua o mesmo)
    if (interaction.isCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (!command) return;
        try {
            await command.execute(interaction);
        } catch (err) {
            console.error(`[ERRO NO COMANDO /${interaction.commandName}]`, err);
            try {
                const errorMessage = `❌ **Erro Crítico!** Ocorreu um problema:\n\n\`\`\`${err.message}\`\`\``;
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({ content: errorMessage, flags: 64 });
                } else {
                    await interaction.reply({ content: errorMessage, flags: 64 });
                }
            } catch (catchErr) {
                console.error("[ERRO NO CATCH] Não foi possível responder à interação que falhou:", catchErr.message);
            }
        }
    }
    if (interaction.isButton()) {
        try {
            if (interaction.customId.startsWith('iniciar_') || 
                interaction.customId.startsWith('ver_') || 
                interaction.customId.startsWith('edit_') ||
                interaction.customId.startsWith('confirmar_') ||
                interaction.customId.startsWith('cancelar_')) 
            {
                await ligaButtonHandler(client, interaction);
            }
            else if (interaction.customId.startsWith('carreira_status_')) 
            {
                await carreiraButtonHandler(interaction);
            }
            else if (interaction.customId === 'ticket_abrir_denuncia') 
            {
                await ticketOpenHandler(interaction);
            }
            else if (interaction.customId === 'ticket_fechar') 
            {
                await ticketCloseHandler(interaction);
            }
        } catch (err) {
            console.error(`Erro no handler de botão (${interaction.customId}):`, err);
            try {
                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({ content: '❌ Ocorreu um erro ao usar este botão.', flags: 64 });
                } else {
                    await interaction.followUp({ content: '❌ Ocorreu um erro ao usar este botão.', flags: 64 });
                }
            } catch (catchErr) {
                console.error("[ERRO NO CATCH] Não foi possível responder ao botão que falhou:", catchErr.message);
            }
        }
    }
});

// --- Login do Bot ---
client.login(process.env.TOKEN);