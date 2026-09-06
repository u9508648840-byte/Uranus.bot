require('dotenv').config();
const { 
    Client, 
    GatewayIntentBits, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    EmbedBuilder, 
    PermissionFlagsBits,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ChannelType,
    StringSelectMenuBuilder
} = require('discord.js');
const { createCanvas } = require('canvas');
const express = require('express');

// 🌐 WEB SERVER HTTP PER MANTENERE IL BOT SVEGLIO SU HOSTING CLOUD (Render, Railway, VPS)
const app = express();
const PORT = process.env.PORT || 3000;
app.get('/', (req, res) => res.send('🤖 Bot Uranus online e operativo 24/7!'));
app.listen(PORT, () => console.log(`🌐 Server Web di Keep-Alive attivo sulla porta ${PORT}`));

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildVoiceStates
    ]
});

// ID PROPRIETARIO SERVER
const OWNER_ID = "1425167749105324133"; 

// RUOLI BASE
const RUOLO_OSPITE = "Ospite";
const RUOLO_VERIFICATO = "Membro";
const RUOLO_ADMIN = "Amministratore";

const ADMIN_MASTER_PASSWORD = "UranusAdmin2026!";
const utentiRegistrati = new Map();
const tempChannels = new Map();

client.once('ready', () => {
    console.log(`✅ Bot Uranus pronto e online come ${client.user.tag}!`);
});

// 🎨 GENERATORE ICONA GRAFICA AUTOMATICA (AI/CANVAS)
function generaIconaServer(testoIniziale) {
    const width = 512;
    const height = 512;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Sfondo Sfumato Moderno
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#0f0c29');
    gradient.addColorStop(0.5, '#302b63');
    gradient.addColorStop(1, '#24243e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Cerchio di design
    ctx.strokeStyle = '#00d2ff';
    ctx.lineWidth = 15;
    ctx.beginPath();
    ctx.arc(256, 256, 210, 0, Math.PI * 2);
    ctx.stroke();

    // Testo / Iniziale del server
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 180px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(testoIniziale.substring(0, 2).toUpperCase(), width / 2, height / 2);

    return canvas.toBuffer('image/png');
}

// GESTIONE RUOLI SERVER
async function gestisciRuoli(guild) {
    let rOspite = guild.roles.cache.find(r => r.name === RUOLO_OSPITE) || 
        await guild.roles.create({ name: RUOLO_OSPITE, color: '#808080', reason: 'Preset Server' });
    
    let rMembro = guild.roles.cache.find(r => r.name === RUOLO_VERIFICATO) || 
        await guild.roles.create({ name: RUOLO_VERIFICATO, color: '#2ecc71', reason: 'Preset Server' });

    let rAdmin = guild.roles.cache.find(r => r.name === RUOLO_ADMIN) || 
        await guild.roles.create({ name: RUOLO_ADMIN, color: '#e74c3c', permissions: [PermissionFlagsBits.Administrator], reason: 'Preset Server' });

    return { rOspite, rMembro, rAdmin };
}

// PANNELLI REGOLAMENTO ED AUTENTICAZIONE
async function inviaPannelliBase(guild, chVerifica, chRegole) {
    const embedRegole = new EmbedBuilder()
        .setTitle('📜 REGOLAMENTO UFFICIALE COMMUNITY')
        .setDescription(
            '1. **Rispetto Reciproco**: Nessun insulto, linguaggio d\'odio o discriminazione.\n' +
            '2. **No Spam**: Vietato inviare link non autorizzati nei canali o nei DM.\n' +
            '3. **Media & Social**: Rispetta il regolamento sul copyright nelle clip condivise.\n' +
            '4. **Account Sicuro**: Custodisci la tua password usata per la registrazione.'
        )
        .setColor('#f1c40f')
        .setFooter({ text: `${guild.name} • System Staff` });

    await chRegole.send({ embeds: [embedRegole] });

    const embedAuth = new EmbedBuilder()
        .setTitle('🛡️ VERIFICA E ACCESSO COMMUNITY')
        .setDescription(
            'Benvenuto nel server!\n\n' +
            '• **Nuovi Utenti**: Clicca su **Registrati** per creare il tuo account.\n' +
            '• **Utenti Registrati**: Clicca su **Accedi** per autenticarti.\n' +
            '• **Staff**: Clicca su **Accedi Admin** ed inserisci la password di amministrazione.'
        )
        .setColor('#2b2d31')
        .setFooter({ text: 'Sistema di Sicurezza Account' });

    const bottoni = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('btn_registrati').setLabel('Registrati 📝').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('btn_accedi').setLabel('Accedi 🔑').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId('btn_admin').setLabel('Accedi Admin 👑').setStyle(ButtonStyle.Danger)
    );

    await chVerifica.send({ embeds: [embedAuth], components: [bottoni] });
}

