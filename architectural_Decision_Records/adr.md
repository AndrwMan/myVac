# Architectural Decision Records (ADRs)

## Languages
### PHP
PHP is an open-source, server-side scripting language primarily designed for web development.

A popular alternative to PHP for server-side development is node.js, or Pyhton  paired used with Django or Flask.

* PHP can be used to quickly prototype and develop small web applications and websites. It has a low learning curve, which can speed up development. For the a single webpage this ensures learning a new tool but keeping the overhead low.
* NodeJS is usually structured with npm_modules, package.json, etc. alot of which is not needed for this project. Modules mainly include cURL. 
* The Laravel framework is rejected for now for the same reason.
* Compared to Python PHP has a longer history of use in web development. PHP is also well-supported by many shared hosting providers, which keeps options open as at the time the choice of hosting service was undecided. wht wasknow was a cost-effective service was a needed since this was the second site I wanted to host. Shared hosting is typically the most budget-friendly hosting option. 

## Server
### Apache
The Apache HTTP Server, is a widely-used open-source web server software. It serves as a critical component of the web hosting and internet infrastructure. 

*  Nginx is an even more popular web server. It's known for its efficient handling of concurrent connections, low memory usage, and scalability. However alot of these advantages are negated on Windows which is the local development. Compared to intended Unix-like systems, Windows has different networking APIs and process management, which can affect Nginx's performance. As of Sept 2023 it stated on Nginx site that "Only the select() and poll() (1.15.9) connection processing methods are currently used, so high performance and scalability should not be expected. Due to this and some other known issues version of nginx for Windows is considered to be a **beta** version." 
*  Apache has long been available on the Windows platform, and it often has excellent compatibility with various Windows-based applications and technologies, making it a suitable choice for Windows-specific web application setups.

## Deployment
### Azure
One of the 3 popular cloud computing platform, this one offered by Microsoft. It provides a wide range of cloud-based services, including computing, analytics, storage, and networking.

* It seems that between AWS, GCP, and Azure, Azure provided the best balance of popularity and price. AWS's S3 are free for 12 months but Azure's B1s was advertised as free under certain usage. GCP has better starting free credits to work with but its market share is the lowest so I didnt prioritize it in case the skills don't transfer. 
* Due the anticipated reduced complexity of the site compared to the personal webpage, I wanted to balance back the difficulty of the project with more deployment configuration. Therefore, I have opted out of using Heroku and only considered IaaS. 


Note: As the project evolves it is expected that new issues arise, therefore one option which may be intially attractive may be swapped out for the alternative. Of course more components may be added.