document.addEventListener("DOMContentLoaded", function () {
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
	//console.log("\t test...")
	//console.log(spxData)
	//console.log(spxData[0])
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
	
	// 	if (dataPoint) {
	// 		// change the properties of the vertical bar on interaction 
	// 		//  shifts & adds visibility
	// 		verticalBar.attr("x1", mouseX).attr("x2", mouseX).style("display", "block");
	// 	} else {
	// 		verticalBar.style("display", "none");
	// 	}
	// });

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

	function dragging(event) {
		if (isDragging) {
			// Limit mouse position within x-axis range
			var mouseX = Math.max(margin.left, Math.min(event.x, width - margin.right)); 
			//var marginLeftDate = x.invert(margin.left);
			//console.log(marginLeftDate)
			updateVerticalBar(mouseX);

			// Update bonds graph with data for the current date/ bar pos
			var dateValue = x.invert(mouseX);
			updateYields(dateValue);
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
	function updateYields(dateValue) {
		// Filter bondsData to get elements with the same date
		console.log(dateValue)
		console.log(typeof(dateValue))
		var filteredBondsData = bondsData.filter(function (d) {
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
	}
});

