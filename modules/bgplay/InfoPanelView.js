/*
 * BGPlay.js
 * Copyright (c) 2013 Massimo Candela, Giuseppe Di Battista, Claudio Squarcella, Roma Tre University and RIPE NCC
 * http://www.bgplayjs.com
 *
 * See the file LICENSE.txt for copying permission.
 */

/**
 * InfoPanelView provides a panel in which the other modules can publish information.
 * Template: infoPanel.html
 * @class InfoPanelView
 * @module modules
 */
define(
    [
        BGPLAY_TEMPLATES_NOCORS_URL + "infoPanel.html.js"
    ],  function(){

        var InfoPanelView = Backbone.View.extend({
            events:function(){
                return {
                    "mouseover .bgplayAsLink":"asLinkOn",
                    "mouseout .bgplayAsLink":"asLinkOut"
                }
            },

            /**
             * The initialization method of this object.
             * @method initialize
             * @param {Map} A map of parameters
             */
            initialize:function(){
                this.environment=this.options.environment;
                this.bgplay=this.environment.bgplay;
                this.fileRoot=this.environment.fileRoot;
                this.eventAggregator=this.environment.eventAggregator;
                this.preventNextEvent = false;
                this.numberOfNodes = this.bgplay.get("nodes").size();
                this.numberOfCollectorPeers = this.bgplay.get("sources").size();
                this.numberOfEvents = this.bgplay.get("allEvents").size() -1; //without the initial instant
                this.lastEvent = this.bgplay.get("cur_instant");

                this.el=this.options.el;
                this.$el.show();

                if (this.environment.domWidth<480){
                    this.$el.hide();
                }

                this.eventAggregator.on("destroyAll", function(){
                    this.destroyMe();
                },this);

                this.eventAggregator.on('nodeSelected nodeTapped',function(nodeView){
                    if (!this.preventNextEvent){
                        this.node = nodeView.model;
                        this.collectorPeers = this.node.get("sources");
                        this.isASource = (this.collectorPeers.length > 0);
                        this.render();
                    }
                },this);

                this.eventAggregator.on('nodeReleased pathReleased',function(element){
                    if (!this.preventNextEvent){
                        this.node=null;
                        this.path=null;
                        this.render();
                    }
                },this);

                this.eventAggregator.on("pathSelected",function(pathView){
                    if (pathView.subTreeId == null && pathView.path != null && !this.preventNextEvent){
                        this.path = pathView.path;
                        this.pathString = this.path.toString();
                        this.pathStatistics = pathView.getStatistics();
                    }else{
                        this.path = null;
                    }
                    this.render();
                },this);

                this.bgplay.on('change:cur_instant', function(){
                    this.eventChange();
                },this);

                this.eventChange();

                log("InfoPanel view loaded.");
                this.eventAggregator.trigger("moduleLoaded", this);
            },
            url:'infoPanel',

            /**
             * This method draws this module (eg. inject the DOM and elements).
             * @method render
             */
            render:function(){
                parseTemplate(this.environment,'infoPanel.html',this,this.el);
                rotateTextInElement(this.$el.find('.bgplayTitle'));
                return this;
            },

            eventChange: function(){
                this.lastEvent = this.bgplay.get("allEvents").nearest(this.bgplay.get("cur_instant"), false, true);
                if (this.lastEvent != null){
                    this.lastEvent['isInitialInstant'] = (this.lastEvent.get("subType") == "initialstate");
                    this.render();
                }
            },

            asLinkOn:function(event){
                if (this.selectedNode==null){
                    var idNode = $(event.target).text();
                    this.preventNextEvent = true;
                    this.selectedNode = this.bgplay.get("nodes").get(idNode).view;
                    this.eventAggregator.trigger("nodeSelected", this.selectedNode);
                }
            },

            asLinkOut:function(event){
                this.eventAggregator.trigger("nodeReleased", this.selectedNode);
                this.preventNextEvent = false;
                this.selectedNode = null;
            }

        });

        return InfoPanelView;
    });