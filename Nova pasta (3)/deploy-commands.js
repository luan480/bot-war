const { REST, Routes } = require('discord.js');
const { clientId, guildId, token } = require('./config.json'); // Ou use process.env se preferir
const fs = require('node:fs');
const path = require('node:path');

const commands = [];
// Caminho para a pasta commands
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

console.log('--- Iniciando atualização dos comandos (/) ---');

for (const folder of commandFolders) {
	// Pega o caminho da subpasta (ex: commands/economy)
	const commandsPath = path.join(foldersPath, folder);
	
	// Verifica se é realmente uma pasta antes de tentar ler
	if (fs.statSync(commandsPath).isDirectory()) {
		const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
		
		for (const file of commandFiles) {
			const filePath = path.join(commandsPath, file);
			const command = require(filePath);
			
			// Verifica se o arquivo tem as propriedades 'data' e 'execute'
			if ('data' in command && 'execute' in command) {
				commands.push(command.data.toJSON());
				console.log(`[CARREGADO] ${command.data.name} (em ${folder})`);
			} else {
				console.log(`[IGNORADO] ${file} em ${folder} (falta 'data' ou 'execute')`);
			}
		}
	}
}

// Instância do REST
const rest = new REST().setToken(token);

// Deploy
(async () => {
	try {
		console.log(`Começando a atualizar ${commands.length} comandos de aplicativo (/).`);

		// O put substitui todos os comandos existentes pelos novos
		const data = await rest.put(
			Routes.applicationGuildCommands(clientId, guildId),
			{ body: commands },
		);

		console.log(`Sucesso! ${data.length} comandos de aplicativo (/) recarregados.`);
	} catch (error) {
		console.error(error);
	}
})();