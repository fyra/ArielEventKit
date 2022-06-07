/* countdown.js */

window.addEventListener("load", event => {
	settings.form["goButton"].addEventListener("click",
		()=>settings.formButton());
	new URL(window.location).searchParams
	.forEach((value,key) => {settings.form[key].value = value})
	settings.formButton()
	document.querySelector('[value="StartNow"]').addEventListener("click",
		()=>settings.startNow());
	let muteElement = document.querySelector('[value="Mute"]');
	muteElement.addEventListener("click",
		()=>settings.mute(muteElement));
});

// serverdate
import { getServerDate } from "../server-date/serverDate.js";

var sound = new Audio("countdown.mp3");

let lastSample = {};
const synchronize = async () => {
	lastSample = await getServerDate();
};
synchronize();
setInterval(synchronize, 10 * 60 * 1000);

setInterval(()=>{
	let d = new Date(Date.now() + lastSample["offset"])
	document.querySelector("h2").innerText = d.toTimeString().slice(0,8);
}, 45);

var settings = {
	form : document.querySelector("#settingsForm"),
	list : [],
	startListApiURL : true,
	getSearch() {
		if (Boolean(this.form.EventId.valueAsNumber && this.form.DayId.valueAsNumber)){
			this.startListApiURL = "../aidaapi" 
			+ "?EventId=" + this.form.EventId.valueAsNumber
			+ "&DayId=" + this.form.DayId.valueAsNumber;
		}
		else {
			this.startListApiURL = undefined;
		}
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
		this.url
	},
	startNow(){
		let now = Date.now() + lastSample["offset"] + 130000;
		let base = this.list[0].current;
		for (let i = 0; i < this.list.length; i++) {
			this.list[i].current = now + (this.list[i].current - base)
		}
	},
	mute(element){
		sound.muted = !sound.muted;
		if (sound.muted) element.classList.add("muted");
		else element.classList.remove("muted");
	},
	formButton() {
		//this.getSearch();
		//this.setSearch(); disabled for ariel relax.
		sound.muted = true;
		sound.play();
		setTimeout(()=>sound.pause(), 50);
		sound.muted = false;
		if (this.startListApiURL) {
			this.startListApiURL = "test.json";
			console.log("Getting " + this.startListApiURL);
			this.readStartList(this.startListApiURL)
			.then(r => {
				let t = document.querySelector(".diver");
				for (let start of r.response.startList){
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
    #interval;  //id of the interval used for updating
    #updateDelay = 45; // in ms, delay between updates, is passed to setInterval.
    #soundStarted = false;
    constructor (officialTopString, displayNode, dayInfoDate){
		this.display = displayNode;
		this.startCountdown(officialTopString, dayInfoDate);
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
	startCountdown(hourMinString, dateString = "") {
		this.current=this.#toMilliseconds(hourMinString, dateString);
		if (this.#interval) {
			clearInterval(this.#interval)
		}
		this.#interval = setInterval( () => {
			this.update(), this.#updateDelay
			});
		
	}
    stopCountdown() {
		clearInterval(this.#interval);
		this.#interval = 0;
		this.setDisplay("±","00","00","00","00");
	}
	update() {
		// current, next are unix timestamps.
		let distance = Date.now() + lastSample["offset"] - this.current;
		let signedDistance = -distance;
		if (distance < 0) { 
			this.sign = "&minus;";
			distance = Math.abs(distance);
		}
		else this.sign = "&plus;";
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
				sound.currentTime = 0;
				sound.play();
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