// COMANDO PER AVVIARE LA SELEZIONE PRESET
client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.content.startsWith('!')) return;

    if (message.content === '!preset-server') {
        if (message.author.id !== OWNER_ID) {
            return message.reply('❌ **Accesso Negato!** Solo il proprietario del server può eseguire questo comando.');
        }

        const menuPreset1 = new StringSelectMenuBuilder()
            .setCustomId('select_preset_1')
            .setPlaceholder('🎮 Seleziona Preset (1-10 Gaming & Community)...')
            .addOptions([
                { label: '1. Minecraft SMP & Fazioni', description: 'IP, Fazioni, Mercato, Build e Vocali Miniera', value: 'preset_smp', emoji: '⛏️' },
                { label: '2. Roblox Studio & Luau Dev', description: 'Scripting, GUI Design, Modelli 3D, Showcase e Trading', value: 'preset_roblox', emoji: '🧱' },
                { label: '3. Brawl Stars & Mobile Gaming', description: 'Trofei, Club, Cerca Squadra e Clip', value: 'preset_brawl', emoji: '🌵' },
                { label: '4. Content Creator & Multi-Social', description: 'Feed automatici YouTube, TikTok, Twitter e Snapchat', value: 'preset_creator', emoji: '🎬' },
                { label: '5. Multi-Gaming Hub Generico', description: 'Canali per vari videogiochi, clip e vocali', value: 'preset_multigaming', emoji: '🎮' },
                { label: '6. Fortnite Battle Royale', description: 'Coppie, Squad, Mappe Creative, Clip e Tornei', value: 'preset_fortnite', emoji: '🪂' },
                { label: '7. Valorant & Shooter Tattici', description: 'Ranked, Cerca Team, Lineup e Clip Gaming', value: 'preset_valorant', emoji: '🎯' },
                { label: '8. GTA V & Roleplay (FiveM)', description: 'Bande, Polizia, Lavori RP e Raduni Auto', value: 'preset_gta', emoji: '🚗' },
                { label: '9. Rocket League Competitive', description: 'Trading, 1v1, 2v2, 3v3 e Clip Highlights', value: 'preset_rocket', emoji: '🏎️' },
                { label: '10. Call of Duty & Warzone', description: 'Loadout, Warzone Squads e Search & Destroy', value: 'preset_cod', emoji: '🪖' }
            ]);

        const menuPreset2 = new StringSelectMenuBuilder()
            .setCustomId('select_preset_2')
            .setPlaceholder('📚 Seleziona Preset (11-20 Scuola, Dev, Musica & More)...')
            .addOptions([
                { label: '11. Esports & Tornei Competitivi', description: 'Scrims, Team, Reclutamento e Staff VOD Review', value: 'preset_esports', emoji: '🏆' },
                { label: '12. Studio, Scuola & Homework', description: 'Aiuto compiti, materie scolastiche e appunti', value: 'preset_scuola', emoji: '📚' },
                { label: '13. Programmazione & Software Dev', description: 'Node.js, Skript, Lua, Python, HTML/CSS e Bug Fix', value: 'preset_coding', emoji: '💻' },
                { label: '14. Musica, Beatmaking & Funk', description: 'Playlist, tracce, feedback audio e produzione', value: 'preset_musica', emoji: '🎧' },
                { label: '15. Grafica, 3D & Design Art', description: 'Logo, Banner, 3D Render, Photoshop e Feedback', value: 'preset_grafica', emoji: '🎨' },
                { label: '16. Clash Royale & Supercell Hub', description: 'Deck Building, Clan War e Scambi Carte', value: 'preset_clash', emoji: '👑' },
                { label: '17. Roleplay & Lore Avanzato', description: 'Diplomazia, Annunci Fazioni e Mercato', value: 'preset_rp', emoji: '🛡️' },
                { label: '18. Community Social & Chill', description: 'Chat generica, meme, anime, foto e vocali', value: 'preset_chill', emoji: '☕' },
                { label: '19. Anime, Manga & Cultura JP', description: 'Discussioni anime, consigli serie TV e Waifu zone', value: 'preset_anime', emoji: '⛩️' },
                { label: '20. Minimal & Essential Server', description: 'Struttura pulita, rapida ed essenziale', value: 'preset_minimal', emoji: '⚡' }
            ]);

        const row1 = new ActionRowBuilder().addComponents(menuPreset1);
        const row2 = new ActionRowBuilder().addComponents(menuPreset2);

        const embedMenu = new EmbedBuilder()
            .setTitle('⚙️ CONFIGURATORE AVANZATO SERVER (20 PRESET)')
            .setDescription('Scegli uno dei 20 preset dal menu per generare la struttura completa dei canali, l\'icona automatica e la configurazione del server!')
            .setColor('#5865F2');

        await message.reply({ embeds: [embedMenu], components: [row1, row2] });
    }
});

