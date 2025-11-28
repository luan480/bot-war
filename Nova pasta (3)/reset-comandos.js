const { REST, Routes } = require('discord.js');
const { clientId, guildId, token } = require('./config.json');

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
	try {
		console.log('🗑️ Iniciando limpeza de TODOS os comandos...');

		// 1. Apaga comandos do SERVIDOR (Geralmente onde estão as duplicatas)
        // Se o guildId não estiver no config.json, ele vai pular ou dar erro, mas tentaremos.
        if (guildId) {
            console.log(`🔸 Apagando comandos do servidor ${guildId}...`);
            await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: [] });
            console.log('✅ Comandos do servidor apagados.');
        }

		// 2. Apaga comandos GLOBAIS (Que aparecem em todos os servidores)
		console.log('🔸 Apagando comandos globais...');
		await rest.put(Routes.applicationCommands(clientId), { body: [] });
		console.log('✅ Comandos globais apagados.');

		console.log('🎉 Limpeza concluída! Agora rode "node deploy-commands.js" para instalar os corretos.');

	} catch (error) {
		console.error('❌ Erro ao limpar:', error);
	}
})();