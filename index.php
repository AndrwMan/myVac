<!DOCTYPE html>
<html>
<head>
	<!-- Not using default port 80, using port 8080  -->
	<!-- 
		My files to be served is under a subdirectory (myVac)
		instead of directly under htdocs, so when specify path 
		for hosting later, should be careful 
	-->
	<!-- 
		use `C:\Program Files (x86)\Apache24\bin>httpd -k restart`  
		in cmd to restart server (mainly on config changes)
	-->
    <title>Market Yield Data Versus Stock Market index</title>

	<!-- load prebuilt d3.js from CDN -->
	<!-- <script src="https://cdnjs.cloudflare.com/ajax/libs/d3/7.2.0/d3.min.js"></script> -->
	
	<!-- load locally built d3.js  -->
	<!-- without the path issues like node, sucessfully included prebuilt d3.js -->
	<script src="js/d3.min.js"></script>
</head>
<body>
    <h1>Market Yield Data</h1>

    <?php
    /* fetch bonds data */
    // Fetch yield data for bonds w/ 3-months to 30 years maturity horizons 
	// Map selected series_ids to series_names 
	$series_ids = array(
		'DGS3MO' => '3-Month Treasury Constant Maturity Rate',
		'DGS2' => '2-Year Treasury Constant Maturity Rate',
		'DGS5' => '5-Year Treasury Constant Maturity Rate',
		'DGS10' => '10-Year Treasury Constant Maturity Rate',
		'DGS20' => '20-Year Treasury Constant Maturity Rate',
		'DGS30' => '30-Year Treasury Constant Maturity Rate'
	);

	//specify desired time range of data
	//  ensure safe handling of special characters (ie:' ', '&') in url with encode()
	$start_date = urlencode('1999-01-01');
	$end_date = urlencode(date('Y-m-d'));	//today's date

	$base_url = "https://api.stlouisfed.org/fred/series/observations";
	$api_key = urlencode('fc29dfd642dbcd4d5c2d996a6e018b24'); //generated FRED apiKey
	
	//$frequency = urlencode("d");  // Set the frequency to daily, do not need for right series

	$file_type = urlencode("json");
	//$file_type = urlencode("xml");	//uncomment respective code for returned format


	$bonds_reformatted = array();

	// equivalent to `for series_id, series_name in series_ids.items():`
	//  in Python, getting key and value pairs from iterable
	foreach ($series_ids as $series_id => $series_name) {
		//$url = "{$base_url}?series_id={$series_id}&api_key={$api_key}&file_type={$file_type}";
		$url = "{$base_url}?series_id={$series_id}&api_key={$api_key}&observation_start={$start_date}&observation_end={$end_date}&file_type={$file_type}";
		//$url = "{$base_url}?series_id={$series_id}&api_key={$api_key}&observation_start={$start_date}&observation_end={$end_date}&file_type={$file_type}&frequency={$frequency}";
		//echo $url; 

		// Make the API request
		$response = file_get_contents($url);
		// echo "Received API Response: <pre>";
		// print_r($response);
		// echo "</pre>";
	
		if ($response) {
			$data = json_decode($response, true);

			// debug: Use <pre> tags to format the output
			// echo "<pre>"; 
			// print_r($data);
			// echo "</pre>";
				
			// display the data for each series
			echo "Market Yield Data for $series_name:<br>";
			foreach ($data['observations'] as $observation) {
				$date = $observation['date'];
				$value = $observation['value'];
				echo "Date: $date, Value: $value\n";

				// Create an object for each data point, add to $bonds_reformatted
				$data_point = array(
					"marketYield" => $value,
					"maturityHorizon" => $series_name, // Assuming you want to use the series name as maturity horizon
					"date" => $date
				);

				$bonds_reformatted[] = $data_point;
			}

			/* xml respective code */
			//$xml = simplexml_load_string($response);

			/* debug:
			FRED's docs specify that the response is of the form
			<observation realtime_start="2013-08-14" realtime_end="2013-08-14" date="1929-01-01" value="1065.9"/>
			but we can explicitly check for this w/ var_dump
			*/
			// echo "<pre>";
    		// var_dump($xml);
    		// echo "</pre>";
			
			/*
            Display the data for each series
			for the SimpleXML object assess <observation> element
			for each object(SimpleXMLElement) assess single object's attrs as var
			*/
			// if ($xml) {
			// 	echo "<h2>Market Yield Data for $series_name:</h2>";
			// 	echo "<ul>";
			// 	foreach ($xml->observation as $observation) {
			// 		// recall that attributes are different from child elements
			// 		//  they are not separate tags but properties of the previous tag
			// 		$attributes = $observation->attributes();
			// 		$date = (string)$attributes['date'];
			// 		$value = (string)$attributes['value'];
			
			// 		echo "<li>Date: $date, Value: $value</li>";
			// 	}
			// 	echo "</ul>";
			// } 
			// else {
			// 		echo "Failed to fetch data for $series_name";
			// }	
		}
	}

	$bondsDataJson = json_encode($bonds_reformatted);

	/* fetch S&P500 data*/
	$symbol = '^SPX';

    // Define the Yahoo Finance API URL for historical data
    $base_url = "https://query1.finance.yahoo.com/v8/finance/chart/{$symbol}";
	$test_url = "https://query1.finance.yahoo.com/v8/finance/chart/AAPL?metrics=high?&interval=1d&range=5d";
	$test_url2 = "https://query1.finance.yahoo.com/v8/finance/chart/AAPL?";
    
    // Set relevant data range (from 1999-01-01 to today)
    $start_date_tstamp = strtotime('1999-01-01'); // January 1, 1999
	$end_date_tstamp = strtotime(date('Y-m-d')); // Today's date
    
    // Build the URL with appropriate parameters
    //$url = "{$base_url}?period1=" . strtotime($start_date) . "&period2=" . strtotime($end_date) . "&interval=1d";
	$url = "{$base_url}?period1={$start_date_tstamp}&period2={$end_date_tstamp}&interval=1d";

    $ch = curl_init($url); 							// Initialize cURL session 

	// Set cURL options
	// Set the path to the CA certificate bundle (downloaded cacert.pem)
	//  worked for absolute path vs relative path (to project root)
	curl_setopt($ch, CURLOPT_CAINFO, 'C:/Program Files (x86)/Apache24/htdocs/myVac/cacert.pem');
	// Enable SSL certificate verification
	curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
	curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 2);

	curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

    $response = curl_exec($ch);						// Execute cURL session/fetch data

	//debug: cURL response
	echo "API Response:<pre>" . htmlspecialchars($response) . "</pre>";
	if(curl_errno($ch)){
		echo 'Curl error: ' . curl_error($ch);
	}

    curl_close($ch);		// Close cURL session

    $data = json_decode($response, true);	
	echo "<pre>"; 
	print_r($data);
	echo "</pre>";
    // Check if data was successfully fetched
    if ($data && isset($data['chart']['result'][0]['indicators']['quote'][0]['close'])) {
        // Extract and display the daily data
        $close_prices = $data['chart']['result'][0]['indicators']['quote'][0]['close'];
        $timestamps = $data['chart']['result'][0]['timestamp'];

		//store {date: dateVal, close: closeVal}... reformat for d3
		$formatted_data = array();
        
        echo "<h2>Daily Closing Prices for S&P 500 ($symbol)</h2>";
        echo "<table>";
        echo "<tr><th>Date</th><th>Close Price</th></tr>";
        
		//convert unix timestamps back to formatted time
        foreach ($timestamps as $key => $timestamp) {
            $date = date('Y-m-d', $timestamp);
            $close_price = $close_prices[$key];
            echo "<tr><td>{$date}</td><td>{$close_price}</td></tr>";

			// Create an object for each data point
			$data_point = array(
				"date" => $date,
				"close" => $close_price
			);
	
			// Add the data point to the formatted data array
			$formatted_data[] = $data_point;
        }

		// Convert the formatted data array to JSON
		$formatted_data_json = json_encode($formatted_data);
		//debug: 
		// Network > (refresh) > Response to see output
		// due to the amount of output the result might be truncated from webpage
		// use curl <url> to see full output
		echo $formatted_data_json;
	        
        echo "</table>";
    } else {
        echo "Failed to fetch data for S&P 500 ($symbol)";
    }
    ?>
	<script>
		// Embed/pass formatted JSON data to script.js
    	var bondsData = <?php echo $bondsDataJson; ?>;
	</script>
	<script>
		var spxData = <?php echo $formatted_data_json; ?>;
	</script>
	<script src="js/script.js"></script>
	
</body>
</html>