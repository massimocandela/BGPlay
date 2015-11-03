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
    this.frames = 0;

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
    this.edges = new net.webrobotics.TreeMap(edgeComparator, {allowDuplicateKeys: true, suppressDuplicateKeyAlerts: true});
};

//The node object MUST have these properties:id, x, y
BgplayGraph.prototype.addNode = function (node) {
    this.nodeId++;
    node.graphId = this.nodeId;
    node.vectors = [];
    node.edges = 0;
    this.vertices.put(this.nodeId, node);
    return node;
};

BgplayGraph.prototype.addPath = function (path) {
    var next, current, nodes, source, target, orderedNodes, key, edge, present, arc, initial;
    source = path.get("source");
    target = path.get("target");
    nodes = path.get("nodes");
    key = source.id + "-" + target.id;

    this.maxPathLength = Math.max(nodes.length, this.maxPathLength);

    initial = (this.paths.get({source: source, target: target}) != null);
    for (var n=0, length=nodes.length; n < length-1; n++) {
        next = nodes[n+1];
        current = nodes[n];
        orderedNodes = this.utils.absOrientation(current, next);

        edge = this.edges.get({
            vertexStart: orderedNodes[0].view,
            vertexStop: orderedNodes[1].view
        });

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
                {
                    vertexStart: orderedNodes[0].view,
                    vertexStop: orderedNodes[1].view,
                    toString: function () {
                        return this.vertexStart.graphId + "-" + this.vertexStop.graphId;
                    }
                },
                {
                    id: this.arcId,
                    key: key,
                    drawn:false,
                    initial:initial
                }
            );
            this.arcId++;
        }
    }
    this.paths.put({
        source:source,
        target:target
    }, nodes);
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
};

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
};

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
};

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
};

BgplayGraph.prototype.getScaleFactor = function(width, height){
    var maxX, minX, maxY, minY, hOuter, wOuter, scaleFactor;
    maxX = this.getMaxX();
    minX = this.getMinX();
    maxY = this.getMaxY();
    minY = this.getMinY();
    wOuter = (maxX-minX);
    hOuter = (maxY-minY);

    scaleFactor = (wOuter-width > hOuter-height)? wOuter/width : hOuter/height;

    return scaleFactor;

};

