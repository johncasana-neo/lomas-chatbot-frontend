/* chatbot.js — Asistente virtual Loma · Lomas de Ancón */
(function () {
  'use strict';

  const SYSTEM = `Eres Loma, el asistente virtual de Lomas de Ancón (Área de Conservación Regional), ubicado en Ancón, Lima, Perú. Ayudas a visitantes con información sobre tours, actividades (senderismo, sandboard, kayak, avistamiento de flora y fauna nocturna, Gecko Run), voluntariado y pasantías, cómo llegar desde Lima, tarifas, y la historia y conservación del ecosistema de lomas costeras y dunas. Siempre responde en español, de forma cálida, entusiasta y breve (máximo 3-4 oraciones). Para reservas o precios exactos sugiere llamar al +51 984 350 983 o escribir a hola@lomasdeancon.pe.`;

  const CHIPS = [
    ['Tours y actividades',  '¿Qué tours y actividades están disponibles?'],
    ['Cómo llegar',          '¿Cómo llego a Lomas de Ancón desde Lima?'],
    ['Voluntariado',         '¿Cómo puedo participar como voluntario?'],
    ['Precios',              '¿Cuáles son los precios de entrada y actividades?'],
    ['Flora y fauna',        '¿Qué flora y fauna puedo ver en las lomas?'],
    ['Negocios locales',     '¿Qué negocios locales y artesanías hay?'],
  ];

  let history = [];
  let isOpen  = false;
  let atWelcome = true;
  let busy    = false;

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
#cb-msgs{padding:14px;overflow-y:auto;max-height:420px;flex-direction:column;gap:10px;background:#f5f0e8;scroll-behavior:smooth;display:none}
.cb-m{display:flex;gap:8px;align-items:flex-end;animation:cbMsgIn .2s ease}
@keyframes cbMsgIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
.cb-m.bot{align-self:flex-start;max-width:88%}
.cb-m.usr{align-self:flex-end;flex-direction:row-reverse;max-width:88%}
.cb-mava{width:28px;height:28px;flex:0 0 28px;border-radius:50%;background:linear-gradient(145deg,#3a7034,#2d5a27);display:flex;align-items:center;justify-content:center;color:#c49a3c}
.cb-mava .material-symbols-rounded{font-size:13px;font-variation-settings:'FILL' 1,'wght' 500,'GRAD' 0,'opsz' 24}
.cb-mbub{padding:10px 13px;border-radius:16px;font-size:13.5px;line-height:1.55;word-break:break-word}
.cb-m.bot .cb-mbub{background:#fff;color:#2c1a0e;border-bottom-left-radius:4px;box-shadow:0 1px 4px rgba(20,12,5,.08)}
.cb-m.usr .cb-mbub{background:#2d5a27;color:#fff;border-bottom-right-radius:4px;box-shadow:0 2px 8px rgba(45,90,39,.28)}
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
          <div class="cb-hsub">Asistente de Lomas de Ancón</div>
        </div>
        <button class="cb-xbtn" id="cb-xbtn" aria-label="Cerrar">
          <span class="material-symbols-rounded">close</span>
        </button>
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

  /* ── Chips ───────────────────────────────────────────────────── */
  const chipsEl = document.getElementById('cb-chips');
  CHIPS.forEach(([label, q]) => {
    const b = document.createElement('button');
    b.className = 'cb-chip';
    b.textContent = label;
    b.addEventListener('click', () => sendMsg(q));
    chipsEl.appendChild(b);
  });

  /* ── Refs ────────────────────────────────────────────────────── */
  const $btn  = document.getElementById('cb-btn');
  const $win  = document.getElementById('cb-win');
  const $welc = document.getElementById('cb-welcome');
  const $msgs = document.getElementById('cb-msgs');
  const $inp  = document.getElementById('cb-inp');
  const $snd  = document.getElementById('cb-snd');
  const $xbtn = document.getElementById('cb-xbtn');

  /* ── Toggle ──────────────────────────────────────────────────── */
  function toggle() {
    isOpen = !isOpen;
    $btn.classList.toggle('open', isOpen);
    if (isOpen) { $win.removeAttribute('hidden'); setTimeout(() => $inp.focus(), 120); }
    else { $win.setAttribute('hidden', ''); }
  }
  $btn.addEventListener('click', toggle);
  $xbtn.addEventListener('click', toggle);

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

    appendMsg('usr', text);

    // First message carries system context
    const content = history.length === 0 ? `[Contexto: ${SYSTEM}]\n\n${text}` : text;
    history.push({ role: 'user', content });

    busy = true;
    $snd.disabled = true;
    const typing = appendTyping();

    try {
      if (!window.claude) throw new Error('no claude');
      const reply = await window.claude.complete({ messages: history });
      typing.remove();
      appendMsg('bot', reply);
      history.push({ role: 'assistant', content: reply });
    } catch {
      typing.remove();
      appendMsg('bot', 'Hubo un problema de conexión. Puedes llamarnos al +51 984 350 983 o escribirnos a hola@lomasdeancon.pe.');
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
    d.innerHTML = ava + `<div class="cb-mbub">${esc(text)}</div>`;
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

  function esc(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>');
  }

  $inp.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMsg(); }
  });
  $snd.addEventListener('click', () => sendMsg());

})();
