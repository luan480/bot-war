/* ========================================================================
   ARQUIVO: commands/adm/statusHandler.js (NOVO)
   
   - Contém toda a lógica do status rotativo,
     para manter o index.js limpo.
   ======================================================================== */

const { ActivityType } = require('discord.js');

// 1. A Lista de 30 Frases
const statusList = [
    { name: '🎮 War', type: ActivityType.Playing },
    { name: '🏆 a Liga das Nações', type: ActivityType.Competing },
    { name: '📺 o campo de batalha', type: ActivityType.Watching },
    { name: '🎵 hinos de guerra', type: ActivityType.Listening },
    { name: '🧠 planos de ataque', type: ActivityType.Playing },
    { name: '📈 as vitórias da Liga', type: ActivityType.Watching },
    { name: '🛡️ as patentes dos soldados', type: ActivityType.Watching },
    { name: '📝 as regras do QG', type: ActivityType.Playing },
    { name: '👀 o canal 📸・prints', type: ActivityType.Watching },
    { name: '📨 tickets de suporte', type: ActivityType.Watching },
    { name: '🧐 o Registro de Auditoria', type: ActivityType.Watching },
    { name: '👻 caçando Ghost Pings', type: ActivityType.Playing },
    { name: '👋 os novos Recrutas', type: ActivityType.Watching },
    { name: '🗺️ o mapa-múndi', type: ActivityType.Playing },
    { name: '🎖️ polindo as medalhas', type: ActivityType.Playing },
    { name: '💤 descansando no quartel', type: ActivityType.Playing },
    { name: '☕ um café com o General', type: ActivityType.Playing },
    { name: '🎯 um objetivo secreto', type: ActivityType.Competing },
    { name: '🎲 os dados de combate', type: ActivityType.Playing },
    { name: '🚁 a Aeronáutica', type: ActivityType.Watching },
    { name: '⚓ a Marinha', type: ActivityType.Watching },
    { name: '🔰 o Exército', type: ActivityType.Watching },
    { name: '⚔️ os Mercenários', type: ActivityType.Watching },
    { name: '📜 os guias de estratégia', type: ActivityType.Watching },
    { name: '📣 um /anuncio', type: ActivityType.Playing },
    { name: '🔨 banindo cheaters', type: ActivityType.Playing },
    { name: '📁 organizando os logs', type: ActivityType.Watching },
    { name: '🧑‍✈️ o Almirante', type: ActivityType.Listening },
    { name: '💥 preparando o /nuke', type: ActivityType.Playing },
    { name: '💂 Vigiando... sempre vigiando.', type: ActivityType.Watching }
];

// 2. A Função que atualiza o status
// (Ela precisa do 'client' para funcionar)
const updateStatus = (client) => {
    // Pega um item aleatório da lista
    const randomStatus = statusList[Math.floor(Math.random() * statusList.length)];
    
    // Define a atividade
    client.user.setActivity(randomStatus.name, { type: randomStatus.type });
    console.log(`[Status] Status atualizado para: ${ActivityType[randomStatus.type]} ${randomStatus.name}`);
};

// 3. A função principal (que o index.js vai chamar)
// Ela recebe o 'client' e liga o sistema
module.exports = (client) => {
    // Roda a função pela primeira vez (imediatamente)
    updateStatus(client);
    
    // Roda a função a cada 1 hora
    // (1 hora * 60 min * 60 seg * 1000 ms = 3.600.000)
    setInterval(() => updateStatus(client), 3600000);
};