BgplayGraph.prototype.computePosition = function () {
    var orbit, node , h, length, n, radius, pi2, lengthOrbit, spaceOrbit, parents, cycles, orbits;
    cycles = [];
    orbits = [];

    this.vertices.forEach(function(element){
        element.x = 0;
        element.y = 0;
        element.g = 0;
        element.vectors = [];
        element.oldX = 0;
        element.oldY = 0;
        delete element.orbit;
        delete element.visited;
        delete element.confirmed;
        delete element.numId;
    });

    function addIfNotVisited(node, where, orbit){
        var elem, n, length, neighbors;
        neighbors = node.view.getNeighbors();
        length = neighbors.length;
        for (n = 0; n<length; n++){
            elem = neighbors[n];
            if (!elem.view.orbit || elem.view.orbit >= node.view.orbit){
                if (!elem.view.visited){
                    elem.view.numId = node.view.numId + (n*(1/(length)));
                    elem.view.orbit = orbit;
                    where.push(elem);
                }else if (elem.view.visited == true && !node.view.confirmed){
                    if (node.view.orbit == elem.view.orbit && cycles.indexOf(node) == -1){
                        cycles.push(node);
                    }
                    if(cycles.indexOf(elem) == -1){
                        cycles.push(elem);
                    }
                }
                elem.view.visited = true;
            }
        }
        node.view.confirmed = true;
    }

    function getChild(node){
        var out = [];
        var nodes = node.view.getNeighbors();
        for (var n=0,length=nodes.length; n<length ;n++){
            if (nodes[n].view.orbit == node.view.orbit+1){
                out.push(nodes[n]);
            }
        }
        return out;
    }

    function getAncestors(node, orbitId){
        var neighbors = getParents(node, true);
        var ancestors = (node.view.orbit == orbitId + 1) ? neighbors : [];
        for (var n=0,length=neighbors.length; n<length ;n++){
            ancestors = ancestors.concat(getAncestors[n]);
        }
        return ancestors;
    }

    function getParents(node, sameOrbit){
        var out = [];
        var nodes = node.view.getNeighbors();
        for (var n= 0, length=nodes.length; n<length; n++){
            if (nodes[n].view.orbit == node.view.orbit-1 || (sameOrbit == true && nodes[n].view.orbit == node.view.orbit)){
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

    n = 0;
    pi2 = Math.PI * 2;
    orbits[0] = [];

    targets.forEach(function (element) {
        var provider;

        if (element.neighbors.size() == 1){     // Check if there is provider

            // Set the orbit of the target first
            element.numId = n;
            element.orbit = 1; // Orbit 1
            orbits[element.orbit] = orbits[element.orbit] || [];
            orbits[element.orbit].push(element.model);
            element.visited = true;
            n++;

            // Set the orbit of the provider after
            provider = element.neighbors.first().view;
            provider.numId = n;
            provider.orbit = 0;
            orbits[provider.orbit].push(provider.model);
            provider.visited = true;
            n++;

        } else {

            // Set only the orbit of the target
            element.numId = n;
            element.orbit = 0;
            orbits[element.orbit].push(element.model);
            element.visited = true;
            n++;

        }

    });

    var maxOrbitSize = 0;
    for (n = 0; n < orbits.length; n++) { // The lookup of the length is necessary at each iteration
        orbit = orbits[n];
        orbit.forEach(function (node) {
            if (!orbits[n + 1]) {
                orbits[n + 1] = [];
            }
            node.view.orbit = n;
            addIfNotVisited(node, orbits[n + 1], n + 1);
            node.view.visited = true;
        });
        if (orbit.length > maxOrbitSize) {
            maxOrbitSize = orbit.length;
        }
    }
    log("Number of graph orbits " + cycles.length);

    orbits[1] = orderOrbit(orbits[1]);

    for (n = 0, length = orbits.length; n < length; n++) {
        orbit = orbits[n];
        radius = (150 * (n));
        lengthOrbit = orbit.length;

        spaceOrbit = (maxOrbitSize * 20) / lengthOrbit;

        for (h = 0; h < lengthOrbit; h++) {
            node = orbit[h];

            parents = getParents(node, false);
            if (n == 0) {
                node.view.g = (h * (pi2 / lengthOrbit));
                node.view.x = 20 * Math.cos(node.view.g);
                node.view.y = 20 * Math.sin(node.view.g);
            } else if (n == 1) {
                node.view.g = (h * (pi2 / lengthOrbit));
                node.view.x = radius * Math.cos(node.view.g);
                node.view.y = radius * Math.sin(node.view.g);
            } else {
                node.view.g = averageAngle(parents);
                node.view.x = radius * Math.cos(node.view.g) + (0.1 * h);
                node.view.y = radius * Math.sin(node.view.g) + (0.1 * h);
            }
        }
    }


    var $this, springEmbedderCyclesPercentage, whenHookInteractionsStarts, whenHookInteractionsEnds,
        whenOnlyLeavesRepulsion, whenCoulombStarts, whenCoulombEnds, whenEdgeNodeRepulsionStarts, springEmbedderCycles,
        edgeVertexRepulsionIteration, environmentGraph, verticesArray, element1, element2, leavesArray,
        coulombMaxdistance, edgeElements, edgeElementsLength;

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

    verticesArray = this.vertices.toArray();
    edgeElements = this.edges.elements;
    edgeElementsLength = edgeElements.length;

    if (whenOnlyLeavesRepulsion > 0){
        var leaves = this.vertices.getFilteredSubTreeMapByValue(function (node) {
            return (node.model.get("sources").length > 0);
        });
    }

    var initialArcs = this.edges.getFilteredSubTreeMapByValue(function(value){
        return value.initial;
    });


    springEmbedderCycles = this.environment.config.graph.springEmbedderCycles;
    for (var springEmbedderCycleNumber = 0, springEmbedderCycleNumberLength=springEmbedderCycles; springEmbedderCycleNumber < springEmbedderCycleNumberLength; springEmbedderCycleNumber++) {

        if (springEmbedderCycleNumber > whenHookInteractionsStarts && springEmbedderCycleNumber < whenHookInteractionsEnds) {
            var tmpElement, key, element;

            for (var edgeIndex=0; edgeIndex<edgeElementsLength; edgeIndex++) {
                tmpElement = edgeElements[edgeIndex];
                key = tmpElement.getKey();
                element = initialArcs.get(key);
                if (element != null && element.length > 0){
                    $this.utils.hook(key.vertexStart, key.vertexStop, 50, 10);//150,10
                } else {
                    $this.utils.hook(key.vertexStart, key.vertexStop, 50, 50);//150,10
                }
            }
        }

        if (springEmbedderCycleNumber > whenCoulombStarts && springEmbedderCycleNumber < whenCoulombEnds) {
            coulombMaxdistance = (this.frame)? 50 : 250;
            for (var fc1=0,lengthFc1=verticesArray.length; fc1<lengthFc1; fc1++){
                element1 = verticesArray[fc1];
                for (var fc2=0,lengthFc2=verticesArray.length; fc2<lengthFc2; fc2++){
                    element2 = verticesArray[fc2];
                    if (fc1 != fc2){
                        $this.utils.coulomb(element1, element2, element1.neighbors.size(), element2.neighbors.size(), 8, coulombMaxdistance);//0.5,1
                    }
                }
            }
        }


        if (springEmbedderCycleNumber > whenEdgeNodeRepulsionStarts) {
            edgeVertexRepulsionIteration++;

            for (var v=0,lengthv=verticesArray.length; v<lengthv; v++){
                var vertex, tmpElement, nodePair;

                vertex = verticesArray[v];
                for (var edgeIndex=0; edgeIndex<edgeElementsLength; edgeIndex++) {
                    tmpElement = edgeElements[edgeIndex];
                    nodePair = tmpElement.getKey();
                    $this.utils.edgeNodeRepulsion([nodePair.vertexStart, nodePair.vertexStop], vertex, 10, $this.nodeDiameter + 5, edgeVertexRepulsionIteration);
                    edgeVertexRepulsionIteration++;
                }
            }
        }


        if (springEmbedderCycleNumber > whenOnlyLeavesRepulsion) {
            leavesArray = leaves.toArray();

            for (var fc1=0,lengthFc1=leavesArray.length; fc1<lengthFc1; fc1++){
                element1 = verticesArray[fc1];
                for (var fc2=0,lengthFc2=leavesArray.length; fc2<lengthFc2; fc2++){
                    element2 = verticesArray[fc2];
                    if (fc1 != fc2){
                        $this.utils.coulomb(element1, element2, 10, 10, 20, 35);//0.5,1
                    }
                }
            }
        }


        for (var j=0,lengthj=verticesArray.length; j<lengthj; j++){ // Sum all the vectors to compute the final position
            //$this.utils.computeFinalPosition(verticesArray[j]);
            var nodeFinalPosition, vectorElement;

            nodeFinalPosition = verticesArray[j];
            for (var nodeFinalPositionIndex=0,nodeFinalPositionIndexLength=nodeFinalPosition.vectors.length; nodeFinalPositionIndex < nodeFinalPositionIndexLength; nodeFinalPositionIndex++) {
                vectorElement = nodeFinalPosition.vectors[nodeFinalPositionIndex];
                nodeFinalPosition.x += vectorElement.x;
                nodeFinalPosition.y += vectorElement.y;
            }
            nodeFinalPosition.vectors = [];
        }



        this.frames++;
    }

//to refresh cache
    this.getMaxX(true);
    this.getMinX(true);
    this.getMaxY(true);
    this.getMinY(true);
};

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
};


