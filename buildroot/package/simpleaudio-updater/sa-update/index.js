/*Copyright 2018 Bang & Olufsen A/S
Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:
The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.*/

// ROON CONTROL FOR BEOCREATE

var fetch = require("node-fetch");
var exec = require("child_process").exec;
var spawn = require("child_process").spawn;
var fs = require("fs");

	var debug = beo.debug;
	const localVersionPath = "/etc/version"
	var version = require("./package.json").version;
	
	var sources = null;

	var updateAvailable = false;
	var updating = false;
	beo.bus.on('general', function(event) {
		
		if (event.header == "startup") {
		}
		
		if (event.header == "activatedExtension") {
			if (event.content.extension == "sa-update") {
				checkUpdate().then((fetchedUpdate) => {
					const localVersion = fs.readFileSync(localVersionPath, "utf8").trim();
    					updateAvailable = (fetchedUpdate != localVersion);
					beo.bus.emit("ui", {target: "sa-update", header: "updateSettings", content: {updateAvailable: updateAvailable, updating: updating, version: fetchedUpdate}});
				})
				.catch((error) => {
       				 	console.error("Error in processing received data:", error);
    				});
			}
		}
	});
	
	beo.bus.on('sa-update', function(event) {
		if (event.header == "checkUpdate") {
			checkUpdate().then((fetchedUpdate) => {
				const localVersion = fs.readFileSync(localVersionPath, "utf8").trim();
                                updateAvailable = (fetchedUpdate != localVersion);
                                beo.bus.emit("ui", {target: "sa-update", header: "updateSettings", content: {updateAvailable: updateAvailable, updating: updating, version: fetchedUpdate } });
			})
                        .catch((error) => {
                                 console.error("Error in processing received data:", error);
                        });
		}
		
		if (event.header == "runUpdate") {
			const scriptPath = "/usr/bin/sa-updater"; // Replace with your script's path

			const process = spawn(scriptPath);
			updating = true;
			beo.bus.emit("ui", { target: "sa-update", header: "updateSettings", content: { updating: updating } });

    			process.stdout.on('data', (data) => {
        			console.log(`Script output: ${data.toString()}`);
				const output = data.toString(); 
				beo.bus.emit("ui", { target: "sa-update", header: "updateSettings", content: { updating: updating, stdout: output} });
        			// You can update the UI in real-time based on the output, if needed
    			});

    			process.stderr.on('data', (data) => {
        			console.error(`Error output: ${data.toString()}`);
    			});

    			process.on('close', (code) => {
        			console.log(`Script finished with exit code: ${code}`);

        			if (code === 0) {
            			// Success logic
            				console.log("Update process completed successfully!");
            				updating = false;
					beo.bus.emit("ui", { target: "sa-update", header: "updateSettings", content: { updating: false } });
        			} else {
            				console.log(`Update process failed with exit code: ${code}`);
            				updating = false;
					beo.bus.emit("ui", { target: "sa-update", header: "updateSettings", content: { updating: false } });
        			}
    			});
		}
	});
		
	async function checkUpdate() {
    		//const versionURL = "http://larsgrootkarzijn.nl/version.php";
    		const localVersionPath = "/etc/version";

    		try {
        		// Fetch the latest tag from GitHub synchronously
        		const response = await fetch("http://larsgrootkarzijn.nl/version.php", {
            			method: 'GET',
            			headers: { "User-Agent": "Version-Checker"},
				timeout: 10000
        		});

			if (!response.ok) {
            			console.error("Failed to fetch from custom URL:", response.status);
            			return false;
        		}

			const data = await response.json();

        		const latestTag = data.tag_name.trim();

        		const localVersion = fs.readFileSync(localVersionPath, "utf8").trim();
			lastChecked = new Date().toUTCString();
			console.log("foundversion: " + latestTag);
        		return latestTag;
    		
		} catch (error) {
        		console.error("Error checking update:", error);
        		return false;
    		}
	}
	
module.exports = {
	version: version
};