// GENERAZIONE CANALI, CATEGORIE, ICONA E DESCRIZIONE
client.on('interactionCreate', async (interaction) => {
    if (interaction.isStringSelectMenu() && (interaction.customId === 'select_preset_1' || interaction.customId === 'select_preset_2')) {
        if (interaction.user.id !== OWNER_ID) {
            return interaction.reply({ content: '❌ Solo il proprietario può selezionare il preset.', ephemeral: true });
        }

        await interaction.deferReply();
        const guild = interaction.guild;
        const { rOspite, rMembro, rAdmin } = await gestisciRuoli(guild);
        const everyone = guild.roles.everyone;

        const permMembri = [
            { id: everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
            { id: rOspite.id, allow: [PermissionFlagsBits.ViewChannel], deny: [PermissionFlagsBits.SendMessages] },
            { id: rMembro.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] }
        ];

        const permLettura = [
            { id: everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
            { id: rOspite.id, allow: [PermissionFlagsBits.ViewChannel], deny: [PermissionFlagsBits.SendMessages] },
            { id: rMembro.id, allow: [PermissionFlagsBits.ViewChannel], deny: [PermissionFlagsBits.SendMessages] }
        ];

        try {
            // 🎨 ICONA E DESCRIZIONE GENERATI AUTOMATICAMENTE
            const iconBuffer = generaIconaServer(guild.name);
            await guild.setIcon(iconBuffer);
            
            const desc = `Benvenuto in ${guild.name}! Community attiva con social, gaming e stanze interattive. Rispetta il regolamento e divertiti!`;
            if (guild.features.includes('COMMUNITY')) {
                await guild.setDescription(desc);
            }

            // CATEGORIA BASE INFORMAZIONI
            const catInfo = await guild.channels.create({ name: '📋 │ INFORMAZIONI & VERIFICA', type: ChannelType.GuildCategory });
            const chVerifica = await guild.channels.create({ name: '🔒│verifica', type: ChannelType.GuildText, parent: catInfo.id, permissionOverwrites: permLettura });
            const chRegole = await guild.channels.create({ name: '📜│regolamento', type: ChannelType.GuildText, parent: catInfo.id, permissionOverwrites: permLettura });
            await guild.channels.create({ name: '📢│annunci-server', type: ChannelType.GuildText, parent: catInfo.id, permissionOverwrites: permLettura });

            // CATEGORIA MEDIA & SOCIAL FEED
            const catSocial = await guild.channels.create({ name: '📡 │ FEED SOCIAL & MEDIA', type: ChannelType.GuildCategory, permissionOverwrites: permMembri });
            const chYT = await guild.channels.create({ name: '📺│youtube-feed', type: ChannelType.GuildText, parent: catSocial.id, permissionOverwrites: permLettura });
            const chTikTok = await guild.channels.create({ name: '🎵│tiktok-feed', type: ChannelType.GuildText, parent: catSocial.id, permissionOverwrites: permLettura });
            const chTwitter = await guild.channels.create({ name: '🐦│twitter-x-feed', type: ChannelType.GuildText, parent: catSocial.id, permissionOverwrites: permLettura });
            const chSnapchat = await guild.channels.create({ name: '👻│snapchat-feed', type: ChannelType.GuildText, parent: catSocial.id, permissionOverwrites: permLettura });

            await chYT.createWebhook({ name: 'YouTube Notifier' });
            await chTikTok.createWebhook({ name: 'TikTok Notifier' });
            await chTwitter.createWebhook({ name: 'Twitter Notifier' });
            await chSnapchat.createWebhook({ name: 'Snapchat Notifier' });

            const scelta = interaction.values[0];

            // CONFIGURAZIONE SPECIFICA DEI CANALI IN BASE AL PRESET
            if (scelta === 'preset_smp') {
                const cat = await guild.channels.create({ name: '⛏️ │ MINECRAFT SMP', type: ChannelType.GuildCategory, permissionOverwrites: permMembri });
                await guild.channels.create({ name: '🌐│ip-server', type: ChannelType.GuildText, parent: cat.id });
                await guild.channels.create({ name: '🛒│mercato', type: ChannelType.GuildText, parent: cat.id });
                await guild.channels.create({ name: '📸│build-showcase', type: ChannelType.GuildText, parent: cat.id });
            } else if (scelta === 'preset_roblox') {
                const cat = await guild.channels.create({ name: '🧱 │ ROBLOX STUDIO', type: ChannelType.GuildCategory, permissionOverwrites: permMembri });
                await guild.channels.create({ name: '💻│luau-scripting', type: ChannelType.GuildText, parent: cat.id });
                await guild.channels.create({ name: '🎨│gui-e-ui-design', type: ChannelType.GuildText, parent: cat.id });
                await guild.channels.create({ name: '🔄│trading-e-scambi', type: ChannelType.GuildText, parent: cat.id });
            } else if (scelta === 'preset_brawl') {
                const cat = await guild.channels.create({ name: '🌵 │ BRAWL STARS', type: ChannelType.GuildCategory, permissionOverwrites: permMembri });
                await guild.channels.create({ name: '🏆│trophy-push', type: ChannelType.GuildText, parent: cat.id });
                await guild.channels.create({ name: '👥│cerca-squadra', type: ChannelType.GuildText, parent: cat.id });
                await guild.channels.create({ name: '🏰│club-recruitment', type: ChannelType.GuildText, parent: cat.id });
            } else if (scelta === 'preset_scuola') {
                const cat = await guild.channels.create({ name: '📚 │ COMPITI & STUDIO', type: ChannelType.GuildCategory, permissionOverwrites: permMembri });
                await guild.channels.create({ name: '📐│matematica-e-scienze', type: ChannelType.GuildText, parent: cat.id });
                await guild.channels.create({ name: '📖│umanistica-e-lingue', type: ChannelType.GuildText, parent: cat.id });
                await guild.channels.create({ name: '📝│appunti-e-riassunti', type: ChannelType.GuildText, parent: cat.id });
            } else if (scelta === 'preset_coding') {
                const cat = await guild.channels.create({ name: '💻 │ PROGRAMMAZIONE', type: ChannelType.GuildCategory, permissionOverwrites: permMembri });
                await guild.channels.create({ name: '🟩│node-js-javascript', type: ChannelType.GuildText, parent: cat.id });
                await guild.channels.create({ name: '🐍│python-e-scripts', type: ChannelType.GuildText, parent: cat.id });
                await guild.channels.create({ name: '🐛│bug-fix-e-help', type: ChannelType.GuildText, parent: cat.id });
            } else if (scelta === 'preset_musica') {
                const cat = await guild.channels.create({ name: '🎧 │ MUSICA & BEATMAKING', type: ChannelType.GuildCategory, permissionOverwrites: permMembri });
                await guild.channels.create({ name: '🔥│funk-e-remix', type: ChannelType.GuildText, parent: cat.id });
                await guild.channels.create({ name: '🎵│playlist-sharing', type: ChannelType.GuildText, parent: cat.id });
                await guild.channels.create({ name: '🎹│beat-feedback', type: ChannelType.GuildText, parent: cat.id });
            } else {
                // CATEGORIA COMMUNITY PER TUTTI GLI ALTRI PRESET
                const cat = await guild.channels.create({ name: '💬 │ CHAT & COMMUNITY', type: ChannelType.GuildCategory, permissionOverwrites: permMembri });
                await guild.channels.create({ name: '💬│chat-generale', type: ChannelType.GuildText, parent: cat.id });
                await guild.channels.create({ name: '📸│media-e-foto', type: ChannelType.GuildText, parent: cat.id });
                await guild.channels.create({ name: '🎮│gaming-chat', type: ChannelType.GuildText, parent: cat.id });
            }

            // STANZE VOCALI TEMPORANEE
            const catTempVoice = await guild.channels.create({ name: '➕ │ STANZE VOCALI TEMPORANEE', type: ChannelType.GuildCategory, permissionOverwrites: permMembri });
            await guild.channels.create({ name: '➕ Crea Stanza Privata', type: ChannelType.GuildVoice, parent: catTempVoice.id });

            // ZONA AFK
            const catAFK = await guild.channels.create({ name: '💤 │ ZONA AFK', type: ChannelType.GuildCategory, permissionOverwrites: permMembri });
            const chAFK = await guild.channels.create({
                name: '💤│Muto e Inattivo',
                type: ChannelType.GuildVoice,
                parent: catAFK.id,
                permissionOverwrites: [
                    {
                        id: everyone.id,
                        deny: [
                            PermissionFlagsBits.Speak,
                            PermissionFlagsBits.Stream,
                            PermissionFlagsBits.UseSoundboard,
                            PermissionFlagsBits.UseExternalSounds,
                            PermissionFlagsBits.SendMessages
                        ]
                    }
                ]
            });
            await guild.setAFKChannel(chAFK);
            await guild.setAFKTimeout(300);

            // AREA STAFF
            const catStaff = await guild.channels.create({
                name: '🔒 │ AREA STAFF',
                type: ChannelType.GuildCategory,
                permissionOverwrites: [
                    { id: everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
                    { id: rAdmin.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] }
                ]
            });
            await guild.channels.create({ name: '💬│staff-chat', type: ChannelType.GuildText, parent: catStaff.id });
            await guild.channels.create({ name: '📋│log-verifiche', type: ChannelType.GuildText, parent: catStaff.id });

            await inviaPannelliBase(guild, chVerifica, chRegole);
            await interaction.editReply(`✅ **Preset "${scelta}" applicato con successo!**\n- Generata nuova Icona Grafica automatica\n- Creati canali social (YouTube, TikTok, Twitter, Snapchat)\n- Attivate Vocali Temporanee e Zona AFK.`);

        } catch (err) {
            console.error(err);
            await interaction.editReply('❌ **Errore nella creazione del preset!** Assicurati che il ruolo del Bot sia in cima alla lista nei Ruoli del Server.');
        }
    }

    // MODALI DI AUTENTICAZIONE
    if (interaction.isButton()) {
        if (interaction.customId === 'btn_registrati') {
            const modal = new ModalBuilder().setCustomId('modal_registrati').setTitle('Registrazione Account');
            modal.addComponents(
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('input_user').setLabel('Nickname').setStyle(TextInputStyle.Short).setRequired(true)),
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('input_pass').setLabel('Password').setStyle(TextInputStyle.Short).setRequired(true))
            );
            await interaction.showModal(modal);
        }
        if (interaction.customId === 'btn_accedi') {
            const modal = new ModalBuilder().setCustomId('modal_accedi').setTitle('Accesso Account');
            modal.addComponents(
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('input_user').setLabel('Nickname').setStyle(TextInputStyle.Short).setRequired(true)),
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('input_pass').setLabel('Password').setStyle(TextInputStyle.Short).setRequired(true))
            );
            await interaction.showModal(modal);
        }
        if (interaction.customId === 'btn_admin') {
            const modal = new ModalBuilder().setCustomId('modal_admin').setTitle('Autenticazione Admin');
            modal.addComponents(
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('input_admin_pass').setLabel('Master Password Admin').setStyle(TextInputStyle.Short).setRequired(true))
            );
            await interaction.showModal(modal);
        }
    }

    if (interaction.isModalSubmit()) {
        const rOspite = interaction.guild.roles.cache.find(r => r.name === RUOLO_OSPITE);
        const rMembro = interaction.guild.roles.cache.find(r => r.name === RUOLO_VERIFICATO);
        const rAdmin = interaction.guild.roles.cache.find(r => r.name === RUOLO_ADMIN);

        if (interaction.customId === 'modal_registrati') {
            const username = interaction.fields.getTextInputValue('input_user').trim().toLowerCase();
            const password = interaction.fields.getTextInputValue('input_pass').trim();

            if (utentiRegistrati.has(username)) {
                return interaction.reply({ content: '❌ Nickname già registrato! Usa **Accedi**.', ephemeral: true });
            }
            utentiRegistrati.set(username, password);
            if (rOspite) await interaction.member.roles.remove(rOspite).catch(() => {});
            if (rMembro) await interaction.member.roles.add(rMembro).catch(() => {});
            return interaction.reply({ content: `✅ Account **${username}** registrato con successo!`, ephemeral: true });
        }

        if (interaction.customId === 'modal_accedi') {
            const username = interaction.fields.getTextInputValue('input_user').trim().toLowerCase();
            const password = interaction.fields.getTextInputValue('input_pass').trim();

            if (!utentiRegistrati.has(username) || utentiRegistrati.get(username) !== password) {
                return interaction.reply({ content: '❌ Credenziali errate o account non esistente!', ephemeral: true });
            }
            if (rOspite) await interaction.member.roles.remove(rOspite).catch(() => {});
            if (rMembro) await interaction.member.roles.add(rMembro).catch(() => {});
            return interaction.reply({ content: `✅ Accesso eseguito come **${username}**!`, ephemeral: true });
        }

        if (interaction.customId === 'modal_admin') {
            const adminPass = interaction.fields.getTextInputValue('input_admin_pass').trim();

            if (adminPass !== ADMIN_MASTER_PASSWORD) {
                return interaction.reply({ content: '❌ Master Password errata!', ephemeral: true });
            }
            if (rAdmin) await interaction.member.roles.add(rAdmin).catch(() => {});
            return interaction.reply({ content: '👑 Autenticazione Admin riuscita!', ephemeral: true });
        }
    }
});

// AUTOMAZIONE STANZE VOCALI TEMPORANEE
client.on('voiceStateUpdate', async (oldState, newState) => {
    const user = newState.member.user;
    const guild = newState.guild;

    if (newState.channel && newState.channel.name.includes('➕ Crea Stanza Privata')) {
        const createdChannel = await guild.channels.create({
            name: `🔊 Stanza di ${user.username}`,
            type: ChannelType.GuildVoice,
            parent: newState.channel.parentId,
            permissionOverwrites: [
                {
                    id: user.id,
                    allow: [
                        PermissionFlagsBits.ManageChannels,
                        PermissionFlagsBits.MuteMembers,
                        PermissionFlagsBits.DeafenMembers,
                        PermissionFlagsBits.MoveMembers
                    ]
                }
            ]
        });

        tempChannels.set(createdChannel.id, user.id);
        await newState.setChannel(createdChannel);
    }

    if (oldState.channel && tempChannels.has(oldState.channel.id)) {
        if (oldState.channel.members.size === 0) {
            const chan = oldState.channel;
            tempChannels.delete(chan.id);
            await chan.delete().catch(() => {});
        }
    }
});

client.login(process.env.DISCORD_TOKEN);
