/*
 * BGPlay.js
 * Copyright (c) 2013 Massimo Candela, Giuseppe Di Battista, Claudio Squarcella, Roma Tre University and RIPE NCC
 * http://www.bgplayjs.com
 *
 * See the file LICENSE.txt for copying permission.
 */

BGPLAY_PROJECT_URL = "http://localhost:63343/github-bgplay/BGPlay/";

BGPLAY_WIDGET_URL = BGPLAY_PROJECT_URL + "widget/";
BGPLAY_MODEL_URL = BGPLAY_PROJECT_URL + "model/";
BGPLAY_MODULES_URL = BGPLAY_PROJECT_URL + "modules/";
BGPLAY_CONNECTORS_URL = BGPLAY_PROJECT_URL + "connectors/";
BGPLAY_LIB_URL = BGPLAY_PROJECT_URL + "lib/";
BGPLAY_UTILS_URL = BGPLAY_PROJECT_URL + "utils/";

BGPLAY_TEMPLATES_URL = BGPLAY_MODULES_URL + "html/";
BGPLAY_TEMPLATES_NOCORS_URL = BGPLAY_MODULES_URL + "html/js_nocors/";
BGPLAY_STYLESHEETS_URL = BGPLAY_MODULES_URL + "css/";

BGPLAY_IMAGES_URL = BGPLAY_TEMPLATES_URL + "img/";


BGPLAY_INSTANCES = {};

BGPLAY_LOADERS = {
    "BGPlay": "widget/bgplay/bgplay-loader",
    "TPlay": "widget/tplay/tplay-loader",
    "BGPlay3D": "loaders/bgplay3D-loader"
};

function getBGPlayInstance(instance){
    return BGPLAY_INSTANCES[instance].shift();
}

function BGPlayWidget(instance, domId, initialParams, queryParams){
    var loader;

    loader = BGPLAY_LOADERS[instance];

    if (BGPLAY_INSTANCES[instance] == null){
        BGPLAY_INSTANCES[instance] = [];
    }
    BGPLAY_INSTANCES[instance].push({domId: domId, initialParams: initialParams, queryParams: queryParams});

    document.write('<script data-main="' + BGPLAY_PROJECT_URL + loader +'" src="' + BGPLAY_PROJECT_URL + 'lib/require.js"></script>');
}

/*
//Workaround for not CORS enabled web server
function addTemplateContent(name, template){
    window.templateCache = window.templateCache || {};
    window.templateCache[name] = template;
}

*/
