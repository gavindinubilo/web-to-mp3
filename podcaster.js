var request = require('request');
var fs = require('fs');
var async = require('async');

var googleTranslateUrl = 'http://api.microsofttranslator.com/v2/http.svc/speak?appId=TnQHLIpt7D5zHrL1CuaA946gDvqTxnCCrXIFK20E2I5I*&language=en-US&format=audio/mp3&options=MinSize|male&text=';

var Podcaster = {
  convertStringToAudio: function(text, directory, cb) {
    text = text.split(' ');
    var i = 0, l = text.length;
    for (; i < l; i++) {
      if (parseInt(text[i])) {
        text[i] = text[i].replace(/,/g, '');
      }
      if (text[i].match(/^\$[0-9]/)) {
        text[i] = text[i].replace('$', '');
        text[i] += ' dollars';
        console.log(text[i]);
      }

      if (text[i].match(/[0-9]m/g)) {
        text[i] = text[i].replace('m', ' million');
      }

      if (text[i].indexOf('bn') > -1) {
        text[i] = text[i].replace('bn', ' billion');
      }

    }
    text = encodeURIComponent(text.join(' '));
    
    async.eachSeries([1], function(item, callback) {
      try {
        request.get(googleTranslateUrl + text).on('error', function(e) {
          console.log(e);
        }).on('response', function(response) {
          if (response.statusCode !== 200) {
            console.log(googleTranslateUrl + text);
            console.log(response.statusCode) // 200 
            console.log(response.statusMessage); // 'image/png' 
          }
        }).on('end', function() {
          callback(null);
        }).pipe(fs.createWriteStream(directory + '/0.mp3'));
      } catch (e) {
        console.log('Error: ' + e);
      }
    }, function done() {
      cb(directory);
    });
  },
  setUpFolderStructure: function setUpFolderStructure(text, identifier, cb) {
    var self = this;
    fs.mkdir('./audios/' + identifier, function(e) {
      var i = 0;
      async.eachSeries(text, function(elem, callback) {
        fs.mkdir('./audios/' + identifier + '/' + i, function(e) {
          self.convertStringToAudio(elem, './audios/' + identifier + '/' + i, function(){
            console.log('ok');
            i++;
            callback(null)
          });
        });
      }, function done() {
        console.log('finished');
        cb(identifier);
      });
    });
  },
  createAudioFromText: function(textString, folderName) {
    this.setUpFolderStructure(textString, folderName, function(identifier) {
      var clips = [];
    
      var dir = './audios/' + identifier + '/';
      var files = fs.readdirSync(dir);
      
      var finishedMp3 = fs.createWriteStream(dir + '/done.mp3');
      
      var i = 0;

      fs.exists(dir + '/.DS_Store', function(exists) {
        fs.unlinkSync(dir + '/.DS_Store');
      });

      files = files.map(function(file) {
        return parseInt(file);
      });

      files = files.sort(function(a, b) {
        console.log(a, b);
        return a - b;
      });

      async.eachSeries(files, function(item, callback) {

        var currentFile = dir + item + '/0.mp3';
          console.log(currentFile);
          fs.exists(currentFile, function(exists) {
            if (!exists) {
              return callback(null);
            }
            var stream = fs.createReadStream(currentFile);
            stream.pipe(finishedMp3, {end: false});
            stream.on('end', function() {
              console.log('Appended file!');
              return callback(null);
            });
          });
        
      }, function done() {
        finishedMp3.close();
        console.log('done');
      });
    });
  } 
}

module.exports = Podcaster;