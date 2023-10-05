<!DOCTYPE html>
<html>
<head>
	<!-- 
		My files to be served is under a subdirectory (myVac)
		instead of directly under htdocs, so when specify path 
		for hosting later, should be careful 
	-->
    <title>Market Yield Data</title>
</head>
<body>
    <h1>Market Yield Data</h1>

    <?php
    // FRED data fetching

    // Fetching data for 3 months yield
    // $fred_api_key = 'fc29dfd642dbcd4d5c2d996a6e018b24';
    // $series_id = 'GS3M';
    // $start_date = '1999-01-01';
    // $end_date = date('Y-m-d'); // Today's date

    //$api_url = "https://api.stlouisfed.org/fred/series/observations?series_id=$series_id&api_key=$fred_api_key&observation_start=$start_date&observation_end=$end_date&file_type=json";
	
	$base_url = "https://api.stlouisfed.org/fred/series/observations";
	$series_id = urlencode('GS3M');
	$fred_api_key = urlencode('fc29dfd642dbcd4d5c2d996a6e018b24');
	$start_date = urlencode('1999-01-01');
	$end_date = urlencode(date('Y-m-d'));
	$file_type = urlencode("json");

	$api_url = "{$base_url}?series_id={$series_id}&api_key={$fred_api_key}&observation_start={$start_date}&observation_end={$end_date}&file_type={$file_type}";
	
	echo $api_url;

    $response = file_get_contents($api_url);
    if ($response) {
        $data = json_decode($response, true);
        
        echo "<h2>3-Month Treasury Constant Maturity Rate</h2>";
        echo "<table>";
        echo "<tr><th>Date</th><th>Value</th></tr>";
        
        foreach ($data['observations'] as $observation) {
            $date = $observation['date'];
            $value = $observation['value'];
            echo "<tr><td>$date</td><td>$value</td></tr>";
        }
        
        echo "</table>";
    } else {
        echo "Failed to fetch data from FRED.";
    }
    ?>
</body>
</html>


