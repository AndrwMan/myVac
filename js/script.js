document.addEventListener("DOMContentLoaded", function () {
	if (typeof d3 !== 'undefined') {
		console.log('D3.js is already loaded in this project.');
	} 
	else {
		console.log('D3.js is not loaded in this project.');
	}

	d3.select("body").append("p").text("Hello, D3!");
	console.log(spxData);
});