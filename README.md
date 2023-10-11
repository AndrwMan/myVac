# myVac := "market yield Versus adjusted closed"

## Interactive graphs that illustrates the inverse relation between bonds market & stock market performance through market yield plotted against adjusted closed prices of (^SPX). 

## Motivation:
* Having used mySQL, acquire experience with rest of LAMP stack 
* Explore how serverside code is handled in non-nodeJS environment
* Get more practice with d3.js; plots instead of graphs (not node & edges)  
* Dive deeper into deployment that is not managed (IaaS versus previous PaaS)

## Usage
Intended for personal use. Still, the current build process involves the following:

### Dependency Installation
0. Assumes you are on Windows

1. Check if you have php with `php -v`. If not, get php (https://www.php.net/downloads.php). 
2. Download the version that matches your OS and system architecture (32-bit or 64-bit) and extract files to desired directory.  
   * Certain Program Files directory are going to required elevated permissions when developing.
3. Check if php works by creating index.php and write `<?php phpinfo(); ?>` 

4. Check if you have apache with `httpd -v`. If not, get Apache (https://httpd.apache.org/download.cgi.)
    * Under "Apache HTTP Server for Windows," click the "Files" link for the version you want to download (e.g., "Win32" or "Win64").
    * Download "MSI Installer" version (recommended for Windows) or the "ZIP" version if you prefer to manually configure Apache.

5a. Run the MSI Installer, follow wizard instructions.
    * You can leave most settings as default values unless you have specific requirements.

5b. If you downloaded the ZIP version, extract the contents of the ZIP file to a directory of your choice, (e.g., C:\Apache24). Open a text editor as an administrator and edit the Apache configuration file, httpd.conf, which is located in the `conf` subdirectory. Make any necessary configuration changes in httpd.conf. 
* Common changes include configuring the server name, setting up virtual hosts, or specifying the server's port.
* If the default port 80 is blocked you need to use a different port 

7. Open the Windows Command Prompt (cmd) as an administrator.
   * Navigate to the Apache /bin directory. For example, if you installed Apache in C:\Apache24, you can use the following command: `cd C:\Apache24\bin`
   * httpd.exe: To start Apache
   * httpd.exe -k stop: To stop Apache
8. Test Apache; open a web browser and enter http://localhost:<port#>/index.html in the address bar. If Apache is running correctly, you should see the default Apache test page.

### Configuration
* modify `$series_ids = array(...)` get desired FRED economic time series you want
  * modify $start_date, $end_date, $api_key, & $file_type

* modify $symbol, $base_url, $start_date_tstamp, $end_date_tstamp to get desired Yahoo Finance data

*  modify `curl_setopt($ch, CURLOPT_CAINFO, '<path>/<certBundle>')` for SSL certification

### Deployment
0. Assumes you are deploying with Azure

1. Sign In to Azure Portal > Click  "Create a resource" > Search for "Ubuntu Server" > Click "Create" on the Ubuntu Server page.

2. Basics:
    	Fill out the "Basics" tab with the following information:
        Project details: Choose your subscription, resource group, and region.
        Instance details: Choose a unique VM name.
        Authentication type: Select "SSH public key."
        Username: Choose a username for SSH access (e.g., "ubuntu").
        SSH public key source: Choose "Generate new key pair" or use an existing key pair.
        Inbound port rules: Open ports 22 (SSH) and 80 (HTTP) for web development.
	
	* Note if you selected a Windows image instead you will not have SSH generation by default on VM creation. You would have to used RDP or get OpenSSH. 
	* if you don't generate keys at this step you can always generate on local ssh and add the public key later. Windows will still Not have an readily avaliable (GUI) way to add key. 

	Disks: You can leave the default settings for disks.
	
	Networking: Configure the network settings as needed, including virtual network, subnet, public IP address, and more.
	
	Management: Customize management settings like monitoring, backup, and auto-shutdown if desired.

	Review + create: it's normal to wait a little bit, you might get warnings in the meantime.

3.  Once the VM is created, go to VM's page > Click "Networking".
    Copy the Public IP address of your VM.
	
	Connect via SSH:

    To connect to Ubuntu VM via SSH, use an SSH client like PuTTY (Windows) or the terminal (macOS/Linux). 

    In terminal, use `ssh <ubuntu>@<VM-public-IP>`.
	* you need to use `-i <path/<privateKey>>` if there are authentication errors

4. Once connected reinstall all dependencies. Use `sudo apt update` to update the package list to get the latest information about available packages. Then use `sudo apt install php` to ge the lastest php version plus common modules. Might need to adjust the versions. you definately need to double check specific modules you need, for example cURL is used for this project and was not included by the previous cmd.

5. Use `sudo apt install apache2` to startup apache server. Check if index.html takes you to Ubuntu page.
6. Use `scp -r </path/to/php/files/ie:htdocs/ > <ubuntu>@<VM-public-IP>:/var/www/html/` to copy this project's local files to remote. 
* you likely need `-i <path/<privateKey>>` to authenticate
* you likely need `sudo` to get elevated permissions to copy/write to `/var/www/html/`
* Check if `http://<VM-public-IP>/myVac/index.php` takes you to app page.

## License
**Copyright (c) [Andrew Man] [2019-2023]. All Rights Reserved.**
