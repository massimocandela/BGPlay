/*
 * BGPlay.js
 * Copyright (c) 2013 Massimo Candela, Giuseppe Di Battista, Claudio Squarcella, Roma Tre University and RIPE NCC
 * http://www.bgplayjs.com
 *
 * See the file LICENSE.txt for copying permission.
 */


var BgplayGraph = function (options) {
    if (!net.webrobotics.TreeMap) {
        console.log('Webrobotics\'s TreeMap required');
        return null;
    }
    this.nodeId = 0;
    this.arcId = 0;

    this.environment=options.environment;
    this.iterations = setValuePriority("iterations", 500);
    this.elasticCoefficient = setValuePriority("elasticCoefficient", 1);
    this.parentDimensionX = setValuePriority("parentDimensionX", 100);
    this.parentDimensionY = setValuePriority("parentDimensionY", 100);
    this.nodeDiameter = (options) ? options.nodeDiameter : 100 || 100;
    this.maxPathLength = 0;

    /*
    this.initialPosition = setValuePriority("initialPosition", function (nodeWidth, numberOfNodes, nodeNumericalId) {
        var pi2 = Math.PI * 2;
        if (!this.radius) {
            this.radius = (nodeWidth * numberOfNodes) * 2 / pi2;
            this.singleSpace = (this.radius * pi2 / numberOfNodes);
        }
        var t = this.singleSpace * nodeNumericalId;
        var x = this.radius * Math.cos(t);
        var y = this.radius * Math.sin(t);
        return {x:x, y:y};
    });
    */

    function setValuePriority(optionsKey, val2) {
        if (options != null) {
            return (options[optionsKey] != null) ? options[optionsKey] : val2;
        }
        return val2;
    }

    this.utils = new net.webrobotics.GraphUtils();

    this.vertices = new net.webrobotics.TreeMap(comparator, {allowDuplicateKeys:false, suppressDuplicateKeyAlerts:true});

    var pathComparator = function (k1, k2) {
        if (k1.source.id < k2.source.id || (k1.source.id == k2.source.id && k1.target.id < k2.target.id)) {
            return -1;
        }
        if (k1.source.id > k2.source.id || (k1.source.id == k2.source.id && k1.target.id > k2.target.id)) {
            return 1;
        }
        return 0; //equals
    };
    this.paths = new net.webrobotics.TreeMap(pathComparator, {allowDuplicateKeys:true, suppressDuplicateKeyAlerts:true});

    var edgeComparator = function (k1, k2) {
        if (k1.vertexStart.graphId < k2.vertexStart.graphId || (k1.vertexStart.graphId == k2.vertexStart.graphId && k1.vertexStop.graphId < k2.vertexStop.graphId)) {
            return -1;
        }
        if (k1.vertexStart.graphId > k2.vertexStart.graphId || (k1.vertexStart.graphId == k2.vertexStart.graphId && k1.vertexStop.graphId > k2.vertexStop.graphId)) {
            return 1;
        }
        return 0; //equals
    };
    this.edges = new net.webrobotics.TreeMap(edgeComparator, {allowDuplicateKeys:true, suppressDuplicateKeyAlerts:true});
};

//The node object MUST have these properties:id, x, y
BgplayGraph.prototype.addNode = function (node) {
    this.nodeId++;
    node.graphId = this.nodeId;
    node.vectors = new Array();
    node.edges = 0;
    this.vertices.put(this.nodeId, node);
    return node;
};

