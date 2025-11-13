/* index.js (RESTRUTURADO E LIMPO) */
   
require('dotenv').config(); 
const { Client, GatewayIntentBits, Collection } = require('discord.js'); 
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
            const command = require(filePath);
            // Apenas carrega ficheiros que exportam 'data' e 'execute'
            if (command.data && command.execute) {
                client.commands.set(command.data.name, command);
            } else {
                 console.log(`[INFO] O ficheiro em ${filePath} não é um comando válido e foi ignorado.`);
            }
        } catch (err) {
            console.error(`[AVISO] Não foi possível carregar o comando ${filePath}: ${err.message}`);
        }
    }
}

// --- Carregador de Eventos ---
// (Esta é a nova parte)
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);
    
    // Passa o 'client' como último argumento para os handlers de eventos
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args, client));
    } else {
        client.on(event.name, (...args) => event.execute(...args, client));
    }
}

// --- MUDANÇA AQUI: HANDLERS GLOBAIS DE ERRO (ANTI-CRASH) ---
// Captura erros de promessas não tratadas (ex: falha na API do Discord)
process.on('unhandledRejection', (reason, promise) => {
    console.error('[ERRO CRÍTICO] Rejeição não tratada:', reason);
    // Idealmente, aqui também se enviaria uma mensagem para um canal de logs
});

// Captura exceções fatais não apanhadas no código
process.on('uncaughtException', (error) => {
    console.error('[ERRO CRÍTICO] Exceção não capturada:', error);
});
// --- FIM DA MUDANÇA ---


// --- Login do Bot ---
client.login(process.env.TOKEN);
