/* index.js (ATUALIZADO COM TRATAMENTO DE ERRO SEGURO) */
   
require('dotenv').config(); 
const { Client, GatewayIntentBits, Collection, Events } = require('discord.js');
const fs = require('fs');
const path = require('path');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers 
    ],
});

// --- Carregador de Comandos (sem mudanças) ---
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
const ligaButtonHandler = require('./commands/liga/buttons.js');
const carreiraButtonHandler = require('./commands/adm/carreiraButtonHandler.js');
const promotionVigia = require('./commands/adm/promotionHandler.js');
const ticketOpenHandler = require('./commands/ticket/ticketOpenHandler.js');

// --- Evento de Bot Pronto ---
client.once(Events.ClientReady, async c => {
    console.log(`🤖 ${c.user.tag} está online!`);
    try {
        promotionVigia(client);
        console.log("✅ Sistema de Promoção (vigia de prints) ativado.");
    } catch (err) {
        console.error("❌ Falha ao ativar o Sistema de Promoção:", err);
    }
});

// --- Evento de Interação ---
client.on(Events.InteractionCreate, async interaction => {

    // --- Roteador de Comandos ---
    if (interaction.isCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (!command) return;

        try {
            await command.execute(interaction);
        } catch (err) {
            console.error(`[ERRO NO COMANDO /${interaction.commandName}]`, err);
            
            // --- [BLOCO DE CATCH ATUALIZADO] ---
            // Agora, ele tenta responder ao erro, mas se a
            // resposta ao erro também falhar, ele não vai quebrar o bot.
            try {
                const errorMessage = `❌ **Erro Crítico!** Ocorreu um problema:\n\n\`\`\`${err.message}\`\`\``;
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({ content: errorMessage, flags: 64 }); // 64 = Ephemeral
                } else {
                    await interaction.reply({ content: errorMessage, flags: 64 }); // 64 = Ephemeral
                }
            } catch (catchErr) {
                console.error("[ERRO NO CATCH] Não foi possível responder à interação que falhou:", catchErr.message);
            }
            // --- [FIM DA ATUALIZAÇÃO] ---
        }
    }

    // --- Roteador de Botões ---
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

client.login(process.env.TOKEN);