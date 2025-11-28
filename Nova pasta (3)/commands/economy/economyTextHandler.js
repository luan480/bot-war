/* ========================================================================
   ARQUIVO: commands/economy/economyTextHandler.js (ROTEADOR UNIFICADO)
   DESCRIÇÃO: Redireciona comandos de texto para os arquivos oficiais.
   ======================================================================== */
const { Events, MessageFlags } = require('discord.js');

// Importa os comandos REAIS
const comandos = {
    // Aponta para os arquivos que você já tem
    saldo: require('./saldo'),
    atm: require('./saldo'),
    
    banco: require('./banco'),
    
    pagar: require('./pagar'),
    
    trabalhar: require('./trabalhar'),
    work: require('./trabalhar'),
    
    // AQUI ESTÁ O SEGREDO: %daily agora usa o MESMO ARQUIVO que /coletar
    coletar: require('./coletar'),
    daily: require('./coletar'),
    diario: require('./coletar'),
    
    loja: require('./loja'),
    
    comprar: require('./comprar'),
    
    inv: require('./inventario'),
    inventario: require('./inventario'),
    
    roubar: require('./sabotar'),
    sabotar: require('./sabotar'),
    
    duelar: require('./duelar'),
    
    rank: require('./rank-money'),
    top: require('./rank-money'),

    corrida: require('./corrida')
};

module.exports = (client) => {
    client.on(Events.MessageCreate, async (message) => {
        // Ignora bots e mensagens sem prefixo
        if (message.author.bot || !message.content.startsWith('%')) return;

        const args = message.content.slice(1).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();
        
        // Verifica se o comando existe na lista acima
        const comandoAlvo = comandos[commandName];
        if (!comandoAlvo) return;

        // Cria a "Interação Falsa" para o comando achar que é Slash
        const fakeInteraction = {
            id: message.id,
            user: message.author,
            member: message.member,
            guild: message.guild,
            channel: message.channel,
            client: client,
            
            // Respostas
            reply: async (opts) => {
                const content = typeof opts === 'string' ? opts : opts.content;
                const embeds = opts.embeds || [];
                
                // Se for privado (ephemeral), manda resposta simples ou na DM
                if (opts.ephemeral || opts.flags === MessageFlags.Ephemeral) {
                    return message.reply(`🔒 **Privado:** ${content || ''}`).catch(()=>{});
                }
                return message.reply({ content, embeds, components: opts.components }).catch(()=>{});
            },
            
            // Funções auxiliares que os comandos usam
            deferReply: async () => {}, // Ignora
            editReply: async (opts) => message.channel.send(opts),
            followUp: async (opts) => message.channel.send(opts),
            fetchReply: async () => message,
            
            // Opções (Simula os inputs do usuário)
            options: {
                getUser: () => message.mentions.users.first(),
                getMember: () => message.mentions.members.first(),
                getString: (name) => {
                    if (name === 'item') return args.join(' '); // Para comprar item
                    if (name === 'valor') return args[0]; // Para banco/pagar
                    return args.join(' ');
                },
                getInteger: (name) => {
                    const num = args.find(a => !isNaN(parseInt(a)) && !a.startsWith('<@'));
                    return num ? parseInt(num) : null;
                },
                getSubcommand: () => {
                    // Para o banco (sacar, depositar, info)
                    const sub = args[0]?.toLowerCase();
                    if (['sacar', 'depositar', 'info', 'ver'].includes(sub)) return sub === 'ver' ? 'info' : sub;
                    return null;
                }
            }
        };

        try {
            // Executa o comando REAL (com as travas e correções)
            await comandoAlvo.execute(fakeInteraction);
        } catch (error) {
            console.error(`Erro no comando texto %${commandName}:`, error);
        }
    });
};