/* countdown.js */
window.addEventListener("load", event => {
	settings.form["goButton"].addEventListener("click",
		()=>settings.prepare());
	new URL(window.location).searchParams
	.forEach((value,key) => {settings.form[key].value = value})
	settings.prepare()
	document.querySelector('[value="StartNow"]').addEventListener("click",
		()=>settings.startNow());
	let muteElement = document.querySelector('[value="Mute"]');
	muteElement.addEventListener("click",
		()=>settings.mute(muteElement));
	document.querySelector('[value="ResetActive"]').addEventListener("click",
		()=>settings.setActive(document.querySelector(".diver")));
});
// serverdate
import { getServerDate } from "../server-date/serverDate.js";

var countdownSound = new Audio("countdown.mp3");


let lastSample = {};
const synchronize = async () => {
	lastSample = await getServerDate();
};
synchronize();
setInterval(synchronize, 10 * 60 * 1000);

setInterval(()=>{
	let d = new Date(Date.now() + lastSample["offset"])
	document.querySelector("h2").innerText = d.toTimeString().slice(0,8);
	for (let timer of settings.list) {
		timer.update();
	}
}, 45);


var settings = {
	form : document.querySelector("#settingsForm"),
	list : [],
	startListApiURL : false,
	mutebutton : document.querySelector('[value="Mute"]'),
	sound : countdownSound,
	
	prepare() {
		//this.setSearch(); // TODO: Start using this again.
		console.log("test");
		this.mute();
		this.sound.play();
		setTimeout(()=>this.sound.pause(), 50);
		if (true) {
			this.startListApiURL = "summer.json";
			console.log("Getting " + this.startListApiURL);
			this.readStartList(this.startListApiURL)
			.then(r => {
				let t = document.querySelector(".diver");
				let list = r.response.startList;
				list.sort(function(a,b) {
					return ((a.officialTime < b.officialTime) ? -1 : 1)
					});
				console.log(list);
				for (let start of list){
					let n = t.insertAdjacentElement("beforebegin", t.cloneNode(true));
					n.querySelector(".order").innerText = start["order"];
					n.querySelector(".diverFirstName").innerText = start["diverFirstName"];
					n.querySelector(".diverLastName").innerText = start["diverLastName"];
					this.list.push(new Timer(start["officialTime"], n, r.response.dayInfo.date));
					
					n.removeAttribute("style");
				}
			});
		}
	},
	getSearch() {
		if (Boolean(this.form.EventId.valueAsNumber && this.form.DayId.valueAsNumber)){
			this.startListApiURL = "../aidaapi" 
			+ "?EventId=" + this.form.EventId.valueAsNumber
			+ "&DayId=" + this.form.DayId.valueAsNumber;
		}
		else {
			this.startListApiURL = undefined;
		}
		this.searchToForm();
	},
	url : new URL(window.location),
	setSearch() {
		if (this.form.EventId.valueAsNumber) 
			this.url.searchParams.set("EventId", this.form.EventId.valueAsNumber);
		if (this.form.DayId.valueAsNumber) 
			this.url.searchParams.set("DayId",this.form.DayId.valueAsNumber);
		window.history.pushState({}, '', this.url);

	},
	searchToForm(){
		// Fill out the form with values from url.
		//TODO
	},
	startNow(){
		let now = Date.now() + lastSample["offset"] + 130000;
		let base = this.list[0].current;
		for (let i = 0; i < this.list.length; i++) {
			this.list[i].current = now + (this.list[i].current - base)
		}
	},
	mute(){
		this.sound.muted = !this.sound.muted;
		if (this.sound.muted) this.mutebutton.classList.add("muted");
		else this.mutebutton.classList.remove("muted");
		console.log(this.sound);
	},
	readStartList (url){
		return fetch(url)
		.then(response => {
			if (!response.ok) {
				throw new Error("HTTP error " + response.status);
			}			
			return response.json()
		})
		.then(json => {
			if (json.isError) {
				throw new Error("API error " + json.errorMessage);
			}
			return json;
		})
		.catch(error => {
			this.dataError = true
			console.error(error);
		})
	},
	setActive(displayNode){
		let prev = document.querySelector(".active");
		displayNode.classList.add("active");
		if (prev) {
			prev.classList.remove("active");
			prev.classList.add("inactive");
		}
	}
}
export class Timer {
    officialTop;  //time we are counting to (from)
    sign;
    hours;
    minutes;
    seconds;
    hundredths;
    display;
    current; // target time in milliseconds
    #soundStarted = false;
    constructor (officialTopTimeString, displayNode, dayInfoDate){
		this.display = displayNode;
		this.current=this.#toMilliseconds(officialTopTimeString, dayInfoDate);
    }
	#toMilliseconds(hourMinString, dateString = "") {
		// hourMinString looks like "17:30" "07:05"
		// dateString has the annoying format of 24-05-2022 (!)
		let date = new Date();
		if (dateString) date.setDate(dateString.substr(0,2));
		date.setHours(hourMinString.substr(0,2));
		date.setMinutes(hourMinString.substr(3));
		date.setSeconds(0);
		date.setMilliseconds(0);
		return date.getTime();
	}
	update() {
		let distance = Date.now() + lastSample["offset"] - this.current;
		let signedDistance = -distance;
		if (distance < 0) { 
			this.sign = "&minus;";
			distance = Math.abs(distance);
		}
		else {
			this.sign = "&plus;";
			distance = distance + 1000
		}
		this.hours = Math.trunc(distance / (1000 * 60 * 60));
		this.minutes = Math.trunc((distance % (1000 * 60 * 60)) / (1000 * 60));
		this.seconds = Math.trunc((distance / 1000) % 60);
		//this.hundredths = Math.trunc((distance % (1000 * 60)) / 10);
		this.updateDisplay();
		if (!(this.display.classList.contains("active") || this.display.classList.contains("inactive") ) && ((Math.round(signedDistance/10)) < 36000)) {
			settings.setActive(this.display);
		}
		if (!this.#soundStarted) {
			if ((Math.round(signedDistance/10)) == 12550) {
				settings.sound.currentTime = 0;
				settings.sound.play();
				console.log(this.display.querySelector(".order").innerText, "distance: ", distance);
				this.#soundStarted = true;
			}
		}
		
	}
	updateDisplay() {
		this.display.querySelector(".timerSign").innerHTML = this.sign;
		this.display.querySelector(".timerHours").innerText = ("00" + this.hours).slice(-2);
		this.display.querySelector(".timerMinutes").innerText = ("00" + this.minutes).slice(-2);
		this.display.querySelector(".timerSeconds").innerText = ("00" + this.seconds).slice(-2);
		//this.display.querySelector(".timerHundredths").innerText = ("00" + this.hundredths).slice(-2);
		
		this.display.querySelector(".timerHours").innerText = ("00" + this.hours).slice(-2);

		if (this.hours == 0) {
			this.display.querySelector(".timerHours").style.display="none";
		}
		else this.display.querySelector(".timerHours").removeAttribute("style");
	}
}


