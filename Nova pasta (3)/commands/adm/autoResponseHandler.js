/* ========================================================================
   ARQUIVO: commands/adm/autoResponseHandler.js (CORRIGIDO E INTELIGENTE)
   ======================================================================== */
const { Events } = require('discord.js');
const fs = require('fs');
const path = require('path');

// --- CONFIGURAÇÕES ---
const CHANNEL_GERAL_ID = '849696656730357762'; 
const CHANNEL_MERCADO_ID = '1441499321810813001'; // ID pego do seu arquivo coletar.js

// Chance do bot responder a coisas banais (0.1 = 10%)
const CHANCE_RESPOSTA_NORMAL = 0.1; 

// Chance do bot dar uma dica espontânea nos canais (0.05 = 5% a cada msg)
const CHANCE_DICA = 0.05;

// Palavras que o bot SEMPRE vai responder (Prioridade Alta - 100% chance)
const PALAVRAS_PRIORIDADE = [
    'admin', 'staff', 'moderador', 'suporte', 'dono', 
    'ajuda', 'help', 'ticket', 'denuncia', 'bug', 'erro', 
    'convite', 'ip', 'site', 'regra'
];

// --- LISTAS DE DICAS ---
const DICAS_SERVIDOR = [
    "📢 **Dica:** Já leu as regras hoje? Evite punições conferindo o canal de regras!",
    "👋 **Servidor:** Convide seus amigos para jogar com a gente!",
    "💎 **Vip:** Quer vantagens exclusivas? Confira os planos VIPs!",
    "🎫 **Suporte:** Encontrou algum problema? Abra um ticket no canal de suporte.",
    "🤖 **Bot:** Eu sou o bot oficial da Liga! Use /ajuda ou %help para ver o que sei fazer.",
    "🛡️ **Segurança:** A Staff nunca pedirá sua senha. Cuidado com golpes!",
    "🎉 **Eventos:** Fique ligado nos anúncios para não perder os eventos valendo prêmios!"
];

const DICAS_ECONOMIA = [
    "💰 **Dica:** Use `%trabalhar` ou `%work` a cada hora para garantir seu salário!",
    "📅 **Dica:** Não esqueça de pegar seu prêmio diário com `%daily` ou `%coletar`.",
    "🎒 **Inventário:** Veja o que você tem na mochila usando `%mochila` ou `%inv`.",
    "🔫 **Crime:** O comando `%roubar` dá muito dinheiro, mas você pode ser preso...",
    "🛒 **Loja:** Quer gastar? Use `%loja` para ver itens incríveis.",
    "🏦 **Banco:** Guarde seu dinheiro no banco (`%depositar`) para não ser roubado!",
    "🔝 **Ranking:** Quer ver quem é o mais rico? Digite `%rank` ou `%top`."
];

module.exports = (client) => {
    // Carrega o JSON de respostas
    let autoRespostas = {};
    try {
        const dataPath = path.join(__dirname, 'auto_respostas.json');
        const data = fs.readFileSync(dataPath, 'utf8');
        autoRespostas = JSON.parse(data);
    } catch (err) {
        console.log("[AutoResponse] Erro ao ler auto_respostas.json:", err.message);
    }

    client.on(Events.MessageCreate, async (message) => {
        if (message.author.bot) return; // Ignora bots

        const conteudo = message.content.toLowerCase();
        const canalId = message.channel.id;

        // ==============================================================
        // 1. SISTEMA DE DICAS ESPONTÂNEAS
        // ==============================================================
        
        // Chat Geral
        if (canalId === CHANNEL_GERAL_ID) {
            if (Math.random() < CHANCE_DICA) {
                const dica = DICAS_SERVIDOR[Math.floor(Math.random() * DICAS_SERVIDOR.length)];
                return message.channel.send(dica).catch(()=>{});
            }
        }

        // Chat Mercado (Economia)
        if (canalId === CHANNEL_MERCADO_ID) {
            if (Math.random() < CHANCE_DICA) {
                const dica = DICAS_ECONOMIA[Math.floor(Math.random() * DICAS_ECONOMIA.length)];
                return message.channel.send(dica).catch(()=>{});
            }
        }

        // ==============================================================
        // 2. SISTEMA DE AUTO-RESPOSTA (CORRIGIDO)
        // ==============================================================

        // Itera sobre as chaves do JSON (ex: "bom dia", "staff", etc.)
        for (const [gatilho, respostas] of Object.entries(autoRespostas)) {
            
            if (conteudo.includes(gatilho.toLowerCase())) {
                
                // Verifica prioridade
                const ehPrioridade = PALAVRAS_PRIORIDADE.some(p => gatilho.includes(p) || conteudo.includes(p));
                
                // Lógica de Chance: 100% se for prioridade, 10% se for papo furado
                const deveResponder = ehPrioridade || (Math.random() < CHANCE_RESPOSTA_NORMAL);

                if (deveResponder) {
                    let respostaFinal = "";

                    // Se tiver várias respostas, sorteia uma
                    if (Array.isArray(respostas)) {
                        respostaFinal = respostas[Math.floor(Math.random() * respostas.length)];
                    } else {
                        respostaFinal = respostas;
                    }

                    try {
                        await message.reply(respostaFinal);
                        console.log(`[AutoResponse] Respondido '${gatilho}' para ${message.author.tag}`);
                    } catch (e) {
                        console.error("[AutoResponse] Erro ao enviar:", e);
                    }
                    
                    // Para o loop assim que encontrar uma resposta para não flodar
                    return; 
                }
            }
        }
    });
};