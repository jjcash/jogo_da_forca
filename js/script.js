// ------------------- UTILIDADES -------------------
function removeAccents(str) {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function normalizeLetter(letter){
  return removeAccents(letter.toUpperCase());
}

// ------------------- CATEGORIES -------------------
const categories = ["Frutas","Animais","Países","Objetos"];
const categoryWords = {
  "Frutas": ["ABACAXI","BANANA","CEREJA","DAMASCO","FRAMBOESA","GOIABA","LARANJA","MELANCIA","MORANGO","PESSEGO","UVA","KIWI","MANGA","PERA","LIMÃO"],
  "Animais": ["CACHORRO","GATO","ELEFANTE","GIRAFA","LEÃO","TIGRE","COBRA","MACACO","RAPOSA","CAMELO","CAVALO","PORCO","PATO","ZEBRA","LOBO"],
  "Países": ["BRASIL","PORTUGAL","ANGOLA","MOZAMBIQUE","JAPÃO","CHINA","ARGENTINA","MÉXICO","CANADÁ","ALEMANHA","FRANÇA","ITÁLIA","ESPANHA","NIGÉRIA","ÍNDIA"],
  "Objetos": ["CADEIRA","MESA","COMPUTADOR","CELULAR","GARRAFA","LIVRO","MOCHILA","CANETA","TECLADO","VENTILADOR","RELÓGIO","TELEVISÃO","SOFÁ","PRATO","JANELA"]
};

// ------------------- GAME VARIABLES -------------------
let category = categories[Math.floor(Math.random() * categories.length)];
let word = "";
let correctLetters = [];
let errors = 0;
const maxErrors = 6;

const wordDiv = document.getElementById("word");
const definitionDiv = document.getElementById("wordDefinition");
const lettersDiv = document.getElementById("letters");
const messageDiv = document.getElementById("message");
const categoryDiv = document.getElementById("category");
const infiniteWinsDiv = document.getElementById("infiniteWins");

const canvas = document.getElementById("hangmanCanvas");
const ctx = canvas.getContext("2d");
canvas.height = canvas.width * 1.5;

// ------------------- SOUNDS -------------------
const soundClick = new Audio("sounds/click.mp3");
const soundError = new Audio("sounds/error.mp3");
const soundWin = new Audio("sounds/win.mp3");

// ------------------- THEME TOGGLE -------------------
const themeToggleBtn = document.getElementById("themeToggle");

if(localStorage.getItem("theme") === "light") {
  document.body.classList.add("light-theme");
  themeToggleBtn.textContent = "☀️";
} else {
  themeToggleBtn.textContent = "🌙";
}

themeToggleBtn.addEventListener("click", () => {
  document.body.classList.toggle("light-theme");
  if(document.body.classList.contains("light-theme")){
    localStorage.setItem("theme", "light");
    themeToggleBtn.textContent = "☀️";
  } else {
    localStorage.setItem("theme", "dark");
    themeToggleBtn.textContent = "🌙";
  }
});

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

async function fetchWordDefinition(word) {
  const variants = [removeAccents(word.toLowerCase()), word.toLowerCase()];
  for (let w of variants) {
    try {
      const response = await fetch(`https://api.dicionario-aberto.net/word/${w}`);
      const data = await response.json();
      if (data.length > 0 && data[0].art.length > 0) {
        return data[0].art[0].def;
      }
    } catch (error) {
      console.error("Erro ao buscar definição:", error);
    }
  }
  return "Definição não disponível no momento.";
}

// ------------------- DAILY WORD -------------------
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
  const normalizedCorrect = correctLetters.map(l => normalizeLetter(l));
  wordDiv.textContent = word.split("").map(l => {
    const normalizedLetter = normalizeLetter(l);
    return normalizedCorrect.includes(normalizedLetter) ? l : "_";
  }).join(" ");
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
let infiniteWins = parseInt(localStorage.getItem("infiniteWins")) || 0;
infiniteWinsDiv.textContent = `Vitórias consecutivas: ${infiniteWins}`;

function play(letter, btn){
  btn.disabled = true;
  const normalizedLetter = normalizeLetter(letter);
  const normalizedWord = removeAccents(word);
  if(normalizedWord.includes(normalizedLetter)){
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
  const normalizedWord = removeAccents(word);
  const normalizedCorrect = correctLetters.map(l=>normalizeLetter(l));

  if(!normalizedWord.split("").some(l=>!normalizedCorrect.includes(l))){
    messageDiv.textContent = "🎉 Você ganhou!";
    soundWin.play();
    disableButtons();
    createConfetti();
    drawConfetti();

    if(categoryDiv.textContent === "Modo Infinito") {
      infiniteWins++;
      localStorage.setItem("infiniteWins", infiniteWins);
      infiniteWinsDiv.textContent = `Vitórias consecutivas: ${infiniteWins}`;
    }

  } else if(errors >= maxErrors){
    messageDiv.textContent = `❌ Você perdeu! A palavra era ${word}`;
    disableButtons();

    if(categoryDiv.textContent === "Modo Infinito") {
      infiniteWins = 0;
      localStorage.setItem("infiniteWins", infiniteWins);
      infiniteWinsDiv.textContent = `Vitórias consecutivas: ${infiniteWins}`;
    }
  }
}

function disableButtons(){
  document.querySelectorAll("#letters button").forEach(b=>b.disabled=true);
}

// ------------------- DRAWING -------------------
function drawBase(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.lineWidth = 4;
  ctx.strokeStyle = document.body.classList.contains("light-theme") ? "#111" : "#eee";
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(10, 240); ctx.lineTo(190, 240); ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(40, 240); ctx.lineTo(40, 20); ctx.lineTo(120,20); ctx.lineTo(120,40); ctx.stroke();
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
  definitionDiv.textContent = "";
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

  const definition = await fetchWordDefinition(word);
  definitionDiv.textContent = definition;
}

async function nextInfiniteWord() {
  errors = 0;
  correctLetters = [];
  lettersDiv.innerHTML = '';
  messageDiv.textContent = '';
  drawBase();

  word = await fetchRandomWord();
  showWord();
  createButtons();

  const definition = await fetchWordDefinition(word);
  definitionDiv.textContent = definition;
}

// ------------------- BUTTON EVENTS -------------------
document.getElementById("infiniteBtn").addEventListener("click", () => {
  initInfiniteGame();
});

document.getElementById("nextWordBtn").addEventListener("click", () => {
  if(categoryDiv.textContent === "Modo Infinito") {
    nextInfiniteWord();
  }
});

// Inicia o jogo diário por padrão
initDailyGame();