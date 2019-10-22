#!/usr/bin/env node

const fetch = require('node-fetch');
const Msg = require('node-msg');
const Args = require('arg-parser');
const config = require('./config.json');
const fs = require('fs');
const path = require('path');
const http = require('http');
const CSV_FILE = path.resolve(__dirname, 'src/data.csv');

function getTemp (str) {
	let json;
	try { json = JSON.parse(str); }
	catch(e) {/* */}
	if (json) return json.main.temp;
	return '';
}

function getWeather (resp) {
	const apiurl = 'http://api.openweathermap.org/data/2.5/weather';
	const appid = 'afe9ed75c174bff3c0f900fe0c15f994';
	const town = encodeURIComponent(config.location || 'Dublin, Ireland');
	const url = `${apiurl}?appid=${appid}&units=metric&q=${town}`;
	let str = '';
	return new Promise((resolve, reject) => {
		http
			.request(url, res => {
				res.on('data', function (chunk) { str += chunk; });
				res.on('end', function () {
					resp.outsideTemp = getTemp(str);
					resolve(resp);
				});
			})
			.on('error', reject)
			.end();
	});
}

function parseDate (str) {
	const d = new Date(str);
	d.setHours(d.getHours() + 2);
	return d.toISOString().replace('T', ' ').substr(0, 16);
}


function parseSensors (res) {
	const list = Object.values(res)
		.filter(s => (s.type === 'ZLLTemperature' || s.type === 'ZLLPresence'))
		.map(s => {
			s.id = s.uniqueid.split('-')[0];
			return s;
		});
	return list
		.filter(s => s.type === 'ZLLPresence')
		.map(p => {
			const temp = list.find(s => (s.id === p.id && s.type === 'ZLLTemperature'));
			return {
				name: p.name,
				temp: temp.state.temperature / 100,
				presence: p.state.presence,
				updated: parseDate(p.state.lastupdated),
				battery: p.config.battery,
			};
		});
}


function getTempSensors () {
	const url = `http://${config.ip}/api/${config.username}/sensors`;
	return fetch(url)
		.then(r => r.json())
		.then(parseSensors);
}


function writeTable (r) {
	const table = r.map(s => {
		const name = s.name.replace(' sensor', '');
		const presence = s.presence ? Msg.yellow('!') : '-';
		const temp = Math.round(s.temp * 10) / 10 + '°';
		return [name, temp, s.battery, presence, s.updated];
	});
	table.unshift(['Name', 'Temp', 'Battery', 'Presence', 'Updated']);
	Msg.log('\nOutside temp: ' + r.outsideTemp + '°C\n');
	Msg.table(table);
}


function writeCsv (r) {
	if (!fs.existsSync(CSV_FILE)) {
		const hdr = ['Date', ...r.map(s => s.name), 'Outside temp'].join(',') + '\n';
		fs.writeFileSync(CSV_FILE, hdr, 'utf8');
		console.log(CSV_FILE, 'created');
	}
	const line = [new Date().toISOString(), ...r.map(s => s.temp), r.outsideTemp].join(',') + '\n';
	fs.appendFileSync(CSV_FILE, line, 'utf8');
	console.log(CSV_FILE, 'updated');
}


function run (params) {
	getTempSensors()
		.then(getWeather)
		.then(r => {
			if (params.csv) writeCsv(r);
			else writeTable(r);
		});
}



const args = new Args('hue', '1.0', 'Philips Hue temperature sensor reader');
args.add({ name: 'csv', desc: 'save data to csv', switches: [ '-c', '--csv'] });
if (args.parse()) run(args.params);
