window.addEventListener("load", event => {
	settings.form["goButton"].addEventListener("click",
		()=>settings.formButton());
	settings.form.addEventListener("click",
		()=>settings.timerCheckboxClick());
});
var settings = {
	form : document.querySelector("#settingsForm"),
	list : [],
	startListApiURL : undefined,
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
	formButton() {
		this.getSearch();
		this.setSearch();
		sound.muted = true;
		sound.play();
		setTimeout(()=>sound.pause(), 50);
		sound.muted = false;
		if (this.startListApiURL) {
			//this.startListApiURL = "examplestartlists/test"
			console.log("Getting " + this.startListApiURL);
			this.readStartList(this.startListApiURL)
			.then(r => {
				let t = document.querySelector(".diver");
				for (let start of r.response.startList){
					let n = t.insertAdjacentElement("beforebegin", t.cloneNode(true));
					n.querySelector(".order").innerText = start["order"];
					n.querySelector(".diverFirstName").innerText = start["diverFirstName"];
					n.querySelector(".diverLastName").innerText = start["diverLastName"];
/*					this.list.push(new Timer(start["officialTime"], n, r.response.dayInfo.date)); */
					
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
		prev.classList.remove("active");
	}
}
