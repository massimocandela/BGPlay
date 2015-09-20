/*
 * BGPlay.js
 * Copyright (c) 2013 Massimo Candela, Giuseppe Di Battista, Claudio Squarcella, Roma Tre University and RIPE NCC
 * http://www.bgplayjs.com
 *
 * See the file LICENSE.txt for copying permission.
 */

BGPLAY_PROJECT_URL = STAT_HOME + "widgets/js/bgplay/v1.1/";

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


require.config({
    paths: {
        "underscore": BGPLAY_LIB_URL + "underscore",
        "backbone": BGPLAY_LIB_URL + "backbone",
        "tinyscrollbar": BGPLAY_LIB_URL + "jquery.tinyscrollbar.min",
        "mousewheel": BGPLAY_LIB_URL + "jquery.mousewheel.min",
        "timepicker": BGPLAY_LIB_URL + "jquery-ui-timepicker-addon",
        "mustaches": BGPLAY_LIB_URL + "mustaches",
        "raphael": BGPLAY_LIB_URL + "raphael",
        "raphael-pan": BGPLAY_LIB_URL + "raphael-pan",
        "model": BGPLAY_WIDGET_URL + "bgplayjs-common-model",

        "config": BGPLAY_WIDGET_URL + "bgplay-ripestat/bgplay-ripestat-config",
        "modules": BGPLAY_WIDGET_URL + "bgplay-ripestat/bgplay-ripestat-modules",


        "TreeMap": BGPLAY_LIB_URL + "TreeMap",
        "dateFormat": BGPLAY_LIB_URL + "dateFormat",

        "compatibilityTricks": BGPLAY_UTILS_URL + "compatibilityTricks",
        "validator": BGPLAY_UTILS_URL + "validator",
        "graphUtils": BGPLAY_UTILS_URL + "graph",
        "general": BGPLAY_UTILS_URL + "general",
        "cssAlert": BGPLAY_UTILS_URL + "cssAlert",
        "wbrGraph": BGPLAY_LIB_URL + "wbrGraph2",
        "main": BGPLAY_PROJECT_URL + "main",
        "MainView": BGPLAY_MODULES_URL + "bgplay_ripestat/MainViewRipestat"
    },

    shim: {
        "underscore": {
            exports: "_"
        },
        "backbone": {
            exports: "Backbone",
            deps: ["underscore"]
        },
        "mustaches": {
            exports: "Mustache"
        },
        "raphael": {
            exports: "raphael"
        },
        "raphael-pan": {
            deps:['raphael']
        },
        "modules": {
            deps:[
                 'general'
            ]
        },
        "model": {
            deps:[
                'backbone'
            ]
        },
        "general": {
            deps:[
                'backbone',
                'compatibilityTricks',
                'dateFormat'
            ]
        },
        "main": {
            deps:[
                'general',
                'modules',
                'model',
                'MainView'
            ]
        },
        "MainView": {
            deps:[
                'backbone',
                'general'
            ]
        },
        "wbrGraph" : {
            deps:[
                'TreeMap',
                'graphUtils'
            ]
        }
    }
});



define([
    STAT_WIDGET_API_URL + "js/misc.js",
    "backbone",
    "mustaches",
    "raphael",
    "config",
    "modules",
    "MainView",
    "main",
    "model",
    BGPLAY_CONNECTORS_URL + "JsonWrapRipestat.js",
    "raphael-pan",
    "tinyscrollbar",
    "mousewheel",
    "timepicker",
    "TreeMap",
    "wbrGraph",
    "validator",
    "general",
    "cssAlert"

], function(
    misc,
    Backbone,
    Mustache,
    raphael,
    config,
    modules,
    MainView
    ) {

    window.Mustache = Mustache;

    misc.loadCss(BGPLAY_STYLESHEETS_URL + 'bgplay-ripestat.css');

    debugMode = false;// false to prevent console logs

    var $ = jQuery;

    if (!window.$){
        window.$ = $;
    }

    if (!window.Mustache){
        window.Mustache = Mustache;
    }

    if (!window.Backbone){
        window.Backbone = backbone;
    }


    $.fn.statBGPlay = function(data, widget_width) {
        var main, widget_height, thisWidget;

        thisWidget = this.statWidget();
        main = new BGPlay(this);
        widget_height = (thisWidget.get_pref_height() || (widget_width/100)*120);

        //Override of some methods
        main.advancedInit = function(){
            main.environment.thisWidget = thisWidget;
        };

        main.alert = function(msg, type){
            main.environment.dom.append(misc.infoMessage(type,msg));
        };

        //Initialization of the BGPlay environment
        main.init({
            width:widget_width,
            height: widget_height,
            config: config,
            modules: modules,
            mainView: MainView,
            fileRoot: BGPLAY_PROJECT_URL,
            imageRoot: BGPLAY_IMAGES_URL,
            templateRoot: BGPLAY_TEMPLATES_URL
        });

        //main.setDefaultParams(initialParams);

        //Run BGPlay on the data
        main.run(data);

        // meta info
        var metaInfo = misc.formatMetaInfo({
            "queryStarttime": new Date(dateToUTC(data.query_starttime)),
            "queryEndtime": new Date(dateToUTC(data.query_endtime)),
            "resource": data.resource
        }, widget_width);

        this.append(metaInfo);

        return this;
    };

});
