/* ========================================================================
   HANDLER ATUALIZADO: commands/adm/logHandler.js (V6 - "ALMIRANTE")
   
   - [MUDANÇA] O log de Voz (VoiceStateUpdate) agora checa
     o Registro de Auditoria para diferenciar entre "Trocou de Canal"
     (sozinho) e "Foi Movido" (por um Admin).
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

    // --- LOGS DE MENSAGEM (DELETADA, EDITADA, GHOST PING) ---
    // (Esta parte já está correta e não muda)
    client.on(Events.MessageDelete, async (message) => { /* ... (código de Ghost Ping) ... */ });
    client.on(Events.MessageUpdate, async (oldMessage, newMessage) => { /* ... (código de Edição) ... */ });
    
    // --- LOGS DE MEMBROS (ENTRADA, SAÍDA, CARGOS, APELIDOS) ---
    // (Esta parte já está correta e não muda)
    client.on(Events.GuildMemberAdd, async (member) => { /* ... (código de Entrada) ... */ });
    client.on(Events.GuildMemberUpdate, async (oldMember, newMember) => { /* ... (código de Cargos/Apelidos) ... */ });


    /* ============================================================
       [NOVO] LOGS DE VOZ (COM VERIFICAÇÃO DE "MOVER")
       ============================================================ */
    client.on(Events.VoiceStateUpdate, async (oldState, newState) => {
        const logChannel = await getLogChannel();
        if (!logChannel) return;
        
        const user = newState.member.user;
        
        // 1. ENTROU NO CANAL
        if (!oldState.channel && newState.channel) {
            const embed = new EmbedBuilder()
                .setColor('Green').setTitle('Voz: Membro Entrou')
                .setDescription(`**Membro:** ${user} (${user.tag})\n**Canal:** ${newState.channel.name}`)
                .setThumbnail(user.displayAvatarURL()).setTimestamp();
            await logChannel.send({ embeds: [embed] });
        }

        // 2. SAIU DO CANAL
        if (oldState.channel && !newState.channel) {
            const embed = new EmbedBuilder()
                .setColor('Orange').setTitle('Voz: Membro Saiu')
                .setDescription(`**Membro:** ${user} (${user.tag})\n**Canal:** ${oldState.channel.name}`)
                .setThumbnail(user.displayAvatarURL()).setTimestamp();
            await logChannel.send({ embeds: [embed] });
        }

        // 3. MUDOU DE CANAL (OU FOI MOVIDO)
        if (oldState.channel && newState.channel && oldState.channel.id !== newState.channel.id) {
            
            // Verifica o Audit Log para ver se foi MOVIDO
            const fetchedLogs = await newState.guild.fetchAuditLogs({
                limit: 1,
                type: AuditLogEvent.MemberMove,
            }).catch(() => null);

            const moveLog = fetchedLogs?.entries.first();
            let embed;

            // Se foi movido por um Admin
            if (moveLog && moveLog.target.id === user.id && moveLog.createdAt > (Date.now() - 5000)) {
                embed = new EmbedBuilder()
                    .setColor('DarkBlue') // Cor diferente
                    .setTitle('Voz: Membro Foi Movido')
                    .setDescription(`**Membro:** ${user} (${user.tag})\n**Movido por:** ${moveLog.executor}`)
                    .addFields(
                        { name: 'Saiu de', value: `${oldState.channel.name}` },
                        { name: 'Entrou em', value: `${newState.channel.name}` }
                    )
                    .setThumbnail(user.displayAvatarURL()).setTimestamp();
            } else {
            // Se trocou de canal sozinho
                embed = new EmbedBuilder()
                    .setColor('Blue').setTitle('Voz: Membro Trocou de Canal')
                    .setDescription(`**Membro:** ${user} (${user.tag})`)
                    .addFields(
                        { name: 'Saiu de', value: `${oldState.channel.name}` },
                        { name: 'Entrou em', value: `${newState.channel.name}` }
                    )
                    .setThumbnail(user.displayAvatarURL()).setTimestamp();
            }
            await logChannel.send({ embeds: [embed] });
        }
    });

    /* ============================================================
       OUVINTE DO REGISTRO DE AUDITORIA (LOGS DE ADMIN)
       (Esta parte já está correta e não muda)
       ============================================================ */
    
    client.on(Events.GuildAuditLogEntryCreate, async (auditLogEntry, guild) => {
        const logChannel = await getLogChannel();
        if (!logChannel) return;

        const { action, executor, target, reason } = auditLogEntry;

        // --- LOG DE MENSAGEM DELETADA ---
        if (action === AuditLogEvent.MessageDelete) {
            if (executor.id === client.user.id || executor.id === target.id) return;
            const embed = new EmbedBuilder()
                .setColor('Red').setTitle('Mensagem Deletada por Moderador')
                .setDescription(`**Autor da Mensagem:** ${target} (${target.tag})\n**Deletado por:** ${executor} (${executor.tag})\n**Canal:** <#${auditLogEntry.extra.channel.id}>`)
                .setThumbnail(executor.displayAvatarURL()).setTimestamp();
            await logChannel.send({ embeds: [embed] });
        }

        // --- LOG DE MEMBRO KICKADO ---
        if (action === AuditLogEvent.MemberKick) {
            // (O GuildMemberRemove já pega isso de forma melhor, então pulamos)
            return;
        }

        // --- LOG DE MEMBRO BANIDO ---
        if (action === AuditLogEvent.MemberBanAdd) {
            const embed = new EmbedBuilder()
                .setColor('DarkRed').setTitle('Membro Banido')
                .setDescription(`**Usuário:** ${target} (${target.tag})\n**Banido por:** ${executor} (${executor.tag})\n**Motivo:** \`\`\`${reason || 'N/A'}\`\`\``)
                .setThumbnail(target.displayAvatarURL()).setTimestamp();
            await logChannel.send({ embeds: [embed] });
        }
        
        // --- LOG DE CANAL CRIADO ---
        if (action === AuditLogEvent.ChannelCreate) {
            const embed = new EmbedBuilder()
                .setColor('Green').setTitle('Canal Criado')
                .setDescription(`**Canal:** ${target} (${target.name})\n**Tipo:** ${ChannelType[target.type]}\n**Criado por:** ${executor} (${executor.tag})`)
                .setTimestamp();
            await logChannel.send({ embeds: [embed] });
        }

        // --- LOG DE CANAL DELETADO ---
        if (action === AuditLogEvent.ChannelDelete) {
            const embed = new EmbedBuilder()
                .setColor('DarkRed').setTitle('Canal Deletado')
                .setDescription(`**Canal:** \`#${auditLogEntry.changes.find(c => c.key === 'name').old}\`\n**Tipo:** ${ChannelType[auditLogEntry.changes.find(c => c.key === 'type').old]}\n**Deletado por:** ${executor} (${executor.tag})`)
                .setTimestamp();
            await logChannel.send({ embeds: [embed] });
        }

        // --- LOG DE CANAL ATUALIZADO (MUDANÇA DE NOME) ---
        if (action === AuditLogEvent.ChannelUpdate) {
            // (Ignoramos para não poluir, a menos que você queira muito)
        }
    });

    // (Ouvinte de GuildMemberRemove, que foi movido para baixo
    // para funcionar melhor com o Audit Log de Kick)
    client.on(Events.GuildMemberRemove, async (member) => {
        const logChannel = await getLogChannel();
        if (!logChannel) return;

        // Espera 1 segundo para o Audit Log de Kick ou Ban ser registrado
        await new Promise(resolve => setTimeout(resolve, 1500)); 

        const fetchedKick = await member.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.MemberKick }).catch(() => null);
        const kickLog = fetchedKick?.entries.first();
        if (kickLog && kickLog.target.id === member.id && kickLog.createdAt > (Date.now() - 5000)) {
            // Se foi Kick, o Audit Log já cuidou disso. Não faz nada.
            return;
        }
        
        const fetchedBan = await member.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.MemberBanAdd }).catch(() => null);
        const banLog = fetchedBan?.entries.first();
        if (banLog && banLog.target.id === member.id && banLog.createdAt > (Date.now() - 5000)) {
            // Se foi Ban, o Audit Log já cuidou disso. Não faz nada.
            return;
        }

        // Se não foi Kick nem Ban, ele "Saiu"
        const embed = new EmbedBuilder()
            .setColor('Orange').setTitle('Membro Saiu')
            .setDescription(`**Usuário:** ${member.user} (${member.user.tag})\n**ID:** ${member.id}`)
            .setThumbnail(member.user.displayAvatarURL()).setTimestamp();
        await logChannel.send({ embeds: [embed] });
    });

};