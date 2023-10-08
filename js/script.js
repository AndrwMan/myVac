document.addEventListener("DOMContentLoaded", async function () {
	//verify d3.js lib import
	if (typeof d3 !== 'undefined') {
		console.log('D3.js is already loaded in this project.');
	} 
	else {
		console.log('D3.js is Not loaded in this project.');
	}
	//verify php data available
	console.log(bondsData);
	//bookedmarked version of same url will not be updated, no new logs
	console.log(spxData);
	
	if (!spxData || !bondsData) {
		// Either SPX or bond data is missing, throw an error
		throw new Error("SPX or bond data is missing. Cannot draw initial graph.");
	  }
	//console.log(spxData[0]);

	// Define dimensions of the graph
	var width = 800;
	var height = 400;
	var margin = { top: 20, right: 20, bottom: 30, left: 50 };

	// Create an SVG container for the graph
	var svg = d3.select("body").append("svg")
	.attr("width", width)
	.attr("height", height);

	// Set parse function that converts strings to Date objects
	var parseDate = d3.timeParse("%Y-%m-%d");

	// Set the ranges for x and y
	var x = d3.scaleTime().range([margin.left, width - margin.right]);
	var y = d3.scaleLinear().range([height - margin.bottom, margin.top]);

	// Define the line
	var line = d3.line()
	.x(function (d) { return x(d.date); })
	.y(function (d) { return y(d.close); });

	// Format the data
	spxData.forEach(function (d) {
		//console.log(d.date)
		d.date = parseDate(d.date);
		d.close = +d.close;
	});

	// Scale the range of the data
	x.domain(d3.extent(spxData, function (d) { return d.date; }));
	y.domain([0, d3.max(spxData, function (d) { return d.close; })]);

	// Add the X-axis
	svg.append("g")
	.attr("transform", "translate(0," + (height - margin.bottom) + ")")
	.call(d3.axisBottom(x));

	// Add the Y-axis
	svg.append("g")
	.attr("transform", "translate(" + margin.left + ",0)")
	.call(d3.axisLeft(y));

	// Add the line
	svg.append("path")
	.datum(spxData)
	.attr("fill", "none")
	.attr("stroke", "steelblue")
	.attr("stroke-width", 2)
	.attr("d", line);

	// Add interactive vertical bar
	// weirdly when manually inputting the very first date here
	//  x.invert() gets the pos/date for the day before
	//var initialXPosition = x(new Date("1999-01-04")); 

	//programmtically set the very first date, still "1999-01-04"
	var minDate = d3.min(spxData, function(d) { return d.date; });
	var initialXPosition = x(minDate);
	var verticalBar = svg.append("line")
	.attr("x1", initialXPosition)
	.attr("x2", initialXPosition)
	.attr("y1", margin.top)
	.attr("y2", height - margin.bottom)
	.attr("stroke", "red")
	.attr("stroke-width", 2)
	//.style("display", "none"); // Initially hidden

	// Add text elements to display date and closing value
	var infoText = svg.append("text")
		.attr("x", margin.left + 10)
		.attr("y", margin.top + 10)
		.attr("class", "info-text");

	//Add mousemove event to show/hide vertical bar and update data
	console.log(svg.node())
	// do not use d3.mouse which was removed in d3 v6 onwards
	// see: https://observablehq.com/@d3/d3v6-migration-guide#pointer
	// svg.on("mousemove", (event) => {
	// 	var pointer = d3.pointer(event);
	// 	var mouseX = pointer[0];			// get x-coordinate
	// 	var dateValue = x.invert(mouseX);	// converts pixel position to date value using x-scale
	// 	// find the closest data value in spxData array,
	// 	//  recall that user is free to point anywhere 
	// 	//  but not all dates are trading days and 
	// 	//  therefore may not have observed vals
	// 	var bisectDate = d3.bisector(function (d) { return d.date; }).left;
	// 	var index = bisectDate(spxData, dateValue, 1);
	// 	var dataPoint = spxData[index];

	/* dragging features */
	// Add drag behavior
	var dragBehavior = d3.drag()
		.on("start", dragStart)
		.on("drag", dragging)
		.on("end", dragEnd);

	// Apply drag behavior to the SVG
	svg.call(dragBehavior);

	// Variables to store drag state
	var isDragging = false;
	//var mouseX = 0;

	function dragStart() {
		isDragging = true;
	}

	async function dragging(event) {
	//async function dragging(event) {
		if (isDragging) {
			// Limit mouse position within x-axis range
			var mouseX = Math.max(margin.left, Math.min(event.x, width - margin.right)); 
			//var marginLeftDate = x.invert(margin.left);
			//console.log(marginLeftDate)
			updateVerticalBar(mouseX);

			// Update bonds graph with data for the current date/ bar pos
			var dateValue = x.invert(mouseX);
			//await updateYields(dateValue);
			updateYields(dateValue);

			//await updateYieldCurve();
			updateYieldCurve();
		}
	}

	function dragEnd() {
		isDragging = false;

		// FIXME: its seems that vertical bar is off by 1 after drag
		// ex: 1999-01-05 even when fully dragged left to 1999-01-04
		var mouseX = +verticalBar.attr("x1");	// Get current position of bar
		updateVerticalBar(mouseX);

		// retrieve the matched bondsData a final time
		// to sync with current bar pos/date
		// var mouseX = +verticalBar.attr("x1");	// Get current position of bar
		// var dateValue = x.invert(mouseX);
		// updateYields(dateValue);
	}

	function updateVerticalBar(mouseX) {
		var dateValue = x.invert(mouseX);
		var bisectDate = d3.bisector(function (d) { return d.date; }).left;
		var index = bisectDate(spxData, dateValue, 1);
		var dataPoint = spxData[index];

		if (dataPoint) {
			verticalBar.attr("x1", mouseX).attr("x2", mouseX).style("display", "block");
			// display dynamic date and close values, rounded to nearest cents 
			infoText.text("Date: " + d3.timeFormat("%Y-%m-%d")(dataPoint.date) + ", Close: " + dataPoint.close.toFixed(2))
				.style("display", "block");
		} else {
			verticalBar.style("display", "none");
			infoText.style("display", "none");
		}
	}

	/* snapshot features */
	// Add "Snapshot" button
	var snapshotButton = d3.select("body").append("button")
	.text("Snapshot")
	.on("click", toggleSnapshot);

	var snapshotXPosition = null; // var to store position of snapshot bar

	function toggleSnapshot() {
	if (snapshotXPosition === null) {
		// Draw a snapshot bar, pos fixed
		snapshotXPosition = verticalBar.attr("x1");
		verticalBar.clone() // Clone the vertical bar
			.attr("stroke", "green") // Change the color for snapshot
			.attr("class", "snapshot-bar") // Add a class to identify snapshot bars
			.attr("x1", snapshotXPosition)
			.attr("x2", snapshotXPosition);

		snapshotButton.text("Reset");
		} else {
			// Remove the snapshot bar
			svg.selectAll(".snapshot-bar").remove();
			snapshotXPosition = null;
			// toggle button text
			snapshotButton.text("Snapshot"); 
		}
	}

	/* playback related features */

	// Add "Animate" button
    var animateButton = d3.select("body").append("button")
        .text("Animate")
        .on("click", toggleAnimate);

    var isAnimating = false; // store animation state
    var animationInterval; // Interval for the animation

    function toggleAnimate() {
        if (!isAnimating) {
            isAnimating = true;
            animateButton.text("Pause");

            // Start animation
            var currentX = +verticalBar.attr("x1");
			//determine upper bound of x-axis pos based on data
            var maxX = x(spxData[spxData.length - 1].date);
            var animationSpeed = 100; 
			//convert pixels to date value, use to update in animationInterval
            var currentDateIndex = d3.bisector(function (d) { return d.date; }).left(spxData, x.invert(currentX));
            var currentDate = spxData[currentDateIndex].date;
			
			// shift bar & update displayed date, closing values 
            animationInterval = setInterval(function () {
                if (currentX < maxX) {
                    currentDateIndex++;
                    currentDate = spxData[currentDateIndex].date;
                    currentX = x(currentDate);
                    updateVerticalBar(currentX);
					updateYields(currentDate); // Update bonds graph

					updateYieldCurve();
                } else {
                    pauseAnimate();
                }
            }, animationSpeed);
        } else {
			//somehow animate always get same date updateVerticalBar() display 
			// var currentX = +verticalBar.attr("x1");
			// updateVerticalBar(currentX);
			// console.log(currentX)

			// var currentDateIndex = d3.bisector(function (d) { return d.date; }).left(spxData, x.invert(currentX));
            // var currentDate = spxData[currentDateIndex].date;
			// updateYields(currentDate)

            pauseAnimate();
        }
    }

    function pauseAnimate() {
        isAnimating = false;
        animateButton.text("Animate");
		//stop associated Js Interval timer
        clearInterval(animationInterval);
    }

	/* dynamic bonds graph features */
	// event handler for spx bar selection

	// market yield curve graph/ container creation
	var svg_bonds = d3.select("body").append("svg")
        .attr("width", width)
        .attr("height", height);

	// Initial filtering & bonds graph creation 
	// since there is no data on 1/1/1999 for SPX,
	//  the bar is moved to next avalible date 
	//  making bar 1 day ahead of actual date's data
	var initDateValue = x.invert(initialXPosition);
	console.log(initialXPosition);
	console.log(initDateValue);
	updateYields(initDateValue);

	// bonds graph update based on interactivity
	//  Not time-based/(setInterval()) updates
	// global, inscope for bonds graph
	var filteredBondsData;
	function updateYields(dateValue) {
			// Filter bondsData to get elements with the same date
			console.log(dateValue)
			console.log(typeof(dateValue))
			// even though the anon func is callback
			//  bbut filter may still need time to complete filter
			filteredBondsData = bondsData.filter(function (d) {
			//var filteredBondsData = bondsData.filter(function (d) {
				//ensures both dates are Date objects
				bondDate = parseDate(d.date)
				// convert both dates to milliseconds
				//  but we only care that date 'YY-MM-DD' is the same
				// Also, FRED/bond data is updated at midnight (secs component is always :00)
				//  but SPX data is updated at random times with secs 
				//  so the ms comparison will no be equal 
				//return bondDate.getTime() == dateValue.getTime();

				// just compare the year, month, day components of date objects
				return (
					bondDate.getFullYear() === dateValue.getFullYear() &&
					bondDate.getMonth() === dateValue.getMonth() &&
					bondDate.getDate() === dateValue.getDate()
				);
			});
		console.log(filteredBondsData);
		//updateYieldCurve();
	}

	/* market yield curve graph creation */

	// var svg_bonds = d3.select("body").append("svg")
    //     .attr("width", width)
    //     .attr("height", height);

	//Extract unique maturity horizons for x-axis values
	//var maturityHorizons = [...new Set(bondsData.map(function (d) { return d.maturityHorizon; }))];
	var maturityHorizons = [...new Set(bondsData.map(function (d) {
		var parsedDuration = d.maturityHorizon.match(/\d+-Year|\d+-Month/);
		return parsedDuration ? parsedDuration[0] : "";
	}))];

	var uniqueMaturityHorizons = [...new Set(bondsData.map(function (d) {
		return d.maturityHorizon;
	}))];

	// ...Since we want our tick labels to be
	// different from data's "maturityHorizon" property 
	// and match a value in the domain(<array>),
	// Must create a mapping between tick labels & original "maturityHorizon" values
	var ticks2dataMHMap = {};
	uniqueMaturityHorizons.forEach(function (label, index) {
		// takes each value of "maturityHorizon" property in 
		//  and assign it the respective value in maturityHorizons 
		ticks2dataMHMap[label] = maturityHorizons[index];
	});
	console.log(ticks2dataMHMap)

	// Set up scales for the yield curve
	var xYield = d3.scaleBand()
		//.domain() determines both the x-axis ticks
		// and assigns x-values to labels...
		.domain(maturityHorizons)
		.range([margin.left, width - margin.right])
		//.padding(0.1);

	//constant x-values for each category
	var xValues = maturityHorizons.map(function(category) {
		return xYield(category);
	});
	console.log(xValues);

	//original code
	// var numericMarketYields = bondsData
	// .filter(function (d) {
	// 	console.log("\t numericMarketYields")
	// 	return !isNaN(+d.marketYield) && d.marketYield !== ".";
	// })
	// .map(function (d) {
	// 	return +d.marketYield;
	// });

	// var yYield = d3.scaleLinear()
	// .domain([0, d3.max(numericMarketYields)]) // Use filtered and numeric data for the domain
	// .nice()
	// .range([height - margin.bottom, margin.top]);


	//test1
	var numericMarketYields; // Declare numericMarketYields in a higher scope
	//var yYield; // Declare yYield in the same higher scope

	async function processDataAndSetupScale() {
		try {
			numericMarketYields = await new Promise((resolve) => {
			var result = bondsData
				.filter(function (d) {
				console.log("\t numericMarketYields");
				return !isNaN(+d.marketYield) && d.marketYield !== ".";
				})
				.map(function (d) {
				return +d.marketYield;
				});
			resolve(result);
			});

			// Continue with other code that depends on numericMarketYields
		} catch (error) {
			// Handle errors here
			console.error(error);
		}
	}
	await processDataAndSetupScale()

	//test1
	// Set up the yYield scale using numericMarketYields
	var yYield = d3.scaleLinear()
		.domain([0, d3.max(numericMarketYields)]) // Use filtered and numeric data for the domain
		.nice()
		.range([height - margin.bottom, margin.top]);
	

	//debug
	var yRange = yYield.range();
	console.log("yYield range:", yRange);

	// Define the line generator for the yield curve
	var lineYield = d3.line()
		.x(function (d) { 
			// console.log(d.maturityHorizon)
			// console.log(ticks2dataMHMap[d.maturityHorizon])
			// console.log(xYield(ticks2dataMHMap[d.maturityHorizon]))
			console.log(d)
			var mappedValue = ticks2dataMHMap[d.maturityHorizon];
			// console.log("Mapped Value:", mappedValue);
			// console.log("Domain:", xYield.domain());
			// console.log("Domain:", maturityHorizons);

			console.log(filteredBondsData)
			console.log(xValues);
			console.log(xYield(mappedValue))
			console.log(xYield.bandwidth() / 2)
			console.log(xYield(mappedValue) + xYield.bandwidth() / 2)
			// +: shifts the x-value over , // xYield.bandwidth(): gets the width of a category/band, // 2: divide the interval len by 2
			return xYield(mappedValue) + xYield.bandwidth() / 2;
		})
		.y(
			function (d) { 
			console.log( yYield(+d.marketYield) )
			return yYield(+d.marketYield); 
		});

	// Add the x-axis for bond maturities
	// var xAxisYield = d3.axisBottom(xYield)
    // 	.tickValues(xPositions)
	var xAxisYield = d3.axisBottom(xYield);

	// Add the x-axis for bond maturities with custom tick values
	// var xAxisYield = d3.axisBottom(xYield)
	// .tickValues(tickValues) // Set custom tick values
	// .tickFormat(function (d, i) { return maturityHorizons[i].duration; }); // Set tick labels 

	svg_bonds.append("g")
		.attr("class", "x-axis")
		.attr("transform", "translate(0," + (height - margin.bottom) + ")")
		.call(xAxisYield);

	// Add the y-axis for yields
	svg_bonds.append("g")
		.attr("class", "y-axis")
		.attr("transform", "translate(" + margin.left + ",0)")
		.call(d3.axisLeft(yYield));


	console.log(filteredBondsData)	
	// Add the yield curve line
	// svg_bonds.append("path")
	// 	// bind the data to path element
	// 	//  data point in yieldCurveData corresponds 
	// 	//  to a segment/point in the path element's shape. 
	// 	.datum(filteredBondsData)
	// 	//.datum(yieldCurveData)
	// 	.attr("fill", "none")
	// 	.attr("stroke", "green") // You can choose your desired color
	// 	.attr("stroke-width", 2)
	// 	.attr("d", lineYield);

	updateYieldCurve();
	
	/* dynamic yield curve to interative bar */

	// function updateYieldCurve() {
	// 	// Select the path element and bind the updated data to it
	// 	var updatedPath = svg_bonds.select("path")
	// 		.datum(filteredBondsData);

	// 	// enter-exit approach works for suer when there's enough delay
	// 	// Use the enter-update-exit pattern
	// 	updatedPath.enter()
	// 		.append("path")
	// 		.merge(updatedPath)
	// 		.attr("fill", "none")
	// 		.attr("stroke", "green")
	// 		.attr("stroke-width", 2)
	// 		.transition()
	// 		.duration(100)
	// 		.attr("d", d => lineYield(d));

	// 	// updatedPath.transition()
    //     // .duration(100)
    //     // .attr("d", d => lineYield(d));

	// 	//Remove any extra path elements that are no longer needed
	// 	updatedPath.exit().remove();
	// }
		
	//async function updateYieldCurve() {
	function updateYieldCurve() {
		svg_bonds.append("path")
		// bind the data to path element
		//  data point in yieldCurveData corresponds 
		//  to a segment/point in the path element's shape. 
		.datum(filteredBondsData)
		//.datum(yieldCurveData)
		.attr("fill", "none")
		.attr("stroke", "green") // You can choose your desired color
		.attr("stroke-width", 2)
		.attr("d", lineYield);

		// Select the path element and bind the updated data to it
		var updatedPath = svg_bonds.select("path")
		  .datum(filteredBondsData);
	  
		// enter-exit approach works for sure when there's enough delay
		// Use the enter-update-exit pattern
		updatedPath.enter()
		  .append("path")
		  .merge(updatedPath)
		  .attr("fill", "none")
		  .attr("stroke", "green")
		  .attr("stroke-width", 2)
		  .transition()
		  .duration(100)
		  .attr("d", d => lineYield(d))
		  .on("end", () => {
			// This code will be executed when the transition ends
			// Remove any extra path elements that are no longer needed
			updatedPath.exit().remove();
		  });
	  
		// No need for the additional Promise and await here
	  }

});

