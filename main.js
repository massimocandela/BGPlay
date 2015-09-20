/*
 * BGPlay.js
 * Copyright (c) 2013 Massimo Candela, Giuseppe Di Battista, Claudio Squarcella, Roma Tre University and RIPE NCC
 * http://www.bgplayjs.com
 *
 * See the file LICENSE.txt for copying permission.
 */

var BGPlay = function(domElement){
    this.dom = domElement;

    this.alert = function(msg, type){
        alert(msg);
    };

    this.advancedInit = function(){


    };

    this.setDefaultParam = function(key, value){ //Init first
        if (!this.environment.defaultParams){
            this.environment.defaultParams = {};
        }
        this.environment.defaultParams[key] = value;
    };


    this.setDefaultParams = function(params){ //Init first
        this.environment.defaultParams = params;
    };


    this.initDom = function(){
        var internalDivClass;

        internalDivClass = this.environment.config.internalDivClass;

        this.dom.html("<div class=\"" + internalDivClass + "\"></div>");

        this.environment.bgplayDom = this.dom.find('.' + internalDivClass);

        this.environment.cssAlert = new cssAlert(this.environment.bgplayDom, internalDivClass, this.environment.domWidth);
    };


    this.init = function(initParams){
        var environment, jsonWrap, thisDom, internalDivClass;

        this.initParams = initParams;
        this.width = initParams.width;
        this.height = initParams.height;
        this.config = initParams.config;
        this.modules = initParams.modules;
        this.mainView = initParams.mainView;

        thisDom = this.dom;
        environment = {};
        this.environment = environment;
        environment.main = this;
        environment.alert = this.alert;
        environment.safeState = true;
        environment.config = this.config;
        environment.modules = this.modules;
        environment.fileRoot = initParams.fileRoot;
        environment.imageRoot = initParams.imageRoot;
        environment.templateRoot = initParams.templateRoot;
        environment.domWidth = this.width;
        environment.domHeight = this.height;
        environment.eventAggregator = _.extend({}, Backbone.Events);
        environment.dom = thisDom;

        // To initialise properly!!!!!
        environment.useStreaming = true;
        environment.streamingOn = true;
        environment.initialDump = "rest"; // It can be rest, streaming or none

        this.advancedInit();

        log("Data collected");

        this.initDom();

        window.instances = (window.instances) ? (window.instances + 1) : 1;
        environment.instances = window.instances;

        jsonWrap = new JsonWrap(environment);
        environment.jsonWrap = jsonWrap;
        environment.optionalParams = [];
        environment.dynamicParams = [];
        environment.type = jsonWrap.getType();
        environment.modes = [];
    };


    this.run = function(data){
        var environment, mainView, cssListener, cssListenerInterval, cssListenerTimeout;

        environment = this.environment;
        environment.params = environment.jsonWrap.getParams(data);
        mainView = this.mainView;

        var startFunction = function(environment){
            if (environment.safeState) {

                    if (environment.jsonWrap.readJson(data) == true) {
                        log("Objects created");
                        environment.bgplay.set({inputParams: environment.params, silent: true});
                        environment.modes.push('consistent');
                    } else {
                        environment.modes.push('inconsistent');
                        environment.alert(environment.message.text, environment.message.type);
                    }
            }else{
                environment.modes.push('inconsistent');
            }

            (new mainView({el:environment.bgplayDom, environment:environment})).loadViews();
        };

        cssListenerInterval = 50; //50 ms
        cssListenerTimeout = 10000; // 10 secs
        cssListener = setInterval(function(){
            if(environment.bgplayDom.css("margin-top") === "-10px"){
                clearInterval(cssListener);

                if (environment.jsonWrap.confirm(data)){

                    environment.dom.css("min-height", "100px");
                    environment.cssAlert.confirm("This query includes more nodes/events than normal. Rendering this graph may cause your browser to become temporarily unresponsive. Do you wish to continue?", function(){
                        environment.safeState = true;
                        startFunction(environment);
                    }, function(){
                        environment.safeState = false;
                        startFunction(environment);
                    }, 0);

                }else{
                    environment.safeState = true;
                    startFunction(environment);
                }

            }else{
                if (cssListenerTimeout<=0){
                    clearInterval(cssListener);
                    environment.alert("It is impossible to load the stylesheets.","error");
                }
                cssListenerTimeout -= cssListenerInterval;
            }
        }, cssListenerInterval);

    };

    this.retrieveData = function(){ //Init first
        var $this, params, url, run;

        $this = this;
        params = this.environment.jsonWrap.getParams();

        url = this.environment.jsonWrap.getJsonUrl(params);
        run = this.run;

        $.getJSON(
            url+"&callback=?",
            {},
            function(json){
                run.call($this, json.data);
            }
        );
    };

    this.update = function(){ //Init first
        var $this, params, url, run;

        this.environment.eventAggregator.trigger("destroyAll");
        this.initDom();

        $this = this;

        params = this.environment.params;
        url = this.environment.jsonWrap.getJsonUrl(params);

        run = this.run;

        $.getJSON(
            url+"&callback=?",
            {},
            function(json){
                run.call($this, json.data);
            }
        );

    }
};