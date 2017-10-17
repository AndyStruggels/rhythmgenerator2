const express    = require('express');
const bodyParser = require('body-parser');
const rhythms    = require('./rhythms.json');
const scribble   = require('scribbletune');
const ip         = require('ip');
const http       = require('http');
const app  = express();
const port = 3000;
const ch = 9;

const fs = require('fs');
const Midi = require('jsmidgen');

app.set('view engine', 'ejs');

app.get('/', (req, res, err) => {
	res.render('index.ejs',
		{
			title: 'Rhythmgenerator',
			ip: ip.address()
		});
});

/**************************/
/***** CREATE RHYTHMS *****/
/**************************/

function randomBit(sixteenths, triplets, quintuplets, intensity, track, file){
	let output = [],
		subdevisions,
		ticks,
		sixPercent,
		triPercent,
		quiPercent;

	sixPercent = (sixteenths / (sixteenths + triplets + quintuplets)) * 100;
	triPercent = (triplets / (sixteenths + triplets + quintuplets)) * 100;
	quiPercent = (quintuplets / (sixteenths + triplets + quintuplets)) * 100;
	if(sixteenths === 0 && quintuplets === 0){
		subdevisions = 3;
	} else if(triplets === 0 && quintuplets === 0){
		subdevisions = 4;
	} else if(triplets === 0 && sixteenths === 0){
		subdevisions = 5;
	} else if(sixPercent > triPercent && sixPercent > quiPercent){
		if(Math.floor(Math.random() * 100) < sixPercent){
			subdevisions = 4;
		} else if(triPercent > quiPercent){
			subdevisions = Math.floor(Math.random() * 100) < ((triPercent / (triPercent + quiPercent)) * 100) ? 3 : 5;
		} else {
			subdevisions = Math.floor(Math.random() * 100) < ((quiPercent / (triPercent + quiPercent)) * 100) ? 5 : 3;
		}
	} else if(triPercent > sixPercent && triPercent > quiPercent){
		if(Math.floor(Math.random() * 100) < triPercent){
			subdevisions = 3;
		} else if(sixPercent > quiPercent){
			subdevisions = Math.floor(Math.random() * 100) < ((sixPercent / (sixPercent + quiPercent)) * 100) ? 4 : 5;
		} else {
			subdevisions = Math.floor(Math.random() * 100) < ((quiPercent / (sixPercent + quiPercent)) * 100) ? 5 : 4;
		}
	} else if(quiPercent > triPercent && quiPercent > sixPercent){
		if(Math.floor(Math.random() * 100) < quiPercent){
			subdevisions = 5;
		} else if(triPercent > sixPercent){
			subdevisions = Math.floor(Math.random() * 100) < ((triPercent / (triPercent + sixPercent)) * 100) ? 3 : 4;
		} else {
			subdevisions = Math.floor(Math.random() * 100) < ((sixPercent / (triPercent + sixPercent)) * 100) ? 4 : 3;
		}
	} else {
		if(Math.floor(Math.random() * 100) < triPercent){
			subdevisions = 3;
		} else if(Math.floor(Math.random() * 100) > triPercent && Math.floor(Math.random() * 100) < (triPercent + sixPercent)){
			subdevisions = 4;
		} else {
			subdevisions = 5;
		}
	}

	for(let i=0;i<subdevisions;i++){
		ticks = Math.floor(128 / subdevisions);
		if(Math.floor(Math.random() * intensity) > 1){
			track.noteOff(ch, 'd2', ticks);
			if(i == 0){
				track.note(ch, 'c#2');
			}
			output.push(0);
		} else {
			track.noteOn(ch, 'd2', ticks);
			if(i == 0){
				track.note(ch, 'c#2');
			}
			output.push(1);
		}
	}

	return output.join('');
}

function randomRhythm(sixteenths, triplets, quintuplets, intensity, track, file){
	let output = [];
	for(let i=0;i<4;i++){
		output.push(randomBit(parseInt(sixteenths), parseInt(triplets), parseInt(quintuplets), intensity, track, file));
	}


	for(let i=0;i<output.length;i++){
		output[i] = '<div class="noteGroup">' + rhythms[output[i]] + '</div>';
	}

	return output.join('');
}

function output(measures, intensity, track, file, sixteenths, triplets, quintuplets){
	let output = [];
	for(let i=1;i<=measures;i++){
		if(i % 4 === 1){
            output.push('<div class="notes"><span style="float: left">$4</span>');
        } else {
        	output.push('<div class="notes">');
        }

		output.push(randomRhythm(sixteenths, triplets, quintuplets, intensity, track, file));

		if(i == measures){
           	output.push('<span style="float: right">&#92|</span></div>');
        } else {
            output.push('<span style="float: right">&#92</span></div>');
        }
	}

	track.noteOff(ch, 'c#2', 128);

	fs.writeFileSync('public/midi/'+ ip.address() +'.mid', file.toBytes(), 'binary');

	return output.join('');
}

app.get('/generate/:measures/:intensity/:triplets/:sixteenths/:quintuplets', (req, res, err) => {
	let file = new Midi.File();
	let track = new Midi.Track();
	file.addTrack(track);
	track.setTempo(60);
	track.setInstrument(ch, 0x01);
	track.noteOn(ch, 'c#2', 128);
	track.noteOn(ch, 'c#2', 128);
	track.noteOn(ch, 'c#2', 128);
	track.noteOn(ch, 'c#2', 128);
	track.noteOff(ch, 'c#2', 96);
	res.send(output(req.params.measures, req.params.intensity, track, file, req.params.sixteenths, req.params.triplets, req.params.quintuplets));
});

app.use(express.static('public'));

app.listen(port);