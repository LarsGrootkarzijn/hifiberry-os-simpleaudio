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

var exec = require("child_process").exec;

	var debug = beo.debug;
	
	var version = require("./package.json").version;
	var fs = require('fs');

	var service = {
  		"Rear Line-In": false,
  		"Front Line-In": false,
  		"Amplifier": false,
  		"Rear Line-Out": false
	};
	
	const filePath = '/etc/sa-service.json';
	const amplifierOutGpio = 497;
	const amplifierInGpio = 504;
	const lineOutGpio = 495;
	const headphoneGpio = 496;
	const headphoneInGpio = 506;
	const rearMixer = 'Input Mixer AIN1';
	const frontMixer = 'Input Mixer AIN2';
	const bypassMixer = 'Output Mixer Bypass';
	const dacMixer = 'Output Mixer DAC';
	
	beo.bus.on('general', function(event) {
		
		if (event.header == "startup") {
			fs.access(filePath, fs.constants.F_OK, (err) => {
    				if (err) {
        				fs.writeFile(filePath, JSON.stringify(service, null, 2), 'utf8', (writeErr) => {
            				if (writeErr) {
                				console.error('Error creating the file:', writeErr);
            				} else {
                				console.log('File created successfully with initial data.');
           	 			}
        			});
    				} else {
        				// File exists, read it
        				fs.readFile(filePath, 'utf8', (readErr, data) => {
            					if (readErr) {
                					console.error('Error reading the service.json file:', readErr);
                					return;
            					}
            			
						try {
                					service = JSON.parse(data);
            					} catch (parseError) {
                					console.error('Error parsing JSON:', parseError);
            					}
        				});
    				}
			});

			getGpio(amplifierInGpio, (gpioValue) => {
        			if (gpioValue) {
            				service["Amplifier"] = null;
            				console.log(service["Amplifier"]);
            				setGpio(amplifierOutGpio, false);
        			} else {
            				console.log("Amplifier enabled");
        			}

				writeServiceJson("Amplifier", null);
				beo.bus.emit("ui", {target: "sa-control", header: "serviceSettings", content: {service: service}});
    			});	
		}
		
		if (event.header == "activatedExtension") {
			if (event.content.extension == "sa-control") {
				getGpio(headphoneInGpio, (gpioValue) => {
                                	if (!gpioValue) {
                                        	service["Rear Line-Out"] = null;
                                        	console.log(service["Rear Line-Out"]);
                                        	setGpio(lineOutGpio, false);
                                	} else if(gpioValue && service["Rear Line-Out"] === null){
						service["Rear Line-Out"] = false;
                                        	console.log("Headphone disabled");
                                	}

                                	writeServiceJson("Rear Line-Out", service['Rear Line-Out']);
                                	beo.bus.emit("ui", {target: "sa-control", header: "serviceSettings", content: {service: service}});
                        	});
			}
		}
	});
	
	beo.bus.on('sa-control', function(event) {
		
		if (event.header == "serviceSettings") {
			
			if (event.content.service != undefined) {
				for (let prop in event.content.service) {
					if(event.content.service[prop] !== service[prop]) {
						if(prop === "Amplifier" && service["Amplifier"] !== null) {
							setGpio(amplifierOutGpio, event.content.service[prop]);
						}

						if(prop === "Rear Line-Out") {
							setGpio(lineOutGpio, event.content.service[prop])
						}
						
						if(prop === "Front Line-In" && event.content.service["Front Line-In"]) {
                   					setAlsaControl(dacMixer, 'off');
							setAlsaControl(bypassMixer, 'on');
							setAlsaControl(frontMixer, 'on');
							
							setAlsaControl(rearMixer, 'off');
							event.content.service["Rear Line-In"] = false;
						} else if(prop === "Front Line-In" && event.content.service["Rear Line-In"] && !event.content.service["Front Line-In"]) {
                                                        setAlsaControl(frontMixer, 'off');        
                                                } else if(prop === "Front Line-In" && !event.content.service["Front Line-In"]) {
                                                        setAlsaControl(dacMixer, 'on');
                                                        setAlsaControl(bypassMixer, 'off');
                                                        setAlsaControl(frontMixer, 'off');
							setAlsaControl(rearMixer, 'on');
                                                }

						if(prop === "Rear Line-In" && event.content.service["Rear Line-In"]) {
                                                        setAlsaControl(dacMixer, 'off');
                                                        setAlsaControl(bypassMixer, 'on');
                                                        setAlsaControl(rearMixer, 'on');
							if(event.content.service["Front Line-In"]) {
                                                                setAlsaControl(frontMixer, 'off');
                                                                event.content.service["Front Line-In"] = false;
                                                        }

                                                } else if(prop === "Rear Line-In" && !event.content.service["Rear Line-In"] && event.content.service["Front Line-In"]) {
                                                        setAlsaControl(rearMixer, 'off');
                                                } else if(prop === "Rear Line-In" && !event.content.service["Rear Line-In"] && !event.content.service["Front Line-In"]) {
							setAlsaControl(dacMixer, 'on');
                                                        setAlsaControl(bypassMixer, 'off');
							setAlsaControl(rearMixer, 'on');
						}
						writeServiceJson(prop, event.content.service[prop])
					}
				}
				
				service = event.content.service;
				
				beo.bus.emit("ui", {target: "sa-control", header: "serviceSettings", content: {service: service}});
			}
		
		}
	});

	function setGpio(gpionr, value) {
		const gpioValue = value ? 1 : 0;
		const command = `/usr/bin/setgpio ${gpionr} 1 ${gpioValue}`;

    		exec(command, (error, stdout, stderr) => {
 
	       		if (error) {
        	    		console.error(`Error executing command: ${error.message}`);
        			return;
        		}
        	
			if (stderr) {
            			console.error(`stderr: ${stderr}`);
            			return;
        		}

        		console.log(`stdout: ${stdout}`);
    		});
	}
	

	function getGpio(gpionr,callback) {
    		const command = `/usr/bin/getgpio ${gpionr}`;
   		
		exec(command, (error, stdout, stderr) => {
   			if (error) {
            			console.error(`Error executing command: ${error.message}`);
            			callback(null);
				return; // Indicate an error occurred
        		}

			if (stderr) {
            			console.error(`stderr: ${stderr}`);
            			callback(null); // Indicate an error occurred
        			return;
			}

        		const gpioValue = stdout.trim().match(/value = (\d)/);
        		console.log(`gpioval: ${gpioValue}`)	
			if (gpioValue[1] === "1") {
            			callback(true);
        		} else if (gpioValue[1] === "0") {
            			callback(false);
        		} else {
            			callback(null);
        		}
    		});
	}

	function setAlsaControl(mixer, value) {
		const command = `/bin/amixer set '${mixer}' ${value}`
		console.log(`${mixer}`)
		console.log(`${command}`)
		exec(command, (error, stdout, stderr) => {

                        if (error) {
                                console.error(`Error executing command: ${error.message}`);
                                return;
                        }

                        if (stderr) {
                                console.error(`stderr: ${stderr}`);
                                return;
                        }

                        console.log(`stdout: ${stdout}`);
                });
	}
	
	function writeServiceJson(fieldName, fieldValue) {
  		try {
    			const data = fs.readFileSync(filePath, 'utf8');
    			let service = JSON.parse(data);

    			if (fieldName in service) {
      				service[fieldName] = fieldValue;

      				fs.writeFileSync(
        				filePath,
        				JSON.stringify(service, null, 2), // Format JSON with 2-space indentation
        				'utf8'
      				);

      				console.log(`Successfully updated "${fieldName}" to ${fieldValue} in service.json!`);
    			} else {
      				console.error(`Error: Field "${fieldName}" does not exist in service.json.`);
    			}
  		} catch (err) {
  		 	console.error('Error updating service.json:', err);
  		}
	}

module.exports = {
	version: version
};
