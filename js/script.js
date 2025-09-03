// ------------------- CATEGORIES -------------------
const categories = ["Frutas","Animais","Países","Objetos"];
const categoryWords = {
  "Frutas": ["ABACAXI","BANANA","CEREJA","DAMASCO","FRAMBOESA","GOIABA","LARANJA","MELANCIA","MORANGO","PESSEGO","UVA","KIWI","MANGA","PERA","LIMAO"],
  "Animais": ["CACHORRO","GATO","ELEFANTE","GIRAFA","LEAO","TIGRE","COBRA","MACACO","RAPOSA","CAMELO","CAVALO","PORCO","PATO","ZEBRA","LOBO"],
  "Países": ["BRASIL","PORTUGAL","ANGOLA","MOZAMBIQUE","JAPAO","CHINA","ARGENTINA","MEXICO","CANADA","ALEMANHA","FRANCA","ITALIA","ESPANHA","NIGERIA","INDIA"],
  "Objetos": ["CADEIRA","MESA","COMPUTADOR","CELULAR","GARRAFA","LIVRO","MOCHILA","CANETA","TECLADO","VENTILADOR","RELOGIO","TELEVISAO","SOFA","PRATO","JANELA"]
};

// ------------------- GAME VARIABLES -------------------
let category = categories[Math.floor(Math.random() * categories.length)];
let word = "";
let correctLetters = [];
let errors = 0;
const maxErrors = 6;

const wordDiv = document.getElementById("word");
const lettersDiv = document.getElementById("letters");
const messageDiv = document.getElementById("message");
const categoryDiv = document.getElementById("category");

const canvas = document.getElementById("hangmanCanvas");
const ctx = canvas.getContext("2d");
canvas.height = canvas.width * 1.5;

// ------------------- SOUNDS -------------------
const soundClick = new Audio("sounds/click.mp3");
const soundError = new Audio("sounds/error.mp3");
const soundWin = new Audio("sounds/win.mp3");

// ------------------- WORD API -------------------
async function fetchRandomWord() {
  try {
    const response = await fetch('https://api.dicionario-aberto.net/random');
    const data = await response.json();
    return data.word.toUpperCase();
  } catch (error) {
    console.error("Erro ao buscar palavra da API:", error);
    return null;
  }
}

// ------------------- WORD DAILY -------------------
async function getDailyWordByCategory(categoryName) {
  const today = new Date().toISOString().split("T")[0];
  const storageKey = `word_${categoryName}_${today}`;
  let word = localStorage.getItem(storageKey);

  if (!word) {
    const words = categoryWords[categoryName];
    const keyNum = parseInt(`${new Date().getFullYear()}${new Date().getMonth()+1}${new Date().getDate()}`);
    word = words[keyNum % words.length];
    localStorage.setItem(storageKey, word.toUpperCase());
  }

  return word.toUpperCase();
}

// ------------------- DAILY CHECK -------------------
function alreadyPlayedToday() {
  const today = new Date().toISOString().split("T")[0];
  const lastDate = localStorage.getItem("lastDate");
  if (lastDate === today) return true;
  localStorage.setItem("lastDate", today);
  return false;
}

// ------------------- GAME DISPLAY -------------------
function showWord() {
  wordDiv.textContent = word.split("").map(l => correctLetters.includes(l)?l:"_").join(" ");
}

function createButtons() {
  lettersDiv.innerHTML = '';
  for (let i=65;i<=90;i++){
    const letter = String.fromCharCode(i);
    const btn = document.createElement("button");
    btn.textContent = letter;
    btn.onclick = ()=>play(letter,btn);
    lettersDiv.appendChild(btn);
  }
}

// ------------------- GAME LOGIC -------------------
function play(letter, btn){
  btn.disabled = true;
  if(word.includes(letter)){
    correctLetters.push(letter);
    soundClick.play();
  } else {
    errors++;
    drawHangman(errors);
    soundError.play();
  }
  showWord();
  checkEnd();
}

