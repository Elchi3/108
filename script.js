var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const synth = speechSynthesis;
const countElement = document.getElementById("count");
const sunElement = document.getElementById("sun");
const lightElement = document.getElementById("light");
const startButton = document.getElementById("start");
const pauseButton = document.getElementById("pause");
const elapsedTimeElement = document.getElementById('elapsedTime');
let wakeLock = null;
let count = 0;

let startTime;
let elapsedTime = 0;
let interval;

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
  setTimeout(() => synth.speak(utterance), 1800);
}

const recognition = new SpeechRecognition();
recognition.continuous = true;
recognition.lang = "en-US";
recognition.interimResults = false;
recognition.maxAlternatives = 1;

startButton.addEventListener("click", async () => {
  startTime = new Date() - elapsedTime * 1000;
  interval = setInterval(() => {
    updateElapsedTime(startTime);
  }, 1000);

  recognition.start();

  // https://stackoverflow.com/questions/67655133/when-will-speechsynthesis-speak-work-on-ios-safari
  new SpeechSynthesisUtterance('');
  
  try {
    wakeLock = await navigator.wakeLock.request("screen");
  } catch(error) {
    console.log(`${err.name}, ${err.message}`);
  }
});

pauseButton.addEventListener("click", () => {
  clearInterval(interval);
  elapsedTime = (new Date() - startTime) / 1000;
  recognition.stop();
  
  wakeLock.release().then(() => {
    wakeLock = null;
  });
});

recognition.addEventListener("result", (event) => {
  let done = false;
  let transcript = event.results[event.results.length-1][0].transcript.toLowerCase();
  switch (transcript) {
    case 'next':
      count++;
      break;
    case 'done':
      pauseButton.click();
      speak(`Congratulations on ${count} sun salutations! Your time: ${elapsedTimeElement.innerText}. Well done!`);
      done = true;
      break;
    default:
      count = wordsToDigits(transcript);
  }
   
  if (Number.isInteger(count) && count > 0 && count < 109 && !done) {
    // Update counter display
    countElement.innerText = count;
    
    // Make sun rise
    // start = 60%, end = 30%, range = 108
    const percentageDecrease = ((30 - 60) / 60) * 100;
    const percentValue = 60 * (1 + (percentageDecrease / 100) * count / 108);
    sunElement.style.top = percentValue + '%';
    lightElement.style.opacity = count / 150;

    // Read out current round
    // Don't always add a motivation. Extend the range to 15 undefined values.
    const randomMotivation = motivations[Math.floor(Math.random() * motivations.length + 15)];
    let round = `Round ${count}. ${randomMotivation ? randomMotivation : ''}`;
    if (count === 108) {
      round = `Round 108. Final round!`;
    }
    speak(round);
  }
  //console.log(`Transcript: ${transcript}. Confidence: ${event.results[0][0].confidence}`);
});