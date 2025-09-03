// ------------------- CATEGORIES -------------------
const categories = {
  "Frutas": [
    "ABACAXI","BANANA","CEREJA","DAMASCO","FRAMBOESA","GOIABA","LARANJA",
    "MELANCIA","MORANGO","PESSEGO","UVA","KIWI","MANGA","PERA","LIMAO"
  ],
  "Animais": [
    "CACHORRO","GATO","ELEFANTE","GIRAFA","LEAO","TIGRE","COBRA","MACACO",
    "RAPOSA","CAMELO","CAVALO","PORCO","PATO","ZEBRA","LOBO"
  ],
  "Países": [
    "BRASIL","PORTUGAL","ANGOLA","MOZAMBIQUE","JAPAO","CHINA","ARGENTINA",
    "MEXICO","CANADA","ALEMANHA","FRANCA","ITALIA","ESPANHA","NIGERIA","INDIA"
  ],
  "Objetos": [
    "CADEIRA","MESA","COMPUTADOR","CELULAR","GARRAFA","LIVRO","MOCHILA",
    "CANETA","TECLADO","VENTILADOR","RELOGIO","TELEVISAO","SOFA","PRATO","JANELA"
  ]
};

// ------------------- GAME VARIABLES -------------------
let { word, category } = getDailyWord(categories);
let correctLetters = [];
let errors = 0;
const maxErrors = 6;

const wordDiv = document.getElementById("word");
const lettersDiv = document.getElementById("letters");
const messageDiv = document.getElementById("message");
const categoryDiv = document.getElementById("category");

const canvas = document.getElementById("hangmanCanvas");
const ctx = canvas.getContext("2d");

// Adjust canvas height proportionally
canvas.height = canvas.width * 1.25;

// ------------------- WORD SELECTION -------------------
function getDailyWord(categories) {
  const today = new Date();
  const key = parseInt(`${today.getFullYear()}${today.getMonth()+1}${today.getDate()}`);

  const categoryNames = Object.keys(categories);
  const category = categoryNames[key % categoryNames.length];
  const words = categories[category];
  const word = words[key % words.length];

  return { word, category };
}

function alreadyPlayedToday() {
  const today = new Date().toISOString().split("T")[0];
  const lastDate = localStorage.getItem("lastDate");
  if (lastDate === today) return true;
  localStorage.setItem("lastDate", today);
  return false;
}

// ------------------- GAME DISPLAY -------------------
function showWord() {
  wordDiv.textContent = word
    .split("")
    .map(letter => correctLetters.includes(letter) ? letter : "_")
    .join(" ");
}

function createButtons() {
  for (let i = 65; i <= 90; i++) {
    const letter = String.fromCharCode(i);
    const btn = document.createElement("button");
    btn.textContent = letter;
    btn.onclick = () => play(letter, btn);
    lettersDiv.appendChild(btn);
  }
}

// ------------------- GAME LOGIC -------------------
function play(letter, btn) {
  btn.disabled = true;
  if (word.includes(letter)) {
    correctLetters.push(letter);
  } else {
    errors++;
    drawHangman(errors);
  }
  showWord();
  checkEnd();
}

function checkEnd() {
  if (!word.split("").some(letter => !correctLetters.includes(letter))) {
    messageDiv.textContent = "🎉 Você ganhou!";
    messageDiv.classList.add("win");
    disableButtons();
  } else if (errors >= maxErrors) {
    messageDiv.textContent = `❌ Você perdeu! A palavra era ${word}`;
    messageDiv.classList.add("lose");
    disableButtons();
  }
}

function disableButtons() {
  document.querySelectorAll("#letters button").forEach(b => b.disabled = true);
}

// ------------------- DRAWING -------------------
function drawBase() {
  ctx.lineWidth = 4;
  ctx.strokeStyle = "#555";
  ctx.lineCap = "round";

  // base
  ctx.beginPath();
  ctx.moveTo(10, 240);
  ctx.lineTo(190, 240);
  ctx.stroke();

  // post
  ctx.beginPath();
  ctx.moveTo(40, 240);
  ctx.lineTo(40, 20);
  ctx.lineTo(120, 20);
  ctx.lineTo(120, 40);
  ctx.stroke();
}

function drawHangman(errors) {
  ctx.lineWidth = 4;
  ctx.strokeStyle = "#222";
  ctx.lineCap = "round";

  switch(errors) {
    case 1: // head
      ctx.beginPath();
      ctx.arc(120, 60, 20, 0, Math.PI*2);
      ctx.fillStyle = "#eee";
      ctx.fill();
      ctx.stroke();
      break;
    case 2: // body
      ctx.beginPath();
      ctx.moveTo(120, 80);
      ctx.lineTo(120, 140);
      ctx.stroke();
      break;
    case 3: // left arm
      ctx.beginPath();
      ctx.moveTo(120, 100);
      ctx.lineTo(90, 120);
      ctx.stroke();
      break;
    case 4: // right arm
      ctx.beginPath();
      ctx.moveTo(120, 100);
      ctx.lineTo(150, 120);
      ctx.stroke();
      break;
    case 5: // left leg
      ctx.beginPath();
      ctx.moveTo(120, 140);
      ctx.lineTo(90, 180);
      ctx.stroke();
      break;
    case 6: // right leg
      ctx.beginPath();
      ctx.moveTo(120, 140);
      ctx.lineTo(150, 180);
      ctx.stroke();
      break;
  }
}

// ------------------- INITIALIZATION -------------------
if (alreadyPlayedToday()) {
  messageDiv.textContent = "Você já jogou hoje! Volte amanhã 😊";
} else {
  categoryDiv.textContent = `Categoria: ${category}`;
  drawBase();
  showWord();
  createButtons();
}
