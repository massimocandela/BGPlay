/**
 * BGPlay.js
 * Copyright (c) 2013 Massimo Candela, Giuseppe Di Battista, Claudio Squarcella, Roma Tre University and RIPE NCC
 * http://bgplayjs.com
 *
 * See the file LICENSE.txt for copying permission.
 */

/**
 * GraphView provides the SVG graph.
 * Template: graph.html
 * @class GraphView
 * @module modules
 */
define(
    [
        //Sub-modules
        BGPLAY_MODULES_URL + "bgplay/NodeView.js",
        BGPLAY_MODULES_URL + "bgplay/PathView.js",

        //Template
        BGPLAY_TEMPLATES_NOCORS_URL + "graph.html.js"

    ],  function(NodeView, PathView){

        var GraphView = Backbone.View.extend({
            events:function(){
                return {
                    "touchstart .touchGraphEvents": "activateTouch",
                    "click .zoom-in": "zoomIn",
                    "click .zoom-out": "zoomOut",
                    "change .searchNode": "search"
                }
            },

            /**
             * The initialization method of this object.
             * @method initialize
             * @param {Map} A map of parameters
             */
            initialize: function(){
                this.environment = this.options.environment;
                this.bgplay = this.environment.bgplay;
                this.fileRoot = this.environment.fileRoot;
                this.imageRoot = this.environment.imageRoot;
                this.eventAggregator = this.environment.eventAggregator;


                printLoadingInformation(this.environment, "Drawing the graph.");
                this.el = this.options.el;
                this.model = this.options.model;
                this.pathViews = {};
                this.dom = this.$el;
                this.dom.show();
                this.cacheStaticPath = {};

                this.alreadyScaled = false;

                this.width = this.dom.width();
                this.height = this.dom.height();
                this.subtrees = [];

                this.skipAfterHops = this.environment.config.graph.skipAfterHops;
                this.pruneByWeight = this.environment.config.graph.pruneByWeight;
                this.pruneByPeer = this.environment.params.collectorPeers; // || this.environment.config.graph.pruneByPeer;

                this.pathColorsDoublePrefixOne = this.environment.config.graph.pathColorsDoublePrefixOne;
                this.pathColorsDoublePrefixTwo = this.environment.config.graph.pathColorsDoublePrefixTwo;
                this.doublePath = [];
                this.arcDeviationRedrawRequired = [];
                this.uniquePathsCheck = [];
                this.staticPaths = [];
                this.selectedNodes = [];
                this.isMobile = isMobileBrowser();
                this.graphAnimationsOngoing = 0;
                this.environment.GraphView = this;

                this.eventAggregator.on("destroyAll", function(){
                    this.destroyMe();
                },this);

                this.eventAggregator.on("newSample", function(instant){
                    if (this.environment.streamingOn){
                        if (this.updateScene()){
                            if (this.environment.config.graph.computeNodesPosition == true && this.environment.params.nodesPosition == null){
                                this.graph.computePosition();
                                this.autoScale();
                            } else if (this.environment.params.nodesPosition){
                                this.eventAggregator.trigger("applyNodePosition");
                            }
                        }

                        this.eventAggregator.trigger("firstPathDraw");
                        this.eventAggregator.trigger("updateNodesPosition"); //draw
                        this.pruneGraph();
                    }

                }, this);

                this.graph = new BgplayGraph({
                    parentDimensionX: this.width,
                    parentDimensionY: this.height,
                    environment: this.environment,
                    nodeDiameter: this.environment.config.graph.nodeWidth
                });

                this.bgplay.on('change:cur_instant', function(){
                    this.update();
                },this);

                this.eventAggregator.on('allAnimationsCompleted', function(parameters){
                    this.allConcurrentAnimationsCompleted();
                },this);


                this.eventAggregator.on('graphDeepChanged', function(deep){
                    this.skipAfterHops = deep;
                    this.eventAggregator.trigger('redrawPaths');
                    this.pruneGraph();
                },this);

                this.eventAggregator.on('graphLinkWeightChanged', function(weight){
                    this.pruneByWeight = weight;
                    this.eventAggregator.trigger('redrawPaths');
                    this.pruneGraph();
                },this);

                this.eventAggregator.on('filteredPeerChanged', function(value){
                    this.pruneByPeer = value;
                    this.eventAggregator.trigger('redrawPaths');
                    this.pruneGraph();
                },this);


                this.eventAggregator.on("graphAnimationComplete", function(value){
                    this.graphAnimationsOngoing += (value) ? -1 : +1;

                    if (this.graphAnimationsOngoing == 0){
                        this.eventAggregator.trigger("allAnimationsCompleted", null);
                    }

                },this);

                this.eventAggregator.on('arcDeviationRedrawRequired', function(nodes){
                    var $this = this;
                    if (nodes != null){
                        nodes.forEach(function(node){
                            if (!arrayContains($this.arcDeviationRedrawRequired, node)){
                                $this.arcDeviationRedrawRequired.push(node);
                            }
                        });
                    }
                },this);

                this.render();

                this.animation = false;

                this.nodeContainer.on("mouseleave", function(){
                    $this.hideSearch.call($this, event);
                });
                this.nodeContainer.on("mouseenter", function(){
                    $this.showSearch.call($this, event);
                });
                this.searchNodeInput.on("mousemove", function(event){
                    event.stopPropagation()
                });

                this.paper = new Raphael(this.nodeContainer[0], this.width, this.height);
                this.paper["node"] = this.nodeContainer;

                this.paperPan = new paperAddOn(this.paper, true, true, true);

                this.svgGraph = this.paper.set();
                this.paper.graphSet = this.svgGraph;

                var $this = this;

                $(this.paper.node).dblclick(function(evt){
                    if ($($(evt.target).context.parentNode).hasClass('bgplayNodeContainer')){
                        eventStopPropagation(evt);
                        $this.selectedNodes = [];
                    }
                });

                this.createAllNodes();
                this.createAllPaths();
                this.computeSubTrees();

                if (this.environment.config.graph.computeNodesPosition == true && !this.environment.params.nodesPosition){
                    this.graph.computePosition();

                    this.autoScale();

                    this.eventAggregator.trigger("firstPathDraw"); //draw
                    this.eventAggregator.trigger("updateNodesPosition"); //draw
                    this.pruneGraph();
                }else{
                    this.eventAggregator.trigger("firstPathDraw"); //draw
                }


                makeUnselectable(this.nodeContainer[0]);
                log("Graph initialized.");
                this.eventAggregator.trigger("moduleLoaded", this);
            },

            /*
             * This method creates the pointers to the DOM elements.
             */
            getDomElements: function(){
                this.nodeContainer = this.dom.find('.bgplayNodeContainer');
                this.touchGraphEvents = this.dom.find('.touchGraphEvents');
                this.searchNodeInput = this.dom.find('.searchNode')
                    .on("click mousedown mouseup", function(event){event.stopPropagation();});
            },

            /**
             * This method draws this module (eg. inject the DOM and elements).
             * @method render
             */
            render: function(){
                this.$el.show();
                parseTemplate(this.environment, 'graph.html', this, this.el);
                this.getDomElements();
                return this;
            },

            /**
             * This method activates touch gestures on the graph preventing the propagation of them on the whole page.
             * @method activateTouch
             */
            activateTouch: function(event){
                event.preventDefault();
                this.paper.touchEnabled =! this.paper.touchEnabled;
                if (this.paper.touchEnabled == true){
                    this.touchGraphEvents.attr('src', this.fileRoot + 'modules/html/img/touch_icon_enabled.png');
                }else{
                    this.touchGraphEvents.attr('src', this.fileRoot  +'modules/html/img/touch_icon_disabled.png');
                }
            },

            zoomIn: function(event){
                event.preventDefault();
                this.paperPan.fixedZoom(0.7);
            },

            zoomOut: function(event){
                event.preventDefault();
                this.paperPan.fixedZoom(-0.3);
            },


            /**
             * This method computes and applies the default zoom level.
             * @method autoScale
             */
            autoScale: function(){
                if (this.alreadyScaled == false){
                    this.alreadyScaled = true;
                    this.scaleFactor = this.graph.getScaleFactor(this.width, this.height);
                    this.paperPan.scale(this.scaleFactor);
                    this.paperPan.centerIn(this.graph.getCenter());
                }
            },

            /**
             * This method is called during an animation.
             * Use this method if you want to make some changes to the entire graph.
             * Do not use this method to make changes to a particular vertex or edge,
             * use instead dedicated event-triggered methods in the relative views.
             * @method update
             */
            update: function(){

            },

            /**
             * This method will be called at the end of all the concurrent animation on the graph.
             * Use this method if you want to make some changes to the entire graph.
             * Do not use this method to make changes to a particular vertex or edge,
             * use instead dedicated event-triggered method in the relative views.
             * @method allConcurrentAnimationsCompleted
             */
            allConcurrentAnimationsCompleted: function(){
                var $this = this;

                this.arcDeviationRedrawRequired.forEach(function(node){
                    $this.eventAggregator.trigger('redrawPathsOnThisNode', node); //ex nodeMoved
                });
                this.arcDeviationRedrawRequired = [];
                this.pruneGraph();

            },


            pruneGraph: function(){
                // return;
                var $this, pruneByWeight;

                $this = this;
                pruneByWeight = this.pruneByWeight;

                this.bgplay.get("nodes")
                    .forEach(function(node){
                        node.view.pruned = true;
                    });

                this.graph.edges
                    .forEachKey(function(key, values){
                        var start, stop, value;

                        start = key.vertexStart;
                        stop = key.vertexStop;

                        for (var n=0,length=values.length; n<length; n++) {
                            value = values[n];

                            if (value.peerVisible && value.beforeHopsLimit && value.drawn && length > pruneByWeight) {
                                start.pruned = false;
                                stop.pruned = false;
                            }
                        }

                    });

                this.bgplay.get("nodes")
                    .forEach(function(node){
                        if (node.view.pruned == true){
                            node.view.view.attr({ opacity: $this.environment.config.graph.notSelectedElementOpacity });
                        }else{
                            node.view.view.attr({ opacity: 1 });
                        }
                    });
            },

            /**
             * This method initializes all the NodeView needed to represent the nodes of the model layer.
             * @method createAllNodes
             */
            createAllNodes: function(){
                var $this = this;

                this.bgplay.get("nodes")
                    .forEach(function(node){
                        $this.graph
                            .addNode(new NodeView({
                                model: node,
                                paper: $this.paper,
                                visible: true,
                                graphView: $this,
                                environment: $this.environment
                            }));
                    });
            },

            /**
             * This method initializes all the NodeView needed to represent the nodes of the model layer.
             * @method createAllNewNodes
             */
            createAllNewNodes: function(){
                var atLeastOne = false;
                var $this = this;
                this.bgplay.get("nodes")
                    .forEach(function(node){
                        if (!node.view){
                            atLeastOne = true;
                            $this.graph
                                .addNode(new NodeView({
                                    model: node,
                                    paper: $this.paper,
                                    visible: true,
                                    graphView: $this,
                                    environment: $this.environment
                                }));
                        }
                    });

                return atLeastOne;
            },




            /**
             * This method initializes a PathView object for each source-target pair of the model layer.
             * Hence a PathView represents the transition between a set of path objects of the model layer involving the same source-target pair.
             * PathView uses events to update itself.
             * @method createAllPaths
             */
            createAllPaths: function(){
                var $this = this;

                this.skipAfterHops = 0;
                this.bgplay.get("sources")
                    .each(function(source){
                        $.each(source.get("events"), function(key, tree){ //A tree for each target, almost always one
                            var path, target, event, pathView;
                            event = tree.first();
                            path = event.get("path");
                            target = event.get("target");

                            pathView = new PathView({
                                source: source,
                                target: target,
                                path: path,
                                paper: $this.paper,
                                visible: (event.get("type") == "initialstate"),
                                graphView: $this,
                                environment: $this.environment
                            }); //We instantiate a new PathView

                            $this.pathViews[source.id + "-" + target.id] = pathView;

                            tree.forEach(function(event){
                                var path, nodes, target, keyForUniquenessCheck, keyForStaticCheck;

                                path = event.get("path");

                                if (path != null){
                                    target = path.get("target");
                                    nodes = path.get("nodes");
                                    $this.skipAfterHops = (nodes.length + 1 >= $this.skipAfterHops) ? nodes.length + 1 : $this.skipAfterHops;
                                    keyForUniquenessCheck = source.id + "-" + path.toString() + "-" + target.id;
                                    keyForStaticCheck = source.id + "-" + target.id;

                                    if ($this.uniquePathsCheck[keyForUniquenessCheck] == null){ //In this stage, we want to skip both null and duplicated paths in order to have only unique and valid paths
                                        $this.uniquePathsCheck[keyForUniquenessCheck] = true;
                                        $this.pathViews[keyForStaticCheck].static = ($this.pathViews[keyForStaticCheck].static == null);
                                        $this.graph.addPath(path);
                                    }
                                }
                            });
                        });
                    });

                $.each(this.pathViews, function(key, element){
                    if (element.static == true && element.path){
                        $this.staticPaths.push(element.path);
                    }
                });
            },

            createAllNewPaths: function(){
                var $this, atLeastOne, thereWasOneCompletelyNew;

                $this = this;
                thereWasOneCompletelyNew = false;
                this.skipAfterHops = 0;
                atLeastOne = false;
                this.bgplay.get("sources")
                    .each(function(source){
                        $.each(source.get("events"), function (key, tree) { //A tree for each target, almost always one
                            var path, target, event, pathView;
                            event = tree.first();
                            path = event.get("path");
                            target = event.get("target");

                            //if (event.get("new")) {

                            if (!$this.pathViews[source.id + "-" + target.id]) {

                                if (!atLeastOne) {
                                    this.staticPaths = [];
                                }
                                atLeastOne = true;
                                pathView = new PathView({
                                    source: source,
                                    target: target,
                                    path: path,
                                    paper: $this.paper,
                                    visible: false,
                                    graphView: $this,
                                    pd: 1,
                                    environment: $this.environment
                                }); //Instantiate a new PathView

                                $this.pathViews[source.id + "-" + target.id] = pathView;
                            }

                            tree.forEach(function (event) {
                                var path, nodes, target, keyForUniquenessCheck, keyForStaticCheck;

                                path = event.get("path");

                                if (path != null) {
                                    target = path.get("target");
                                    nodes = path.get("nodes");
                                    $this.skipAfterHops = (nodes.length + 1 >= $this.skipAfterHops) ? nodes.length + 1 : $this.skipAfterHops;
                                    keyForUniquenessCheck = source.id + "-" + path.toString() + "-" + target.id;
                                    keyForStaticCheck = source.id + "-" + target.id;

                                    if ($this.uniquePathsCheck[keyForUniquenessCheck] == null) { //In this stage, we want to skip both null and duplicated paths in order to have only unique and valid paths
                                        $this.uniquePathsCheck[keyForUniquenessCheck] = true;
                                        thereWasOneCompletelyNew = true;
                                        $this.pathViews[keyForStaticCheck].static = ($this.pathViews[keyForStaticCheck].static == null);
                                        $this.graph.addPath(path);
                                    }

                                }
                            });

                        });
                    });

                if (atLeastOne){
                    $.each(this.pathViews, function(key, element){
                        if (element.static == true && element.path){
                            $this.staticPaths.push(element.path);
                        }
                    });
                }

                return thereWasOneCompletelyNew;
            },

            checkCycleOneWay: function(path1, path2){
                var n, node, iteration, notCommon;

                notCommon = false;
                iteration = path1.length - 1;
                for (n=1; n<=iteration; n++){
                    node = path1[iteration-n]; //On-fly reverse

                    if (!arrayContains(path2, node)){
                        notCommon = true;
                    } else {
                        if (notCommon){
                            return true; //A common node after a notCommon node
                        }
                    }
                }
                return false; //There isn't a cycle (the worst case for this algorithm, all nodes were checked)
            },

            /**
             * This method checks if there is a cycle between two paths in order to understand if they can be collapsed together.
             * @method thereIsCycle
             * @param {Object} An instance of Path
             * @param {Object} An instance of Path
             * @return {Boolean} True if there is a cycle
             */
            thereIsCycle: function(path1, path2){
                var nodes1, nodes2;

                nodes1 = path1.get("nodes");
                nodes2 = path2.get("nodes");

                //First fast check
                if (nodes1[nodes1.length-1].id != nodes2[nodes2.length-1].id){
                    return true; //Avoids checks between paths with different targets
                }
                return (this.checkCycleOneWay(nodes1, nodes2) || this.checkCycleOneWay(nodes2, nodes1)); //If the first check returns true, the second will not start
            },

            getRedArrayOfColours: function(){
                if (!this.getRedArrayOfColoursCache){
                    this.getRedArrayOfColoursCache = [];

                    var  red, green, offset, secondColour_tmp, offset2, blue;
                    red = 255;
                    blue = 0;
                    green = 0;
                    offset = 20;
                    offset2 = 20;
                    while (red >= 0){
                        red-=offset;
                        secondColour_tmp=blue;
                        this.getRedArrayOfColoursCache.push(("#" + red.toString(16) + green.toString(16) + secondColour_tmp.toString(16)).toUpperCase());
                        while (secondColour_tmp <= 255){
                            secondColour_tmp += offset2;
                            this.getRedArrayOfColoursCache.push(("#" + red.toString(16) + green.toString(16) + secondColour_tmp.toString(16)).toUpperCase());
                        }

                    }
                }
                return this.getRedArrayOfColoursCache;
            },

            getGreenArrayOfColours: function(){
                if (!this.getGreenArrayOfColoursCache){
                    this.getGreenArrayOfColoursCache=[];

                    var  red, green, offset, secondColour_tmp, offset2, blue;
                    red = 0;
                    blue = 0;
                    green = 255;
                    offset = 20;
                    offset2 = 20;
                    while (green >= 0){
                        green -= offset;
                        secondColour_tmp = blue;
                        this.getGreenArrayOfColoursCache.push(("#" + red.toString(16) + green.toString(16) + secondColour_tmp.toString(16)).toUpperCase());
                        while (secondColour_tmp <= 255){
                            secondColour_tmp += offset2;
                            this.getGreenArrayOfColoursCache.push(("#" + red.toString(16) + green.toString(16) + secondColour_tmp.toString(16)).toUpperCase());
                        }

                    }
                }
                return this.getGreenArrayOfColoursCache;
            },
            getFromToColor: function(firstColour, secondColour){
                var  green, offset, out, secondColour_tmp, offset2;
                green = 0;
                offset = 20;
                offset2 = 40;
                out = [];
                while (firstColour >= 0){
                    firstColour -= offset;
                    out.push(("#" + firstColour.toString(16) + green.toString(16) + secondColour.toString(16)).toUpperCase());
                    secondColour_tmp = secondColour;
                    while (secondColour_tmp >= 0){
                        secondColour_tmp -= offset2;
                        out.push(("#" + firstColour.toString(16) + green.toString(16) + secondColour_tmp.toString(16)).toUpperCase());
                    }

                }
                return out;
            },

            /**
             * This method returns a unique color for a given PathView.
             * The objective of this method is to provide unambiguous colours for the paths of the graph.
             * As a first approach, the returned colours are taken from an array declared in config.js.
             * The default array is generated using the CMC(l:c) colour algorithm.
             * As a second approach, when the array of colours ends, a random generation is used.
             * This second approach does not guarantee that the generated colours are distinguishable.
             * Therefore, tune the array of colours to prevent as much as possible the second approach.
             * @method getPathColor
             * @param {Object} An instance of PathView
             * @return {String} An hexadecimal color
             */
            getPathColor: function(pathView){
                var color;
                if (!this.colorRedTmp){
                    this.colorRedTmp = ['#8B8989','#8B6969','#BC8F8F','#C67171','#CD5555','#8E2323','#CD3333','#8B1A1A','#DB2929','#EE6363','#330000','#8B0000','#FF0000','#FF4040','#FFC1C1','#A02422','#F2473F','#CDB7B5','#FC1501','#FA8072','#D66F62','#8A3324','#FF5333','#8B3626','#FF7256','#F5785A','#8B4C39','#EE8262','#E9967A','#E04006','#EE4000','#8B5742','#B13E0F','#5C4033','#CD6839','#FF7D40','#DB9370','#F87531','#BD9178','#FF6103','#FF7722','#733D1A','#FF9955','#E9C2A6','#8B4513','#FFF5EE','#BC7642','#C76114','#EE8833','#8B7765','#F4A460','#B87333','#FFA54F','#CD7F32','#CC7722','#EE7600','#FFCC99','#B67C3D','#E38217','#9F703A','#EDC393','#DD7500','#8B7355','#ED9121','#FFEFDB','#CDAA7D','#C48E48','#EEC591','#FCE6C9','#8B8378','#8B795E','#DC8909','#AA6600','#FFDEAD','#EED6AF','#FFE4B5','#CDBA96','#FDF5E6','#EE9A00','#D5B77A','#FFAA00','#E8C782','#FEE5AC','#DAA520','#EEB422','#CD950C','#E6B426','#CDAB2D','#FFF8DC','#EEE8CD','#FEF1B5','#EEDC82','#8B8878','#EEDD82','#EEC900','#FBDB0C','#FFE303','#D6C537','#FFE600','#8B864E','#EEE685','#BDB76B','#FFFCCF','#7B7922','#8B8B83','#CDCDC1','#4F4F2F','#777733','#F5F5DC','#D9D919','#8B8B00','#EEEE00','#FFFFAA','#FFFFF0','#98A148','#AEBB51','#B3C95A','#FCFFF0','#668014','#54632C','#D4ED91','#A2C257','#79973F','#9ACD32','#DFFFA5','#A2CD5A','#ADFF2F'];
                    this.colorNumberLeft = 0;
                    this.colorNumberRight = this.colorRedTmp.length;
                }

                if (this.environment.config.graph.pathIncrementalColoringForTwoPrefixes == true && this.bgplay.getPrefixes().length == 2){
                    if (this.doublePath[0] == null){
                        this.doublePath[0] = pathView.target;
                    }else if (pathView.target != this.doublePath[0] && this.doublePath[1] == null){
                        this.doublePath[1] = pathView.target;
                    }
                    if (pathView.target == this.doublePath[0]){
                        color = this.colorRedTmp[this.colorNumberLeft];
                        this.colorNumberLeft += 1;
                    }else if (pathView.target == this.doublePath[1]){

                        color = this.colorRedTmp[this.colorNumberRight];
                        this.colorNumberRight -= 1;
                    }

                }else{
                    if (this.notUsedColor == null){
                        this.notUsedColor = this.environment.config.graph.pathColors.slice(this.subtrees.length); //Initialize the array of colours
                    }

                    if (pathView.static == true){
                        color = this.environment.config.graph.pathColors[pathView.subTreeId]; //Dedicated color for static paths
                    }else{
                        color = this.notUsedColor.pop();
                    }
                }

                color = (color) ? color : this.getRandomColor();

                return color;
            },

            getRandomColor: function(){
                var letters = '0123456789ABCDEF'.split('');
                var color = '#';
                for (var i = 0; i < 6; i++ ) {
                    color += letters[Math.round(Math.random() * 15)];
                }
                return color;
            },

            /**
             * The objective of this method is to identify a set of trees composed of static paths that can be collapsed
             * together and coloured with the same colour without introducing ambiguity.
             * An ambiguity is generated when there is a cycle between two paths.
             * @method computeSubTrees
             */
            computeSubTrees: function(){
                if (this.staticPaths.length == 0){
                    return;
                }
                var tree, path1, path2, inThisTree, cacheKey;
                this.subtrees = [];
                this.subtrees.push([this.staticPaths[0]]); //Initializes the first set (alias tree)
                this.pathViews[this.staticPaths[0].get("source").id + "-" + this.staticPaths[0].get("target").id].subTreeId = 0;//The id of the subTree is the index of the array

                for (var h=1,lengthh=this.staticPaths.length; h<lengthh; h++){ //For each static path
                    path1 = this.staticPaths[h];

                    inThisTree = true;

                    for (var n=0,subTreeLength=this.subtrees.length; n<subTreeLength; n++){ //Tries to insert the current static path in a set
                        inThisTree = true;
                        tree = this.subtrees[n];

                        for (var i=0,lengthi=tree.length; i<lengthi; i++){ //Checks if there is a cycle between the new path and the paths already in the set
                            path2 = tree[i]; //A path in the set
                            cacheKey = path1.id + "-" + path2.id;
                            if (this.cacheStaticPath[cacheKey] == undefined){
                                this.cacheStaticPath[cacheKey] = this.thereIsCycle(path1, path2);
                            }

                            if (this.cacheStaticPath[cacheKey]){ //There is a cycle between two paths in the same set
                                inThisTree = false;
                                break; //Skip to check the other paths in the same tree
                            }
                        }

                        if (inThisTree){ //If no checks generates a negative result then we can put this path in the current set
                            this.pathViews[path1.get("source").id + "-" + path1.get("target").id].subTreeId = n;//The id of the subTree is the index of the array
                            this.subtrees[n].push(path1);
                            break; //Don't check in other trees
                        }
                    }

                    if (!inThisTree){
                        this.pathViews[path1.get("source").id+"-"+path1.get("target").id].subTreeId = this.subtrees.length;
                        this.subtrees.push([path1]);
                    }
                }
                this.applyTreeAtEdges();
            },

            updateScene: function(){
                var newNodes, newPaths;

                newNodes = this.createAllNewNodes();
                newPaths = this.createAllNewPaths();

                if (newPaths){
                    this.computeSubTrees();
                }

                return newNodes;
            },

            applyTreeAtEdges: function(){
                var $this = this;
                this.graph.edges.forEach(function(edge){
                    edge.subTreeId = $this.pathViews[edge.key].subTreeId;
                });
            },

            search: function(event) {
                var asId, selectedNode, $this;

                event.preventDefault();

                $this = this;
                asId = $(event.target).val();
                selectedNode = this.bgplay.get("nodes").get(asId);

                if (selectedNode) {

                    if (this.previousNodeSelection) {
                        this.eventAggregator.trigger("nodeReleased", $this.previousNodeSelection);
                    }

                    this.nodeContainer.on("click", function(){
                        $this.eventAggregator.trigger("nodeReleased", $this.previousNodeSelection);
                        $this.searchNodeInput.find("input").val("");
                        $this.previousNodeSelection = null;
                    });

                    this.eventAggregator.trigger("nodeSelected", selectedNode.view);
                    this.previousNodeSelection = selectedNode.view;
                } else {
                    $this.searchNodeInput
                        .find("input")
                        .val("")
                        .attr("placeholder", "No matches!");

                    setTimeout(function(){
                        $this.searchNodeInput
                            .find("input")
                            .attr("placeholder", "ASN");
                    }, 2000);


                }
            },

            showSearch: function(event){
                event.stopPropagation();
                this.searchNodeInput.show();
            },

            hideSearch: function(event){
                event.stopPropagation();
                this.searchNodeInput.hide();
            }

        });

        return GraphView;
    });