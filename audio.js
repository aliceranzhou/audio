var audioContext = new (window.AudioContext || window.webkitAudioContext)();

let audioBuffer;
const audioUrl = 'https://ia600504.us.archive.org/6/items/HowGreatThouArt_466/HowGreatThouArtWorshipVideoWithLyrics.mp3';
var clicked = false;
var chunks = [];

var merger = new ChannelMergerNode(audioContext, mergerOptions);

var button = document.querySelector("button");
button.disabled = true;

let backgroundMusic = audioContext.createBufferSource();

var mergerOptions = {
  numberOfInputs : 2
};

var recDestination = audioContext.createMediaStreamDestination();
var mediaRecorder = new MediaRecorder(recDestination.stream);

window.fetch(audioUrl)
  .then(response => response.arrayBuffer())
  .then(arrayBuffer => audioContext.decodeAudioData(arrayBuffer))
  .then(audioBuffer => {
    button.disabled = false;
    backgroundMusic.buffer = audioBuffer;
    backgroundMusic.connect(merger);
  });

var errorCallback = function(e) {
  console.log('something happened :( ', e);
};

// connect user microphone data
navigator.getUserMedia({audio: true}, function(stream) {
  var microphone = audioContext.createMediaStreamSource(stream);
  var filter = audioContext.createBiquadFilter();

  // microphone -> filter -> recDestination.
  microphone.connect(filter);
  filter.connect(merger);
}, errorCallback);

merger.connect(recDestination);

// button stuff
button.addEventListener("click", function(e) {
  if (!clicked) {
    backgroundMusic.start();
    mediaRecorder.start();
    e.target.innerHTML = "Stop recording";
    clicked = true;
  } else {
    // raises a dataavailable event containing blobs
    // also triggers onstop
    mediaRecorder.requestData();
    mediaRecorder.stop();
    backgroundMusic.stop();
    //e.target.disabled = true;
    clicked = false;
  }
});

// triggered on mediaRecorder::stop
mediaRecorder.onstop = function(evt) {
  // Make blob out of blobs and display as audio.
  var blob = new Blob(chunks, { 'type' : 'audio/ogg; codecs=opus' });
  document.querySelector("audio").src = window.URL.createObjectURL(blob);
};

// trigger on mediaRecorder::dataAvailable
mediaRecorder.ondataavailable = function(evt) {
  // push each chunk (blobs) in an array
  // check not empty
  if (evt.data.size != 0) {
    chunks.push(evt.data);
  }
};
