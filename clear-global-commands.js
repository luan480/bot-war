/* ========================================================================
   SCRIPT DE LIMPEZA DE COMANDOS GLOBAIS (USAR SÓ 1 VEZ)
   
   Este script vai enviar uma lista vazia [] para o Discord,
   forçando a remoção de todos os comandos globais antigos.
   ======================================================================== */

const { REST, Routes } = require('discord.js');
const config = require('./config.json'); // Puxa o seu config.json

// Pega só o que precisa do config
const { clientId, token } = config;

if (!clientId || !token) {
    console.error('ERRO: Falta "clientId" ou "token" no config.json!');
    process.exit(1);
}

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
    try {
        console.log('[INFO] Iniciando a limpeza de TODOS os comandos globais (/) da aplicação.');
        console.log('[INFO] Isso pode demorar um minuto para atualizar no Discord...');

        // Envia um array VAZIO para o endpoint de comandos globais
        await rest.put(
            Routes.applicationCommands(clientId),
            { body: [] }, // O corpo é um array vazio
        );

        console.log('\n✅ SUCESSO! Todos os comandos globais foram removidos.');
        console.log('Agora você pode rodar "node deploy-commands.js" novamente.');

    } catch (error) {
        console.error('\n❌ FALHA AO LIMPAR COMANDOS GLOBAIS:');
        console.error(error);
    }
})();