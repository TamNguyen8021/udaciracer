const RACE_STATUS = {
	IN_PROGRESS: "in-progress",
	FINISHED: "finished",
};

// PROVIDED CODE BELOW (LINES 1 - 80) DO NOT REMOVE

// The store will hold all information needed globally
let store = {
	track_id: undefined,
	track_name: undefined,
	player_id: undefined,
	player_name: undefined,
	race_id: undefined,
};

// We need our javascript to wait until the DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
	onPageLoad();
	setupClickHandlers();
});

const onPageLoad = async () => {
	console.log("Getting form info for dropdowns!");
	try {
		getTracks().then((tracks) => {
			const html = renderTrackCards(tracks);
			renderAt("#tracks", html);
		});

		getRacers().then((racers) => {
			const html = renderRacerCars(racers);
			renderAt("#racers", html);
		});
	} catch (error) {
		console.log("Problem getting tracks and racers ::", error.message);
		console.error(error);
	}
};

const setupClickHandlers = () => {
	document.addEventListener(
		"click",
		function (event) {
			const {target} = event;

			// Race track form field
			if (target.matches(".card.track")) {
				handleSelectTrack(target);
				store.track_id = target.id;
				store.track_name = target.innerHTML;
			}

			// Racer form field
			if (target.matches(".card.racer")) {
				handleSelectRacer(target);
				store.player_id = target.id;
				store.player_name = target.innerHTML;
			}

			// Submit create race form
			if (target.matches("#submit-create-race")) {
				event.preventDefault();

				// start race
				handleCreateRace();
			}

			// Handle acceleration click
			if (target.matches("#gas-peddle")) {
				handleAccelerate();
			}

			console.log("Store updated :: ", store);
		},
		false
	);
};

const delay = async (ms) => {
	try {
		return await new Promise((resolve) => setTimeout(resolve, ms));
	} catch (error) {
		console.log("an error shouldn't be possible here");
		console.log(error);
	}
};

// ^ PROVIDED CODE ^ DO NOT REMOVE

// BELOW THIS LINE IS CODE WHERE STUDENT EDITS ARE NEEDED ----------------------------
// TIP: Do a full file search for TODO to find everything that needs to be done for the game to work

/**
 * @description Controls the flow of the race, add the logic and error handling
 */
const handleCreateRace = async () => {
	console.log("in create race");

	// render starting UI
	renderAt("#race", renderRaceStartView(store.track_name));

	const {player_id, track_id} = store;
	const race = await createRace(player_id, track_id);

	console.log("RACE: ", race);
	store.race_id = race.ID;

	// The race has been created, now start the countdown
	await runCountdown();
	await startRace(store.race_id);
	await runRace(store.race_id);
};

/**
 * @description Runs the race by periodically checking its status and updating the UI accordingly
 *
 * @param {number} raceID The ID of the race to run
 * @returns {Promise<Object>} A promise that resolves with the final race object when the race is finished
 */
const runRace = (raceID) => {
	return new Promise((resolve, reject) => {
		const raceInterval = setInterval(async () => {
			try {
				const race = await getRace(raceID);

				if (race.status === RACE_STATUS.IN_PROGRESS) {
					renderAt("#leaderBoard", raceProgress(race.positions));
				} else if (race.status === RACE_STATUS.FINISHED) {
					clearInterval(raceInterval);
					renderAt("#race", resultsView(race.positions));
					resolve(race);
				}
			} catch (error) {
				clearInterval(raceInterval);
				reject(error);
			}
		}, 500);
	});
};

/**
 * @description Runs a countdown timer from 3 to 0, updating the DOM every second
 *
 * @returns {Promise<void>} A promise that resolves when the countdown reaches 0
 */
const runCountdown = async () => {
	try {
		// wait for the DOM to load
		await delay(1000);
		let timer = 3;

		return new Promise((resolve) => {
			const countdownInterval = setInterval(() => {
				// run this DOM manipulation inside the set interval to decrement the countdown for the user
				document.getElementById("big-numbers").innerHTML = --timer;

				if (timer === 0) {
					clearInterval(countdownInterval);
					resolve();
				}
			}, 1000);
		});
	} catch (error) {
		console.log(error);
	}
};

const handleSelectRacer = (target) => {
	console.log("selected a racer", target.id);

	// remove class selected from all racer options
	const selected = document.querySelector("#racers .selected");
	if (selected) {
		selected.classList.remove("selected");
	}

	// add class selected to current target
	target.classList.add("selected");
};

const handleSelectTrack = (target) => {
	console.log("selected track", target.id);

	// remove class selected from all track options
	const selected = document.querySelector("#tracks .selected");
	if (selected) {
		selected.classList.remove("selected");
	}

	// add class selected to current target
	target.classList.add("selected");
};

/**
 * @description Handles the acceleration action when the user clicks the accelerate button
 */
const handleAccelerate = () => {
	console.log("accelerate button clicked");
	accelerate(store.race_id);
};

// HTML VIEWS ------------------------------------------------
// Provided code - do not remove

