/* events/clientReady.js */
const { Events } = require('discord.js');

// --- Carregadores de Módulos (Vigias e Handlers) ---
// (Movidos do index.js para aqui)
const ligaButtonHandler = require('../commands/liga/buttons.js');
const carreiraButtonHandler = require('../commands/adm/carreiraButtonHandler.js');
const promotionVigia = require('../commands/adm/promotionHandler.js');
const ticketOpenHandler = require('../commands/ticket/ticketOpenHandler.js');
const ticketCloseHandler = require('../commands/ticket/ticketCloseHandler.js');
const logHandler = require('../commands/adm/logHandler.js'); 
const welcomeHandler = require('../commands/adm/welcomeHandler.js');
const autoResponderHandler = require('../commands/adm/autoResponderHandler.js'); 
const statusHandler = require('../commands/adm/statusHandler.js');

module.exports = {
	name: Events.ClientReady,
	once: true,
	async execute(client) { // O 'client' é recebido aqui
		console.log(`🤖 ${client.user.tag} está online!`);
    
        // --- Disponibiliza os Handlers de Botões para o client ---
        // (Para que o 'interactionCreate.js' os possa usar)
        client.buttonHandlers = {
            liga: ligaButtonHandler,
            carreira: carreiraButtonHandler,
            ticketOpen: ticketOpenHandler,
            ticketClose: ticketCloseHandler
        };
        console.log("[INFO] Handlers de botões carregados.");

		// --- Ativa os Vigias ---
		try {
			statusHandler(client);
			console.log("✅ Sistema de Status Rotativo ativado.");
		} catch (err) {
			console.error("❌ Falha ao ativar o Sistema de Status:", err);
		}
		try {
			promotionVigia(client); 
			console.log("✅ Sistema de Promoção (vigia de prints) ativado.");
		} catch (err) {
			console.error("❌ Falha ao ativar o Sistema de Promoção:", err);
		}
		try {
			logHandler(client); 
			console.log("✅ Sistema de Logs (Poderoso) ativado.");
		} catch (err) {
			console.error("❌ Falha ao ativar o Sistema de Logs:", err);
		}
		try {
			welcomeHandler(client); 
			console.log("✅ Sistema de Boas-Vindas ativado.");
		} catch (err) {
			console.error("❌ Falha ao ativar o Sistema de Boas-Vindas:", err);
		}
		try {
			autoResponderHandler(client); 
			console.log("✅ Sistema de Auto-Responder (Chatbot) ativado.");
		} catch (err) {
			console.error("❌ Falha ao ativar o Auto-Responder:", err);
		}
	},
};