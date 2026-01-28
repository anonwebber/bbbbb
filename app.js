// ABSOLUTE CHAOS JS - NO MERCY

// ========== FALLING FALLING BACKGROUND ==========
const canvas = document.getElementById('fallingCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Colors inspired by fallingfalling.com
const colors = [
    '#FF0080', '#FF00FF', '#8000FF', '#0000FF', '#0080FF',
    '#00FFFF', '#00FF80', '#00FF00', '#80FF00', '#FFFF00',
    '#FF8000', '#FF0000', '#FF0040', '#FF0060', '#C000FF'
];

class FallingRect {
    constructor() {
        this.reset();
    }
    
    reset() {
        this.z = 0; // Start at back (0) and come towards viewer
        this.color = colors[Math.floor(Math.random() * colors.length)];
        this.speed = 0.008 + Math.random() * 0.004;
    }
    
    update() {
        this.z += this.speed;
        if (this.z >= 1) {
            this.reset();
        }
    }
    
    draw() {
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        
        // Size grows as z increases (comes closer)
        const size = this.z;
        const maxSize = Math.max(canvas.width, canvas.height) * 1.5;
        
        const width = size * maxSize;
        const height = size * maxSize;
        
        const x = centerX - width / 2;
        const y = centerY - height / 2;
        
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 3 + this.z * 10;
        ctx.strokeRect(x, y, width, height);
    }
}

// Create multiple falling rectangles at different depths
const rects = [];
const numRects = 15;

for (let i = 0; i < numRects; i++) {
    const rect = new FallingRect();
    rect.z = i / numRects; // Distribute across depths
    rects.push(rect);
}

function animateFalling() {
    // Semi-transparent black to create trail effect
    ctx.fillStyle = 'rgba(10, 0, 21, 0.15)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Sort by z so closer ones draw on top
    rects.sort((a, b) => a.z - b.z);
    
    for (const rect of rects) {
        rect.update();
        rect.draw();
    }
    
    requestAnimationFrame(animateFalling);
}

animateFalling();

// ========== CURSOR ==========
const cursor = document.getElementById('cursor');
const cursorEmojis = ['🗑️', '🧠', '💀', '🚀', '💎', '🦍', '📈', '🔥', '👁️', '🤡', '☠️', '🚽'];

document.addEventListener('mousemove', (e) => {
    if (cursor) {
        cursor.style.left = e.clientX + 'px';
        cursor.style.top = e.clientY + 'px';
    }
    
    // Occasional cursor trail
    if (Math.random() > 0.85) {
        spawnCursorTrail(e.clientX, e.clientY);
    }
});

function spawnCursorTrail(x, y) {
    const trail = document.createElement('div');
    trail.textContent = cursorEmojis[Math.floor(Math.random() * cursorEmojis.length)];
    const hue = Math.random() * 360;
    trail.style.cssText = `
        position: fixed;
        left: ${x}px;
        top: ${y}px;
        font-size: ${15 + Math.random() * 20}px;
        pointer-events: none;
        z-index: 99999;
        animation: trailFade 1.5s forwards;
        filter: drop-shadow(0 0 10px hsl(${hue}, 100%, 50%)) hue-rotate(${hue}deg);
    `;
    document.body.appendChild(trail);
    setTimeout(() => trail.remove(), 1500);
}

// SMOOTH COLOR PULSE
function psychedelicPulse() {
    const colors = ['#ff00ff', '#00ffff', '#ffff00', '#ff0080', '#00ff80', '#8000ff'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    
    const pulse = document.createElement('div');
    pulse.style.cssText = `
        position: fixed;
        inset: 0;
        background: radial-gradient(circle at ${Math.random() * 100}% ${Math.random() * 100}%, ${color}22 0%, transparent 50%);
        pointer-events: none;
        z-index: 99990;
        animation: pulseOut 2s ease-out forwards;
    `;
    document.body.appendChild(pulse);
    setTimeout(() => pulse.remove(), 2000);
}

// Occasional pulses
setInterval(() => {
    if (Math.random() > 0.5) psychedelicPulse();
}, 3000);

// Inject trail animation
const trailStyle = document.createElement('style');
trailStyle.textContent = `
    @keyframes trailFade {
        0% { opacity: 0.8; transform: scale(1) rotate(0deg); }
        100% { opacity: 0; transform: scale(1.5) rotate(180deg) translateY(-20px); }
    }
    @keyframes pulseOut {
        0% { opacity: 0.3; }
        100% { opacity: 0; }
    }
`;
document.head.appendChild(trailStyle);

// Random cursor emoji
setInterval(() => {
    if (cursor) {
        cursor.textContent = cursorEmojis[Math.floor(Math.random() * cursorEmojis.length)];
    }
}, 1000);


// ========== 3D STICKER POPUP ==========
function showStickerPopup(emoji, title, text) {
    const popup = document.getElementById('stickerPopup');
    const emojiEl = document.getElementById('stickerEmoji');
    const titleEl = document.getElementById('stickerTitle');
    const textEl = document.getElementById('stickerText');
    
    if (popup && emojiEl && titleEl && textEl) {
        emojiEl.textContent = emoji;
        titleEl.textContent = title;
        textEl.innerHTML = text;
        popup.classList.add('show');
        
        // Reset emoji animation
        emojiEl.style.animation = 'none';
        setTimeout(() => {
            emojiEl.style.animation = 'emojiPop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
        }, 10);
    }
}

function closeStickerPopup() {
    const popup = document.getElementById('stickerPopup');
    if (popup) {
        popup.classList.remove('show');
    }
}

// Close on background click
document.addEventListener('click', (e) => {
    if (e.target.id === 'stickerPopup') {
        closeStickerPopup();
    }
});

// ========== BUTTON FUNCTIONS ==========
function buyToken() {
    // Spawn chaos
    for (let i = 0; i < 20; i++) {
        setTimeout(() => spawnFallingEmoji(), i * 50);
    }
    
    showStickerPopup('🦍', 'APE MODE ACTIVATED', 
        'This is a placeholder link.<br><br>DYOR NFA WAGMI<br><br><span style="color: #00ffff">(the bin is pleased)</span>');
}

function viewChart() {
    showStickerPopup('📈', 'CHART STATUS', 
        '• Direction: <span style="color: #00ff00">UP</span><br>• Floor: <span style="color: #00ff00">YES</span><br>• Moon: <span style="color: #ffff00">SOON</span><br>• Rug: <span style="color: #ff0000">NO</span><br>• Source: <span style="color: #888">trust me bro</span>');
}

function maxChaos() {
    showAchievement({ title: 'CHAOS ACTIVATED', desc: 'You chose violence', points: '-999G' });
    
    // FULL PSYCHEDELIC CHAOS MODE
    document.body.style.animation = 'chaosMode 0.05s infinite';
    
    // Spawn many popups
    for (let i = 0; i < 15; i++) {
        setTimeout(() => spawnHostilePopup(), i * 100);
    }
    
    // Falling emojis
    for (let i = 0; i < 50; i++) {
        setTimeout(() => spawnFallingEmoji(), i * 100);
    }
    
    // Psychedelic pulses
    for (let i = 0; i < 10; i++) {
        setTimeout(() => psychedelicPulse(), i * 200);
    }
    
    // Spawn trippy shapes
    for (let i = 0; i < 20; i++) {
        setTimeout(() => spawnTrippyShape(), i * 150);
    }
    
    setTimeout(() => {
        document.body.style.animation = '';
    }, 5000);
}

// TRIPPY SHAPES
function spawnTrippyShape() {
    const shapes = ['◆', '◇', '○', '●', '△', '▲', '□', '■', '★', '☆'];
    const shape = document.createElement('div');
    const hue = Math.random() * 360;
    shape.textContent = shapes[Math.floor(Math.random() * shapes.length)];
    shape.style.cssText = `
        position: fixed;
        left: ${Math.random() * 100}vw;
        top: ${Math.random() * 100}vh;
        font-size: ${50 + Math.random() * 100}px;
        color: hsl(${hue}, 100%, 50%);
        pointer-events: none;
        z-index: 9998;
        text-shadow: 0 0 30px hsl(${hue}, 100%, 50%);
        animation: trippyShape 2s ease-out forwards;
    `;
    document.body.appendChild(shape);
    setTimeout(() => shape.remove(), 2000);
}

function copyCA() {
    const ca = document.getElementById('caValue').textContent;
    navigator.clipboard.writeText(ca).then(() => {
        showStickerPopup('📋', 'COPIED!', 
            'Contract Address secured.<br><br>Now do something with it.<br><br><span style="color: #888">(or dont, we dont care)</span>');
    });
}

// ========== CARD EXPLODE ==========
function cardExplode(card) {
    card.style.animation = 'cardExplode 0.5s forwards';
    
    // Spawn emojis from card
    const rect = card.getBoundingClientRect();
    for (let i = 0; i < 10; i++) {
        const emoji = document.createElement('div');
        emoji.textContent = ['💥', '🗑️', '💀', '🔥'][Math.floor(Math.random() * 4)];
        emoji.style.cssText = `
            position: fixed;
            left: ${rect.left + rect.width/2}px;
            top: ${rect.top + rect.height/2}px;
            font-size: 30px;
            pointer-events: none;
            z-index: 10000;
            animation: emojiExplode 1s forwards;
        `;
        document.body.appendChild(emoji);
        setTimeout(() => emoji.remove(), 1000);
    }
    
    setTimeout(() => {
        card.style.animation = '';
    }, 500);
}

// ========== SKIBIDI TOILET ==========
function skibidiRespond() {
    // Spawn toilets
    for (let i = 0; i < 15; i++) {
        setTimeout(() => {
            const toilet = document.createElement('div');
            toilet.textContent = '🚽';
            toilet.style.cssText = `
                position: fixed;
                left: ${Math.random() * 100}vw;
                top: -50px;
                font-size: ${40 + Math.random() * 40}px;
                z-index: 10000;
                pointer-events: none;
                animation: emojiFall ${2 + Math.random() * 2}s linear forwards;
            `;
            document.body.appendChild(toilet);
            setTimeout(() => toilet.remove(), 4000);
        }, i * 100);
    }
    
    showStickerPopup('🚽', 'SKIBIDI TOILET SAYS', 
        '<span style="color: #ff00ff">"skibidi dop dop dop yes yes"</span><br><br>"u are now one with the bin"<br><br><span style="color: #00ffff">"buy $BBBBB or get flushed"</span><br><br>"brrrrrr skibidi"');
}

// ========== SOCIAL CLICK ==========
function socialClick(e, type) {
    e.preventDefault();
    
    const popups = {
        tg: {
            emoji: '🚫',
            title: 'NO TELEGRAM',
            text: 'TG is for <span style="color: #ff0000">LOSERS</span><br><br>Real ones communicate through<br><span style="color: #00ffff">✨ onchain vibes ✨</span><br><br>The bin speaks to us directly.<br><span style="color: #888">(in price action)</span>'
        },
        tw: {
            emoji: '🐦',
            title: 'TWITTER',
            text: 'Follow for alpha.<br><span style="color: #888">(its all shitposts)</span><br><br><span style="color: #888">(placeholder link)</span>'
        }
    };
    
    const p = popups[type];
    showStickerPopup(p.emoji, p.title, p.text);
}

// ========== HOSTILE POPUP ==========
function spawnHostilePopup() {
    const container = document.getElementById('popupContainer');
    if (!container) return;
    
    const messages = [
        '⚠️ ALERT: ur ngmi',
        '🚨 WARNING: mid detected',
        '🗑️ BIN SAYS: buy more',
        '💀 RIP: ur old portfolio',
        '📈 BREAKING: line go up',
        '🧠 SCAN: 0 wrinkles found',
        '🦍 APE: together strong',
    ];
    
    const popup = document.createElement('div');
    popup.style.cssText = `
        position: fixed;
        top: ${20 + Math.random() * 60}%;
        left: ${10 + Math.random() * 70}%;
        background: #c0c0c0;
        border: 3px outset #fff;
        padding: 0;
        z-index: 10000;
        transform: rotate(${Math.random() * 20 - 10}deg);
        box-shadow: 5px 5px 0 rgba(0,0,0,0.5);
        width: 250px;
    `;
    popup.innerHTML = `
        <div style="background: linear-gradient(90deg, #000080, #1084d0); color: #fff; padding: 5px 10px; display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 12px;">alert.exe</span>
            <button onclick="this.parentElement.parentElement.remove()" style="background: #c0c0c0; border: 2px outset #fff; cursor: pointer; font-size: 10px; padding: 0 5px;">X</button>
        </div>
        <div style="padding: 20px; text-align: center; color: #000;">
            <p style="font-weight: bold; font-size: 14px;">${messages[Math.floor(Math.random() * messages.length)]}</p>
            <button onclick="this.parentElement.parentElement.remove()" style="margin-top: 15px; background: #c0c0c0; border: 2px outset #fff; padding: 5px 20px; cursor: pointer;">OK</button>
        </div>
    `;
    container.appendChild(popup);
    
    setTimeout(() => {
        if (popup.parentElement) popup.remove();
    }, 5000);
}

// ========== FALLING EMOJI ==========
function spawnFallingEmoji() {
    const emojis = ['🗑️', '🧠', '💀', '📈', '🚀', '💎', '🦍', '🔥', '✨', '💰', '🤡', '☠️'];
    const emoji = document.createElement('div');
    emoji.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    emoji.style.cssText = `
        position: fixed;
        top: -50px;
        left: ${Math.random() * 100}vw;
        font-size: ${30 + Math.random() * 40}px;
        z-index: 9999;
        pointer-events: none;
        animation: emojiFall ${2 + Math.random() * 3}s linear forwards;
    `;
    document.body.appendChild(emoji);
    setTimeout(() => emoji.remove(), 5000);
}

// ========== SOON COUNTER ==========
function updateSoonCounter() {
    const counter = document.getElementById('soonCounter');
    if (counter) {
        const options = ['NaN days', '2 more weeks', 'Soon™', 'Any day now', 'Trust the process', 'Loading...', '∞ days', 'Tomorrow (lie)'];
        counter.textContent = 'ETA: ' + options[Math.floor(Math.random() * options.length)];
    }
}
setInterval(updateSoonCounter, 3000);

// ========== INJECT ANIMATIONS - ULTRA INTENSE ==========
const chaosStyle = document.createElement('style');
chaosStyle.textContent = `
    @keyframes chaosMode {
        0% { filter: hue-rotate(0deg) saturate(2) brightness(1) contrast(1); }
        10% { filter: hue-rotate(36deg) saturate(3) brightness(1.3) contrast(1.2); }
        20% { filter: hue-rotate(72deg) saturate(2.5) brightness(0.8) contrast(1.5); }
        30% { filter: hue-rotate(108deg) saturate(3) brightness(1.4) contrast(1.1); }
        40% { filter: hue-rotate(144deg) saturate(2) brightness(1.1) contrast(1.3); }
        50% { filter: hue-rotate(180deg) saturate(3) brightness(0.9) contrast(1.4); }
        60% { filter: hue-rotate(216deg) saturate(2.5) brightness(1.2) contrast(1.2); }
        70% { filter: hue-rotate(252deg) saturate(3) brightness(1.5) contrast(1); }
        80% { filter: hue-rotate(288deg) saturate(2) brightness(0.85) contrast(1.5); }
        90% { filter: hue-rotate(324deg) saturate(3) brightness(1.3) contrast(1.2); }
        100% { filter: hue-rotate(360deg) saturate(2) brightness(1) contrast(1); }
    }
    @keyframes emojiFall {
        0% { transform: translateY(0) rotate(0deg) scale(1); opacity: 1; filter: hue-rotate(0deg) saturate(2); }
        25% { transform: translateY(27vh) rotate(180deg) scale(2); filter: hue-rotate(90deg) saturate(3); }
        50% { transform: translateY(55vh) rotate(360deg) scale(2.5); filter: hue-rotate(180deg) saturate(2); }
        75% { transform: translateY(82vh) rotate(540deg) scale(1.5); filter: hue-rotate(270deg) saturate(3); }
        100% { transform: translateY(110vh) rotate(720deg) scale(1); opacity: 0; filter: hue-rotate(360deg) saturate(2); }
    }
    @keyframes cardExplode {
        0% { transform: rotate(var(--rot, 0deg)) scale(1); filter: hue-rotate(0deg) saturate(1); }
        25% { transform: rotate(var(--rot, 0deg)) scale(1.4); filter: brightness(2) hue-rotate(90deg) saturate(3); }
        50% { transform: rotate(var(--rot, 0deg)) scale(1.6); filter: brightness(3) hue-rotate(180deg) saturate(2); }
        75% { transform: rotate(var(--rot, 0deg)) scale(1.3); filter: brightness(2) hue-rotate(270deg) saturate(3); }
        100% { transform: rotate(var(--rot, 0deg)) scale(1); filter: hue-rotate(360deg) saturate(1); }
    }
    @keyframes emojiExplode {
        0% { transform: translate(0, 0) scale(1) rotate(0deg); opacity: 1; filter: saturate(2); }
        50% { transform: translate(${Math.random() * 100 - 50}px, ${Math.random() * 100 - 50}px) scale(2) rotate(180deg); opacity: 0.8; filter: saturate(3) hue-rotate(180deg); }
        100% { transform: translate(${Math.random() * 200 - 100}px, ${Math.random() * 200 - 100}px) scale(0) rotate(360deg); opacity: 0; filter: saturate(2) hue-rotate(360deg); }
    }
    @keyframes trippyShape {
        0% { transform: scale(0) rotate(0deg); opacity: 1; filter: saturate(3); }
        25% { transform: scale(2) rotate(90deg); opacity: 0.9; filter: saturate(4) hue-rotate(90deg); }
        50% { transform: scale(3) rotate(180deg); opacity: 0.7; filter: saturate(3) hue-rotate(180deg); }
        75% { transform: scale(2) rotate(270deg); opacity: 0.4; filter: saturate(4) hue-rotate(270deg); }
        100% { transform: scale(4) rotate(360deg); opacity: 0; filter: blur(30px) saturate(3) hue-rotate(360deg); }
    }
`;
document.head.appendChild(chaosStyle);

// ========== RANDOM EVENTS ==========
setInterval(() => {
    if (Math.random() > 0.9) {
        spawnHostilePopup();
    }
}, 8000);

setInterval(() => {
    if (Math.random() > 0.7) {
        spawnFallingEmoji();
    }
}, 3000);


// ========== CONSOLE BRANDING ==========
console.log(`
%c
╔══════════════════════════════════════════════════════╗
║                                                      ║
║   🗑️  $BBBBB - BLUBRAINBITBASEBIN  🗑️              ║
║                                                      ║
║   THE BIN SEES ALL                                   ║
║   THE BIN KNOWS ALL                                  ║
║   BECOME THE BIN                                     ║
║                                                      ║
║   type chaos() for destruction                       ║
║                                                      ║
╚══════════════════════════════════════════════════════╝
`, 'color: #ff00ff; font-family: monospace;');

window.chaos = function() {
    maxChaos();
    return '🗑️ CHAOS DEPLOYED 🗑️';
};

// ========== CHROMA KEY - REMOVE WHITE BACKGROUND ==========
function initChromaKey() {
    const binVideo = document.getElementById('binVideo');
    const binCanvas = document.getElementById('binCanvas');

    if (!binVideo || !binCanvas) return;

    const ctx = binCanvas.getContext('2d', { willReadFrequently: true });

    // Crop settings - adjust these to focus on the bin
    // Values are percentages (0-1) of how much to crop from each side
    const cropLeft = 0.32;   // Crop 32% from left
    const cropRight = 0.32;  // Crop 32% from right
    const cropTop = 0.03;    // Crop 3% from top
    const cropBottom = 0.03; // Crop 3% from bottom

    function startProcessing() {
        const videoWidth = binVideo.videoWidth || 400;
        const videoHeight = binVideo.videoHeight || 400;

        // Calculate crop dimensions from source video
        const sx = videoWidth * cropLeft;
        const sy = videoHeight * cropTop;
        const sWidth = videoWidth * (1 - cropLeft - cropRight);
        const sHeight = videoHeight * (1 - cropTop - cropBottom);

        // Set canvas to cropped size
        binCanvas.width = sWidth;
        binCanvas.height = sHeight;

        console.log('Bin video cropped:', sWidth, 'x', sHeight, '(from', videoWidth, 'x', videoHeight, ')');
        processFrame(sx, sy, sWidth, sHeight);
    }

    function processFrame(sx, sy, sWidth, sHeight) {
        // Draw CROPPED video frame to canvas
        // drawImage(source, srcX, srcY, srcW, srcH, destX, destY, destW, destH)
        ctx.drawImage(binVideo, sx, sy, sWidth, sHeight, 0, 0, binCanvas.width, binCanvas.height);

        // Get pixel data
        try {
            const imageData = ctx.getImageData(0, 0, binCanvas.width, binCanvas.height);
            const data = imageData.data;

            // Loop through pixels and make white/light gray transparent
            for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];

                // Calculate brightness
                const brightness = (r + g + b) / 3;

                // Check if pixel is grayish (not blue enough)
                const isGray = Math.abs(r - g) < 30 && Math.abs(g - b) < 30 && Math.abs(r - b) < 30;

                // Remove white, gray, and light pixels
                if (brightness > 120 && isGray) {
                    data[i + 3] = 0; // Make transparent
                }
                // Also catch shadows/darker grays
                else if (brightness > 100 && isGray) {
                    data[i + 3] = 0;
                }
            }

            // Put modified pixels back
            ctx.putImageData(imageData, 0, 0);
        } catch (e) {
            // CORS error - just draw without chroma key
            console.log('Chroma key error:', e);
        }

        requestAnimationFrame(() => processFrame(sx, sy, sWidth, sHeight));
    }

    // Try multiple events to catch when video is ready
    binVideo.addEventListener('loadeddata', startProcessing);
    binVideo.addEventListener('canplay', startProcessing);

    // If video already loaded, start now
    if (binVideo.readyState >= 2) {
        startProcessing();
    }

    // Force play
    binVideo.play().catch(e => console.log('Autoplay blocked:', e));
}

// Run after DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initChromaKey);
} else {
    initChromaKey();
}

// ========== INIT ==========
console.log('%c BRAINROT INITIALIZED 🗑️', 'color: #0f0; font-size: 20px;');
