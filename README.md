BGPlay.js
=========

BGPlay.js provides a graphical and intuitive representation of the inter-domain routing and its evolution over time.
It has been developed as a part of the Master’s thesis of Massimo Candela at the 
Computer Network Research Group[http://www.dia.uniroma3.it/~compunet/] of Roma Tre University (Italy) 
in collaboration with RIPE NCC[https://www.ripe.net]. 

Today te tool still maintained by me in my free time.

The project is open source, see LICENSE.txt for more information.
The modular architecture of this project allowed the creation of some others tools based on it, e.g. TPlay, (now renamed Radian).
Documentation and other info about this or other projects based on BGPlay.js is available here[http://bgplayjs.com/?section=bgplay]. 


You can embed this tool in your service for free, or share instances/screenshots, but please 
**use a proper acknowledgment** as described here[http://bgplayjs.com/?section=bgplay#copyright].


Setup:

1. set `BGPLAY_PROJECT_URL` in `widget/bgplayjs-main-widget.js` to be the home of the project (use "file:///" if 
the installation is not under a web server);

2. inject the widget in an HTML document as described in `run_bgplay.html` (or use directly `run_bgplay.html`);

3. edit `connectors/JsonWrapGeneric.js` to adapt it for the interaction with your JSON data source, in particular set 
the url of the data source in `getJsonUrl()`;

4. run the HTML launcher (e.g. `run_bgplay.html`) in your browser.


How to use your data? read here[http://bgplayjs.com/?section=bgplay#mydata]