BgplayGraph.prototype.addPath = function (path) {
    var next, current, nodes, source, target, orderedNodes, key, edge, present, arc, initial;
    source = path.get("source");
    target = path.get("target");
    nodes = path.get("nodes");
    key = source.id+"-"+target.id;

    this.maxPathLength = Math.max(nodes.length, this.maxPathLength);

    initial = (this.paths.get({source:source, target:target}) != null);
    for (var n=0, length=nodes.length; n < length-1; n++) {
        next = nodes[n+1];
        current = nodes[n];
        orderedNodes = this.utils.absOrientation(current, next);

        edge = this.edges.get({vertexStart:orderedNodes[0].view, vertexStop:orderedNodes[1].view});

        present = false;
        if (edge != null){
            for (var y=0, length2=edge.length; y<length2; y++){
                arc = edge[y];
                if (arc.key == key){ //An arc for each key
                    present = true;
                }
            }
        }
        if (!present){
            next.view.addNeighbor(current);
            current.view.addNeighbor(next);

            this.edges.put(
                {vertexStart:orderedNodes[0].view, vertexStop:orderedNodes[1].view, toString:function () {
                    return this.vertexStart.graphId + "-" + this.vertexStop.graphId;
                }},
                {id:this.arcId, key:key, drawn:false, initial:initial}
            );
            this.arcId++;
        }
    }
    this.paths.put({source:source,target:target}, nodes);
    return path;
};

BgplayGraph.prototype.getMinY = function(refresh) {
    var min;
    if (refresh == true || this.minY == null){
        this.vertices.forEach(function(node){
            if (node.y < min || min == null){
                min = node.y;
            }
        });
        this.minY = min;
    }
    return this.minY;
}

BgplayGraph.prototype.getMaxY = function (refresh) {
    var max;
    if (refresh == true || this.maxY == null){
        this.vertices.forEach(function(node){
            if (node.y > max || max == null){
                max = node.y;
            }
        });
        this.maxY = max;
    }
    return this.maxY;
}

BgplayGraph.prototype.getMinX = function (refresh) {
    var min;
    if (refresh == true || this.minX == null){
        this.vertices.forEach(function(node){
            if (node.x < min || min == null){
                min = node.x;
            }
        });
        this.minX = min;
    }
    return this.minX;
}

BgplayGraph.prototype.getMaxX = function (refresh) {
    var max;
    if (refresh == true || this.maxX == null){
        this.vertices.forEach(function(node){
            if (node.x > max || max == null){
                max = node.x;
            }
        });
        this.maxX = max;
    }
    return this.maxX;
}

BgplayGraph.prototype.getScaleFactor = function(width, height){
    var maxX, minX, maxY, minY, hOuter, wOuter, scaleFactor;
    maxX = this.getMaxX();
    minX = this.getMinX();
    maxY = this.getMaxY();
    minY = this.getMinY();
    wOuter = (maxX-minX);
    hOuter = (maxY-minY);

    scaleFactor = (wOuter-width > hOuter-height)? wOuter/width : hOuter/height;

    return scaleFactor;;

}

