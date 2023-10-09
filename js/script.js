document.addEventListener("DOMContentLoaded", async function () {
	//verify d3.js lib import
	if (typeof d3 !== 'undefined') {
		console.log('D3.js is already loaded in this project.');
	} 
	else {
		console.log('D3.js is Not loaded in this project.');
	}
	//verify php data available
	// note that there are ~6459 dates x 6 maturity horizons = 38754 dpts
	console.log(bondsData);
	//bookedmarked version of same url will not be updated, no new logs
	// note that there are ~6231 dates 
	console.log(spxData);
	
	if (!spxData || !bondsData) {
		// Either SPX or bond data is missing, throw an error
		throw new Error("SPX or bond data is missing. Cannot draw initial graph.");
	}
	//console.log(spxData[0]);

	// Define dimensions of the graph
	var width = 800;
	var height = 400;
	var margin = { top: 20, right: 20, bottom: 50, left: 70 };

	// Create an SVG container for the graph
	var svg = d3.select("body").append("svg")
	.attr("width", width)
	.attr("height", height);

	// Set parse function that converts strings to Date objects
	var parseDate = d3.timeParse("%Y-%m-%d");

	// Add x-axis Title
	svg.append("text")
	.attr("class", "x-axis-title")
	.attr("text-anchor", "middle") // Center the title horizontally
	.attr("x", width / 2)
	.attr("y", height - margin.bottom + 40) // Adjust the y position as needed
	.text("Time (years)");

	// Add y-axis Title
	svg.append("text")
	.attr("class", "y-axis-title")
	.attr("text-anchor", "middle")
	.attr("transform", "rotate(-90)") // Rotate the title vertically
	.attr("x", -height / 2)
	.attr("y", margin.left - 50) // Adjust the x position as needed
	.text("Adjusted Closing Price ($)");

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
	//SPX data has one less data pt than bondsData (start: "1999-01-01")
	console.log(minDate)
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

			updateInfoGroup();
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
            var animationSpeed = 70; 
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
					updateInfoGroup();
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
			//  but filter may still need time to complete filter
			// *double check if returned filtered data is off or dateValue 
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

	// svg_bonds is moved to ~ line 270
	//  before updateYields() which might need to access svg_bonds
	//  updateYields() call updateYieldCurve() within it 
	// var svg_bonds = d3.select("body").append("svg")
    //     .attr("width", width)
    //     .attr("height", height);

	// Add the x-axis line
	svg_bonds.append("line")
	.attr("x1", margin.left)
	.attr("y1", height - margin.bottom)
	.attr("x2", width - margin.right)
	.attr("y2", height - margin.bottom)
	.attr("stroke", "black");

	// Add the y-axis line
	svg_bonds.append("line")
	.attr("x1", margin.left)
	.attr("y1", margin.top)
	.attr("x2", margin.left)
	.attr("y2", height - margin.bottom)
	.attr("stroke", "black");

	// Add x-axis title
	svg_bonds.append("text")
	.attr("class", "x-axis-title")
	.attr("x", width / 2)
	.attr("y", height - margin.bottom + 40) 
	.style("text-anchor", "middle")
	.text("Maturity Horizons");

	// Add y-axis title
	svg_bonds.append("text")
	.attr("class", "y-axis-title")
	.attr("transform", "rotate(-90)")
	.attr("x", -height / 2)
	.attr("y", margin.left - 50) 
	.style("text-anchor", "middle")
	.text("Market Yield (%)");

	//Extract unique maturity horizons (shortened & original) for x-axis values
	//var maturityHorizons = [...new Set(bondsData.map(function (d) { return d.maturityHorizon; }))];
	var maturityHorizons = [...new Set(bondsData.map(function (d) {
		var parsedDuration = d.maturityHorizon.match(/\d+-Year|\d+-Month/);
		return parsedDuration ? parsedDuration[0] : "";
	}))];

	var uniqueMaturityHorizons = [...new Set(bondsData.map(function (d) {
		return d.maturityHorizon;
	}))];

	// ...Since we want our tick labels to be
	// different from data's (long) "maturityHorizon" property 
	// and still match a allowed value in the .domain(<array>),
	// Must create a mapping between tick labels & original "maturityHorizon" values
	var ticks2dataMHMap = {};
	uniqueMaturityHorizons.forEach(function (label, index) {
		// takes each value of "maturityHorizon" property in 
		//  and assign it the respective value in maturityHorizons 
		ticks2dataMHMap[label] = maturityHorizons[index];
	});
	console.log(ticks2dataMHMap)

	var str2int = {};
	maturityMonths = [3, 24, 60, 120, 240, 360];
	uniqueMaturityHorizons.forEach(function (months, index) {
		// Use the current value from maturityMonths as the key
		// and assign the corresponding value from maturityHorizon
		str2int[months] = maturityMonths[index];
	});

	// Set up x scales for the yield curve
	// var xYield = d3.scaleBand()
	// 	//.domain() determines both the x-axis ticks
	// 	// and assigns x-values to labels...
	// 	.domain(maturityHorizons)
	// 	.range([margin.left, width - margin.right])
	// 	//.padding(0.1); //between segments

	var xYield = d3.scaleLinear()
		//.domain() determines both the x-axis ticks
		// and assigns x-values to labels...
		// can pass list but should only have 2 values as min, max bounds
		//.domain(maturityMonths)
		.domain([d3.min(maturityMonths), d3.max(maturityMonths)])
		.range([margin.left, width - margin.right])
		//.padding(0.1); //between segments

	//debug: constant x-values for each category
	// var xValues = maturityHorizons.map(function(category) {
	// 	return xYield(category);
	// });
	//console.log(xValues);

	// Declared in higher scope for d3.scaleLinear().range() access
	var numericMarketYields; 

	// ensures that bondsData has "." completely filtered out
	//  before proceeding to redraw (need for .y() coord assignment)
	async function cleanBondsData() {
		try {
			numericMarketYields = await new Promise((resolve) => {
			var result = bondsData
				.filter(function (d) {
				//console.log("\t numericMarketYields");
				return !isNaN(+d.marketYield) && d.marketYield !== ".";
				})
				.map(function (d) {
				return +d.marketYield;
				});
			resolve(result);
			});
		} catch (error) {
			// log errors
			console.error(error);
		}
	}
	await cleanBondsData()

	// Set up yYield scale using numericMarketYields
	var yYield = d3.scaleLinear()
		.domain([0, d3.max(numericMarketYields)]) // Use filtered and numeric data for the domain
		.nice()
		.range([height - margin.bottom, margin.top]);
	
	//debug: constant y-coords
	// *Array [ 370, 20 ] is weirdly reversed,
	//  higher values lower, vice versa
	console.log("yYield range:",  yYield.range());

	// Define the line generator for the yield curve
	var lineYield = d3.line()
		.x(function (d) { 
			//debug: actual data horizons & shortened horizons mapping  
			// console.log(d.maturityHorizon)
			// console.log(ticks2dataMHMap[d.maturityHorizon])
			// console.log(xYield(ticks2dataMHMap[d.maturityHorizon]))
			console.log(d)
			//var mappedValue = ticks2dataMHMap[d.maturityHorizon];
			var mappedValue = str2int[d.maturityHorizon];
			//debug: domain & maturityHorizons equality 
			console.log("Mapped Value:", mappedValue);
			// console.log("Domain:", xYield.domain());
			// console.log("Domain:", maturityHorizons);

			//debug: constant category, bandwidth, & final x-coord mapping 
			// console.log(filteredBondsData)
			// console.log(xValues);
			// console.log(xYield(mappedValue))
			// console.log(xYield.bandwidth() / 2)
			// console.log(xYield(mappedValue) + xYield.bandwidth() / 2)

			// +: shifts the x-value over , // xYield.bandwidth(): gets the width of a category/band, // 2: divide the interval len by 2
			//return xYield(mappedValue) + xYield.bandwidth() / 2;
			return xYield(mappedValue);
		})
		.y(
			function (d) { 
			//console.log( yYield(+d.marketYield) )
			return yYield(+d.marketYield); 
		})
		//smooths segments 
		//.curve(d3.curveCardinal);

	// Add the x-axis for bond maturities
	// var xAxisYield = d3.axisBottom(xYield)
    // 	.tickValues(xPositions)
	//the values allowed in tickValues() are tied to xYield
	// since xYield is discrete (using .scaleBand()), cannot use numbers (decimals)
	// have to use subset of domain, which is hard to get correct granualrity 
	// that match custom spacing
	var xAxisYield = d3.axisBottom(xYield)
		.tickValues(maturityMonths)
		// .tickFormat((d) => {
		// 	if (str2int[d.maturityHorizon] === 3) return '3-month';
		// 	if (str2int[d.maturityHorizon] === 24) return '2-year';
		// 	if (str2int[d.maturityHorizon] === 60) return '5-year';
		// 	if (str2int[d.maturityHorizon] === 120) return '10-year';
		// 	if (str2int[d.maturityHorizon] === 240) return '20-year';
		// 	if (str2int[d.maturityHorizon] === 360) return '30-year';
		// 	return d; // Fallback to the value itself
		// });
		.tickFormat((d, i) => maturityHorizons[i]);
		

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

	
	/* dynamic yield curve to interative bar */
	//console.log(filteredBondsData)	

	// draw initial yield curve
	updateYieldCurve();

	function updateYieldCurve() {
		// Remove old path elements
		svg_bonds.selectAll("path").remove();
	
		// Append new path element to svg (container) element
		svg_bonds
			.append("path")
			.datum(filteredBondsData)
			.attr("fill", "none")
			.attr("stroke", "green")
			.attr("stroke-width", 2)
			// actually redraws the graph
			// "d" is "define"/"data" attribute
			// lineYield returns a string (ex: "M x1 y1 L x2 y2")
			.attr("d", lineYield);		
	}



	/* yield Spread features */
	// Create a group element for displaying the yieldSpread and yieldShape
	var infoGroup = svg_bonds.append("g")
	.attr("class", "info-group")
	.attr("transform", "translate(10, 20)"); // Adjust the position as needed

	// Function to update the displayed yieldSpread and yieldShape
	function updateInfoGroup() {
		//ideally use d, but there still seems to be some problem with initial d

		console.log(filteredBondsData)
		// Find the data for the "3-Month Treasury Constant Maturity Rate" bond
		var threeMonthData = filteredBondsData.find(function (d) {
			return d.maturityHorizon === "3-Month Treasury Constant Maturity Rate";
		});
		// Store yieldSpread & yieldShape properties from 3-Month bond
		var defaultYieldSpread = threeMonthData ? threeMonthData.yieldSpread : "";
		var defaultYieldShape = threeMonthData ? threeMonthData.yieldShape : "";

		// Remove the previous text elements if they exist
		infoGroup.selectAll(".yield-spread, .yield-shape").remove();

		// Calculate positions based on padding, prevent y-axis overlap
		// *for consistency should set margin same as SPX graph
		var padding = 20;	//shift both x & y dims
		var xOffset = padding + 50;
		var yOffset = padding; 
		

		// Add new text elements for yieldSpread and yieldShape
		infoGroup.append("text")
			.attr("class", "yield-spread")
			.attr("x", xOffset)				
			.attr("y", yOffset) 			
			.text("Yield Spread: " + defaultYieldSpread);

		infoGroup.append("text")
			.attr("class", "yield-shape")
			.attr("x", xOffset)
			.attr("y", yOffset + 20)	// prevent text overlap
			.text("Yield Shape: " + defaultYieldShape);
	}

	// Call the updateInfoGroup function initially
	updateInfoGroup();


	/* tooltip hover features */
	// Find the data for the "3-Month Treasury Constant Maturity Rate" bond
	// var threeMonthData = bondsData.find(function (d) {
	// 	return d.maturityHorizon === "3-Month Treasury Constant Maturity Rate";
	// });

	// // Store the yieldSpread and yieldShape properties from the 3-Month bond
	// var defaultYieldSpread = threeMonthData ? threeMonthData.yieldSpread : "";
	// var defaultYieldShape = threeMonthData ? threeMonthData.yieldShape : "";

	// // Create a tooltip div
	// var tooltip = d3.select("body")
	// .append("div")
	// .attr("class", "tooltip")
	// .style("opacity", 0);

	// svg_bonds.selectAll("path")
    // .on("mouseover", updateTooltip)
    // .on("mousemove", updateTooltip) // Add mousemove event for drag
    // .on("mouseout", hideTooltip);

	// // Function to hide the tooltip
	// function hideTooltip() {
	// 	tooltip.transition()
	// 		.duration(500)
	// 		.style("opacity", 0);
	// }

	// function updateTooltip(d) {
	// 	tooltip.transition()
	// 		.duration(200)
	// 		.style("opacity", 0.9);
	
	// 	var tooltipContent = "Market Yield: " + d.marketYield + "<br>Maturity Horizon: " + d.maturityHorizon;
	
	// 	// Use the default yieldSpread and yieldShape properties
	// 	tooltipContent += "<br>Yield Spread: " + defaultYieldSpread + "<br>Yield Shape: " + defaultYieldShape;
	
	// 	tooltip.html(tooltipContent)
	// 		.style("left", (d3.event.pageX + 5) + "px")
	// 		.style("top", (d3.event.pageY - 28) + "px");
	// }
	

	// Add event listeners to the path elements to show tooltips on hover
	// svg_bonds.selectAll("path")
	// 	.on("mouseover", function (event, d) {
	// 		tooltip.transition()
	// 			.duration(200)
	// 			.style("opacity", 0.9);
			
	// 		var tooltipContent = "Market Yield: " + d.marketYield;
	// 		// + "<br>Maturity Horizon: " + d.maturityHorizon

	// 		// Use the default yieldSpread and yieldShape properties
	// 		//tooltipContent += "<br>Yield Spread: " + defaultYieldSpread + "<br>Yield Shape: " + defaultYieldShape;
			
	// 		tooltip.html(tooltipContent)
	// 			.style("left", (event.pageX + 5) + "px")
	// 			.style("top", (event.pageY - 28) + "px");
	// 	})
	// .on("mouseout", function (d) {
	// 	tooltip.transition()
	// 		.duration(500)
	// 		.style("opacity", 0);
	// });

// Sample data
// const data = [10, 20, 30, 40, 50];

// // Define the SVG container dimensions
// const svgWidth = 400;
// const svgHeight = 200;

// // Define the scaling factors for bandwidths
// const scalingFactors = [1, 1, 1, 1, 2]; // Example scaling factors
// const scalingFactorsTicks = [1, 2, 3, 4, 8];

// // Define category names
// const categoryNames = ['e', 'd', 'c', 'b', 'a'];

// // Create an SVG element and append it to the body
// const test_svg = d3.select('body').append('svg')
//     .attr('width', svgWidth)
//     .attr('height', svgHeight)
//     .attr('id', 'test_svg');

// // Define margins and dimensions for the chart
// const test_margin = { top: 40, right: 40, bottom: 40, left: 40 };
// const test_width = svgWidth - test_margin.left - test_margin.right;
// const test_height = svgHeight - test_margin.top - test_margin.bottom;

// // Create a g (group) element for the chart and translate it to account for margins
// const chart = test_svg.append('g')
//     .attr('transform', `translate(${test_margin.left},${test_margin.top})`);

// // Create a linear scale for the y-axis
// const yScale = d3.scaleLinear()
//     .domain([0, d3.max(data)])
//     .nice()
//     .range([test_height, 0]);

// // Create a band scale for the x-axis
// const xScale = d3.scaleBand()
//     //.domain(data.map((d, i) => i)) // Use numeric indices
//     //.domain(scalingFactorsTicks)
// 	// .range([0, test_width])
//     // .paddingInner(0.1); // Add padding between bars
// 	.domain(categoryNames) // Use category names
//     .range([0, test_width])
//     .paddingInner(0.1); // Add padding between bars

// // Create and append the bars to the chart
// chart.selectAll('.bar')
//     .data(data)
//     .enter().append('rect')
//     .attr('class', 'bar')
//     .attr('x', (d, i) => xScale(i))
//     .attr('y', d => yScale(d))
//     .attr('width', (d, i) => xScale.bandwidth() * scalingFactors[i])
//     .attr('height', d => test_height - yScale(d));

// // Create x-axis and adjust the tick positions
// const xAxis = d3.axisBottom(xScale)
//     .tickValues(scalingFactorsTicks)
//     .tickFormat((d, i) => categoryNames[i]);
// 	//.tickValues(categoryNames) // Use category names
//     //.tickFormat((d, i) => d) // Show the same category names

// chart.append('g')
//     .attr('class', 'x-axis')
//     .attr('transform', `translate(0, ${test_height})`)
//     .call(xAxis);

// // Create y-axis
// const yAxis = d3.axisLeft(yScale);
// chart.append('g')
//     .attr('class', 'y-axis')
//     .call(yAxis);

});

