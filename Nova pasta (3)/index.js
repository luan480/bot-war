/* ========================================================================
   ARQUIVO index.js (CORRIGIDO PARA SUBPASTAS + COMANDOS %)
   ======================================================================== */

require('dotenv').config();
const { Client, GatewayIntentBits, Collection, Events, Partials, MessageFlags } = require('discord.js');
const fs = require('fs');
const path = require('path');

// Criação do Client com todas as permissões necessárias
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent, // CRUCIAL para ler comandos %
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessageReactions
    ],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

// --- Carregador de Comandos (Slash Commands /) ---
client.commands = new Collection();
client.cooldowns = new Collection();

const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

// Carrega comandos recursivamente (entra nas pastas adm, economy, etc.)
for (const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder);
    
    // Verifica se é pasta antes de abrir
    if (fs.statSync(commandsPath).isDirectory()) {
        const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
        
        for (const file of commandFiles) {
            const filePath = path.join(commandsPath, file);
            
            // Ignora arquivos de sistema que não são comandos
            if (file.includes('Handler') || file.includes('Router') || file === 'embedSystem.js' || file === 'buttons.js' || file === 'painel.js') {
                continue;
            }

            try {
                const command = require(filePath);
                if (command.data && command.data.toJSON && command.execute) {
                    client.commands.set(command.data.name, command);
                    // console.log(`[CMD] Carregado: ${command.data.name}`); // Descomente para debug
                }
            } catch (err) {
                console.error(`[ERRO] Falha ao carregar ${file}:`, err);
            }
        }
    }
}

// --- Evento: Bot Online ---
client.once(Events.ClientReady, async c => {
    console.log(`🤖 ${c.user.tag} está online e pronto!`);
    
    // === CARREGAMENTO DOS SISTEMAS ESPECIAIS (CRUCIAL) ===
    
    // 1. Sistema de Economia (%)
    try { 
        require('./commands/economy/economyTextHandler.js')(client); 
        console.log("✅ Sistema de Economia (%) ativado.");
    } catch(e) { console.error("❌ Erro no EconomyHandler:", e); }

    // 2. Sistema de Promoção/Cargos
    try { require('./commands/promocao/promotionHandler.js')(client); } catch(e){}

    // 3. Auto Respostas
    try { require('./commands/adm/autoResponseHandler.js')(client); } catch(e){}
});

// --- Evento: Interações (Slash Commands, Botões, Menus) ---
client.on(Events.InteractionCreate, async interaction => {
    
    // 1. Tratamento de Comandos de Barra (/)
    if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (!command) return;

        try { 
            await command.execute(interaction); 
        } catch (err) { 
            console.error(`Erro no comando /${interaction.commandName}:`, err);
            const msg = { content: '❌ Erro ao executar o comando.', flags: MessageFlags.Ephemeral };
            if(interaction.replied || interaction.deferred) await interaction.followUp(msg); 
            else await interaction.reply(msg);
        }
    }
    
    // 2. Tratamento de Botões, Modais e Menus (Roteamento)
    else if (interaction.isButton() || interaction.isModalSubmit() || interaction.isAnySelectMenu()) {
        const id = interaction.customId;
        
        try {
            // Roteamento baseado no ID do botão
            if (id.startsWith('ticket_')) {
                await require('./commands/ticket/buttonRouter.js')(interaction, client);
            }
            else if (id.startsWith('stt_')) {
                await require('./commands/promocao/statusHandler.js')(interaction, client);
            }
            else if (id.startsWith('rank_')) {
                await require('./commands/promocao/rankingHandler.js')(interaction, client);
            }
            else if (id.startsWith('hist_')) {
                await require('./commands/promocao/historicoHandler.js')(interaction, client);
            }
            else if (id.startsWith('emb_') || id.startsWith('mdl_')) {
                await require('./commands/adm/embedSystem.js')(interaction, client);
            }
            // Verifica se é botão da Liga (ex: aceitar duelo)
            else if (interaction.isButton()) {
                // Tenta carregar o handler de botões da liga se o arquivo existir
                try {
                    await require('./commands/liga/buttons')(client, interaction);
                } catch (e) {
                    // Ignora erro se não for botão da liga
                }
            }
        } catch (err) { 
            console.error("Erro em interação de botão/modal:", err); 
        }
    }
});

client.login(process.env.TOKEN);