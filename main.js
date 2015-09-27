/*
 * BGPlay.js
 * Copyright (c) 2013 Massimo Candela, Giuseppe Di Battista, Claudio Squarcella, Roma Tre University and RIPE NCC
 * http://www.bgplayjs.com
 *
 * Go to http://bgplay.massimocandela.com for latest updates.
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
        var environment, jsonWrap, thisDom;

        this.initParams = initParams;
        this.width = initParams.width;
        this.height = initParams.height;
        this.config = initParams.config;
        this.modules = initParams.modules;
        this.mainView = initParams.mainView;

        thisDom = this.dom;
        environment = {};
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
        environment.updateWithStreaming = initParams.updateWithStreaming;
        environment.streamingOn = initParams.streamingOn;
        environment.streamInitialDump = initParams.streamInitialDump;
        environment.skipDump = initParams.skipDump;

        this.environment = environment;
        this.advancedInit();

        log("Data collected");

        this.initDom();

        window.instances = (window.instances) ? (window.instances + 1) : 1;
        environment.instances = window.instances;

        if (environment.updateWithStreaming){
            this.streamingFacade = new StreamingFacade(environment);
            this.streamingAdapter = new StreamingAdapter(environment);
        }

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

            if (!environment.skipDump) { // skip the dump, everything is going to arrive via streaming
                if (environment.safeState) {
                    if (environment.jsonWrap.readJson(data)) {
                        log("Objects created");
                        environment.bgplay.set({inputParams: environment.params, silent: true});
                        environment.modes.push('consistent');
                    } else {
                        environment.modes.push('inconsistent');
                        environment.alert(environment.message.text, environment.message.type);
                    }
                } else {
                    environment.modes.push('inconsistent');
                }
            }
            (new mainView({el:environment.bgplayDom, environment:environment})).loadViews();
        };

        cssListenerInterval = 50; //50 ms
        cssListenerTimeout = 10000; // 10 secs
        cssListener = setInterval(function(){
            if(environment.bgplayDom.css("margin-top") === "-10px"){
                clearInterval(cssListener);

                if (!environment.skipDump && environment.jsonWrap.confirm(data)){

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

    this._retrieveData = function(params, callback){
        var run, url, $this;

        $this = this;
        run = callback;
        if (!this.environment.skipDump && !this.environment.streamInitialDump){

            url = this.environment.jsonWrap.getJsonUrl(params);
            $.getJSON(
                url + "&callback=?",
                {},
                function(json){
                    run.call($this, json.data);
                    if ($this.environment.updateWithStreaming && !$this.streamingAdapter){
                        $this.streamingAdapter = new StreamingAdapter(environment);
                    }
                }
            );

        } else if (!this.environment.skipDump && this.environment.streamInitialDump){
            this.streamingConnected = true;
            this.streamingFacade.connect({
                onEvent: function(data){
                    if ($this.environment.updateWithStreaming){
                        $this.streamingAdapter.addNewEvent(data);
                    }

                },
                onDump: function(data){
                    run.call($this, data);
                },
                onConnect: function(){
                    $this.streamingFacade.subscribe(params);
                }
            });

        }

        if (this.environment.updateWithStreaming && !this.streamingConnected){
            this.streamingFacade.connect({
                onEvent: $this.streamingAdapter.addNewEvent,
                onConnect: function(){
                    $this.streamingFacade.subscribe(params);
                }
            });
        }

    };

    this.retrieveData = function(){ //Init first
        var params;

        params = this.environment.jsonWrap.getParams();

        this._retrieveData(params, this.run);
    };


    this.update = function(){
        var params;

        this.environment.eventAggregator.trigger("destroyAll");
        this.initDom();

        params = this.environment.params;

        this._retrieveData(params, this.run);
    }
};