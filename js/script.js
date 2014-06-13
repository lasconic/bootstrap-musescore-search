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
                    $('#results').append('<li data-url="' + score.permalink + '" class="score-result"><img src="http://static.musescore.com/' + score.id + '/' + score.secret + '/thumb.png?nocache=' + score.dates.lastupdate + '"><a href="#">' + score.title + '</a></li>');
                });;
                $('.score-result').click(function(event) {
                    var url = $(this).attr("data-url");
                    $.get("http://localhost:5000/convert?url=" + url, function(data) { 
                        console.log(data);
                        $('#main').html(' <video width="100%" height="100%" controls="" autoplay="" name="media"><source src="' + data + '" type="video/mp4"></video>')

                        //$('#main').html('<a href="' + data + '">Watch the video</a>');
                    })
                });
            });
        }
    });



});