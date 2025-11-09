/* deploy-commands.js ATUALIZADO PARA DISCLOUD */

const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
// const config = require('./config.json'); // NÃO PRECISAMOS MAIS

// MUDANÇA: Lendo as variáveis direto do DisCloud
const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID;
const token = process.env.TOKEN;

if (!clientId || !guildId || !token) {
    console.error('ERRO: Variáveis de ambiente (TOKEN, CLIENT_ID, GUILD_ID) não encontradas!');
    process.exit(1); 
}

const commands = [];
const commandsPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(commandsPath).filter(folder => 
    fs.statSync(path.join(commandsPath, folder)).isDirectory()
);

console.log(`[INFO] Pastas encontradas: ${commandFolders.join(', ')}`);

for (const folder of commandFolders) {
    const folderPath = path.join(commandsPath, folder);
    const commandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
        const filePath = path.join(folderPath, file);
        try {
            if (file === 'promotionHandler.js') continue; 
            const command = require(filePath);
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

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
    try {
        console.log(`\n[INFO] Iniciando a atualização de ${commands.length} comandos (/) no servidor: ${guildId}`);
        
        // Registrando no servidor específico
        const data = await rest.put(
            Routes.applicationGuildCommands(clientId, guildId),
            { body: commands },
        );
        
        console.log(`\n✅ SUCESSO! ${data.length} comandos (/) foram recarregados.`);
    } catch (error) {
        console.error("\n❌ FALHA AO REGISTRAR COMANDOS:");
        console.error(error);
    }
})();