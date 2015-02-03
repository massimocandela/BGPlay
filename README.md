BGPlay.js
=========

Note: In this version of the code an independent widget environment, including a connection layer, was introduced in order to communicate with generic data sources.
In this beta version, changing the query in the control panel causes the reloading of the whole page and not only of the widget content. This is a temporary workaround to solve some known issues.
If you are looking for a stable instance of bgplay.js use the version provided by the RIPE stat project https://stat.ripe.net/widget/bgplay (communicating with the RIS data source).


Setup:

1. set `BGPLAY_PROJECT_URL` in `widget/bgplayjs-main-widget.js` to be the home of the project (use "file:///" if the installation is not under a web server);

2. inject the widget in an HTML document as described in `run_bgplay.html` (or use directly `run_bgplay.html`);

3. edit `connectors/JsonWrapGeneric.js` to adapt it for the interaction with your JSON data source, in particular set the url of the data source in `getJsonUrl()`;

4. run the HTML launcher (e.g. `run_bgplay.html`) in your browser.
