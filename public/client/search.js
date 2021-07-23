console.log('working')
const script_tag = document.getElementById('yt-download');
const data = JSON.parse(script_tag.getAttribute('data'));

const button = document.getElementById('downloadButton');
const download = document.getElementById('download');
var dropdown = document.getElementById('qualityselector')

console.log(data.formats)

for (let i = 0; i < data.formats.length; i++) {
    let itag = data.formats[i].itag;
    let size = data.formats[i].size;
    let str = ''
    if(i == 0){
        str = '360p mp4: ' + String(size) + ' (' + String(itag) + ')';
    }
    else if(i == 1){
        str = '720p mp4: ' + String(size) + ' (' + String(itag) + ')';
    }
    else if(i == 2){
        str = '1080p mp4: ' + String(size) + ' (' + String(itag) + ')';
    }

    let newOption = new Option(str, itag);
    dropdown.add(newOption, undefined)
}

const options = {
    method: 'POST',
    body: {}, 
    headers: {
        'Content-Type': 'application/json'
    }
}

button.onclick = function(event){
    event.preventDefault();
    const value = parseInt(dropdown.options[dropdown.selectedIndex].value)
    const itag_data = JSON.stringify({ itag : value, link: data.link})
    console.log(itag_data)
    options.body = itag_data;
    fetch('/api', options)
        .then(response => response.json())
        .then(itag_data => {
            console.log(itag_data);
        });
}
