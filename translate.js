var fs = require('fs');
var Promise = require('promise');
var request = require('request');

//Watons Setup
var watson = require('watson-developer-cloud');
var speech_to_text = watson.speech_to_text({
  username: process.env.TEXT_TO_SPEECH_USER,
  password: process.env.TEXT_TO_SPEECH_PW,
  version: 'v1'
});

const FILENAME_RE = /.*.wav/;
const AUDIO_DIRECTORY = '/home/herlitzj/Downloads/';


//method to get local audio files
var getAudioFileNames = function() {
  return new Promise(function(resolve, reject) {
    fileNames = fs.readdirSync(AUDIO_DIRECTORY);
    var audioFilenames = fileNames.filter(function(filename) {
      if(filename.match(FILENAME_RE)) return filename;
    });
    if(audioFilenames.length > 0) {
      return resolve(audioFilenames[0]);
    } else {
      return reject("[TRANSLATE] - No audio files found in directory.");
    }
  })
}

//method to delete local audio files
var deleteAudioFiles = function(filename) {
  return new Promise(function(resolve, reject) {
    fs.unlink(AUDIO_DIRECTORY + filename, (err) => {
      if (err) return reject(err);
      console.log('[TRANSLATE] - Successfully deleted ' + filename);
      return resolve();
    });
  })
}

var transcribeAudio = function(filename) {
  return new Promise(function(resolve, reject) {
    var params = {
      audio: fs.createReadStream(AUDIO_DIRECTORY + filename),
      content_type: 'audio/wav',
      timestamps: true,
      word_alternatives: 0.9
    };

    speech_to_text.recognize(params, function(err, transcript) {
      if (err)
        return reject(err)
      else
        return resolve(transcript.results[0].alternatives[0].transcript);
    });
  })
}


// exports.translate = function() {
  console.log("[TRANSLATE] - Starting translation sequence.");
  console.log("[TRANSLATE] - Getting local audio file for translation.");
  getAudioFileNames()
  .then(function(filename) {
    console.log("[TRANSLATE] - Transcribing file " + filename + ".")
    return transcribeAudio(filename);
    process.exit();
  })
  .then(function(transcript) {
    console.log(transcript);
  })
  .catch(function(error) {
    console.log(error);
    process.exit();
  })
//}