<!DOCTYPE html>
<html>
<head>
</head>
<body>
	<h1>test</h1>
	<?php 
	phpinfo(); 
	error_reporting(E_ALL);


	// Check if OpenSSL is enabled in PHP
	if (extension_loaded('openssl')) {
        echo "OpenSSL is enabled in PHP.";
    } else {
        echo "OpenSSL is not enabled in PHP.";
    }
	?>
</body>
</html>



