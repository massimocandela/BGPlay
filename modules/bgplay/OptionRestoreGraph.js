/*
 * BGPlay.js
 * Copyright (c) 2013 Massimo Candela, Giuseppe Di Battista, Claudio Squarcella, Roma Tre University and RIPE NCC
 * http://bgplayjs.com
 *
 * See the file LICENSE.txt for copying permission.
 */

/**
 * OptionAnimationSpeedView pushes in the option panel the animation speed control
 * @class OptionAnimationSpeedView
 * @module modules
 */

define(
    [
        //Template
        BGPLAY_TEMPLATES_NOCORS_URL + "optionRestoreGraph.html.js"

    ],  function(){


        var OptionRestoreGraph = Backbone.View.extend({

            /*
             * The initialization method of this object.
             * @method initialize
             * @param {Map} A map of parameters
             */
            initialize: function(){
                this.environment = this.options.environment;
                this.bgplay = this.environment.bgplay;
                this.fileRoot = this.environment.fileRoot;
                this.eventAggregator = this.environment.eventAggregator;



                this.eventAggregator.on("destroyAll", function(){
                    this.destroyMe();
                },this);

                this.dom = this.environment.optionPopupDom;
                this.render();
                this.eventManager();
                this.getNodesPositions();

                this.eventAggregator.trigger("moduleLoaded", this);
            },

            /**
             * This method draws this module (eg. inject the DOM and elements).
             * @method render
             */
            render: function(){
                this.footerDiv = this.environment.dom.find('.bgplayjsButtonsDiv');
                this.button = $('<a class="button" href="javascript:void(0);">layout</a>');
                this.popup = $('<div class="json_nodes popup"><h3>Json of the positions of the nodes</h3></div>');
                parseTemplate(this.environment,'aboutBgplay.html',this,this.popup,"append");
                this.popup.hide();


                return this;
            },

            /**
             * This method manages the events of the built DOM.
             * @method eventManager
             */
            eventManager: function(){
                var $this = this;
                this.button.click(function(){
                    $this.apply();
                });
            },

            /**
             * This methods builds a string describing the graph.
             * @method getNodesPositions
             */
            getNodesPositions: function(){
                var positions = {};
                this.bgplay.get("nodes").forEach(function(node){
                    positions[node.id] = {x:node.view.x, y:node.view.y};
                });

                this.nodesPosition = JSON.stringify(positions);
            },

            /**
             * This methods applies to each node the coordinates obtained with the getNodesPositions method.
             * @method apply
             */
            apply: function(){
                var newPositions, position, $this;
                $this=this;
                newPositions = JSON.parse(this.nodesPosition);
                this.bgplay.get("nodes").forEach(function(node){
                    position = newPositions[node.id];
                    if (position != null){
                        var x = (position.x - node.view.x);
                        var y = (position.y - node.view.y);
                        node.view.view.translate(x, y);
                        node.oldX = node.view.x;
                        node.oldY = node.view.y;
                        node.view.x += x;
                        node.view.y += y;
                        $this.eventAggregator.trigger("nodeMoved", node);
                    }
                });
            }
        });

        return OptionRestoreGraph;
    });