const renderRacerCars = (racers) => {
	if (!racers.length) {
		return `
			<h4>Loading Racers...</4>
		`;
	}

	const results = racers.map(renderRacerCard).join("");

	return `
		<ul id="racers">
			${results}
		</ul>
	`;
};

const renderRacerCard = (racer) => {
	const {id, driver_name} = racer;

	return `<h4 class="card racer" id="${id}">${driver_name}</h3>`;
};

const renderTrackCards = (tracks) => {
	if (!tracks.length) {
		return `
			<h4>Loading Tracks...</4>
		`;
	}

	const results = tracks.map(renderTrackCard).join("");

	return `
		<ul id="tracks">
			${results}
		</ul>
	`;
};

const renderTrackCard = (track) => {
	const {id, name} = track;

	return `<h4 id="${id}" class="card track">${name}</h4>`;
};

const renderCountdown = (count) => {
	return `
		<h2>Race Starts In...</h2>
		<p id="big-numbers">${count}</p>
	`;
};

const renderRaceStartView = (track) => {
	return `
		<header>
			<h1>Race: ${track.name}</h1>
		</header>
		<main id="two-columns">
			<section id="leaderBoard">
				${renderCountdown(3)}
			</section>

			<section id="accelerate">
				<h2>Directions</h2>
				<p>Click the button as fast as you can to make your racer go faster!</p>
				<button id="gas-peddle">Click Me To Win!</button>
			</section>
		</main>
		<footer></footer>
	`;
};

const resultsView = (positions) => {
	let count = 1;

	const results = positions
		.sort(
			(firstRacer, secondRacer) =>
				firstRacer.final_position - secondRacer.final_position
		)
		.map((racer) => {
			return `
			<tr>
				<td>
					<h3>${count++} - ${racer.driver_name}</h3>
				</td>
			</tr>
		`;
		});

	return `
		<header>
			<h1>Race Results</h1>
		</header>
		<main>
			<h3>Race Results</h3>
			<p>The race is done! Here are the final results:</p>
			${results.join("")}
			<a href="/race">Start a new race</a>
		</main>
	`;
};

const raceProgress = (positions) => {
	let userPlayer = positions.find((e) => e.id === parseInt(store.player_id));
	userPlayer.driver_name += " (you)";

	positions = positions.sort((a, b) => (a.segment > b.segment ? -1 : 1));
	let count = 1;

	const results = positions.map((p) => {
		return `
			<tr>
				<td>
					<h3>${count++} - ${p.driver_name}</h3>
				</td>
			</tr>
		`;
	});

	return `
		<table>
			${results.join("")}
		</table>
	`;
};

const renderAt = (element, html) => {
	const node = document.querySelector(element);

	node.innerHTML = html;
};

// ^ Provided code ^ do not remove

// API CALLS ------------------------------------------------

const SERVER = "http://localhost:3001";

const defaultFetchOpts = () => {
	return {
		mode: "cors",
		headers: {
			"Content-Type": "application/json",
			"Access-Control-Allow-Origin": SERVER,
		},
	};
};

/**
 * @description Fetches the list of tracks from the server
 *
 * @returns {Promise<Array>} A promise that resolves to an array of track objects
 */
const getTracks = () => {
	console.log(`calling server :: ${SERVER}/api/tracks`);

	return fetch(`${SERVER}/api/tracks`, {
		method: "GET",
		...defaultFetchOpts(),
	})
		.then((response) => response.json())
		.catch((error) => console.log("Problem with getTracks request::", error));
};

/**
 * @description Fetches the list of racers (cars) from the server
 *
 * @returns {Promise<Array>} A promise that resolves to an array of racer objects
 */
const getRacers = () => {
	return fetch(`${SERVER}/api/cars`, {
		method: "GET",
		...defaultFetchOpts(),
	})
		.then((response) => response.json())
		.catch((error) => console.log("Problem with getRacers request::", error));
};

const createRace = (player_id, track_id) => {
	player_id = parseInt(player_id);
	track_id = parseInt(track_id);
	const body = {player_id, track_id};

	return fetch(`${SERVER}/api/races`, {
		method: "POST",
		...defaultFetchOpts(),
		dataType: "jsonp",
		body: JSON.stringify(body),
	})
		.then((response) => response.json())
		.catch((error) => console.log("Problem with createRace request::", error));
};

const getRace = (id) => {
	return fetch(`${SERVER}/api/races/${id}`, {
		method: "GET",
		...defaultFetchOpts(),
	})
		.then((response) => response.json())
		.catch((error) => console.log("Problem with getRace request::", error));
};

const startRace = (id) => {
	return fetch(`${SERVER}/api/races/${id}/start`, {
		method: "POST",
		...defaultFetchOpts(),
	})
		.then((response) => response.json())
		.catch((error) => console.log("Problem with getRace request::", error));
};

/**
 * @description Sends an acceleration request to the server for a specific race
 *
 * @param {number} id The ID of the race to accelerate
 * @returns {Promise<Response>} A promise that resolves to the response from the server
 */
const accelerate = (id) => {
	return fetch(`${SERVER}/api/races/${id}/accelerate`, {
		method: "POST",
		...defaultFetchOpts(),
	}).catch((error) => console.log("Problem with accelerate request::", error));
};