function checkEnd(){
  if(!word.split("").some(l=>!correctLetters.includes(l))){
    messageDiv.textContent = "🎉 Você ganhou!";
    messageDiv.classList.add("win");
    soundWin.play();
    disableButtons();
    createConfetti();
    drawConfetti();
  } else if(errors >= maxErrors){
    messageDiv.textContent = `❌ Você perdeu! A palavra era ${word}`;
    messageDiv.classList.add("lose");
    disableButtons();
  }
}

function disableButtons(){
  document.querySelectorAll("#letters button").forEach(b=>b.disabled=true);
}

// ------------------- DRAWING -------------------
function drawBase(){
  ctx.lineWidth = 4;
  ctx.strokeStyle = "#555";
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(10, 240); ctx.lineTo(190, 240); ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(40, 240); ctx.lineTo(40, 20); ctx.lineTo(120,20); ctx.lineTo(120,40); ctx.stroke();
}

function drawLineAnimated(x1,y1,x2,y2,duration=200){
  let start=null;
  function animate(timestamp){
    if(!start) start=timestamp;
    const progress=Math.min((timestamp-start)/duration,1);
    const cx=x1+(x2-x1)*progress;
    const cy=y1+(y2-y1)*progress;
    ctx.beginPath();
    ctx.moveTo(x1,y1);
    ctx.lineTo(cx,cy);
    ctx.stroke();
    if(progress<1) requestAnimationFrame(animate);
  }
  requestAnimationFrame(animate);
}

function drawHangman(errors){
  ctx.lineWidth=4; ctx.strokeStyle="#222"; ctx.lineCap="round";
  switch(errors){
    case 1: ctx.beginPath(); ctx.arc(120,60,20,0,Math.PI*2); ctx.fillStyle="#eee"; ctx.fill(); ctx.stroke(); break;
    case 2: drawLineAnimated(120,80,120,140); break;
    case 3: drawLineAnimated(120,100,90,120); break;
    case 4: drawLineAnimated(120,100,150,120); break;
    case 5: drawLineAnimated(120,140,90,180); break;
    case 6: drawLineAnimated(120,140,150,180); break;
  }
}

// ------------------- CONFETTI -------------------
let confettiArray = [];

function createConfetti() {
  const colors = ["#f94144","#f3722c","#f9c74f","#90be6d","#43aa8b","#577590"];
  for (let i = 0; i < 100; i++) {
    confettiArray.push({
      x: Math.random() * canvas.width,
      y: Math.random() * -canvas.height,
      size: 5 + Math.random() * 5,
      speed: 2 + Math.random() * 3,
      color: colors[Math.floor(Math.random() * colors.length)],
      angle: Math.random() * 2 * Math.PI,
      rotationSpeed: Math.random() * 0.1
    });
  }
}

function drawConfetti() {
  ctx.clearRect(0,0,canvas.width,canvas.height);
  drawBase();
  showWord();
  confettiArray.forEach(c => {
    ctx.fillStyle = c.color;
    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.rotate(c.angle);
    ctx.fillRect(-c.size/2, -c.size/2, c.size, c.size);
    ctx.restore();
    c.y += c.speed;
    c.angle += c.rotationSpeed;
  });
  confettiArray = confettiArray.filter(c => c.y < canvas.height + c.size);
  if (confettiArray.length > 0) requestAnimationFrame(drawConfetti);
}

// ------------------- INITIALIZATION -------------------
async function initDailyGame() {
  if(alreadyPlayedToday()){
    messageDiv.textContent="Você já jogou hoje! Volte amanhã 😊";
    return;
  }
  categoryDiv.textContent = `Categoria: ${category}`;
  drawBase();
  word = await getDailyWordByCategory(category);
  showWord();
  createButtons();
}

async function initInfiniteGame() {
  categoryDiv.textContent = `Modo Infinito`;
  drawBase();
  errors = 0;
  correctLetters = [];
  lettersDiv.innerHTML = '';
  messageDiv.textContent = '';
  
  word = await fetchRandomWord();
  showWord();
  createButtons();
}

// ------------------- BUTTON EVENTS -------------------
document.getElementById("infiniteBtn").addEventListener("click", () => {
  initInfiniteGame();
});

// Inicia o jogo diário por padrão
initDailyGame();
