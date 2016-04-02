var fs = require('fs');
var Promise = require('promise');
var request = require('request');

//Watons Setup
var watson = require('watson-developer-cloud');
var speech_to_text = watson.speech_to_text({
  username: process.env.SPEECH_TO_TEXT_USER,
  password: process.env.SPEECH_TO_TEXT_PW,
  version: 'v1'
});
var language_translation = watson.language_translation({
  username: process.env.TRANSLATE_USER,
  password: process.env.TRANSLATE_PW,
  version: 'v2'
});
var text_to_speech = watson.text_to_speech({
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
      model: 'es-ES_BroadbandModel',
      content_type: 'audio/wav',
      timestamps: true,
      word_alternatives: 0.9
    };

    speech_to_text.recognize(params, function(err, transcript) {
      if (err)
        return reject(err)
      else
        console.log(transcript)
        return resolve(transcript.results[0].alternatives[0].transcript);
    });
  })
}

var translateTranscript = function(transcript) {
  return new Promise(function(resolve, reject) {
    language_translation.translate({
        text: transcript,
        source: 'en',
        target: 'ja'
      }, function(err, translation) {
        if (err)
          return reject(err);
        else
          return resolve(translation.translations[0].translation);
    });
  })
}

var getAudioOfTranslation = function(translation) {
  return new Promise(function(resolve, reject) {
    var params = {
      text: translation,
      voice: 'ja-JP_EmiVoice',
    }

    text_to_speech.synthesize(params, function(err, audio) {
      if (err)
        return reject(err);
      else
        fs.writeFile(AUDIO_DIRECTORY + "/translated.wav", audio, function(err) {
          if(err) {
            return reject(err);
          }
          console.log("[TRANSLATE] - The audio file was saved in " + AUDIO_DIRECTORY);
          return resolve(audio);
        }); 
    })
  })
}


// exports.translate = function() {
  console.log("[TRANSLATE] - Starting translation sequence.");
  console.log("[TRANSLATE] - Getting local audio file for translation.");
  getAudioFileNames()
  .then(function(filename) {
    console.log("[TRANSLATE] - Transcribing file " + filename + "...");
    return transcribeAudio(filename);
  })
  .then(function(transcript) {
    console.log("[TRANSLATE] - Successfully transcribed audio. Translating...");
    console.log("[TRANSLATE] - Transcript: ", transcript);
    return translateTranscript(transcript);
  })
  .then(function(translation) {
    console.log("[TRANSLATE] - Translation complete: ", translation);
    console.log("[TRANSLATE] - Converting text to speech...");
    return getAudioOfTranslation(translation);
  })
  .then(function(audio) {
    console.log("[TRANSLATE] - Translation completed Successfully");
  })
  .catch(function(error) {
    console.log("[ERROR] - ", error);
    process.exit();
  })
//}