
var BgplayGraph = function (options) {
    if (!net.webrobotics.TreeMap) {
        console.log('Webrobotics\'s TreeMap required');
        return null;
    }
    this.nodeId = 0;
    this.arcId = 0;
    this.pathId=0;
    this.environment=options.environment;
    this.iterations = setValuePriority("iterations", 500);
    this.elasticCoefficient = setValuePriority("elasticCoefficient", 1);
    this.parentDimensionX = setValuePriority("parentDimensionX", 100);
    this.parentDimensionY = setValuePriority("parentDimensionY", 100);
    this.nodeDiameter = (options) ? options.nodeDiameter : 100 || 100;
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
    this.pathOrderByProximity = new net.webrobotics.TreeMap(comparator, {allowDuplicateKeys:false, suppressDuplicateKeyAlerts:false});

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

//The node object MUST have these properties:id,x,y
BgplayGraph.prototype.addNode = function (node) {
    this.nodeId++;
    node.graphId = this.nodeId;
    node.vectors = new Array();
    node.edges = 0;
    this.vertices.put(this.nodeId, node);
    return node;
};

BgplayGraph.prototype.addPath = function (path) {
    var next, current, nodes,source,target,orderedNodes,key,edge,present, y, arc;
    source=path.get("source");
    target=path.get("target");
    nodes=path.get("nodes");
    key=source.id+"-"+target.id;
    if (this.pathOrderByProximity.isEmpty()){
        this.pathOrderByProximity.put(1, path);
    }

    this.paths.put({source:source,target:target}, nodes);
    for (var n = 0; n < nodes.length -1; n++) {
        next = nodes[n + 1];
        current = nodes[n];
        orderedNodes = this.utils.absOrientation(current, next);

        edge=this.edges.get({vertexStart:orderedNodes[0].view, vertexStop:orderedNodes[1].view});

        present=false;
        if (edge!=null){
            for (y=0; y<edge.length; y++){
                arc=edge[y];
                if (arc.key==key){ //An arc for each key
                    present=true;
                }
            }
        }
        if (!present){
            next.view.neighbors.push(current);
            current.view.neighbors.push(next);

            this.edges.put(
                {vertexStart:orderedNodes[0].view, vertexStop:orderedNodes[1].view, toString:function () {
                    return this.vertexStart.graphId + "-" + this.vertexStop.graphId;
                }},
                {id:this.arcId,key:key,drawn:false}
            );
            this.arcId++;
        }
    }
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
    var disconnectedArcs = [];
    var cycles = [];
    var orbits = [];
    var orbit, node , h, length, index, singleSpace, n, radius, pi2, g, orbit2, element, t;

    function addIfNotVisited(node, where){
        var elem, n, length, neighbors;
        neighbors = node.view.neighbors;
        length = neighbors.length;
        for (n = 0; n<length; n++){
            elem = neighbors[n];
            if (!elem.view.visited){
                elem.view.numId = node.view.numId + (n*(1/(length))); //At most 100 neighbors
                elem.view["offset"] = 0;
                where.push(elem);
            }else{
                disconnectedArcs.push([node,elem]);
                cycles.push(node);
                cycles.push(elem);
            }
            elem.view.visited=true;
        }
    }


    function proximity(arc){
        var maxId = (arc[0].view.orbit < arc[1].view.orbit) ? 1 : 0;

        arc[maxId].view["offset"] += arc[maxId].view.orbit;

        proximityRecursive(arc[maxId].view.neighbors, arc[maxId]);
    }

    function proximityRecursive(nodes, node){
        var n, nodeTmp, length, nodesTmp, length2, i, neighborTmp;
        nodesTmp = new net.webrobotics.TreeMap(comparator, {allowDuplicateKeys:false, suppressDuplicateKeyAlerts:false});
        for (n=0, length=nodes.length; n<length; n++){
            nodeTmp = nodes[n];

            for (i=0, length2=nodeTmp.neighbors.length; i<length2; i++){
                neighborTmp = nodeTmp.neighbors[i];
                if (neighborTmp.view.orbit < node.view.orbit && neighborTmp.view["offset"] == 0){
                    neighborTmp.view["offset"] = node.id;
                    nodesTmp.put(neighborTmp.id, neighborTmp);
                }
            }
        }
        proximityRecursive(nodesTmp.toArray(), node);
    }


    var targets = this.vertices.getFilteredSubTreeMapByValue(function (node) {
        return (node.model.get("targets").length > 0);
    });

    n=0;
    pi2 = Math.PI * 2;
    orbits[0]=[];
    targets.forEach(function(element){
        element.numId = n;//*(128/targets.size());
        orbits[0].push(element.model);
        element.orbit=0;
        //addIfNotVisited(element.model, orbits[0]); // 1st orbit
        n+=10;
    });

    var maxOrbitSize=0;
    for (n=0; n<orbits.length; n++){ // The lookup of the length is necessary at each iteration
        orbit=orbits[n];
        orbit.forEach(function(node){
            if (!orbits[n+1]){
                orbits[n+1] = [];
            }
            addIfNotVisited(node, orbits[n+1]);
            node.view.visited=true;
            node.view.orbit=n;
        });
        if (orbit.length > maxOrbitSize)
            maxOrbitSize = orbit.length;
    }


    for (n=0, length=orbits.length; n<length; n++){
        orbit=orbits[n];
        radius = (250 * (n));
        singleSpace = 1/orbit.length;

        for (h=0; h<orbit.length; h++){
            node=orbit[h];
            t = singleSpace * node.view.numId;
            node.view.x = radius * Math.cos(t);
            node.view.y = radius * Math.sin(t);

        }
    }

    var $this = this;
    var numberOfNodes = this.vertices.size();
    var nodeSize = 20;
    var posFinal={x:0, y:this.parentDimensionY / 2};
    /*
     this.vertices.forEach(function (element) {
     var initialP={x:element.x,y:element.y};

     $this.utils.translatePoint(initialP, posFinal);//centered in the viewport
     element.x = initialP.x;
     element.y = initialP.y;

     });
     */

    var leaves = this.vertices.getFilteredSubTreeMapByValue(function (node) {
        return (node.model.get("sources").length > 0);
    });

    var firstEdge = this.edges.getFilteredSubTreeMapByKey(function (key) {
        return (targets.containsValue(key.vertexStart)) ? true : false;
    });

    var firstNode = [];
    firstEdge.forEachKey(function (key) {
        firstNode.push(key.vertexStop);
    });

    var springEmbedderCyclesPercentage = this.environment.config.graph.springEmbedderCycles / 100;
    var whenHookInteractions = springEmbedderCyclesPercentage * this.environment.config.graph.whenHookInteractions;
    var whenOnlyLeavesRepulsion = springEmbedderCyclesPercentage * this.environment.config.graph.whenOnlyLeavesRepulsion;
    var whenCoulomb = springEmbedderCyclesPercentage * this.environment.config.graph.whenCoulombRepulsion;
    var whenEdgeNodeRepulsionStarts = springEmbedderCyclesPercentage * this.environment.config.graph.whenEdgeNodeRepulsionStarts;

    var edgeVertexRepulsionIteration=0;

    for (var n = 0, length=this.environment.config.graph.springEmbedderCycles; n < length; n++) {

        if (n > whenHookInteractions) {
            this.edges.forEachKey(function (key, values) {
                //$this.utils.hook(key.vertexStart,key.vertexStop,150,40,leaves);//150,10
                $this.utils.hook(key.vertexStart, key.vertexStop, 50, 50);//150,10
            });
        }

        if (n > whenCoulomb) {
            this.vertices.forEachCouple(function (element1, element2) {
                //$this.utils.coulomb(element1,element2,8,1,20);//0.5,1
                $this.utils.coulomb(element1, element2, element1.neighbors.length, element2.neighbors.length, 8, 250);//0.5,1
                //$this.utils.coulomb(element1,element2,0.8,0,20);//0.5,1
            });
        }


        if (n > whenEdgeNodeRepulsionStarts) {
            edgeVertexRepulsionIteration++;
            $this.vertices.forEach(function(vertex){
                $this.edges.forEachKey(function(nodePair){
                    $this.utils.edgeNodeRepulsion([nodePair.vertexStart,nodePair.vertexStop],vertex, 20, 90,edgeVertexRepulsionIteration);
                });
            });
        }

        if (n > whenOnlyLeavesRepulsion) {
            leaves.forEachCouple(function (element1, element2) {

                //$this.utils.coulomb(element1,element2,8,1,20);//0.5,1
                $this.utils.coulomb(element1, element2, 10, 10, 20, 100);//0.5,1
                //$this.utils.coulomb(element1,element2,0.8,0,20);//0.5,1
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


