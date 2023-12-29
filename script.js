var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const synth = speechSynthesis;
const countElement = document.getElementById("count");
const sunElement = document.getElementById("sun");
const lightElement = document.getElementById("light");
const startButton = document.getElementById("start");
const pauseButton = document.getElementById("pause");
const resetButton = document.getElementById("reset");
const elapsedTimeElement = document.getElementById('elapsedTime');
let wakeLock = null;
let count = 0;
let startTime;
let elapsedTime = 0;
let interval;
let recognizing = false;

const recognition = new SpeechRecognition();
recognition.continuous = true;
recognition.lang = "en-US";
recognition.interimResults = false;
recognition.maxAlternatives = 1;
recognition.onstart = () => recognizing = true;
recognition.onend = () => recognizing = false;
recognition.onerror = () => recognizing = false;

async function requestWakeLock() {
  try {
    wakeLock = await navigator.wakeLock.request('screen');
    console.log("Wake lock requested!");
  } catch (err) {
    console.log(err.message);
  }
}

const motivations = [
  "Well done!",
  "Great job!",
  "Keep up the good work!",
  "You're amazing!",
  "Fantastic!",
  "You've got this!",
  "Way to go!",
  "Terrific effort!",
  "Bravo!",
  "Awesome work!",
  "Excellent!",
  "Superb!",
  "You're a star!",
  "Outstanding!",
  "Impressive!",
  "Keep pushing forward!",
  "You make a difference!",
  "Success is yours!",
  "Believe in yourself!",
  "You're making progress!",
  "You're on the right track!",
  "Stay positive!",
  "You're unstoppable!",
  "You can do it!",
];

function wordsToDigits(input) {
  const wordToDigitMap = {
    zero: 0,
    one: 1,
    two: 2,
    three: 3,
    four: 4,
    five: 5,
    six: 6,
    seven: 7,
    eight: 8,
    nine: 9,
    ten: 10,
    eleven: 11,
    twelve: 12,
    thirteen: 13,
    fourteen: 14,
    fifteen: 15,
    sixteen: 16,
    seventeen: 17,
    eighteen: 18,
    nineteen: 19,
    twenty: 20,
    thirty: 30,
    forty: 40,
    fifty: 50,
    sixty: 60,
    seventy: 70,
    eighty: 80,
    ninety: 90,
    hundred: 100,
  };
  const words = input.split(" ");
  const result = words.map((word) =>
    wordToDigitMap[word] !== undefined ? wordToDigitMap[word] : word,
  );
  let total = 0;
  let currentNumber = 0;
  for (const num of result) {
    if (num === 100) {
      currentNumber *= 100;
    } else {
      currentNumber += num;
    }
  }

  return Number(total + currentNumber);
}

function updateElapsedTime(startTime) {
  const currentTime = new Date();
  const elapsedSeconds = Math.floor((currentTime - startTime) / 1000);

  const minutes = Math.floor(elapsedSeconds / 60);
  const seconds = elapsedSeconds % 60;

  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  elapsedTimeElement.textContent = formattedTime;
}

function speak(text) {
  let utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.rate = 1;
  utterance.pitch = 1;
  const voices = synth.getVoices();
  utterance.voice = voices.find(voice => voice.name === "Daniel");
  synth.speak(utterance);
}

function pause() {
  clearInterval(interval);
  if (startTime > 0) {
    elapsedTime = (new Date() - startTime) / 1000;
  }
  try {
    wakeLock.release().then(() => wakeLock = null);
  } catch (err) {
    console.log(err.message);
  }
}

function start() {
  startTime = new Date() - elapsedTime * 1000;
  interval = setInterval(() => {
    updateElapsedTime(startTime);
  }, 1000);

  requestWakeLock();

  if (!recognizing) {
    recognition.start();
  }
  speak("Let's go!");
}

function reset() {
  window.location.reload();
}

startButton.addEventListener("click", start);
pauseButton.addEventListener("click", pause);
resetButton.addEventListener('click', reset);

recognition.addEventListener("result", (event) => {
  let announceRound = false;
  let transcript = event.results[event.results.length-1][0].transcript.toLowerCase();
  switch (transcript) {
    case 'next':
      count++;
      announceRound = true;
      break;
    case 'start':
      start();
      break;
    case 'pause':
      pause();
      break;
    case 'done':
      speak(`Congratulations on ${count} sun salutations! Your time: ${elapsedTimeElement.innerText}. Well done!`);
      pause();
      break;
    default:
      count = wordsToDigits(transcript);
      announceRound = true;
  }
   
  if (Number.isInteger(count) && count > 0 && count < 109 && announceRound) {
    // Update counter display
    countElement.innerText = count;
    
    // Make sun rise
    // start = 60%, end = 30%, range = 108
    const percentageDecrease = ((30 - 60) / 60) * 100;
    const percentValue = 60 * (1 + (percentageDecrease / 100) * count / 108);
    sunElement.style.top = percentValue + '%';
    lightElement.style.opacity = count / 150;

    // Read out current round
    // Sometimes add a random motivation
    const randomMotivation = motivations[Math.floor(Math.random() * motivations.length)];
    let round = `Round ${count} completed. ${Math.random() < 0.5 ? randomMotivation : ''}`;
    if (count === 108) {
      round = `Congratulations on ${count} sun salutations! Your time: ${elapsedTimeElement.innerText}. Well done!`;
      pause();
    }
    speak(round);
  }
  console.log(`Transcript: ${transcript}. Confidence: ${event.results[0][0].confidence}`);
});