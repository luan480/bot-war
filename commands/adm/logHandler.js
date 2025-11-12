/* ========================================================================
   HANDLER ATUALIZADO: commands/adm/logHandler.js (V5 - AUDITORIA)
   
   - [NOVO] Adicionado "Ouvinte" do Registro de Auditoria
     (Events.GuildAuditLogEntryCreate) para pegar logs
     de deleção de mensagens, canais, kicks e bans.
   - Os ouvintes antigos de Mensagem Deletada (Ghost Ping),
     Edição, Voz e Membros (Entrada/Cargos) foram mantidos,
     pois o Audit Log não os cobre bem.
   ======================================================================== */
   
const { Events, EmbedBuilder, AuditLogEvent, ChannelType } = require('discord.js');
const path = require('path');
const { safeReadJson } = require('../liga/utils/helpers.js');

const logConfigPath = path.join(__dirname, 'log_config.json');

module.exports = (client) => {

    // Função para buscar o canal de log
    async function getLogChannel() {
        const config = safeReadJson(logConfigPath);
        if (!config.logChannelId) return null;
        return await client.channels.fetch(config.logChannelId).catch(() => null);
    }

    /* ============================================================
       OUVINTES EM TEMPO REAL
       (Voz, Edição, Ghost Ping, Entrada, Mudança de Cargo)
       ============================================================ */
    
    // (Estes ouvintes continuam aqui porque são melhores que o Audit Log para estas tarefas)

    client.on(Events.MessageDelete, async (message) => {
        // Este ouvinte agora foca APENAS em Ghost Pings
        if (!message.guild || message.author?.bot || message.mentions.users.size === 0) return;
        
        const logChannel = await getLogChannel();
        if (!logChannel) return;

        // ESPELHO (Ghost Ping)
        const mentionedUser = message.mentions.users.first();
        if (mentionedUser.id !== message.author.id) {
            const embed = new EmbedBuilder()
                .setColor('#9B59B6').setTitle('👻 Ghost Ping Detectado (Espelho)')
                .setDescription(`**Autor:** ${message.author} (${message.author.tag})\n**Mencionado:** ${mentionedUser} (${mentionedUser.tag})\n**Canal:** ${message.channel}`)
                .addFields({ name: 'Mensagem Deletada', value: `\`\`\`${message.content || '[N/A]'}\`\`\`` })
                .setThumbnail(message.author.displayAvatarURL()).setTimestamp();
            await logChannel.send({ embeds: [embed] });
        }
    });

    client.on(Events.MessageUpdate, async (oldMessage, newMessage) => { /* ... (código da Aula 2, sem mudanças) ... */ });
    client.on(Events.GuildMemberAdd, async (member) => { /* ... (código da Aula 3, sem mudanças) ... */ });
    client.on(Events.GuildMemberUpdate, async (oldMember, newMember) => { /* ... (código da Aula 4, sem mudanças) ... */ });
    client.on(Events.VoiceStateUpdate, async (oldState, newState) => { /* ... (código da Aula 4, sem mudanças) ... */ });


    /* ============================================================
       [NOVO] OUVINTE DO REGISTRO DE AUDITORIA (LOG PODEROSO)
       Ouve por ações de Admins (Deletar, Banir, Kickar, etc.)
       ============================================================ */
    
    client.on(Events.GuildAuditLogEntryCreate, async (auditLogEntry, guild) => {
        const logChannel = await getLogChannel();
        if (!logChannel) return;

        const { action, executor, target, reason } = auditLogEntry;

        // --- LOG DE MENSAGEM DELETADA (Como o do 'Almirante') ---
        if (action === AuditLogEvent.MessageDelete) {
            // Ignora se o bot deletou (ex: /limpar) ou se o próprio autor deletou (para evitar log duplicado com o Ghost Ping)
            if (executor.id === client.user.id || executor.id === target.id) {
                return;
            }

            // O 'target' é o autor da mensagem
            // O 'executor' é quem deletou
            const embed = new EmbedBuilder()
                .setColor('Red')
                .setTitle('Mensagem Deletada por Moderador')
                .setDescription(
                    `**Autor da Mensagem:** ${target} (${target.tag})\n` +
                    `**Deletado por:** ${executor} (${executor.tag})\n` +
                    `**Canal:** <#${auditLogEntry.extra.channel.id}>`
                )
                // O Audit Log NÃO salva o conteúdo da mensagem, infelizmente.
                // Apenas o 'Almirante' (que é um bot parceiro do Discord) consegue isso.
                // Mas nós pegamos o mais importante: QUEM deletou.
                .setThumbnail(executor.displayAvatarURL())
                .setTimestamp();
            
            await logChannel.send({ embeds: [embed] });
        }

        // --- LOG DE MEMBRO KICKADO ---
        if (action === AuditLogEvent.MemberKick) {
            const embed = new EmbedBuilder()
                .setColor('DarkRed').setTitle('Membro Expulso (Kick)')
                .setDescription(
                    `**Usuário:** ${target} (${target.tag})\n` +
                    `**Expulso por:** ${executor} (${executor.tag})\n` +
                    `**Motivo:** \`\`\`${reason || 'N/A'}\`\`\``
                )
                .setThumbnail(target.displayAvatarURL()).setTimestamp();
            await logChannel.send({ embeds: [embed] });
        }

        // --- LOG DE MEMBRO BANIDO ---
        if (action === AuditLogEvent.MemberBanAdd) {
            const embed = new EmbedBuilder()
                .setColor('DarkRed').setTitle('Membro Banido')
                .setDescription(
                    `**Usuário:** ${target} (${target.tag})\n` +
                    `**Banido por:** ${executor} (${executor.tag})\n` +
                    `**Motivo:** \`\`\`${reason || 'N/A'}\`\`\``
                )
                .setThumbnail(target.displayAvatarURL()).setTimestamp();
            await logChannel.send({ embeds: [embed] });
        }
        
        // --- LOG DE CANAL CRIADO ---
        if (action === AuditLogEvent.ChannelCreate) {
            const embed = new EmbedBuilder()
                .setColor('Green').setTitle('Canal Criado')
                .setDescription(
                    `**Canal:** ${target} (${target.name})\n` +
                    `**Tipo:** ${ChannelType[target.type]}\n` +
                    `**Criado por:** ${executor} (${executor.tag})`
                )
                .setTimestamp();
            await logChannel.send({ embeds: [embed] });
        }

        // --- LOG DE CANAL DELETADO (O que você viu o Almirante fazer) ---
        if (action === AuditLogEvent.ChannelDelete) {
            const embed = new EmbedBuilder()
                .setColor('DarkRed').setTitle('Canal Deletado')
                .setDescription(
                    `**Canal:** \`#${auditLogEntry.changes.find(c => c.key === 'name').old}\`\n` + // Pega o nome antigo
                    `**Tipo:** ${ChannelType[auditLogEntry.changes.find(c => c.key === 'type').old]}\n` +
                    `**Deletado por:** ${executor} (${executor.tag})`
                )
                .setTimestamp();
            await logChannel.send({ embeds: [embed] });
        }
    });
};