function getRhythm(){
    document.getElementById('rhythmContainer').innerHTML = '';
    const xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function(){
        if(xmlhttp.readyState == 4 && xmlhttp.status == 200){
            let data = this.responseText;

            document.getElementById('rhythmContainer').innerHTML = data;
        }
    }

    xmlhttp.open('GET', '/generate/' + document.getElementById('measures').value + '/' + (200 / document.getElementById('intensity').value) + '/' + document.getElementById('triplets').value + '/' + document.getElementById('sixteenths').value + '/' + document.getElementById('quintuplets').value, true);
    xmlhttp.send();
}