/*
 * BGPlay.js
 * Copyright (c) 2013 Massimo Candela, Giuseppe Di Battista, Claudio Squarcella, Roma Tre University and RIPE NCC
 * http://bgplayjs.com
 *
 * See the file LICENSE.txt for copying permission.
 */

/**
 * MainView manages all the modules.
 * At initialization time it injects all the needed DOM elements.
 * Template: main.html
 * @class MainView
 * @module modules
 */
define(
    [
        //Template
        BGPLAY_TEMPLATES_NOCORS_URL + "main.html.js"

    ],  function(){

        var MainView = Backbone.View.extend({

            /**
             * The initialization method of this object.
             * @method initialize
             * @param {Map} A map of parameters
             */
            initialize:function(){
                this.environment = this.options.environment;
                this.bgplay = this.environment.bgplay;
                this.fileRoot = this.environment.fileRoot;
                this.eventAggregator = this.environment.eventAggregator;

                this.selectedNode = null;
                this.modulesLoaded = 0;
                this.notLoadedModules = 0;
                this.rootDom = $(this.el);
                this.autoStartFunctions = [];

                this.eventAggregator.on("destroyAll", function(){
                    this.destroyMe();
                },this);

                this.eventAggregator.on("autoStartFunction", function(callback){
                    this.autoStartFunctions.push(callback);
                },this);

                this.render();

                this.eventAggregator.on("moduleLoaded",function(module){
                    this.modulesLoaded++;
                    if (this.areAllModulesLoaded()){
                        this.allModulesLoaded();
                    }
                },this);
            },

            /**
             * This method draws this module (eg. inject the DOM and elements).
             * @method render
             */
            render:function(){
                parseTemplate(this.environment, 'main.html', this, this.el, "prepend");
                this.layoutManager();
                return this;
            },

            /**
             * This method alters the layout at run-time. It should be used only when absolutely necessary preferring instead a static CSS+HTML+Mustaches.js layout.
             * @method layoutManager
             */
            layoutManager:function(){
                var marginTop = 100;

                this.bgplayDom = this.environment.bgplayDom;
                this.bgplayDom.css('height', this.environment.domHeight+'px');
                this.bgplayDom.css('width', this.environment.domWidth+'px');// = this.environment.domWidth;

                this.infoDiv = this.bgplayDom.find('.bgplayInfoDiv');
                this.centerDiv = this.bgplayDom.find('.bgplayCenterDiv');
                this.timelineDiv = this.bgplayDom.find('.bgplayTimelineDiv');

                if (this.environment.modules.filter(function(i){ return i.domClass == "bgplayGraphDiv" }).length > 0){
                    this.centerDiv.height(
                        Math.max(this.environment.domHeight - this.infoDiv.outerHeight(true) - this.timelineDiv.outerHeight(true) - marginTop,
                            this.environment.config.graph.paperMinHeight)
                    );
                }
            },

            /**
             * This method initializes all the modules declared in the modules.js file.
             * In this environment a module is a View-Controller object:
             * - each module is responsible for its representation;
             * - each module is combined with a DOM element of the MainView's template;
             * - each DOM element has an ID with prefix 'bgplay' to avoid ambiguities with the background html.
             * @method loadViews
             */
            loadViews:function(){
                var module, n, length, domElement;
                length = this.environment.modules.length;
                for (n=0; n<length; n++){
                    module = this.environment.modules[n];
                    if (arrayContainsOne(module["types"], [this.environment.type,"all"]) &&
                        arrayContainsAll(module["modes"], this.environment.modes)){
                        domElement = this.bgplayDom.find('.'+module.domClass);
                        if (domElement!=null){
                            new module.view({el:domElement, environment:this.environment});
                        }else{
                            new module.view({environment:this.environment});
                        }
                    }else{
                        this.notLoadedModules++;
                    }

                    if (this.areAllModulesLoaded()){
                        this.allModulesLoaded();
                    }
                }
            },

            /**
             * This returns true if all modules are loaded
             * @method areAllModulesLoaded
             * @return {Boolean} True if all modules are loaded
             */
            areAllModulesLoaded:function(){
                return (this.modulesLoaded == this.environment.modules.length - this.notLoadedModules);
            },

            /**
             * This method executes a set of functions when all the modules have been loaded.
             * @method allModulesLoaded
             */
            allModulesLoaded:function(){
                this.autoStartFunctions.forEach(function(callback){
                    callback.func.call(callback.context);
                });
                printLoadingInformation(this.environment,"");
            }
        });


        return MainView;
    });