const {mergeVideoAudio, createDataArray} = require('./helper.js')
const express = require('express');
const ytdl = require('ytdl-core')

const app = express()
app.use(express.urlencoded({extended:true}));
app.use(express.static('public'));
app.use(express.json());

app.set('view engine', 'ejs')

app.get('/', (req, res) => {
    res.render('index')
})

app.post('/done', async (req, res) => {
    const link = req.body.search;
    const info = await ytdl.getBasicInfo(link);
    // const allFormats = info.formats;
    
    const data = createDataArray(link, info);

    // res.send(video.info)
    // res.send(allFormats);
    // res.send(filteredFormats);
    // res.send(data);

    res.render('search', {data: data})
})

app.post('/api', async (req, res) => {
    res.json({status: 'downloading'});
    quality = String(req.body.itag);
    console.log(quality);

    mergeVideoAudio(req.body, quality)

})

app.listen(3000, () => {
})