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
    <title>Market Yield Data</title>
</head>
<body>
    <h1>Market Yield Data</h1>

    <?php
    // FRED data fetching
    // Fetch yield data for bonds w/ 3-months to 30 years maturity horizons 
	// Map selected series_ids to series_names 
	$series_ids = array(
		'GS3M' => '3-Month Treasury Constant Maturity Rate',
		'GS2' => '2-Year Treasury Constant Maturity Rate',
		'GS5' => '5-Year Treasury Constant Maturity Rate',
		'GS10' => '10-Year Treasury Constant Maturity Rate',
		'GS20' => '20-Year Treasury Constant Maturity Rate',
		'GS30' => '30-Year Treasury Constant Maturity Rate'
	);

	//specify desired time range of data
	//  ensure safe handling of special characters (ie:' ', '&') in url with encode()
	$start_date = urlencode('1999-01-01');
	$end_date = urlencode(date('Y-m-d'));	//today's date

	$base_url = "https://api.stlouisfed.org/fred/series/observations";
	$api_key = urlencode('fc29dfd642dbcd4d5c2d996a6e018b24'); //generated FRED apiKey
	
	$file_type = urlencode("json");
	//$file_type = urlencode("xml");	//uncomment respective code for returned format

	// equivalent to `for series_id, series_name in series_ids.items():`
	//  in Python, getting key and value pairs from iterable
	foreach ($series_ids as $series_id => $series_name) {
		$url = "{$base_url}?series_id={$series_id}&api_key={$api_key}&observation_start={$start_date}&observation_end={$end_date}&file_type={$file_type}";
		//echo $url; 
		// Make the API request
		$response = file_get_contents($url);
	
		if ($response) {
			$data = json_decode($response, true);
	
			// display the data for each series
			echo "Market Yield Data for $series_name:\n";
			foreach ($data['observations'] as $observation) {
				$date = $observation['date'];
				$value = $observation['value'];
				echo "Date: $date, Value: $value\n";
			}
			
			/* xml respective code */
			//$xml = simplexml_load_string($response);

			// debug:
			// FRED's docs specify that the response is 
			// <observation realtime_start="2013-08-14" realtime_end="2013-08-14" date="1929-01-01" value="1065.9"/>
			// but we can explicitly check for this w/ var_dump
			// echo "<pre>";
    		// var_dump($xml);
    		// echo "</pre>";

            // Display the data for each series
            // echo "Market Yield Data for $series_name:\n";
			// // for the SimpleXML object assess <observations> element
			// //  for <observations> assess single <observations> as var
			// older incorrect parsing of XML structure, no error handling
            // foreach ($xml->observations->observation as $observation) {
            //     $date = $observation->date;
            //     $value = $observation->value;
            //     echo "Date: $date, Value: $value\n";
            // }
			// echo "\n";

			// if ($xml) {
			// 	echo "<h2>Market Yield Data for $series_name:</h2>";
			// 	echo "<ul>";
			// 	// older incorrect parsing of XML structure
			// 	// foreach ($xml->observations->observation as $observation) {
			// 	// 	$date = $observation->date;
			// 	// 	$value = $observation->value;
			// 	// 	echo "<li>Date: $date, Value: $value</li>";
			// 	// }
			// 	// foreach ($xml->observation as $observation) {
			// 	// 	$date = $observation->date;
			// 	// 	$value = $observation->value;
			
			// 	// 	echo "<li>Date: $date, Value: $value</li>";
			// 	// }
			// 	foreach ($xml->observation as $observation) {
			// 		// recall that attributes are different from child elements
			// 		//  they are not separate tags but properties of the previous tag
			// 		// TODO: get data every 20 days next
			// 		$attributes = $observation->attributes();
			// 		$date = (string)$attributes['date'];
			// 		$value = (string)$attributes['value'];
			
			// 		echo "<li>Date: $date, Value: $value</li>";
			// 	}
			// 	echo "</ul>";
			// } else {
			// 		echo "Failed to fetch data for $series_name";
			// }	
		}
	}
    ?>
</body>
</html>