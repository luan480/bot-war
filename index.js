/* ========================================================================
   ARQUIVO index.js (VERSÃO LIMPA E ORGANIZADA)
   
   - Contém apenas o essencial: login, carregador de comandos
     e roteador de interações.
   - O Sistema de Promoção foi movido para um arquivo separado.
   ======================================================================== */
   
const { Client, GatewayIntentBits, Collection, Events } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('./config.json');

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
            // [MUDANÇA] Ignora o novo handler para não tentar carregar como comando
            if (file === 'promotionHandler.js') {
                console.log(`[INFO] Módulo de promoção (vigia) encontrado.`);
                continue; 
            }

            const command = require(filePath);
            // Carrega apenas arquivos que são comandos de barra
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
    
    // [NOVO] Inicia o vigia de promoções
    // Esta linha ativa o sistema de prints.
    try {
        require('./commands/adm/promotionHandler.js')(client);
        console.log("✅ Sistema de Promoção (vigia de prints) ativado.");
    } catch (err) {
        console.error("❌ Falha ao ativar o Sistema de Promoção:", err);
    }
});

// --- Evento de Interação (Comandos e Botões) ---
client.on(Events.InteractionCreate, async interaction => {

    // Roteador de Comandos (ex: /carreira, /liga)
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

    // Roteador de Botões (da Liga)
    if (interaction.isButton()) {
        const buttons = require('./commands/liga/buttons');
        try { 
            await buttons(client, interaction); 
        } catch (err) { 
            console.error('Erro no handler de botões:', err); 
        }
    }
});

// [REMOVIDO] Todo o bloco 'client.on(Events.MessageCreate...)' agora está
// no arquivo 'promotionHandler.js'.

// --- Login do Bot ---
client.login(config.token);