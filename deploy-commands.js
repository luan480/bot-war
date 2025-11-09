/* ========================================================================
   SCRIPT DE REGISTRO DE COMANDOS (VERSÃO PARA DESENVOLVIMENTO)
   
   Este script lê as pastas 'adm' e 'liga' e registra
   os comandos instantaneamente APENAS no servidor especificado
   no seu 'config.json' (guildId).
   ======================================================================== */

const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('./config.json'); // Puxa o seu config.json

// Verifica se as informações essenciais estão no config.json
if (!config.token || !config.clientId || !config.guildId) {
    console.error('ERRO: Falta "token", "clientId" ou "guildId" no seu config.json!');
    process.exit(1); // Para o script se algo estiver faltando
}

const { clientId, guildId, token } = config;

const commands = [];
// O caminho principal agora é a pasta 'commands'
const commandsPath = path.join(__dirname, 'commands');

// Lê as subpastas (ex: 'liga', 'adm')
// Adicionado um filtro para garantir que são mesmo diretórios
const commandFolders = fs.readdirSync(commandsPath).filter(folder => 
    fs.statSync(path.join(commandsPath, folder)).isDirectory()
);

console.log(`[INFO] Pastas encontradas: ${commandFolders.join(', ')}`);

// Itera sobre cada subpasta (ex: 'liga', 'adm')
for (const folder of commandFolders) {
    const folderPath = path.join(commandsPath, folder);
    
    // Pega apenas os arquivos .js dentro da subpasta
    const commandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
        const filePath = path.join(folderPath, file);
        
        try {
            const command = require(filePath);

            // A verificação principal:
            // O arquivo deve exportar 'data' (com .toJSON) e 'execute'
            if (command.data && command.data.toJSON && command.execute) {
                commands.push(command.data.toJSON());
                console.log(`[SUCESSO] Comando carregado: ${command.data.name} (de ${folder}/${file})`);
            } else {
                console.log(`[AVISO] O arquivo em ${filePath} não é um comando válido e foi ignorado.`);
            }
        } catch (error) {
            console.error(`[ERRO] Não foi possível carregar o comando em ${filePath}:`, error.message);
        }
    }
}

// Configura a API do Discord
const rest = new REST({ version: '10' }).setToken(token);

// Envia os comandos para o Discord
(async () => {
    try {
        console.log(`\n[INFO] Iniciando a atualização de ${commands.length} comandos (/) no servidor: ${guildId}`);

        // --- ESTA É A MUDANÇA PRINCIPAL ---
        // Routes.applicationGuildCommands registra os comandos IMEDIATAMENTE
        // no servidor (Guild) especificado, em vez de globalmente.
        const data = await rest.put(
            Routes.applicationGuildCommands(clientId, guildId),
            { body: commands },
        );
        // ------------------------------------

        console.log(`\n✅ SUCESSO! ${data.length} comandos (/) foram recarregados.`);
        console.log("Os comandos devem aparecer no seu servidor instantaneamente.");

    } catch (error) {
        // Mostra um erro mais detalhado se algo der errado
        console.error("\n❌ FALHA AO REGISTRAR COMANDOS:");
        console.error(error);
    }
})();