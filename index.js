/* ========================================================================
   ARQUIVO index.js (VERSÃO FINAL PARA RODAR NO PC E DISCLOUD)
   ======================================================================== */

//
// ⬇️ ESTA É A LINHA QUE FALTAVA ⬇️
//
require('dotenv').config(); // Esta linha LÊ o seu .env e o torna disponível

// O resto do seu código
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
            if (file === 'promotionHandler.js') {
                console.log(`[INFO] Módulo de promoção (vigia) encontrado.`);
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

// --- Evento de Bot Pronto ---
client.once(Events.ClientReady, async c => {
    console.log(`🤖 ${c.user.tag} está online!`);
    try {
        require('./commands/adm/promotionHandler.js')(client);
        console.log("✅ Sistema de Promoção (vigia de prints) ativado.");
    } catch (err) {
        console.error("❌ Falha ao ativar o Sistema de Promoção:", err);
    }
});

// --- Evento de Interação ---
client.on(Events.InteractionCreate, async interaction => {
    // Roteador de Comandos
    if (interaction.isCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (!command) return;
        try {
            await command.execute(interaction);
        } catch (err) {
            console.error(err);
            const errorMessage = `❌ **Erro Crítico!** Ocorreu um problema:\n\n\`\`\`${err.message}\`\`\``;
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: errorMessage, ephemeral: true });
            } else {
                await interaction.reply({ content: errorMessage, ephemeral: true });
            }
        }
    }
    // Roteador de Botões
    if (interaction.isButton()) {
        const buttons = require('./commands/liga/buttons');
        try { 
            await buttons(client, interaction); 
        } catch (err) { 
            console.error('Erro no handler de botões:', err); 
        }
    }
});

// --- Login do Bot ---
// Esta linha agora vai funcionar no seu PC, pois a Linha 6
// carregou o 'process.env.TOKEN' do seu arquivo .env
client.login(process.env.TOKEN);