BgplayGraph.prototype.computePosition = function () {
    var orbit, node , h, length, n, radius, pi2, lengthOrbit, spaceOrbit, parents, cycles, orbits;
    cycles = [];
    orbits = [];

    function addIfNotVisited(node, where, orbit){
        var elem, n, length, neighbors;
        neighbors = node.view.getNeighbors();
        length = neighbors.length;
        for (n = 0; n<length; n++){
            elem = neighbors[n];
            if (!elem.view.orbit || elem.view.orbit>=node.view.orbit){
                if (!elem.view.visited){
                    elem.view.numId = node.view.numId + (n*(1/(length)));
                    elem.view.orbit = orbit;
                    where.push(elem);
                }else if (elem.view.visited==true && !node.view.confirmed){
                    if (node.view.orbit==elem.view.orbit && !arrayContains(cycles,node))cycles.push(node);
                    if(!arrayContains(cycles,elem))cycles.push(elem);
                }
                elem.view.visited=true;
            }
        }
        node.view.confirmed=true;
    }

    function getChild(node){
        var out = [];
        var nodes = node.view.getNeighbors();
        for (var n= 0, length=nodes.length; n<length ;n++){
            if (nodes[n].view.orbit == node.view.orbit+1){
                out.push(nodes[n]);
            }
        }
        return out;
    }

    function getAncestors(node, orbitId){
        var neighbors = getParents(node, true);
        var ancestors = (node.view.orbit == orbitId+1) ? neighbors : [];
        for (var n=0, length=neighbors.length; n<length ;n++){
            ancestors = ancestors.concat(getAncestors[n]);
        }
        return ancestors;
    }

    function getParents(node, sameOrbit){
        var out = [];
        var nodes = node.view.getNeighbors();
        for (var n= 0, length=nodes.length; n<length ;n++){
            if (nodes[n].view.orbit == node.view.orbit-1 || (sameOrbit==true && nodes[n].view.orbit == node.view.orbit)){
                out.push(nodes[n]);
            }
        }
        return out;
    }

    function orderOrbit(orbit){
        var orderedArray = [];
        var unorderedArray = orbit;
        var node, ancestors;
        ancestors = [];
        for (var n=0, length=cycles.length; n<length ;n++){
            node = cycles[n];
            ancestors = getAncestors(node, orbit[0].view.orbit);
            for (var i=0; i<ancestors.length; i++){
                if (!arrayContains(orderedArray, ancestors[i]) && ancestors[i] != null){
                    orderedArray.push(ancestors[i]);
                }
            }
        }
        unorderedArray = removeSubArray(unorderedArray, orderedArray);
        return orderedArray.concat(unorderedArray);
    }

    function averageAngle(nodes){
        var avg, n, length, frc, node;
        avg = 0;
        length = nodes.length;
        frc = length;
        for (n=0; n<length; n++){
            node = nodes[n].view;
            avg += (node.g);
        }
        return avg/frc;
    }


    var targets = this.vertices.getFilteredSubTreeMapByValue(function (node) {
        return (node.model.get("targets").length > 0);
    });

    n=0;
    pi2 = Math.PI * 2;
    orbits[0] = [];
    targets.forEach(function(element){
        element.numId = n;
        orbits[0].push(element.model);
        element.orbit = 0;
        element.visited = true;
        n++;
    });

    var maxOrbitSize=0;
    for (n=0; n<orbits.length; n++){ // The lookup of the length is necessary at each iteration
        orbit=orbits[n];
        orbit.forEach(function(node){
            if (!orbits[n+1]){
                orbits[n+1] = [];
            }
            node.view.orbit=n;
            addIfNotVisited(node, orbits[n+1], n+1);
            node.view.visited=true;
        });
        if (orbit.length > maxOrbitSize){
            maxOrbitSize = orbit.length;
        }
    }
    log("Number of graph orbits " + cycles.length);

    orbits[1] = orderOrbit(orbits[1]);

    for (n=0, length=orbits.length; n<length; n++){
        orbit = orbits[n];
        radius = (150 * (n));
        lengthOrbit = orbit.length;

        spaceOrbit = (maxOrbitSize*20)/lengthOrbit;

        for (h=0; h<lengthOrbit; h++){
            node = orbit[h];

            parents = getParents(node, false);
            if (n==0){
                node.view.g = (h*(pi2/lengthOrbit));
                node.view.x = 20 * Math.cos(node.view.g);
                node.view.y = 20 * Math.sin(node.view.g);
            }else if (n==1){
                node.view.g = (h*(pi2/lengthOrbit));
                node.view.x = radius * Math.cos(node.view.g);
                node.view.y = radius * Math.sin(node.view.g);
            }else{
                node.view.g = averageAngle(parents);
                node.view.x = radius * Math.cos(node.view.g)+(0.1*h);
                node.view.y = radius * Math.sin(node.view.g)+(0.1*h);
            }
        }
    }

    var $this, springEmbedderCyclesPercentage, whenHookInteractionsStarts, whenHookInteractionsEnds,
        whenOnlyLeavesRepulsion, whenCoulombStarts, whenCoulombEnds, whenEdgeNodeRepulsionStarts,
        edgeVertexRepulsionIteration, environmentGraph;

    $this = this;
    environmentGraph = this.environment.config.graph;
    springEmbedderCyclesPercentage = environmentGraph.springEmbedderCycles / 100;
    whenHookInteractionsStarts = springEmbedderCyclesPercentage * environmentGraph.whenHookInteractionsStarts;
    whenHookInteractionsEnds = springEmbedderCyclesPercentage * environmentGraph.whenHookInteractionsEnds;
    whenOnlyLeavesRepulsion = springEmbedderCyclesPercentage * environmentGraph.whenOnlyLeavesRepulsion;
    whenCoulombStarts = springEmbedderCyclesPercentage * environmentGraph.whenCoulombRepulsionStarts;
    whenCoulombEnds = springEmbedderCyclesPercentage * environmentGraph.whenCoulombRepulsionEnds;
    whenEdgeNodeRepulsionStarts = springEmbedderCyclesPercentage * environmentGraph.whenEdgeNodeRepulsionStarts;

    edgeVertexRepulsionIteration = 0;

    if (whenOnlyLeavesRepulsion > 0){
        var leaves = this.vertices.getFilteredSubTreeMapByValue(function (node) {
            return (node.model.get("sources").length > 0);
        });
    }

    var initialArcs = this.edges.getFilteredSubTreeMapByValue(function(value){
        return value.initial;
    });

    /*
     var firstEdge = this.edges.getFilteredSubTreeMapByKey(function (key) {
     return (targets.containsValue(key.vertexStart)) ? true : false;
     });

     var firstNode = [];
     firstEdge.forEachKey(function (key) {
     firstNode.push(key.vertexStop);
     });
     */

    for (var n = 0, length=this.environment.config.graph.springEmbedderCycles; n < length; n++) {

        if (n > whenHookInteractionsStarts && n < whenHookInteractionsEnds) {
            this.edges.forEachKey(function (key, values) {
                var element = initialArcs.get(key);
                if (element!=null && element.length>0){
                    $this.utils.hook(key.vertexStart, key.vertexStop, 50, 10);//150,10
                }else{
                    $this.utils.hook(key.vertexStart, key.vertexStop, 50, 50);//150,10
                }
            });
        }

        if (n > whenCoulombStarts && n < whenCoulombEnds) {
            this.vertices.forEachCouple(function (element1, element2) {
                $this.utils.coulomb(element1, element2, element1.neighbors.size(), element2.neighbors.size(), 8, 250);//0.5,1
            });
        }


        if (n > whenEdgeNodeRepulsionStarts) {
            edgeVertexRepulsionIteration++;
            $this.vertices.forEach(function(vertex){
                $this.edges.forEachKey(function(nodePair){
                    $this.utils.edgeNodeRepulsion([nodePair.vertexStart,nodePair.vertexStop],vertex, 10, $this.nodeDiameter+5,edgeVertexRepulsionIteration);
                    edgeVertexRepulsionIteration++;
                });
            });
        }

        if (n > whenOnlyLeavesRepulsion) {
            leaves.forEachCouple(function (element1, element2) {
                $this.utils.coulomb(element1, element2, 10, 10, 20, 35);//0.5,1
            });
        }

        /*
         this.vertices.forEach(function (node) { //impose a dynamic box
         var top = {x:node.x, y:-$this.parentDimensionY / 2, vectors:[]};
         var bottom = {x:node.x, y:$this.parentDimensionY + $this.parentDimensionY / 2, vectors:[]};
         var left = {x:0, y:node.y, vectors:[]};
         var right = {x:$this.parentDimensionX, y:node.y, vectors:[]};

         //$this.utils.coulomb(node, top, 20, 20, 5, 200);
         //$this.utils.coulomb(node, bottom, 20, 20, 5, 200);
         //$this.utils.coulomb(node,left,8,1,20);
         //$this.utils.coulomb(node,right,8,1,20);
         });
         */

        this.vertices.forEach(function (node) {
            $this.utils.computeFinalPosition(node);
        });

    }

//to refresh cache
    this.getMaxX(true);
    this.getMinX(true);
    this.getMaxY(true);
    this.getMinY(true);
}

BgplayGraph.prototype.getCenter = function(){
    var maxX, minX, maxY, minY, center;
    maxX = this.getMaxX();
    minX = this.getMinX();
    maxY = this.getMaxY();
    minY = this.getMinY();
    center = {};
    center.x = (((maxX - minX)/2) + minX);
    center.y = (((maxY - minY)/2) + minY);

    return center;
}


