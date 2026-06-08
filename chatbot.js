/* chatbot.js — Asistente virtual Loma · Lomas de Ancón
   Envía a /chat: { message, session_id, nombre, email, history }
*/
(function () {
  'use strict';

  /* ── Config ──────────────────────────────────────────────── */
  const API_URL = (window.CHATBOT_API_URL || 'https://las-lomas-chatbot-backend-1456509096.us-central1.run.app') + '/chat';

  const CHIPS = [
    ['Tours y actividades',  '¿Qué tours y actividades están disponibles?'],
    ['Cómo llegar',          '¿Cómo llego a Lomas de Ancón desde Lima?'],
    ['Voluntariado',         '¿Cómo puedo participar como voluntario?'],
    ['Precios',              '¿Cuáles son los precios de entrada y actividades?'],
    ['Flora y fauna',        '¿Qué flora y fauna puedo ver en las lomas?'],
    ['Negocios locales',     '¿Qué negocios locales y artesanías hay?'],
  ];

  /* ── State ───────────────────────────────────────────────── */
  let chatHistory = [];  // renamed to avoid collision with window.history
  let isOpen     = false;
  let busy       = false;
  let registered = false;   // true after nombre+email submitted
  let userData   = { nombre: '', email: '' };
  let sessionId  = generateSessionId();

  function generateSessionId() {
    return 'sess-' + Math.random().toString(36).slice(2, 12) + Date.now().toString(36).slice(-4);
  }

  /* ── Styles ──────────────────────────────────────────────── */
  const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700&family=Fraunces:wght@700;800&display=swap');

#cb{position:fixed;bottom:24px;right:24px;z-index:9999;font-family:"Manrope",system-ui,sans-serif}

/* Button */
#cb-btn{width:58px;height:58px;border-radius:50%;background:linear-gradient(145deg,#3a7034,#2d5a27);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 8px 28px rgba(45,90,39,.48);position:relative;transition:transform .2s,box-shadow .2s;color:#c49a3c;padding:0;outline:none}
#cb-btn:hover{transform:scale(1.08);box-shadow:0 12px 36px rgba(45,90,39,.55)}
.cb-ic{position:absolute;display:flex;align-items:center;justify-content:center;transition:opacity .18s,transform .18s}
.cb-ic .material-symbols-rounded{font-size:26px;font-variation-settings:'FILL' 1,'wght' 500,'GRAD' 0,'opsz' 24}
.cb-ic-close{opacity:0;transform:rotate(-90deg)}
#cb-btn.open .cb-ic-chat{opacity:0;transform:rotate(90deg)}
#cb-btn.open .cb-ic-close{opacity:1;transform:rotate(0)}
.cb-ring{position:absolute;inset:-5px;border-radius:50%;border:2px solid rgba(196,154,60,.45);animation:cbRing 3.5s ease-out infinite;pointer-events:none}
@keyframes cbRing{0%{transform:scale(1);opacity:.7}70%,100%{transform:scale(1.42);opacity:0}}

/* Tooltip */
#cb-tip{position:absolute;bottom:70px;right:0;background:#fff;color:#3d2b1a;padding:9px 15px;border-radius:14px 14px 4px 14px;font-size:13px;font-weight:600;white-space:nowrap;box-shadow:0 4px 18px rgba(20,12,5,.18);pointer-events:none;opacity:0;animation:cbTipA .4s ease 2.5s forwards,cbTipB .4s ease 7.5s forwards}
@keyframes cbTipA{to{opacity:1}}
@keyframes cbTipB{to{opacity:0}}

/* Window */
#cb-win{position:absolute;bottom:76px;right:0;width:360px;border-radius:20px;overflow:hidden;box-shadow:0 24px 60px rgba(20,12,5,.32),0 0 0 1px rgba(20,12,5,.08);background:#f5f0e8;transform-origin:bottom right;animation:cbWin .26s cubic-bezier(.34,1.56,.64,1)}
#cb-win[hidden]{display:none!important}
@keyframes cbWin{from{opacity:0;transform:scale(.88) translateY(10px)}to{opacity:1;transform:none}}
@media(max-width:430px){#cb-win{width:calc(100vw - 40px);right:-4px}#cb{bottom:16px;right:16px}}

/* Header */
.cb-head{display:flex;align-items:center;gap:12px;padding:14px 16px;background:linear-gradient(135deg,#2d5a27 0%,#1a3818 100%)}
.cb-hava{width:44px;height:44px;flex:0 0 44px;border-radius:50%;background:rgba(196,154,60,.15);border:1.5px solid rgba(196,154,60,.45);display:flex;align-items:center;justify-content:center;color:#c49a3c;position:relative}
.cb-hava::after{content:"";position:absolute;bottom:1px;right:1px;width:9px;height:9px;border-radius:50%;background:#4ade80;border:2px solid #2d5a27}
.cb-hava .material-symbols-rounded{font-size:22px;font-variation-settings:'FILL' 1,'wght' 500,'GRAD' 0,'opsz' 24}
.cb-hinfo{flex:1;min-width:0}
.cb-hname{font-family:"Fraunces",Georgia,serif;font-weight:700;font-size:16px;color:#fff;line-height:1}
.cb-hsub{font-size:11px;color:rgba(240,230,200,.68);margin-top:3px;letter-spacing:.04em}
.cb-xbtn{width:32px;height:32px;border-radius:50%;background:rgba(255,255,255,.1);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,.75);transition:background .2s;padding:0;flex:0 0 32px}
.cb-xbtn:hover{background:rgba(255,255,255,.2)}
.cb-xbtn .material-symbols-rounded{font-size:18px}

/* ── Registration panel ── */
#cb-reg{padding:28px 22px 22px;background:#f5f0e8;display:flex;flex-direction:column;align-items:center;text-align:center}
.cb-reg-icon{width:64px;height:64px;border-radius:50%;background:linear-gradient(145deg,#3a7034,#2d5a27);display:flex;align-items:center;justify-content:center;margin-bottom:14px;box-shadow:0 6px 20px rgba(45,90,39,.3),0 0 0 5px rgba(45,90,39,.08);color:#c49a3c}
.cb-reg-icon .material-symbols-rounded{font-size:30px;font-variation-settings:'FILL' 1,'wght' 500,'GRAD' 0,'opsz' 48}
.cb-reg-title{font-family:"Fraunces",Georgia,serif;font-weight:800;font-size:20px;color:#3d2b1a;margin:0 0 6px}
.cb-reg-sub{font-size:13px;color:#7a5028;line-height:1.55;margin:0 0 20px;max-width:28ch}
.cb-reg-form{width:100%;display:flex;flex-direction:column;gap:10px}
.cb-reg-input{width:100%;border:1.5px solid rgba(61,43,26,.18);border-radius:10px;padding:10px 14px;font-size:13.5px;color:#3d2b1a;font-family:"Manrope",system-ui,sans-serif;background:#fff;outline:none;transition:border-color .2s,box-shadow .2s;box-sizing:border-box}
.cb-reg-input:focus{border-color:#3a7034;box-shadow:0 0 0 3px rgba(58,112,52,.15)}
.cb-reg-input::placeholder{color:#a08060}
.cb-reg-btn{width:100%;padding:11px;border-radius:10px;background:linear-gradient(135deg,#3a7034,#2d5a27);border:none;color:#c49a3c;font-family:"Manrope",system-ui,sans-serif;font-size:14px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:7px;transition:opacity .2s,transform .15s;box-shadow:0 4px 14px rgba(45,90,39,.3);margin-top:2px}
.cb-reg-btn:hover{opacity:.9;transform:translateY(-1px)}
.cb-reg-btn .material-symbols-rounded{font-size:16px}
.cb-reg-err{font-size:12px;color:#c0392b;background:#fdf0f0;border:1px solid rgba(192,57,43,.2);border-radius:8px;padding:8px 12px;display:none}
.cb-reg-err.show{display:block}

/* Welcome */
#cb-welcome{padding:30px 22px 18px;display:flex;flex-direction:column;align-items:center;text-align:center;background:#f5f0e8}
.cb-wava{width:72px;height:72px;border-radius:50%;background:linear-gradient(145deg,#3a7034,#2d5a27);display:flex;align-items:center;justify-content:center;margin-bottom:16px;box-shadow:0 8px 24px rgba(45,90,39,.32),0 0 0 6px rgba(45,90,39,.08);color:#c49a3c}
.cb-wava .material-symbols-rounded{font-size:36px;font-variation-settings:'FILL' 1,'wght' 500,'GRAD' 0,'opsz' 48}
.cb-wtitle{font-family:"Fraunces",Georgia,serif;font-weight:800;font-size:22px;color:#3d2b1a;line-height:1.1;margin:0 0 8px}
.cb-wsub{font-size:13.5px;color:#7a5028;line-height:1.55;margin:0 0 22px;max-width:26ch}
.cb-chips{display:flex;flex-wrap:wrap;gap:7px;justify-content:center;padding-bottom:4px}
.cb-chip{padding:8px 14px;border-radius:999px;border:1.5px solid rgba(196,154,60,.55);background:transparent;color:#3d2b1a;font-size:12px;font-weight:600;cursor:pointer;font-family:"Manrope",system-ui,sans-serif;transition:background .18s,border-color .18s,color .18s;line-height:1}
.cb-chip:hover{background:rgba(196,154,60,.14);border-color:#c49a3c}

/* Messages */
#cb-msgs{padding:14px;overflow-y:auto;max-height:380px;flex-direction:column;gap:10px;background:#f5f0e8;scroll-behavior:smooth;display:none}
.cb-m{display:flex;gap:8px;align-items:flex-end;animation:cbMsgIn .2s ease}
@keyframes cbMsgIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
.cb-m.bot{align-self:flex-start;max-width:88%}
.cb-m.usr{align-self:flex-end;flex-direction:row-reverse;max-width:88%}
.cb-mava{width:28px;height:28px;flex:0 0 28px;border-radius:50%;background:linear-gradient(145deg,#3a7034,#2d5a27);display:flex;align-items:center;justify-content:center;color:#c49a3c}
.cb-mava .material-symbols-rounded{font-size:13px;font-variation-settings:'FILL' 1,'wght' 500,'GRAD' 0,'opsz' 24}
.cb-mbub{padding:10px 13px;border-radius:16px;font-size:13.5px;line-height:1.55;word-break:break-word}
.cb-m.bot .cb-mbub{background:#fff;color:#2c1a0e;border-bottom-left-radius:4px;box-shadow:0 1px 4px rgba(20,12,5,.08)}
.cb-m.usr .cb-mbub{background:#2d5a27;color:#fff;border-bottom-right-radius:4px;box-shadow:0 2px 8px rgba(45,90,39,.28)}
.cb-mbub a{color:#2d5a27;font-weight:600;text-decoration:underline}
.cb-mbub a:hover{color:#1f4a1a}
.cb-m.usr .cb-mbub a{color:#fff}
.cb-mbub ul{margin:6px 0 6px 18px;padding:0;list-style-type:disc}
.cb-mbub li{margin-bottom:4px}
.cb-mbub li:last-child{margin-bottom:0}
.cb-dots{display:flex;gap:4px;align-items:center;padding:1px 0}
.cb-dot{width:7px;height:7px;border-radius:50%;background:#c49a3c;animation:cbDot 1.2s ease-in-out infinite}
.cb-dot:nth-child(2){animation-delay:.2s}
.cb-dot:nth-child(3){animation-delay:.4s}
@keyframes cbDot{0%,60%,100%{transform:none;opacity:.35}30%{transform:translateY(-6px);opacity:1}}

/* Input bar */
.cb-ibar{display:flex;align-items:center;gap:8px;padding:11px 13px;background:#fff;border-top:1px solid rgba(61,43,26,.08)}
.cb-inp{flex:1;border:none;outline:none;background:#f0ebe0;border-radius:999px;padding:10px 16px;font-size:13.5px;color:#3d2b1a;font-family:"Manrope",system-ui,sans-serif}
.cb-inp::placeholder{color:#a08060}
.cb-snd{width:38px;height:38px;flex:0 0 38px;border-radius:50%;background:#2d5a27;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#c49a3c;transition:background .2s,transform .15s;box-shadow:0 3px 10px rgba(45,90,39,.35);padding:0}
.cb-snd:hover{background:#1f4a1a;transform:scale(1.08)}
.cb-snd:disabled{opacity:.4;cursor:not-allowed;transform:none}
.cb-snd .material-symbols-rounded{font-size:17px;font-variation-settings:'FILL' 1,'wght' 600,'GRAD' 0,'opsz' 24}
`;

  /* ── Inject styles ───────────────────────────────────────── */
  const styleEl = document.createElement('style');
  styleEl.textContent = CSS;
  document.head.appendChild(styleEl);

  /* ── Build DOM ───────────────────────────────────────────── */
  const root = document.createElement('div');
  root.id = 'cb';
  root.innerHTML = `
    <div id="cb-tip">¿En qué puedo ayudarte? 🌿</div>
    <button id="cb-btn" aria-label="Abrir chat con Loma">
      <span class="cb-ic cb-ic-chat"><span class="material-symbols-rounded">chat</span></span>
      <span class="cb-ic cb-ic-close"><span class="material-symbols-rounded">close</span></span>
      <span class="cb-ring"></span>
    </button>
    <div id="cb-win" hidden>
      <div class="cb-head">
        <div class="cb-hava"><span class="material-symbols-rounded">landscape</span></div>
        <div class="cb-hinfo">
          <div class="cb-hname">Loma</div>
          <div class="cb-hsub">Asistente de Lomas de Ancón</div>
        </div>
        <button class="cb-xbtn" id="cb-xbtn" aria-label="Cerrar">
          <span class="material-symbols-rounded">close</span>
        </button>
      </div>

      <!-- Registration panel -->
      <div id="cb-reg">
        <div class="cb-reg-icon"><span class="material-symbols-rounded">waving_hand</span></div>
        <div class="cb-reg-title">¡Hola! Soy Loma 🌿</div>
        <div class="cb-reg-sub">Para ayudarte mejor, necesito tu nombre y correo.</div>
        <div class="cb-reg-form">
          <input id="cb-reg-nombre" class="cb-reg-input" type="text" placeholder="Tu nombre" maxlength="80" autocomplete="name" />
          <input id="cb-reg-email" class="cb-reg-input" type="email" placeholder="tu@correo.com" maxlength="120" autocomplete="email" />
          <div id="cb-reg-err" class="cb-reg-err">Por favor ingresa un nombre y correo válidos.</div>
          <button id="cb-reg-btn" class="cb-reg-btn">
            <span class="material-symbols-rounded">arrow_forward</span>Comenzar chat
          </button>
        </div>
      </div>

      <!-- Welcome / chips (shown after registration) -->
      <div id="cb-welcome" style="display:none">
        <div class="cb-wava"><span class="material-symbols-rounded">landscape</span></div>
        <div class="cb-wtitle" id="cb-wtitle">¡Hola!</div>
        <div class="cb-wsub">Tu guía en las lomas, dunas y bahía de Ancón. ¿En qué puedo ayudarte hoy?</div>
        <div class="cb-chips" id="cb-chips"></div>
      </div>

      <!-- Messages -->
      <div id="cb-msgs"></div>

      <!-- Input bar (hidden until registered) -->
      <div class="cb-ibar" id="cb-ibar" style="display:none">
        <input id="cb-inp" class="cb-inp" type="text" placeholder="Escribe tu mensaje..." autocomplete="off" />
        <button id="cb-snd" class="cb-snd" aria-label="Enviar">
          <span class="material-symbols-rounded">send</span>
        </button>
      </div>
    </div>`;
  document.body.appendChild(root);

  /* ── Refs ────────────────────────────────────────────────── */
  const $btn        = document.getElementById('cb-btn');
  const $win        = document.getElementById('cb-win');
  const $xbtn       = document.getElementById('cb-xbtn');
  const $reg        = document.getElementById('cb-reg');
  const $regNombre  = document.getElementById('cb-reg-nombre');
  const $regEmail   = document.getElementById('cb-reg-email');
  const $regErr     = document.getElementById('cb-reg-err');
  const $regBtn     = document.getElementById('cb-reg-btn');
  const $welc       = document.getElementById('cb-welcome');
  const $wtitle     = document.getElementById('cb-wtitle');
  const $chips      = document.getElementById('cb-chips');
  const $msgs       = document.getElementById('cb-msgs');
  const $ibar       = document.getElementById('cb-ibar');
  const $inp        = document.getElementById('cb-inp');
  const $snd        = document.getElementById('cb-snd');

  /* ── Build chips ─────────────────────────────────────────── */
  CHIPS.forEach(([label, q]) => {
    const b = document.createElement('button');
    b.className = 'cb-chip';
    b.textContent = label;
    b.addEventListener('click', () => sendMsg(q));
    $chips.appendChild(b);
  });

  /* ── Toggle ──────────────────────────────────────────────── */
  function toggle() {
    isOpen = !isOpen;
    $btn.classList.toggle('open', isOpen);
    if (isOpen) {
      $win.removeAttribute('hidden');
      setTimeout(() => {
        if (!registered) $regNombre.focus();
        else $inp.focus();
      }, 120);
    } else {
      $win.setAttribute('hidden', '');
    }
  }
  $btn.addEventListener('click', toggle);
  $xbtn.addEventListener('click', toggle);

  /* ── Registration ────────────────────────────────────────── */
  function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function submitRegistration() {
    const nombre = $regNombre.value.trim();
    const email  = $regEmail.value.trim();

    if (!nombre || !validateEmail(email)) {
      $regErr.classList.add('show');
      return;
    }

    $regErr.classList.remove('show');
    userData = { nombre, email };
    registered = true;

    // Transition: hide reg panel, show chat UI
    $reg.style.display = 'none';
    $wtitle.textContent = `¡Hola, ${nombre.split(' ')[0]}!`;
    $welc.style.display = 'flex';
    $welc.style.flexDirection = 'column';
    $welc.style.alignItems = 'center';
    $welc.style.textAlign = 'center';
    $ibar.style.display = 'flex';
    setTimeout(() => $inp.focus(), 80);
  }

  $regBtn.addEventListener('click', submitRegistration);
  [$regNombre, $regEmail].forEach(el => {
    el.addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); submitRegistration(); }
    });
  });

  /* ── Send message ────────────────────────────────────────── */
  async function sendMsg(override) {
    if (!registered) return;
    const text = (typeof override === 'string' ? override : $inp.value).trim();
    if (!text || busy) return;
    $inp.value = '';

    // Hide welcome panel on first message
    if ($welc.style.display !== 'none') {
      $welc.style.display = 'none';
      $msgs.style.display = 'flex';
      $msgs.style.flexDirection = 'column';
      $msgs.style.gap = '10px';
    }

    appendMsg('usr', text);

    // Snapshot history BEFORE adding current message.
    // On the first call this is always [] — never null or undefined.
    const historySnapshot = chatHistory.slice();

    busy = true;
    $snd.disabled = true;
    const typing = appendTyping();

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message:    text,
          session_id: sessionId,
          nombre:     userData.nombre,
          email:      userData.email,
          history:    historySnapshot   // [] on first msg, prior turns after that
        })
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      // Remove typing indicator and prepare bot bubble for streaming content
      typing.remove();
      const botMsg = appendMsg('bot', '');
      const bub = botMsg.querySelector('.cb-mbub');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let reply = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (!line.startsWith("data:")) continue;
          try {
            const payload = JSON.parse(line.slice(5).trim());
            if (payload.text) {
              reply += payload.text;
              bub.innerHTML = parseMarkdown(reply);
              $msgs.scrollTop = $msgs.scrollHeight;
            }
          } catch (_) {}
        }
      }

      if (!reply) {
        bub.innerHTML = parseMarkdown('Lo siento, no pude procesar tu mensaje.');
      } else {
        // Persist both turns only after a successful response
        chatHistory.push({ role: 'user',      content: text  });
        chatHistory.push({ role: 'assistant', content: reply });
      }

    } catch (err) {
      console.error('[Chatbot] Error:', err);
      typing.remove();
      appendMsg('bot', 'Hubo un problema de conexión. Puedes llamarnos al +51 984 350 983 o escribirnos a hola@lomasdeancon.pe.');
      // chatHistory not modified on error — stays clean
    }

    busy = false;
    $snd.disabled = false;
    $msgs.scrollTop = $msgs.scrollHeight;
  }

  /* ── Helpers ─────────────────────────────────────────────── */
  function appendMsg(role, text) {
    const d = document.createElement('div');
    d.className = 'cb-m ' + role;
    const ava = role === 'bot'
      ? `<div class="cb-mava"><span class="material-symbols-rounded">landscape</span></div>` : '';
    d.innerHTML = ava + `<div class="cb-mbub">${parseMarkdown(text)}</div>`;
    $msgs.appendChild(d);
    $msgs.scrollTop = $msgs.scrollHeight;
    return d;
  }

  function appendTyping() {
    const d = document.createElement('div');
    d.className = 'cb-m bot';
    d.innerHTML = `<div class="cb-mava"><span class="material-symbols-rounded">landscape</span></div><div class="cb-mbub"><div class="cb-dots"><span class="cb-dot"></span><span class="cb-dot"></span><span class="cb-dot"></span></div></div>`;
    $msgs.appendChild(d);
    $msgs.scrollTop = $msgs.scrollHeight;
    return d;
  }

  function parseMarkdown(text) {
    if (!text) return '';
    
    // 1. Escapar caracteres HTML para prevenir XSS
    let html = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // 2. Procesar líneas para identificar listas con viñetas
    const lines = html.split('\n');
    let inList = false;
    const processedLines = [];

    for (let line of lines) {
      // Coincide con viñetas tipo "* elemento" o "- elemento"
      const listMatch = line.match(/^(\s*)([\*\-])\s+(.*)$/);
      if (listMatch) {
        if (!inList) {
          inList = true;
          processedLines.push('<ul>');
        }
        processedLines.push(`<li>${listMatch[3]}</li>`);
      } else {
        if (inList) {
          inList = false;
          processedLines.push('</ul>');
        }
        processedLines.push(line);
      }
    }
    if (inList) {
      processedLines.push('</ul>');
    }

    html = processedLines.join('\n');

    // 3. Formatear texto en negrita: **texto** -> <strong>texto</strong>
    html = html.replace(/\*\*([\s\S]*?)\*\*/g, '<strong>$1</strong>');

    // 4. Formatear enlaces: [texto](url) -> <a href="url" target="_blank" rel="noopener noreferrer">texto</a>
    html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^\s\)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

    // 5. Convertir saltos de línea restantes a <br>
    html = html.replace(/\n/g, '<br>');

    // Limpiar saltos de línea adicionales alrededor de listas
    html = html.replace(/<br>\s*<ul>/g, '<ul>')
               .replace(/<\/ul>\s*<br>/g, '</ul>')
               .replace(/<\/li>\s*<br>/g, '</li>');

    return html;
  }

  /* ── Input events ────────────────────────────────────────── */
  $inp.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMsg(); }
  });
  $snd.addEventListener('click', () => sendMsg());

})();
