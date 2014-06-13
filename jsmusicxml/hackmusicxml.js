      zip.workerScriptsPath = "/lib/";

      // source: http://stackoverflow.com/a/901144
      function getParameter(name) {
        name = name.replace(/\[]/, "\\\[").replace(/[\]]/, "\\\]");
        var regex = new RegExp("[\\?&]" + name + "=([^&#]*)");
        var results = regex.exec(window.location.search);
        if (results == null) return undefined;
        else return decodeURIComponent(results[1].replace(/\+/g, " "));
      }

      function stripTrailingSlash(s) {
        if (s.charAt(s.length - 1) == '/')
          s = s.substring(0, s.length - 1);
        return s;
      }

      function findEvent(evts, time) {
        if (time <= 0)
          return evts[0];
        var l = evts.length;
        if (l <= 1) {
          return evts[0];
        }
        var i = Math.floor(l / 2);
        var ev = evts[i];
        if (time < ev.position) {
          return findEvent(evts.slice(0, i), time);
        } else if (time > ev.position) {
          return findEvent(evts.slice(i), time);
        } else {
          return ev;
        }
      }

      var doc = null;
      
      $(document).ready(function() {
        var mxlUri = getParameter('doc');
        var secret = getParameter('secret');
        var nid = getParameter('nid');
        var midiUri;
        var syncUri;
        var mdUri;
        if (! mxlUri) { 
          if(!secret || !nid)
              mxlUri = "Reunion.mxl";
          else { 
              secret = stripTrailingSlash(secret);
              nid = stripTrailingSlash(nid);

              mxlUri = "http://static.musescore.com/"+ nid + "/" + secret +"/score.mxl";
              midiUri = "http://static.musescore.com/"+ nid + "/" + secret +"/score.mid";
              syncUri = "http://api.musescore.com/services/rest/score/"+ nid +"/time.jsonp?oauth_consumer_key=musichackday";
              mdUri = "http://api.musescore.com/services/rest/score/"+ nid +".jsonp?oauth_consumer_key=musichackday";
          }
        }
        else {
          mxlUri = stripTrailingSlash(mxlUri);
        }

        //console.log(mxlUri);

        var xhr = new XMLHttpRequest();
        xhr.open('GET', mxlUri, true);
        xhr.responseType = 'blob';
        xhr.onload = function(e) {
          if (this.status == 200) {
            var myBlob = this.response;
            // use a BlobReader to read the zip from a Blob object
            zip.createReader(new zip.BlobReader(myBlob), function(reader) {
              // get all entries from the zip
              reader.getEntries(function(entries) {
                if (entries.length) {

                  // get first entry content as text
                  entries[1].getData(new zip.TextWriter(), function(text) {
                    // text contains the entry data as a String
                    //console.log(text);
                    doc = new Vex.Flow.Document(text);
                    doc.getFormatter().setWidth(800).draw($("#viewer")[0]);

                    // close the zip reader
                    reader.close(function() {
                      // onclose callback
                    });

                  }, function(current, total) {
                    // onprogress callback
                  });
                }
              });
            }, function(error) {
              // onerror callback
            });
          }
        };
        xhr.send();

        $.getJSON(syncUri+"&callback=?", function(data) {
            var events;
            var eventsSorted;
            events = data;
            eventsSorted = {};
            for ( var i = 0; i < data.length; i++) {
               events[i].position = parseFloat(events[i].position);
             if( ! eventsSorted[events[i].elid] ) {
                eventsSorted[events[i].elid] = new Array();
             }
             eventsSorted[events[i].elid].push(events[i].position);
            }
            $.getJSON(mdUri + "&callback=?", function(data) {
                MIDI.loader = new widgets.Loader;
                var instruments = new Array(); 
                $.each(data.metadata.parts, function(index, part) {
                  var program = parseInt(part.part.program);
                  if (program == 128)
                    program = 118;
                  if ($.inArray(program, instruments) == -1)
                    instruments.push(program);
                  }
                );
                console.log(instruments);
                MIDI.loadPlugin({
                  soundfontUrl: "./soundfont/",
                  instruments: instruments,
                  callback: function() {
                    player = MIDI.Player;
                    player.timeWarp = 1; // speed the song is played back
                    player.loadFile(midiUri, MIDIPlayerReady);
                    MIDI.loader.stop();
                  }
                });

                function MIDIPlayerReady() {
                  console.log('MIDI player ready');
                  $('#smp-control-play').show();
                  $('#smp-control-replay').show();
                  $('#smp-tempo-list').show();
                  player.start();
                  
                  player.setAnimation(function(data, element) {
                    var now = data.now; // where we are now
                    var end = data.end; // end of song
                    var event = findEvent(events, (1000 * now) / player.timeWarp);
                    if (event) {
                      console.log(event.elid);
                      //var m = doc.getMeasure(event.elid)//.getBoundingBox()
                      //console.log(m)
                      //console.log(doc.getFormatter())
                    }
                  });
                }

            });


          }); // get sync data
      });// document ready