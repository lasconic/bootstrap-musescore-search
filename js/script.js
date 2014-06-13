$(document).ready(function() {
    $('[data-toggle=offcanvas]').click(function() {
        $('.row-offcanvas').toggleClass('active');
    });


    $('#search').keyup(function(event) {
        if (event.keyCode == 13) {
            var text = $(this).val();
            $.getJSON('http://api.musescore.com/services/rest/score.jsonp?&oauth_consumer_key=musichackday&callback=?&text=' + text, function(data) {
                $('#results').html('');
                $.each(data, function(index, score) {
                    $('#results').append('<li data-nid="'+score.id+'" data-secret="'+score.secret+'" data-url="' + score.permalink + '" class="score-result"><a href="#"><img src="http://static.musescore.com/' + score.id + '/' + score.secret + '/thumb.png?nocache=' + score.dates.lastupdate + '" class="score-picture"><div class="score-title">' + score.title + '</div></a></li>');
                });;
                score_oembed();
            });
        }
    });

    function score_oembed() {
        $('.score-result').click(function(event) {
            var url = $(this).attr("data-url");
            var nid = $(this).attr("data-nid");
            var secret = $(this).attr("data-secret");
            $.getJSON('http://musescore.com/oembed/endpoint?url='+url+'&format=jsonp&callback=?', function(data) {
                $('#main').html('<div>Render this score to <a href="#" class="score-to-motion">Motion</a>, <a href="#" class="score-to-browser">Browser</a>, <a href="#" class="score-to-laser">Laser</a></div><div id="main-render">'+data.html+'</div>');
                $('.score-to-motion').click(function(){
                  $.get("http://localhost:5000/convert?url=" + url, function(data) { 
                    console.log(data);
                    $('#main-render').html('<video width="100%" height="100%" controls="" autoplay="" name="media"><source src="' + data + '" type="video/mp4"></video>');
                  });
                  return false;
                });
                $('.score-to-browser').click(function(){
                  var h = $(document).height() - 50;
                  $('#main-render').html('<iframe width="100%" height="' + h + '" frameborder="0" src="http://localhost:8000/score.html?nid='+ nid +'&secret='+ secret+'">')
                  return false;
                });
                $('.score-to-laser').click(function(){
                  $('#main-render').html('Here comes the video of the laser printer');
                  return false;
                });
            });
            return false;
        });        
    }
    score_oembed();

});