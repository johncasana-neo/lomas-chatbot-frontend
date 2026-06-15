/* chatbot.js — Asistente virtual Loma · Lomas de Ancón */
(function () {
  'use strict';

  const BACKEND_URL = window.LOMAS_CHAT_API || 'http://localhost:8000';
  const WHATSAPP_URL = 'https://wa.me/51984350983';

  const CHIPS = [
    ['Tours y actividades',  '¿Qué tours y actividades están disponibles?'],
    ['Reservar tour',        'Quiero reservar un tour, ¿cómo lo hago?'],
    ['Cómo llegar',          '¿Cómo llego a Lomas de Ancón desde Lima?'],
    ['Voluntariado',         '¿Cómo puedo participar como voluntario?'],
    ['Precios',              '¿Cuáles son los precios de entrada y actividades?'],
    ['Flora y fauna',        '¿Qué flora y fauna puedo ver en las lomas?'],
  ];

  const SESSION_ID = (() => {
    let id = localStorage.getItem('lomas_session_id');
    if (!id) {
      id = 'sess-' + Math.random().toString(36).slice(2, 10);
      localStorage.setItem('lomas_session_id', id);
    }
    return id;
  })();

  let history   = JSON.parse(localStorage.getItem('lomas_history') || '[]');
  let isOpen    = false;
  let atWelcome = history.length === 0;
  let busy      = false;
  let turnCount = Math.floor(history.length / 2);
  let ratingShown = localStorage.getItem('lomas_rating_shown') === '1';

  /* ── STYLES ─────────────────────────────────────────────────── */
  const CSS = `
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

/* Tooltip — persiste hasta primer click */
#cb-tip{position:absolute;bottom:70px;right:0;background:#fff;color:#3d2b1a;padding:9px 15px;border-radius:14px 14px 4px 14px;font-size:13px;font-weight:600;white-space:nowrap;box-shadow:0 4px 18px rgba(20,12,5,.18);pointer-events:none;opacity:0;animation:cbTipA .4s ease 2s forwards;transition:opacity .3s}
#cb-tip.hide{opacity:0!important;animation:none}
@keyframes cbTipA{to{opacity:1}}

/* Window */
#cb-win{position:absolute;bottom:76px;right:0;width:420px;border-radius:20px;overflow:hidden;box-shadow:0 24px 60px rgba(20,12,5,.32),0 0 0 1px rgba(20,12,5,.08);background:#f5f0e8;transform-origin:bottom right;animation:cbWin .26s cubic-bezier(.34,1.56,.64,1);display:flex;flex-direction:column;max-height:min(70vh,640px)}
#cb-win[hidden]{display:none!important}
@keyframes cbWin{from{opacity:0;transform:scale(.88) translateY(10px)}to{opacity:1;transform:none}}
@media(max-width:480px){#cb-win{position:fixed;inset:0;width:auto;height:100dvh;max-height:none;border-radius:0;bottom:0;right:0}#cb{bottom:16px;right:16px}}

/* Header */
.cb-head{display:flex;align-items:center;gap:12px;padding:14px 16px;background:linear-gradient(135deg,#2d5a27 0%,#1a3818 100%);flex:0 0 auto}
.cb-hava{width:44px;height:44px;flex:0 0 44px;border-radius:50%;background:rgba(196,154,60,.15);border:1.5px solid rgba(196,154,60,.45);display:flex;align-items:center;justify-content:center;color:#c49a3c;position:relative}
.cb-hava::after{content:"";position:absolute;bottom:1px;right:1px;width:9px;height:9px;border-radius:50%;background:#4ade80;border:2px solid #2d5a27}
.cb-hava .material-symbols-rounded{font-size:22px;font-variation-settings:'FILL' 1,'wght' 500,'GRAD' 0,'opsz' 24}
.cb-hinfo{flex:1;min-width:0}
.cb-hname{font-family:"Fraunces",Georgia,serif;font-weight:700;font-size:16px;color:#fff;line-height:1}
.cb-hsub{font-size:11px;color:rgba(240,230,200,.68);margin-top:3px;letter-spacing:.04em}
.cb-hactions{display:flex;gap:6px;align-items:center}
.cb-hbtn{width:32px;height:32px;border-radius:50%;background:rgba(255,255,255,.1);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,.85);transition:background .2s;padding:0;flex:0 0 32px;text-decoration:none}
.cb-hbtn:hover{background:rgba(255,255,255,.22)}
.cb-hbtn .material-symbols-rounded{font-size:18px}
.cb-hbtn.wa{background:#25D366;color:#fff}
.cb-hbtn.wa:hover{background:#1ebe57}

/* Welcome */
#cb-welcome{padding:30px 22px 18px;display:flex;flex-direction:column;align-items:center;text-align:center;background:#f5f0e8;flex:1;overflow-y:auto}
.cb-wava{width:72px;height:72px;border-radius:50%;background:linear-gradient(145deg,#3a7034,#2d5a27);display:flex;align-items:center;justify-content:center;margin-bottom:16px;box-shadow:0 8px 24px rgba(45,90,39,.32),0 0 0 6px rgba(45,90,39,.08);color:#c49a3c}
.cb-wava .material-symbols-rounded{font-size:36px;font-variation-settings:'FILL' 1,'wght' 500,'GRAD' 0,'opsz' 48}
.cb-wtitle{font-family:"Fraunces",Georgia,serif;font-weight:800;font-size:22px;color:#3d2b1a;line-height:1.1;margin:0 0 8px}
.cb-wsub{font-size:13.5px;color:#7a5028;line-height:1.55;margin:0 0 22px;max-width:26ch}
.cb-chips{display:flex;flex-wrap:wrap;gap:7px;justify-content:center;padding-bottom:4px}
.cb-chip{padding:8px 14px;border-radius:999px;border:1.5px solid rgba(196,154,60,.55);background:transparent;color:#3d2b1a;font-size:12px;font-weight:600;cursor:pointer;font-family:"Manrope",system-ui,sans-serif;transition:background .18s,border-color .18s,color .18s;line-height:1}
.cb-chip:hover{background:rgba(196,154,60,.14);border-color:#c49a3c}

/* Messages */
#cb-msgs{padding:14px;overflow-y:auto;flex:1;flex-direction:column;gap:10px;background:#f5f0e8;scroll-behavior:smooth;display:none;min-height:0}
.cb-m{display:flex;gap:8px;align-items:flex-end;animation:cbMsgIn .2s ease}
@keyframes cbMsgIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
.cb-m.bot{align-self:flex-start;max-width:88%}
.cb-m.usr{align-self:flex-end;flex-direction:row-reverse;max-width:88%}
.cb-mava{width:28px;height:28px;flex:0 0 28px;border-radius:50%;background:linear-gradient(145deg,#3a7034,#2d5a27);display:flex;align-items:center;justify-content:center;color:#c49a3c}
.cb-mava .material-symbols-rounded{font-size:13px;font-variation-settings:'FILL' 1,'wght' 500,'GRAD' 0,'opsz' 24}
.cb-mbub{padding:10px 13px;border-radius:16px;font-size:13.5px;line-height:1.55;word-break:break-word}
.cb-m.bot .cb-mbub{background:#fff;color:#2c1a0e;border-bottom-left-radius:4px;box-shadow:0 1px 4px rgba(20,12,5,.08)}
.cb-m.usr .cb-mbub{background:#2d5a27;color:#fff;border-bottom-right-radius:4px;box-shadow:0 2px 8px rgba(45,90,39,.28)}
.cb-time{font-size:10px;color:#a08060;margin-top:3px;padding:0 4px}
.cb-dots{display:flex;gap:4px;align-items:center;padding:1px 0}
.cb-dot{width:7px;height:7px;border-radius:50%;background:#c49a3c;animation:cbDot 1.2s ease-in-out infinite}
.cb-dot:nth-child(2){animation-delay:.2s}
.cb-dot:nth-child(3){animation-delay:.4s}
@keyframes cbDot{0%,60%,100%{transform:none;opacity:.35}30%{transform:translateY(-6px);opacity:1}}

/* Follow-up chips bajo respuesta */
.cb-followups{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0 4px 36px;animation:cbMsgIn .25s ease}
.cb-fchip{padding:6px 11px;border-radius:999px;border:1px solid rgba(45,90,39,.35);background:#fff;color:#2d5a27;font-size:12px;font-weight:600;cursor:pointer;font-family:"Manrope",system-ui,sans-serif;transition:background .18s,border-color .18s;line-height:1.2}
.cb-fchip:hover{background:rgba(45,90,39,.08);border-color:#2d5a27}

/* Rating */
.cb-rating{display:flex;align-items:center;gap:10px;justify-content:center;padding:10px;margin:6px 14px;background:#fff;border-radius:12px;font-size:12px;color:#3d2b1a;box-shadow:0 1px 4px rgba(20,12,5,.06)}
.cb-rbtn{background:none;border:none;cursor:pointer;font-size:18px;padding:2px 4px;transition:transform .15s}
.cb-rbtn:hover{transform:scale(1.25)}

/* Input bar */
.cb-ibar{display:flex;align-items:center;gap:8px;padding:11px 13px;background:#fff;border-top:1px solid rgba(61,43,26,.08);flex:0 0 auto}
.cb-inp{flex:1;border:none;outline:none;background:#f0ebe0;border-radius:999px;padding:10px 16px;font-size:13.5px;color:#3d2b1a;font-family:"Manrope",system-ui,sans-serif}
.cb-inp::placeholder{color:#a08060}
.cb-snd{width:38px;height:38px;flex:0 0 38px;border-radius:50%;background:#2d5a27;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#c49a3c;transition:background .2s,transform .15s;box-shadow:0 3px 10px rgba(45,90,39,.35);padding:0}
.cb-snd:hover{background:#1f4a1a;transform:scale(1.08)}
.cb-snd:disabled{opacity:.4;cursor:not-allowed;transform:none}
.cb-snd .material-symbols-rounded{font-size:17px;font-variation-settings:'FILL' 1,'wght' 600,'GRAD' 0,'opsz' 24}
`;

  /* ── DOM ─────────────────────────────────────────────────────── */
  const styleEl = document.createElement('style');
  styleEl.textContent = CSS;
  document.head.appendChild(styleEl);

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
          <div class="cb-hsub">En línea · Lomas de Ancón</div>
        </div>
        <div class="cb-hactions">
          <a class="cb-hbtn wa" id="cb-wa" href="${WHATSAPP_URL}" target="_blank" rel="noopener" aria-label="WhatsApp">
            <span class="material-symbols-rounded">chat</span>
          </a>
          <button class="cb-hbtn" id="cb-reset" aria-label="Nueva conversación" title="Nueva conversación">
            <span class="material-symbols-rounded">refresh</span>
          </button>
          <button class="cb-hbtn" id="cb-xbtn" aria-label="Cerrar">
            <span class="material-symbols-rounded">close</span>
          </button>
        </div>
      </div>
      <div id="cb-welcome">
        <div class="cb-wava"><span class="material-symbols-rounded">landscape</span></div>
        <div class="cb-wtitle">¡Hola! Soy Loma</div>
        <div class="cb-wsub">Tu guía en las lomas, dunas y bahía de Ancón. ¿En qué puedo ayudarte hoy?</div>
        <div class="cb-chips" id="cb-chips"></div>
      </div>
      <div id="cb-msgs"></div>
      <div class="cb-ibar">
        <input id="cb-inp" class="cb-inp" type="text" placeholder="Escribe tu mensaje..." autocomplete="off" />
        <button id="cb-snd" class="cb-snd" aria-label="Enviar">
          <span class="material-symbols-rounded">send</span>
        </button>
      </div>
    </div>`;
  document.body.appendChild(root);

  /* ── Refs ────────────────────────────────────────────────────── */
  const $btn  = document.getElementById('cb-btn');
  const $tip  = document.getElementById('cb-tip');
  const $win  = document.getElementById('cb-win');
  const $welc = document.getElementById('cb-welcome');
  const $msgs = document.getElementById('cb-msgs');
  const $inp  = document.getElementById('cb-inp');
  const $snd  = document.getElementById('cb-snd');
  const $xbtn = document.getElementById('cb-xbtn');
  const $reset = document.getElementById('cb-reset');
  const chipsEl = document.getElementById('cb-chips');

  /* ── Chips iniciales ─────────────────────────────────────────── */
  CHIPS.forEach(([label, q]) => {
    const b = document.createElement('button');
    b.className = 'cb-chip';
    b.textContent = label;
    b.addEventListener('click', () => sendMsg(q));
    chipsEl.appendChild(b);
  });

  /* ── Restaurar historial visual ──────────────────────────────── */
  if (history.length > 0) {
    atWelcome = false;
    $welc.style.display = 'none';
    $msgs.style.display = 'flex';
    history.forEach(m => appendMsg(m.role === 'user' ? 'usr' : 'bot', m.content));
  }

  /* ── Toggle ──────────────────────────────────────────────────── */
  function toggle() {
    isOpen = !isOpen;
    $btn.classList.toggle('open', isOpen);
    $tip.classList.add('hide');
    if (isOpen) { $win.removeAttribute('hidden'); setTimeout(() => $inp.focus(), 120); }
    else { $win.setAttribute('hidden', ''); }
  }
  $btn.addEventListener('click', toggle);
  $xbtn.addEventListener('click', toggle);

  /* ── Reset ───────────────────────────────────────────────────── */
  $reset.addEventListener('click', () => {
    history = [];
    turnCount = 0;
    ratingShown = false;
    localStorage.removeItem('lomas_history');
    localStorage.removeItem('lomas_rating_shown');
    $msgs.innerHTML = '';
    $msgs.style.display = 'none';
    $welc.style.display = 'flex';
    atWelcome = true;
  });

  /* ── Send ────────────────────────────────────────────────────── */
  async function sendMsg(override) {
    const text = (typeof override === 'string' ? override : $inp.value).trim();
    if (!text || busy) return;
    $inp.value = '';

    if (atWelcome) {
      atWelcome = false;
      $welc.style.display = 'none';
      $msgs.style.display = 'flex';
    }

    // Limpia chips de follow-up del turno anterior
    document.querySelectorAll('.cb-followups').forEach(el => el.remove());

    appendMsg('usr', text);
    history.push({ role: 'user', content: text });

    busy = true;
    $snd.disabled = true;
    const typing = appendTyping();

    try {
      const historyToSend = history.slice(0, -1);

      const res = await fetch(`${BACKEND_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message:    text,
          session_id: SESSION_ID,
          history:    historyToSend,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      let botEl = null, bubEl = null, fullReply = '', firstChunk = true, suggestions = [];
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();

        for (const line of lines) {
          if (!line.startsWith('data:')) continue;
          const raw = line.slice(5).trim();
          if (!raw || raw === '[DONE]') continue;
          try {
            const chunk = JSON.parse(raw);
            const token = chunk.text ?? chunk.content ?? chunk.token ?? chunk.delta ?? '';
            if (token) {
              if (firstChunk) {
                typing.remove();
                botEl = appendMsg('bot', '');
                bubEl = botEl.querySelector('.cb-mbub');
                firstChunk = false;
              }
              fullReply += token;
              bubEl.innerHTML = renderMarkdown(fullReply);
              $msgs.scrollTop = $msgs.scrollHeight;
            }
            if (typeof chunk.replace === 'string' && bubEl) {
              fullReply = chunk.replace;
              bubEl.innerHTML = renderMarkdown(fullReply);
              $msgs.scrollTop = $msgs.scrollHeight;
            }
            if (Array.isArray(chunk.suggestions)) {
              suggestions = chunk.suggestions;
            }
          } catch { /* partial */ }
        }
      }

      if (!fullReply) throw new Error('empty stream reply');
      history.push({ role: 'assistant', content: fullReply });
      localStorage.setItem('lomas_history', JSON.stringify(history.slice(-20)));
      turnCount++;

      if (suggestions.length > 0) renderFollowups(suggestions);

      if (!ratingShown && turnCount >= 3) {
        renderRating();
        ratingShown = true;
        localStorage.setItem('lomas_rating_shown', '1');
      }

    } catch (err) {
      console.error('[Chatbot]', err);
      const stillTyping = $msgs.querySelector('.cb-m.bot:last-child .cb-dots');
      if (stillTyping) stillTyping.closest('.cb-m').remove();
      appendMsg('bot', 'Hubo un problema de conexión. Escríbenos al [WhatsApp](https://wa.me/51984350983) o a hola@lomasdeancon.pe.');
      history.pop();
    }

    busy = false;
    $snd.disabled = false;
    $msgs.scrollTop = $msgs.scrollHeight;
  }

  function appendMsg(role, text) {
    const d = document.createElement('div');
    d.className = 'cb-m ' + role;
    const ava = role === 'bot'
      ? `<div class="cb-mava"><span class="material-symbols-rounded">landscape</span></div>` : '';
    d.innerHTML = ava + `<div class="cb-mbub">${role === 'bot' ? renderMarkdown(text) : esc(text)}</div>`;
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

  function renderFollowups(items) {
    const wrap = document.createElement('div');
    wrap.className = 'cb-followups';
    items.forEach(q => {
      const b = document.createElement('button');
      b.className = 'cb-fchip';
      b.textContent = q;
      b.addEventListener('click', () => {
        wrap.remove();
        sendMsg(q);
      });
      wrap.appendChild(b);
    });
    $msgs.appendChild(wrap);
    $msgs.scrollTop = $msgs.scrollHeight;
  }

  function renderRating() {
    const wrap = document.createElement('div');
    wrap.className = 'cb-rating';
    wrap.innerHTML = `<span>¿Te fue útil?</span>
      <button class="cb-rbtn" data-r="up">👍</button>
      <button class="cb-rbtn" data-r="down">👎</button>`;
    wrap.querySelectorAll('.cb-rbtn').forEach(btn => {
      btn.addEventListener('click', () => {
        const rating = btn.dataset.r;
        try {
          fetch(`${BACKEND_URL}/feedback`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ session_id: SESSION_ID, rating }),
          }).catch(() => {});
        } catch {}
        wrap.innerHTML = '<span>¡Gracias por tu feedback! 🌿</span>';
        setTimeout(() => wrap.remove(), 2000);
      });
    });
    $msgs.appendChild(wrap);
    $msgs.scrollTop = $msgs.scrollHeight;
  }

  function esc(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function renderMarkdown(s) {
    let h = s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Links: [text](url) — marca con placeholder para evitar doble-link
    const linkPlaceholders = [];
    h = h.replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, (_, t, u) => {
      const idx = linkPlaceholders.length;
      linkPlaceholders.push(`<a href="${u}" target="_blank" rel="noopener noreferrer" style="color:#2d5a27;font-weight:600;text-decoration:underline">${t}</a>`);
      return `\x00L${idx}\x00`;
    });

    // Auto-link bare URLs (ya no chocan con markdown links)
    h = h.replace(/(https?:\/\/[^\s<"]+)/g,
      '<a href="$1" target="_blank" rel="noopener noreferrer" style="color:#2d5a27;font-weight:600;text-decoration:underline">$1</a>');

    // Bold
    h = h.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>');
    h = h.replace(/__([^_\n]+)__/g, '<strong>$1</strong>');

    // Bullets
    h = h.replace(/^[*\-] (.+)$/gm, '<li>$1</li>');
    h = h.replace(/(<li>[\s\S]*?<\/li>)(\n<li>[\s\S]*?<\/li>)*/g, match =>
      '<ul style="margin:.3em 0 .3em 1.1em;padding:0;list-style:disc">' + match + '</ul>');

    // Italic
    h = h.replace(/(?<!\*)\*(?!\*)([^*\n]+)(?<!\*)\*(?!\*)/g, '<em>$1</em>');
    h = h.replace(/(?<!_)_(?!_)([^_\n]+)(?<!_)_(?!_)/g, '<em>$1</em>');

    // Collapse multiple blank lines → single newline before converting to <br>
    h = h.replace(/\n{2,}/g, '\n');

    // Line breaks
    h = h.replace(/(?!<\/li>|<li>)\n/g, '<br>');

    // Restaurar links protegidos
    h = h.replace(/\x00L(\d+)\x00/g, (_, i) => linkPlaceholders[+i]);

    return h;
  }

  $inp.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMsg(); }
  });
  $snd.addEventListener('click', () => sendMsg());

})();
