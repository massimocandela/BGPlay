/*
 * BGPlay.js
 * Copyright (c) 2013 Massimo Candela, Giuseppe Di Battista, Claudio Squarcella, Roma Tre University and RIPE NCC
 * http://bgplayjs.com
 *
 * See the file LICENSE.txt for copying permission.
 */

/**
 * NodePositionView provides three functions:
 * - allows the user to obtain the json of the graph;
 * - allows the user to edit and apply a json to the graph;
 * - applies, if present, a json from widget's parameters.
 * @class NodePositionView
 * @module modules
 */

define(
    [
        //Template
        BGPLAY_TEMPLATES_NOCORS_URL + "nodePosition.html.js"

    ],  function(){
        var NodePositionView = Backbone.View.extend({

            /**
             * The initialization method of this object.
             * @method initialize
             * @param {Map} A map of parameters
             */
            initialize: function(){
                this.environment = this.options.environment;
                this.bgplay = this.environment.bgplay;
                this.fileRoot = this.environment.fileRoot;
                this.eventAggregator = this.environment.eventAggregator;



                this.environment.optionalParams.push('nodesPosition');
                this.positions = "";
                this.eventAggregator.on("destroyAll", function(){
                    this.destroyMe();
                },this);

                this.render();
                this.eventManager();

                this.eventAggregator.on("nodeMoved", function(){
                    if (this.popup.is(':visible')){
                        this.getNodesPositions();
                    }
                },this);

                if (this.environment.params.nodesPosition != null){
                    this.environment.config.graph.computeNodesPosition = false;
                    this.environment.params.preventNewQueries = true;
                    this.textArea.val(this.environment.params.nodesPosition);
                    this.apply();
                }
                this.eventAggregator.trigger("moduleLoaded", this);
            },

            /**
             * This method draws this module (eg. inject the DOM and elements).
             * @method render
             */
            render: function(){
                this.footerDiv = this.environment.dom.closest('.stat-widget').find('.box-buttons');
                this.button = $('<li><a class="button" href="javascript:void(0);">layout</a></li>');
                this.popup = $('<div class="json_nodes popup"><h3>Json of the positions of the nodes</h3></div>');
                this.popup.hide();
                parseTemplate(this.environment,'nodePosition.html',this,this.popup,"append");
                this.textArea = this.popup.find('textarea');
                this.applyButton = this.popup.find('.apply');
                this.getSVGbutton = this.popup.find('.getsvg');

                this.footerDiv.find('.left').append(this.button);
                this.footerDiv.append(this.popup);

                var ie = isInternetExplorer();
                if (!(ie==-1 || ie >9)){
                    this.getSVGbutton.hide();
                }
                return this;
            },

            /**
             * This method manages the events of the built DOM.
             * @method eventManager
             */
            eventManager: function(){
                var $this = this;
                this.button.click(function(){
                    if ($this.popup.is(':visible')){
                        $this.popup.hide();
                    }else{
                        $this.footerDiv.find('.popup').hide();
                        $this.getNodesPositions();
                        $this.popup.show();
                    }
                });

                this.applyButton.click(function(){
                    $this.apply();
                });

                this.getSVGbutton.click(function(){
                    $this.screenshot();
                });
            },

            /**
             * This methods builds a string describing the graph.
             * @method getNodesPositions
             */
            getNodesPositions:function(){
                var positions = {};
                this.bgplay.get("nodes").forEach(function(node){
                    positions[node.id] = {x:node.view.x, y:node.view.y};
                });

                this.positions = JSON.stringify(positions);
                this.textArea.val(this.positions);
            },

            /**
             * This methods applies to each node the coordinates obtained with the getNodesPositions method.
             * @method apply
             */
            apply: function(){
                var newPositions, position, $this;
                $this = this;
                newPositions = JSON.parse(this.textArea.val());
                this.bgplay.get("nodes").forEach(function(node){
                    position = newPositions[node.id];
                    if (position!=null){
                        var x = (position.x - node.view.x);
                        var y = (position.y - node.view.y);

                        if (x != 0 || y != 0){ //Something changed
                            node.view.view.translate(x, y);
                            node.oldX = node.view.x;
                            node.oldY = node.view.y;
                            node.view.x += x;
                            node.view.y += y;
                            $this.eventAggregator.trigger("nodeMoved", node);
                        }
                    }
                });
                this.environment.GraphView.autoScale();
            },

            /**
             * This method opens in a new tab an SVG file containing the graph
             * @method screenshot
             */
            screenshot:function(event){
                var header, content, content_clone, uriContent, viewBox, svg;
                header = "<?xml version=\'1.0\' standalone=\'no\'?><!DOCTYPE svg PUBLIC \'-//W3C//DTD SVG 1.1//EN\'"+" "+"\'http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd\'>";
                //var xmlns_xlink = "http://www.w3.org/1999/xlink";

                content = this.environment.bgplayDom.find(".bgplayNodeContainer");

                content_clone = content.clone();

                svg = content_clone.find("svg");

                svg.removeAttr("height").removeAttr("width");
                var x = this.environment.GraphView.graph.getMinX(true) - this.environment.config.graph.nodeWidth;
                var y = this.environment.GraphView.graph.getMinY(true) - this.environment.config.graph.nodeHeight;
                var width = this.environment.GraphView.graph.getMaxX(true)-x + this.environment.config.graph.nodeWidth;
                var height = this.environment.GraphView.graph.getMaxY(true)-y + this.environment.config.graph.nodeHeight;

                svg.attr("viewBox", x+" "+y+" "+width+" "+height);

                uriContent = 'data:text/html,' + encodeURIComponent(header+content_clone.html());
                window.open(uriContent, 'BGPlay');
            }

        });

        return NodePositionView;
    });