const {mergeVideoAudio, createDataArray} = require('./helper.js');
const express = require('express');
const ytdl = require('ytdl-core');
const path = require('path');

const app = express()
app.use(express.urlencoded({extended:true}));
app.use(express.static('public'));
app.set('views', path.join(__dirname, '/views'))
app.use(express.json());

app.set('view engine', 'ejs')

app.get('/', (req, res) => {
    console.log('working')
    res.render('index') 
})

app.post('/done', async (req, res) => {
    const link = req.body.search;

    if (!ytdl.validateURL(link)){
        return res.json({ error: 'invalid URL'});
    }

    
    const info = await ytdl.getBasicInfo(link);
    // const allFormats = info.formats;
    
    const data = createDataArray(link, info);

    // res.send(video.info)
    // res.send(allFormats);
    // res.send(filteredFormats);
    // res.send(data);

    return res.render('search', {data: data})
})

app.post('/api', async (req, res) => {
    res.json({status: 'downloading'});
    quality = String(req.body.itag);
    console.log(quality);

    mergeVideoAudio(req.body, quality)

})

app.listen(3000, () => {
})