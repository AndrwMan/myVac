document.addEventListener("DOMContentLoaded", function () {
	//verify d3.js lib import
	if (typeof d3 !== 'undefined') {
		console.log('D3.js is already loaded in this project.');
	} 
	else {
		console.log('D3.js is Not loaded in this project.');
	}
	//verify php data available
	console.log(spxData);

	// Define dimensions of the graph
	var width = 800;
	var height = 400;
	var margin = { top: 20, right: 20, bottom: 30, left: 50 };

	// Create an SVG container for the graph
	var svg = d3.select("body").append("svg")
	.attr("width", width)
	.attr("height", height);

	// Set parse date function
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
	var initialXPosition = x(new Date("1999-01-01")); 
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
			//mouseX = event.x;
			// Limit mouse position within x-axis range
			var mouseX = Math.max(margin.left, Math.min(event.x, width - margin.right)); 
			updateVerticalBar(mouseX);
		}
	}

	function dragEnd() {
		isDragging = false;
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

	
});